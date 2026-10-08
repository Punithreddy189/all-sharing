import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { ChatConversation } from '../types';
import { MessageSquare, ChevronRight, Sparkles } from 'lucide-react-native';

export const ChatListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.userId) return;

    const unsub = dataService.subscribeToConversations(currentUser.userId, (list) => {
      setConversations(list);
      setLoading(false);
    });

    return () => {
      unsub();
    };
  }, [currentUser?.userId]);

  const getOtherParticipant = (conv: ChatConversation) => {
    const otherId = conv.participantIds.find((id) => id !== currentUser?.userId) || '';
    const info = conv.participants?.[otherId] || { name: 'Neighbor' };
    return { id: otherId, ...info };
  };

  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const other = getOtherParticipant(item);
    const dateFormatted = new Date(item.lastMessageTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            conversationId: item.conversationId,
            itemTitle: item.itemTitle,
            itemImage: item.itemImage,
            recipientName: other.name
          })
        }
      >
        {other.avatarUrl ? (
          <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{other.name?.[0] || 'U'}</Text>
          </View>
        )}

        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <Text style={styles.convName} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={styles.timeText}>{dateFormatted}</Text>
          </View>

          {item.itemTitle && (
            <View style={styles.itemTag}>
              <Text style={styles.itemTagText} numberOfLines={1}>
                📦 {item.itemTitle}
              </Text>
            </View>
          )}

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <ChevronRight size={18} color="#cbd5e1" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages 💬</Text>
        <Text style={styles.subtitle}>Coordinate pickups, swaps, and item queries</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MessageSquare size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptyText}>
                When you request or share an item, you can chat directly with your neighbors here!
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  listContent: {
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669'
  },
  convContent: {
    flex: 1,
    marginRight: 8
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  convName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500'
  },
  itemTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 3
  },
  itemTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  lastMessage: {
    fontSize: 13,
    color: '#64748b'
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
