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
import { SharedItem, UserProfile, ItemRequest, AppNotification, ChatMessage, ChatConversation } from '../types';
import { validateListing } from '../utils/listingConfig';
import { notificationService } from './notificationService';

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

import { INITIAL_USERS, INITIAL_ITEMS, INITIAL_REQUESTS } from './mockStorage';

let localMobileItems = [...INITIAL_ITEMS];
let localMobileRequests = [...INITIAL_REQUESTS];
let localMobileConversations: ChatConversation[] = [
  {
    conversationId: 'conv-demo-1',
    itemId: 'item-101',
    itemTitle: 'Marvel Graphic Novel Vol. 1',
    itemImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    participantIds: ['user-demo-101', 'user-neighbor-202'],
    participants: {
      'user-demo-101': { name: 'Alex Rivera' },
      'user-neighbor-202': { name: 'Elena Rostova' }
    },
    lastMessage: 'Hi Alex! Is the graphic novel still available for this weekend?',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    lastSenderId: 'user-neighbor-202',
    unreadCount: 1
  }
];
let localMobileMessages: Record<string, ChatMessage[]> = {
  'conv-demo-1': [
    {
      messageId: 'msg-1',
      conversationId: 'conv-demo-1',
      senderId: 'user-neighbor-202',
      senderName: 'Elena Rostova',
      text: 'Hi Alex! Is the graphic novel still available for this weekend?',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: true
    }
  ]
};
let localMobileNotifications: AppNotification[] = [
  {
    id: 'notif-demo-1',
    userId: 'user-demo-101',
    title: 'Welcome to EcoShare! 🌱',
    message: 'You earned 50 starting EcoPoints! Share an item to earn more points and prevent CO2 waste.',
    type: 'points_earned',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    pointsAwarded: 50
  },
  {
    id: 'notif-demo-2',
    userId: 'user-demo-101',
    title: 'New Message from Elena 💬',
    message: 'Elena asked about "Marvel Graphic Novel Vol. 1"',
    type: 'message_received',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    relatedConversationId: 'conv-demo-1'
  }
];
const localItemListeners: Array<(items: SharedItem[]) => void> = [];
const localConversationListeners: Record<string, Array<(convs: ChatConversation[]) => void>> = {};
const localMessageListeners: Record<string, Array<(msgs: ChatMessage[]) => void>> = {};
const localNotificationListeners: Record<string, Array<(notifs: AppNotification[]) => void>> = {};

export const dataService = {
  // ==========================================
  // 1. ITEMS (Create, Read Live, Delete)
  // ==========================================

  async createItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
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

    localMobileItems = [localItem, ...localMobileItems];
    localItemListeners.forEach(cb => cb(localMobileItems));

    if (db) {
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
        });

        const docRef = await addDoc(collection(db, 'items'), itemData);

        try {
          const userRef = doc(db, 'users', item.ownerId);
          await updateDoc(userRef, {
            ecoPoints: increment(10),
            itemsSharedCount: increment(1)
          });
        } catch {}

        return docRef.id;
      } catch (err: any) {
        console.warn('[Firestore] Write error or permission restriction, saved locally:', err.message);
        return newItemId;
      }
    }

    return newItemId;
  },

  async postItem(item: Omit<SharedItem, 'itemId' | 'createdAt' | 'status'>): Promise<string> {
    return this.createItem(item);
  },

  subscribeToItems(callback: (items: SharedItem[]) => void): () => void {
    callback(localMobileItems);
    localItemListeners.push(callback);

    let unsubFirestore: (() => void) | null = null;

    if (db) {
      try {
        const itemsQuery = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        unsubFirestore = onSnapshot(
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

            if (items.length > 0) {
              localMobileItems = items;
              callback(items);
            }
          },
          (error) => {
            console.warn('[Firestore] Items subscription fallback active:', error.message);
            callback(localMobileItems);
          }
        );
      } catch (e: any) {
        console.warn('[Firestore] Query setup error:', e.message);
      }
    }

    return () => {
      const idx = localItemListeners.indexOf(callback);
      if (idx !== -1) localItemListeners.splice(idx, 1);
      if (unsubFirestore) unsubFirestore();
    };
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
  async initLocalStore(): Promise<void> {},

  // ==========================================
  // 4. REAL-TIME CHAT & MESSAGING
  // ==========================================

  subscribeToConversations(userId: string, callback: (convs: ChatConversation[]) => void): () => void {
    if (db) {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userId),
          orderBy('lastMessageTime', 'desc')
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const conversations: ChatConversation[] = [];
            snapshot.forEach((docSnap) => {
              conversations.push({
                conversationId: docSnap.id,
                ...docSnap.data()
              } as ChatConversation);
            });
            callback(conversations);
          },
          (error) => {
            console.warn('[Firestore] Conversation listener notice:', error);
            const userConvs = localMobileConversations.filter((c) =>
              c.participantIds.includes(userId)
            );
            callback(userConvs);
          }
        );
        return unsubscribe;
      } catch (e) {
        console.warn('[Firestore] Chat query setup error:', e);
      }
    }

    // Local fallback
    if (!localConversationListeners[userId]) {
      localConversationListeners[userId] = [];
    }
    localConversationListeners[userId].push(callback);
    const userConvs = localMobileConversations.filter((c) =>
      c.participantIds.includes(userId)
    );
    callback(userConvs);

    return () => {
      if (localConversationListeners[userId]) {
        localConversationListeners[userId] = localConversationListeners[userId].filter(
          (cb) => cb !== callback
        );
      }
    };
  },

  subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    if (db) {
      try {
        const q = query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              messages.push({
                messageId: docSnap.id,
                ...docSnap.data()
              } as ChatMessage);
            });
            callback(messages);
          },
          (error) => {
            console.warn('[Firestore] Message listener notice:', error);
            callback(localMobileMessages[conversationId] || []);
          }
        );
        return unsubscribe;
      } catch (e) {
        console.warn('[Firestore] Message query setup error:', e);
      }
    }

    // Local fallback
    if (!localMessageListeners[conversationId]) {
      localMessageListeners[conversationId] = [];
    }
    localMessageListeners[conversationId].push(callback);
    callback(localMobileMessages[conversationId] || []);

    return () => {
      if (localMessageListeners[conversationId]) {
        localMessageListeners[conversationId] = localMessageListeners[conversationId].filter(
          (cb) => cb !== callback
        );
      }
    };
  },

  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'messageId' | 'createdAt'>
  ): Promise<string> {
    const messageId = `msg-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newMsg: ChatMessage = {
      messageId,
      conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      text: message.text,
      createdAt,
      read: false
    };

    // Save locally
    if (!localMobileMessages[conversationId]) {
      localMobileMessages[conversationId] = [];
    }
    localMobileMessages[conversationId].push(newMsg);

    // Update conversation snippet
    const convIndex = localMobileConversations.findIndex(
      (c) => c.conversationId === conversationId
    );
    if (convIndex >= 0) {
      localMobileConversations[convIndex].lastMessage = message.text;
      localMobileConversations[convIndex].lastMessageTime = createdAt;
      localMobileConversations[convIndex].lastSenderId = message.senderId;
    }

    // Notify listeners
    if (localMessageListeners[conversationId]) {
      localMessageListeners[conversationId].forEach((cb) =>
        cb([...localMobileMessages[conversationId]])
      );
    }
    Object.keys(localConversationListeners).forEach((uId) => {
      localConversationListeners[uId].forEach((cb) =>
        cb(localMobileConversations.filter((c) => c.participantIds.includes(uId)))
      );
    });

    // Sync to Firestore
    if (db) {
      try {
        const msgRef = doc(
          db,
          'conversations',
          conversationId,
          'messages',
          messageId
        );
        await setDoc(msgRef, cleanForFirestore(newMsg));

        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          lastMessage: message.text,
          lastMessageTime: createdAt,
          lastSenderId: message.senderId,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('[Firestore] Could not write message to cloud:', e);
      }
    }

    return messageId;
  },

  async getOrCreateConversation(
    item: SharedItem,
    buyer: UserProfile
  ): Promise<string> {
    const existing = localMobileConversations.find(
      (c) =>
        c.itemId === item.itemId &&
        c.participantIds.includes(buyer.userId) &&
        c.participantIds.includes(item.ownerId)
    );
    if (existing) {
      return existing.conversationId;
    }

    const conversationId = `conv-${Date.now()}`;
    const newConv: ChatConversation = {
      conversationId,
      itemId: item.itemId,
      itemTitle: item.title,
      itemImage: item.imageUrl,
      participantIds: [buyer.userId, item.ownerId],
      participants: {
        [buyer.userId]: { name: buyer.name, avatarUrl: buyer.avatarUrl },
        [item.ownerId]: { name: item.ownerName, avatarUrl: item.ownerAvatar }
      },
      lastMessage: `Started a conversation about "${item.title}"`,
      lastMessageTime: new Date().toISOString(),
      lastSenderId: buyer.userId,
      unreadCount: 0
    };

    localMobileConversations.unshift(newConv);

    if (db) {
      try {
        const convRef = doc(db, 'conversations', conversationId);
        await setDoc(convRef, cleanForFirestore(newConv));
      } catch (e) {
        console.warn('[Firestore] Could not create cloud conversation:', e);
      }
    }

    return conversationId;
  },

  // ==========================================
  // 5. IN-APP & CLOUD NOTIFICATIONS
  // ==========================================

  subscribeToNotifications(
    userId: string,
    callback: (notifs: AppNotification[]) => void
  ): () => void {
    if (db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const notifs: AppNotification[] = [];
            snapshot.forEach((docSnap) => {
              notifs.push({
                id: docSnap.id,
                ...docSnap.data()
              } as AppNotification);
            });
            callback(notifs);
          },
          (error) => {
            console.warn('[Firestore] Notification listener notice:', error);
            callback(localMobileNotifications.filter((n) => n.userId === userId));
          }
        );
        return unsubscribe;
      } catch (e) {
        console.warn('[Firestore] Notification query setup error:', e);
      }
    }

    // Local fallback
    if (!localNotificationListeners[userId]) {
      localNotificationListeners[userId] = [];
    }
    localNotificationListeners[userId].push(callback);
    callback(localMobileNotifications.filter((n) => n.userId === userId));

    return () => {
      if (localNotificationListeners[userId]) {
        localNotificationListeners[userId] = localNotificationListeners[userId].filter(
          (cb) => cb !== callback
        );
      }
    };
  },

  async sendNotification(
    notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
  ): Promise<string> {
    const id = `notif-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newNotif: AppNotification = {
      id,
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      createdAt,
      relatedItemId: notif.relatedItemId,
      relatedConversationId: notif.relatedConversationId,
      pointsAwarded: notif.pointsAwarded
    };

    localMobileNotifications.unshift(newNotif);

    // Trigger Native Push Notification (Lock screen / Status bar alert)
    const dedupKey = `${notif.type}_${notif.userId}_${notif.relatedItemId || notif.relatedConversationId || 'general'}`;
    const channelId = notif.type === 'message_received' ? 'chat_messages' : notif.type === 'points_earned' ? 'rewards' : 'requests';

    notificationService.triggerLocalPushNotification({
      title: notif.title,
      body: notif.message,
      channelId,
      data: {
        type: notif.type,
        relatedItemId: notif.relatedItemId,
        relatedConversationId: notif.relatedConversationId
      },
      dedupKey
    });

    if (localNotificationListeners[notif.userId]) {
      localNotificationListeners[notif.userId].forEach((cb) =>
        cb(localMobileNotifications.filter((n) => n.userId === notif.userId))
      );
    }

    if (db) {
      try {
        const notifRef = doc(db, 'notifications', id);
        await setDoc(notifRef, cleanForFirestore(newNotif));
      } catch (e) {
        console.warn('[Firestore] Cloud notification notice:', e);
      }
    }

    return id;
  },

  async markNotificationAsRead(notifId: string): Promise<void> {
    const target = localMobileNotifications.find((n) => n.id === notifId);
    if (target) {
      target.read = true;
      if (localNotificationListeners[target.userId]) {
        localNotificationListeners[target.userId].forEach((cb) =>
          cb(localMobileNotifications.filter((n) => n.userId === target.userId))
        );
      }
    }

    if (db) {
      try {
        const notifRef = doc(db, 'notifications', notifId);
        await updateDoc(notifRef, { read: true });
      } catch (e) {
        console.warn('[Firestore] Could not mark notif read in cloud:', e);
      }
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    localMobileNotifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });

    if (localNotificationListeners[userId]) {
      localNotificationListeners[userId].forEach((cb) =>
        cb(localMobileNotifications.filter((n) => n.userId === userId))
      );
    }

    if (db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('read', '==', false)
        );
        // Fire updates for matching documents
      } catch (e) {
        console.warn('Could not mark all notifs read:', e);
      }
    }
  }
};
