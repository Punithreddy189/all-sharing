import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Sparkles,
  Inbox,
  MessageSquare,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react-native';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.userId) return;

    const unsub = dataService.subscribeToNotifications(currentUser.userId, (list) => {
      setNotifications(list);
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [currentUser?.userId]);

  const handleMarkAllRead = async () => {
    if (!currentUser?.userId) return;
    await dataService.markAllNotificationsAsRead(currentUser.userId);
  };

  const handlePressNotification = async (item: AppNotification) => {
    await dataService.markNotificationAsRead(item.id);

    if (item.type === 'message_received' && item.relatedConversationId) {
      navigation.navigate('MessagesTab', {
        screen: 'ChatDetail',
        params: {
          conversationId: item.relatedConversationId
        }
      });
    } else if (item.type === 'request_received' || item.type === 'request_accepted') {
      navigation.navigate('Requests');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'points_earned':
        return <Sparkles size={20} color="#d97706" />;
      case 'request_received':
        return <Inbox size={20} color="#059669" />;
      case 'request_accepted':
        return <CheckCircle size={20} color="#059669" />;
      case 'request_rejected':
        return <XCircle size={20} color="#dc2626" />;
      case 'message_received':
        return <MessageSquare size={20} color="#2563eb" />;
      default:
        return <Package size={20} color="#059669" />;
    }
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const timeFormatted = new Date(item.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => handlePressNotification(item)}
      >
        <View style={styles.iconCircle}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notifMessage}>{item.message}</Text>
          <Text style={styles.timeText}>{timeFormatted}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Notifications 🔔</Text>
          <Text style={styles.pageSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <CheckCheck size={16} color="#059669" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You'll receive alerts here when someone requests your items, sends messages, or when you earn EcoPoints!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4
  },
  listContent: {
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  notifCardUnread: {
    backgroundColor: '#f0fdf4',
    borderColor: '#a7f3d0'
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  notifContent: {
    flex: 1
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#0f172a'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginLeft: 6
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  }
});
