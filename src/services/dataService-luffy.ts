import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { SharedItem, UserProfile, ItemRequest, AppNotification, ItemCategory } from '../types';
import { INITIAL_USERS } from './mockStorage';
import { validateListing } from '../utils/listingConfig';

/** Helper to remove undefined fields before Firestore setDoc / addDoc */
const cleanForFirestore = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Production-Grade Data Service for Firestore Live Mode
 * Synchronizes real-time across Web & Mobile apps using Firestore listeners (onSnapshot).
 */
export const dataService = {
  // ==========================================
  // 1. ITEMS (Create, Read Live, Update, Delete)
  // ==========================================

  /**
   * Add a new item to the "items" collection in Firestore.
   */
  async addItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');

    // Server-side validation before writing to database
    const validation = validateListing({
      title: item.title,
      description: item.description,
      listingType: item.listingType || 'Borrow',
      price: item.price,
      pricingUnit: item.pricingUnit,
      exchangeFor: item.exchangeFor,
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid item data.');
    }

    const itemData = cleanForFirestore({
      title: item.title,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl || '',
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      ownerAvatar: item.ownerAvatar || '',
      location: item.location || 'Local Community',
      status: 'Available',
      listingType: item.listingType || 'Borrow',
      price: typeof item.price === 'number' ? item.price : null,
      pricingUnit: item.pricingUnit || (item.listingType === 'Rent' ? 'day' : null),
      currency: item.currency || 'USD',
      exchangeFor: item.exchangeFor || null,
      isNegotiable: Boolean(item.isNegotiable),
      condition: item.condition || 'Good',
      createdAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, 'items'), itemData);

    // Award +10 EcoPoints to owner
    try {
      const userRef = doc(db, 'users', item.ownerId);
      await updateDoc(userRef, {
        ecoPoints: increment(10),
        itemsSharedCount: increment(1)
      });
    } catch {
      // Handled if user doc not yet created
    }

    return docRef.id;
  },

  /** Alias */
  async createItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    return this.addItem(item);
  },

  /**
   * Real-time listener for the "items" collection.
   */
  subscribeToItems(callback: (items: SharedItem[]) => void): () => void {
    if (!db) {
      console.warn('Firestore db not initialized for subscribeToItems');
      return () => {};
    }

    const itemsQuery = query(collection(db, 'items'), orderBy('createdAt', 'desc'));

    return onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items: SharedItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }

          return {
            itemId: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'Others',
            imageUrl: data.imageUrl || '',
            ownerId: data.ownerId || '',
            ownerName: data.ownerName || 'Community Member',
            ownerAvatar: data.ownerAvatar || undefined,
            location: data.location || '',
            status: data.status || 'Available',
            listingType: data.listingType || 'Borrow',
            price: typeof data.price === 'number' ? data.price : (data.price ? Number(data.price) : null),
            pricingUnit: data.pricingUnit || (data.listingType === 'Rent' ? 'day' : null),
            currency: data.currency || '$',
            exchangeFor: data.exchangeFor || null,
            isNegotiable: Boolean(data.isNegotiable),
            condition: data.condition || 'Good',
            createdAt: createdAtStr,
          };
        });

        callback(items);
      },
      (error) => {
        console.error('Firestore items subscription error:', error);
      }
    );
  },

  /** Alias */
  getItemsRealtime(callback: (items: SharedItem[]) => void): () => void {
    return this.subscribeToItems(callback);
  },

  /**
   * Delete an item from Firestore
   */
  async deleteItem(itemId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'items', itemId));
  },

  // ==========================================
  // 2. REQUESTS (Request, Accept, Reject)
  // ==========================================

  async requestItem(params: {
    itemId: string;
    itemTitle: string;
    itemImage?: string;
    ownerId: string;
    ownerName?: string;
    requesterId: string;
    requesterName: string;
    requesterAvatar?: string;
    note?: string;
  }): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');

    const requestData = cleanForFirestore({
      itemId: params.itemId,
      itemTitle: params.itemTitle,
      itemImage: params.itemImage || '',
      ownerId: params.ownerId,
      ownerName: params.ownerName || 'Owner',
      requesterId: params.requesterId,
      requesterName: params.requesterName,
      requesterAvatar: params.requesterAvatar || '',
      status: 'Pending',
      note: params.note || '',
      createdAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, 'requests'), requestData);

    // Update item status in Firestore → "Requested"
    try {
      await updateDoc(doc(db, 'items', params.itemId), { status: 'Requested' });
    } catch (e) {
      console.warn('Could not update item status:', e);
    }

    // Add notification document for owner
    try {
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: params.ownerId,
        title: 'New Borrow Request 📬',
        message: `${params.requesterName} requested to borrow "${params.itemTitle}".`,
        type: 'request_received',
        read: false,
        createdAt: serverTimestamp(),
        relatedItemId: params.itemId,
      }));
    } catch (e) {
      console.warn('Could not create notification:', e);
    }

    return docRef.id;
  },

  subscribeToRequests(callback: (requests: ItemRequest[]) => void): () => void {
    if (!db) return () => {};

    const reqQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));

    return onSnapshot(
      reqQuery,
      (snapshot) => {
        const reqs: ItemRequest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }

          return {
            requestId: docSnap.id,
            itemId: data.itemId,
            itemTitle: data.itemTitle,
            itemImage: data.itemImage || undefined,
            ownerId: data.ownerId,
            ownerName: data.ownerName || undefined,
            requesterId: data.requesterId,
            requesterName: data.requesterName,
            requesterAvatar: data.requesterAvatar || undefined,
            status: data.status || 'Pending',
            note: data.note || undefined,
            createdAt: createdAtStr,
          };
        });

        callback(reqs);
      },
      (error) => {
        console.error('Firestore requests subscription error:', error);
      }
    );
  },

  async acceptRequest(requestId: string, itemId?: string, ownerId?: string): Promise<void> {
    if (!db) return;

    const reqRef = doc(db, 'requests', requestId);
    await updateDoc(reqRef, { status: 'Accepted' });

    const reqSnap = await getDoc(reqRef);
    if (reqSnap.exists()) {
      const data = reqSnap.data();
      const targetItemId = itemId || data.itemId;
      const targetOwnerId = ownerId || data.ownerId;

      if (targetItemId) {
        try {
          await updateDoc(doc(db, 'items', targetItemId), { status: 'Shared' });
        } catch (e) {
          console.warn('Could not mark item shared:', e);
        }
      }

      if (targetOwnerId) {
        try {
          await updateDoc(doc(db, 'users', targetOwnerId), {
            ecoPoints: increment(20)
          });
        } catch (e) {
          console.warn('Could not award EcoPoints:', e);
        }
      }

      if (data.requesterId) {
        try {
          await addDoc(collection(db, 'notifications'), cleanForFirestore({
            userId: data.requesterId,
            title: 'Request Accepted! 🎉',
            message: `Your request for "${data.itemTitle || 'an item'}" was accepted! You can now coordinate handover.`,
            type: 'request_accepted',
            read: false,
            createdAt: serverTimestamp(),
            relatedItemId: targetItemId,
          }));
        } catch (e) {
          console.warn('Could not notify requester:', e);
        }
      }
    }
  },

  async rejectRequest(requestId: string, itemId?: string): Promise<void> {
    if (!db) return;

    const reqRef = doc(db, 'requests', requestId);
    await updateDoc(reqRef, { status: 'Rejected' });

    const reqSnap = await getDoc(reqRef);
    if (reqSnap.exists()) {
      const data = reqSnap.data();
      const targetItemId = itemId || data.itemId;

      if (targetItemId) {
        try {
          await updateDoc(doc(db, 'items', targetItemId), { status: 'Available' });
        } catch (e) {
          console.warn('Could not reset item status:', e);
        }
      }

      if (data.requesterId) {
        try {
          await addDoc(collection(db, 'notifications'), cleanForFirestore({
            userId: data.requesterId,
            title: 'Request Declined',
            message: `Your request for "${data.itemTitle || 'an item'}" was declined by the owner.`,
            type: 'request_rejected',
            read: false,
            createdAt: serverTimestamp(),
            relatedItemId: targetItemId,
          }));
        } catch (e) {
          console.warn('Could not notify requester:', e);
        }
      }
    }
  },

  // ==========================================
  // 3. NOTIFICATIONS & USERS
  // ==========================================

  subscribeToNotifications(userId: string, callback: (notifs: AppNotification[]) => void): () => void {
    if (!db || !userId) return () => {};

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      notifQuery,
      (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }

          return {
            id: docSnap.id,
            userId: data.userId,
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'points_earned',
            read: Boolean(data.read),
            createdAt: createdAtStr,
            relatedItemId: data.relatedItemId,
          };
        });

        callback(notifs);
      },
      (error) => {
        console.error('Firestore notifications subscription error:', error);
      }
    );
  },

  async markNotificationRead(userId: string, notifId: string): Promise<void> {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      console.warn('Could not mark notification read:', e);
    }
  },

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    if (!db || !userId) return () => {};

    return onSnapshot(
      doc(db, 'users', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ userId: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn('User profile onSnapshot error:', error);
      }
    );
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!db || !userId) return null;
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        return { userId: userSnap.id, ...userSnap.data() } as UserProfile;
      }
    } catch (e) {
      console.warn('Could not get user profile:', e);
    }
    return null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!db || !profile.userId) return;
    const cleaned = cleanForFirestore({
      userId: profile.userId,
      name: profile.name || 'Community Member',
      email: profile.email || '',
      ecoPoints: profile.ecoPoints ?? 50,
      itemsSharedCount: profile.itemsSharedCount ?? 0,
      avatarUrl: profile.avatarUrl || '',
      joinedAt: profile.joinedAt || new Date().toISOString()
    });
    await setDoc(doc(db, 'users', profile.userId), cleaned, { merge: true });
  }
};

/**
 * Authentication Service supporting Firebase Auth & Demo switcher
 */
export const authService = {
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    if (auth && isFirebaseConfigured()) {
      return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await dataService.getUserProfile(firebaseUser.uid);
          if (profile) {
            callback(profile);
          } else {
            const newProfile: UserProfile = {
              userId: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Eco Member',
              email: firebaseUser.email || '',
              ecoPoints: 50,
              itemsSharedCount: 0,
              avatarUrl: firebaseUser.photoURL || '',
              joinedAt: new Date().toISOString()
            };
            await dataService.saveUserProfile(newProfile);
            callback(newProfile);
          }
        } else {
          callback(INITIAL_USERS[0]);
        }
      });
    }

    callback(INITIAL_USERS[0]);
    return () => {};
  },

  async signUp(email: string, pass: string, name: string, avatarUrl?: string): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase Auth is not configured');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name || avatarUrl) {
      await updateProfile(cred.user, { 
        displayName: name, 
        photoURL: avatarUrl || undefined 
      });
    }

    const newProfile: UserProfile = {
      userId: cred.user.uid,
      name: name || email.split('@')[0],
      email,
      ecoPoints: 50,
      itemsSharedCount: 0,
      avatarUrl: avatarUrl || '',
      joinedAt: new Date().toISOString()
    };
    await dataService.saveUserProfile(newProfile);
    return newProfile;
  },

  async logIn(email: string, pass: string): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase Auth is not configured');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await dataService.getUserProfile(cred.user.uid);
    if (profile) return profile;

    const newProfile: UserProfile = {
      userId: cred.user.uid,
      name: cred.user.displayName || email.split('@')[0],
      email,
      ecoPoints: 50,
      itemsSharedCount: 0,
      avatarUrl: cred.user.photoURL || '',
      joinedAt: new Date().toISOString()
    };
    await dataService.saveUserProfile(newProfile);
    return newProfile;
  },

  async logOut(): Promise<void> {
    if (auth) {
      await signOut(auth);
    }
  },

  switchDemoUser(userId: string): UserProfile | null {
    const user = INITIAL_USERS.find(u => u.userId === userId);
    return user || null;
  }
};
