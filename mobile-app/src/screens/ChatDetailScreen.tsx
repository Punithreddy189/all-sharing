import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { ChatMessage } from '../types';
import { Send, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';

export const ChatDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { conversationId, itemTitle, itemImage, recipientName } = route.params;
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId) return;

    const unsub = dataService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsub();
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser?.userId) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await dataService.sendMessage(conversationId, {
        conversationId,
        senderId: currentUser.userId,
        senderName: currentUser.name || 'Eco Member',
        senderAvatar: currentUser.avatarUrl,
        text
      });
    } catch (e) {
      console.warn('Could not send message:', e);
    } finally {
      setSending(false);
    }
  };

  const renderMessageBubble = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === currentUser?.userId;
    const timeFormatted = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextRight : styles.messageTextLeft
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timeSubtext,
              isMe ? styles.timeSubtextRight : styles.timeSubtextLeft
            ]}
          >
            {timeFormatted}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Item Summary Bar */}
      {itemTitle && (
        <View style={styles.itemBanner}>
          {itemImage ? (
            <Image source={{ uri: itemImage }} style={styles.itemThumb} />
          ) : (
            <View style={styles.itemThumbPlaceholder}>
              <ImageIcon size={18} color="#059669" />
            </View>
          )}
          <View style={styles.itemBannerText}>
            <Text style={styles.itemBannerLabel}>Listing Discussion</Text>
            <Text style={styles.itemBannerTitle} numberOfLines={1}>
              {itemTitle}
            </Text>
          </View>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.messageId}
        renderItem={renderMessageBubble}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${recipientName || 'Neighbor'}...`}
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  itemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 12
  },
  itemThumbPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemBannerText: {
    flex: 1
  },
  itemBannerLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  itemBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  messageRowLeft: {
    justifyContent: 'flex-start'
  },
  messageRowRight: {
    justifyContent: 'flex-end'
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  bubbleRight: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  messageTextLeft: {
    color: '#0f172a'
  },
  messageTextRight: {
    color: '#ffffff'
  },
  timeSubtext: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  timeSubtextLeft: {
    color: '#94a3b8'
  },
  timeSubtextRight: {
    color: '#d1fae5'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    marginRight: 8
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8'
  }
});
