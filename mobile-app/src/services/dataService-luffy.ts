import {
  collection,
  doc,
  setDoc,
  getDoc,
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
import { db } from './firebase';
import { SharedItem, UserProfile, ItemRequest, AppNotification } from '../types';
import { validateListing } from '../utils/listingConfig';

/** Helper to remove undefined values before Firestore setDoc / addDoc */
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
 * Mobile Data Service powered directly by Firebase Firestore
 * Real-time synchronization across Web & Mobile.
 */
export const dataService = {
  // ==========================================
  // 1. ITEMS (Create, Read Live, Delete)
  // ==========================================

  async createItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    if (!db) {
      console.warn('[Firestore] ⚠️ Write aborted: Firestore is not initialized');
      throw new Error('Firestore is not initialized.');
    }

    // Validation before writing to Firestore
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

    console.log('[Firestore] 📝 Creating new item:', item.title);
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
    console.log('[Firestore] ✅ Item created successfully with ID:', docRef.id);

    try {
      const userRef = doc(db, 'users', item.ownerId);
      await updateDoc(userRef, {
        ecoPoints: increment(10),
        itemsSharedCount: increment(1)
      });
      console.log('[Firestore] 🌟 Updated user EcoPoints for sharing item');
    } catch {
      // Handled on auth
    }

    return docRef.id;
  },

  async postItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    return this.createItem(item);
  },

  subscribeToItems(callback: (items: SharedItem[]) => void): () => void {
    if (!db) {
      console.warn('[Firestore] ⚠️ Cannot subscribe to items: db is null');
      return () => {};
    }

    console.log('[Firestore] 📡 Subscribing to items collection real-time stream...');
    const itemsQuery = query(collection(db, 'items'), orderBy('createdAt', 'desc'));

    return onSnapshot(
      itemsQuery,
      (snapshot) => {
        console.log(`[Firestore] 🔄 Received items snapshot: ${snapshot.docs.length} items`);
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
        console.error('[Firestore] ❌ Items subscription error:', error);
      }
    );
  },

  getItemsRealtime(callback: (items: SharedItem[]) => void): () => void {
    return this.subscribeToItems(callback);
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

    try {
      await updateDoc(doc(db, 'items', params.itemId), { status: 'Requested' });
    } catch (e) {
      console.warn('Could not update item status:', e);
    }

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

  subscribeToRequests(userId: string, callback: (requests: ItemRequest[]) => void): () => void {
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

        const filtered = reqs.filter((r) => r.ownerId === userId || r.requesterId === userId);
        callback(filtered);
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

  async updateRequestStatus(requestId: string, status: 'Accepted' | 'Rejected'): Promise<void> {
    if (status === 'Accepted') {
      await this.acceptRequest(requestId);
    } else {
      await this.rejectRequest(requestId);
    }
  },

  async getActiveUser(): Promise<UserProfile> {
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', 'user-demo-101'));
        if (userDoc.exists()) {
          return { userId: userDoc.id, ...userDoc.data() } as UserProfile;
        }
      } catch (e) {
        console.warn('Could not fetch Firestore user:', e);
      }
    }

    return {
      userId: 'user-demo-101',
      name: 'Alex Rivera',
      email: 'alex.rivera@ecoshare.org',
      ecoPoints: 450,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedAt: '2024-01-15T08:00:00.000Z',
      itemsSharedCount: 6
    };
  },

  async setActiveUser(userId: string): Promise<void> {},
  async initLocalStore(): Promise<void> {}
};
