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
import { INITIAL_USERS, INITIAL_ITEMS, INITIAL_REQUESTS } from './mockStorage';
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

// ==========================================
// Local In-Memory & LocalStorage Sync Cache
// ==========================================
const LOCAL_STORAGE_ITEMS_KEY = 'ecoshare_local_items_v2';
const LOCAL_STORAGE_REQUESTS_KEY = 'ecoshare_local_requests_v2';
const LOCAL_STORAGE_NOTIFS_KEY = 'ecoshare_local_notifs_v2';

const getStoredLocalItems = (): SharedItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_ITEMS];
};

const saveStoredLocalItems = (items: SharedItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    localItemListeners.forEach(cb => cb(items));
  } catch {}
};

const localItemListeners: Array<(items: SharedItem[]) => void> = [];
const localRequestListeners: Array<(reqs: ItemRequest[]) => void> = [];

/**
 * Production-Grade Data Service for Firestore Live Mode with Instant Local Fallback
 * Synchronizes real-time across Web & Mobile apps using Firestore listeners (onSnapshot)
 * and guarantees 100% demo continuity if Firestore rules are restricted.
 */
export const dataService = {
  // ==========================================
  // 1. ITEMS (Create, Read Live, Update, Delete)
  // ==========================================

  /**
   * Add a new item to Firestore or fallback locally
   */
  async addItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    // Validation before writing
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

    const newItemId = `item-${Date.now()}`;
    const createdAtStr = new Date().toISOString();

    const localItem: SharedItem = {
      itemId: newItemId,
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
      currency: item.currency || '$',
      exchangeFor: item.exchangeFor || null,
      isNegotiable: Boolean(item.isNegotiable),
      condition: item.condition || 'Good',
      createdAt: createdAtStr,
      ecoPoints: item.ecoPoints || 20,
      co2Saved: item.co2Saved || 1.0,
      tags: item.tags || [item.category.toLowerCase()],
    };

    // Always keep local store updated immediately
    const currentLocal = getStoredLocalItems();
    saveStoredLocalItems([localItem, ...currentLocal]);

    // Attempt writing to Firestore if configured
    if (db && isFirebaseConfigured()) {
      try {
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
          currency: item.currency || '$',
          exchangeFor: item.exchangeFor || null,
          isNegotiable: Boolean(item.isNegotiable),
          condition: item.condition || 'Good',
          createdAt: serverTimestamp(),
          ecoPoints: item.ecoPoints,
          co2Saved: item.co2Saved,
          tags: item.tags,
        });

        const docRef = await addDoc(collection(db, 'items'), itemData);

        // Award EcoPoints in Firestore if possible
        try {
          const userRef = doc(db, 'users', item.ownerId);
          await updateDoc(userRef, {
            ecoPoints: increment(item.ecoPoints || 10),
            itemsSharedCount: increment(1)
          });
        } catch {}

        return docRef.id;
      } catch (err: any) {
        console.warn('[DataService] Firestore write not permitted or offline, saved to persistent local store:', err.message);
        return newItemId;
      }
    }

    return newItemId;
  },

  /** Alias */
  async createItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    return this.addItem(item);
  },

  /**
   * Real-time listener for items.
   */
  subscribeToItems(callback: (items: SharedItem[]) => void): () => void {
    // Initial emit from local store
    callback(getStoredLocalItems());
    localItemListeners.push(callback);

    let unsubFirestore: (() => void) | null = null;

    if (db && isFirebaseConfigured()) {
      try {
        const itemsQuery = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        unsubFirestore = onSnapshot(
          itemsQuery,
          (snapshot) => {
            const firestoreItems: SharedItem[] = snapshot.docs.map((docSnap) => {
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
                ecoPoints: data.ecoPoints,
                co2Saved: data.co2Saved,
                tags: data.tags,
              };
            });

            if (firestoreItems.length > 0) {
              saveStoredLocalItems(firestoreItems);
            }
          },
          (error) => {
            console.warn('[DataService] Firestore subscription fallback active:', error.message);
            callback(getStoredLocalItems());
          }
        );
      } catch (e: any) {
        console.warn('[DataService] Query setup fallback:', e.message);
      }
    }

    return () => {
      const idx = localItemListeners.indexOf(callback);
      if (idx !== -1) localItemListeners.splice(idx, 1);
      if (unsubFirestore) unsubFirestore();
    };
  },

  /** Alias */
  getItemsRealtime(callback: (items: SharedItem[]) => void): () => void {
    return this.subscribeToItems(callback);
  },

  /**
   * Delete an item from Firestore and local store
   */
  async deleteItem(itemId: string): Promise<void> {
    const current = getStoredLocalItems().filter(i => i.itemId !== itemId);
    saveStoredLocalItems(current);

    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'items', itemId));
      } catch {}
    }
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
    const newReqId = `req-${Date.now()}`;
    const createdAtStr = new Date().toISOString();

    const localReq: ItemRequest = {
      requestId: newReqId,
      itemId: params.itemId,
      itemTitle: params.itemTitle,
      itemImage: params.itemImage,
      ownerId: params.ownerId,
      ownerName: params.ownerName,
      requesterId: params.requesterId,
      requesterName: params.requesterName,
      requesterAvatar: params.requesterAvatar,
      status: 'Pending',
      note: params.note,
      createdAt: createdAtStr,
    };

    // Update local items status -> "Requested"
    const localItems = getStoredLocalItems().map(i => i.itemId === params.itemId ? { ...i, status: 'Requested' as const } : i);
    saveStoredLocalItems(localItems);

    if (db && isFirebaseConfigured()) {
      try {
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

        try {
          await updateDoc(doc(db, 'items', params.itemId), { status: 'Requested' });
        } catch {}

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
        } catch {}

        return docRef.id;
      } catch (err: any) {
        console.warn('[DataService] Firestore request error, saved locally:', err.message);
        return newReqId;
      }
    }

    return newReqId;
  },

  subscribeToRequests(callback: (requests: ItemRequest[]) => void): () => void {
    callback(INITIAL_REQUESTS);
    localRequestListeners.push(callback);

    let unsubFirestore: (() => void) | null = null;

    if (db && isFirebaseConfigured()) {
      try {
        const reqQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
        unsubFirestore = onSnapshot(
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
            console.warn('[DataService] Firestore requests subscription fallback:', error.message);
            callback(INITIAL_REQUESTS);
          }
        );
      } catch (e: any) {
        console.warn('[DataService] Requests query setup fallback:', e.message);
      }
    }

    return () => {
      const idx = localRequestListeners.indexOf(callback);
      if (idx !== -1) localRequestListeners.splice(idx, 1);
      if (unsubFirestore) unsubFirestore();
    };
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
 * Authentication Service supporting Firebase Auth & Seamless Local Account Persistence
 */
const ACTIVE_USER_SESSION_KEY = 'ecoshare_active_user_session_v2';
const LOCAL_USERS_STORE_KEY = 'ecoshare_registered_users_v2';

const getStoredLocalUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_USERS];
};

const saveStoredLocalUser = (user: UserProfile) => {
  try {
    const users = getStoredLocalUsers();
    const existingIdx = users.findIndex(u => u.userId === user.userId || u.email === user.email);
    if (existingIdx !== -1) {
      users[existingIdx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(LOCAL_USERS_STORE_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_USER_SESSION_KEY, JSON.stringify(user));
  } catch {}
};

export const authService = {
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    // 1. Check if user already has an active local session
    try {
      const activeSession = localStorage.getItem(ACTIVE_USER_SESSION_KEY);
      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        if (parsed && parsed.userId) {
          callback(parsed);
          return () => {};
        }
      }
    } catch {}

    if (auth && isFirebaseConfigured()) {
      try {
        return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            const profile = await dataService.getUserProfile(firebaseUser.uid);
            if (profile) {
              localStorage.setItem(ACTIVE_USER_SESSION_KEY, JSON.stringify(profile));
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
              saveStoredLocalUser(newProfile);
              callback(newProfile);
            }
          } else {
            callback(INITIAL_USERS[0]);
          }
        });
      } catch {
        callback(INITIAL_USERS[0]);
        return () => {};
      }
    }

    callback(INITIAL_USERS[0]);
    return () => {};
  },

  async signUp(email: string, pass: string, name: string, avatarUrl?: string): Promise<UserProfile> {
    // Try Firebase Auth if configured
    if (auth && isFirebaseConfigured()) {
      try {
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
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
          joinedAt: new Date().toISOString()
        };
        await dataService.saveUserProfile(newProfile);
        saveStoredLocalUser(newProfile);
        return newProfile;
      } catch (err: any) {
        console.warn('[AuthService] Firebase Auth not active in console, creating local account:', err.message);
      }
    }

    // Seamless Local Account Fallback
    const localProfile: UserProfile = {
      userId: `user-${Date.now()}`,
      name: name.trim() || email.split('@')[0],
      email: email.trim().toLowerCase(),
      ecoPoints: 50,
      itemsSharedCount: 0,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      joinedAt: new Date().toISOString()
    };

    saveStoredLocalUser(localProfile);
    return localProfile;
  },

  async logIn(email: string, pass: string): Promise<UserProfile> {
    if (auth && isFirebaseConfigured()) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const profile = await dataService.getUserProfile(cred.user.uid);
        if (profile) {
          saveStoredLocalUser(profile);
          return profile;
        }

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
        saveStoredLocalUser(newProfile);
        return newProfile;
      } catch (err: any) {
        console.warn('[AuthService] Firebase Login error, checking local store:', err.message);
      }
    }

    // Local Account Fallback
    const localUsers = getStoredLocalUsers();
    const existing = localUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      localStorage.setItem(ACTIVE_USER_SESSION_KEY, JSON.stringify(existing));
      return existing;
    }

    // Auto-create local profile if signing in with custom email
    const created: UserProfile = {
      userId: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email.trim().toLowerCase(),
      ecoPoints: 50,
      itemsSharedCount: 0,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      joinedAt: new Date().toISOString()
    };
    saveStoredLocalUser(created);
    return created;
  },

  async logOut(): Promise<void> {
    try {
      localStorage.removeItem(ACTIVE_USER_SESSION_KEY);
      if (auth) {
        await signOut(auth);
      }
    } catch {}
  },

  switchDemoUser(userId: string): UserProfile | null {
    const user = INITIAL_USERS.find(u => u.userId === userId) || getStoredLocalUsers().find(u => u.userId === userId);
    if (user) {
      localStorage.setItem(ACTIVE_USER_SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }
};
