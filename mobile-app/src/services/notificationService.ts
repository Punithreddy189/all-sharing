import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

let NotificationsModule: any = null;

try {
  NotificationsModule = require('expo-notifications');
  if (NotificationsModule && typeof NotificationsModule.setNotificationHandler === 'function') {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (err) {
  console.log('[NotificationService] Expo-notifications native module not attached, using in-app fallback:', err);
}

// In-memory deduplication cache: type + userId + itemId -> timestamp
const recentAlertsCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60000; // 60 seconds

export const notificationService = {
  /**
   * Initialize and request permissions for Push Notifications
   * Sets up Android Notification Channels with high priority & sound
   */
  async registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
    if (!NotificationsModule) {
      console.log('[NotificationService] Native push module not active in this runtime.');
      return null;
    }

    let token: string | null = null;

    try {
      if (Platform.OS === 'android' && NotificationsModule.setNotificationChannelAsync) {
        // 1. Configure Android High-Importance Notification Channels
        try {
          await NotificationsModule.setNotificationChannelAsync('default', {
            name: 'General EcoShare Alerts',
            importance: NotificationsModule.AndroidImportance?.MAX || 5,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#059669',
            sound: 'default'
          });

          await NotificationsModule.setNotificationChannelAsync('chat_messages', {
            name: 'Chat & Direct Messages',
            importance: NotificationsModule.AndroidImportance?.HIGH || 4,
            vibrationPattern: [0, 150, 150, 150],
            lightColor: '#2563eb',
            sound: 'default'
          });

          await NotificationsModule.setNotificationChannelAsync('requests', {
            name: 'Item Sharing & Borrow Requests',
            importance: NotificationsModule.AndroidImportance?.MAX || 5,
            vibrationPattern: [0, 300, 200, 300],
            lightColor: '#059669',
            sound: 'default'
          });

          await NotificationsModule.setNotificationChannelAsync('rewards', {
            name: 'EcoPoints & Rewards',
            importance: NotificationsModule.AndroidImportance?.DEFAULT || 3,
            lightColor: '#d97706',
            sound: 'default'
          });
        } catch (channelErr) {
          console.log('[NotificationService] Android channels setup notice:', channelErr);
        }
      }

      // 2. Request System Permissions
      if (NotificationsModule.getPermissionsAsync) {
        const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted' && NotificationsModule.requestPermissionsAsync) {
          const { status } = await NotificationsModule.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[NotificationService] Push notification permissions not granted.');
          return null;
        }
      }

      // 3. Obtain Token
      if (NotificationsModule.getExpoPushTokenAsync) {
        try {
          const tokenData = await NotificationsModule.getExpoPushTokenAsync();
          token = tokenData?.data || null;
          console.log('[NotificationService] 📲 Push Token obtained:', token);

          // 4. Sync Token with Firestore User Document
          if (token && userId && db && !userId.startsWith('user-demo')) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              pushToken: token,
              pushTokenUpdatedAt: new Date().toISOString()
            });
          }
        } catch (tokenErr) {
          console.log('[NotificationService] Push token notice:', tokenErr);
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Registration error:', error);
    }

    return token;
  },

  /**
   * Deduplicates alerts to prevent notification spam
   */
  shouldSendAlert(key: string): boolean {
    const now = Date.now();
    const lastSent = recentAlertsCache.get(key);
    if (lastSent && now - lastSent < DEDUPLICATION_WINDOW_MS) {
      console.log(`[NotificationService] 🛡️ Deduplicating notification key: ${key}`);
      return false;
    }
    recentAlertsCache.set(key, now);
    return true;
  },

  /**
   * Triggers a local Push Notification (visible on Lock Screen & Status Bar)
   */
  async triggerLocalPushNotification(params: {
    title: string;
    body: string;
    channelId?: 'default' | 'chat_messages' | 'requests' | 'rewards';
    data?: Record<string, any>;
    dedupKey?: string;
  }): Promise<void> {
    const { title, body, channelId = 'default', data = {}, dedupKey } = params;

    if (dedupKey && !this.shouldSendAlert(dedupKey)) {
      return;
    }

    if (!NotificationsModule || !NotificationsModule.scheduleNotificationAsync) {
      console.log('[NotificationService] 🔔 In-App notification recorded:', title);
      return;
    }

    try {
      await NotificationsModule.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1
        },
        trigger: null // Display immediately
      });
      console.log('[NotificationService] 🔔 Native push alert dispatched:', title);
    } catch (e) {
      console.warn('[NotificationService] Could not schedule local push:', e);
    }
  },

  /**
   * Attaches response listener when user taps an alert from lock screen / shade
   */
  addResponseListener(callback: (response: any) => void) {
    if (NotificationsModule && NotificationsModule.addNotificationResponseReceivedListener) {
      return NotificationsModule.addNotificationResponseReceivedListener(callback);
    }
    return { remove: () => {} };
  }
};
