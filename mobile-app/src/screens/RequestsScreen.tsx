import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ItemRequest } from '../types';
import { Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react-native';

export const RequestsScreen: React.FC = () => {
  const { requests, handleAcceptRequest, handleRejectRequest } = useApp();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Segregate incoming vs outgoing requests
  const incomingRequests = requests.filter((r) => r.ownerId === currentUser?.userId);
  const outgoingRequests = requests.filter((r) => r.requesterId === currentUser?.userId);

  const displayedList = tab === 'incoming' ? incomingRequests : outgoingRequests;

  const onAccept = (request: ItemRequest) => {
    Alert.alert(
      'Accept Request',
      `Share "${request.itemTitle}" with ${request.requesterName}? You will earn +100 EcoPoints!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Share',
          onPress: async () => {
            await handleAcceptRequest(request.requestId);
            Alert.alert('Request Accepted! 🎉', 'You earned +100 EcoPoints for sharing.');
          }
        }
      ]
    );
  };

  const onReject = (request: ItemRequest) => {
    Alert.alert('Decline Request', `Decline request from ${request.requesterName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => handleRejectRequest(request.requestId)
      }
    ]);
  };

  const renderRequestItem = ({ item }: { item: ItemRequest }) => {
    const isIncoming = tab === 'incoming';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.itemImage && (
            <Image source={{ uri: item.itemImage }} style={styles.itemThumb} />
          )}
          <View style={styles.itemHeaderInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.itemTitle}
            </Text>
            <Text style={styles.personSubtext}>
              {isIncoming ? `Requested by ${item.requesterName}` : `Owned by ${item.ownerName || 'Member'}`}
            </Text>
          </View>

          {/* Status Chip */}
          <View
            style={[
              styles.statusChip,
              item.status === 'Accepted' && styles.statusAccepted,
              item.status === 'Rejected' && styles.statusRejected,
              item.status === 'Pending' && styles.statusPending
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                item.status === 'Accepted' && styles.textGreen,
                item.status === 'Rejected' && styles.textRed,
                item.status === 'Pending' && styles.textAmber
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {item.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>"{item.note}"</Text>
          </View>
        )}

        {/* Action buttons for pending incoming requests */}
        {isIncoming && item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(item)}
            >
              <X size={16} color="#ef4444" />
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(item)}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'incoming' && styles.tabBtnActive]}
          onPress={() => setTab('incoming')}
        >
          <Text style={[styles.tabBtnText, tab === 'incoming' && styles.tabBtnTextActive]}>
            Received ({incomingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'outgoing' && styles.tabBtnActive]}
          onPress={() => setTab('outgoing')}
        >
          <Text style={[styles.tabBtnText, tab === 'outgoing' && styles.tabBtnTextActive]}>
            Sent ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.requestId}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              No {tab === 'incoming' ? 'incoming' : 'outgoing'} requests
            </Text>
            <Text style={styles.emptyDesc}>
              {tab === 'incoming'
                ? 'When community members request your shared items, they will appear here.'
                : 'Items you requested will show their status here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  tabBtnActive: {
    backgroundColor: '#059669'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#ffffff'
  },
  list: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#e2e8f0'
  },
  itemHeaderInfo: {
    flex: 1,
    marginRight: 8
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  personSubtext: {
    fontSize: 12,
    color: '#64748b'
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusPending: {
    backgroundColor: '#fef3c7'
  },
  statusAccepted: {
    backgroundColor: '#d1fae5'
  },
  statusRejected: {
    backgroundColor: '#fee2e2'
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700'
  },
  textGreen: {
    color: '#047857'
  },
  textRed: {
    color: '#b91c1c'
  },
  textAmber: {
    color: '#b45309'
  },
  noteBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  noteText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    gap: 4
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444'
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    gap: 4
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32
  }
});
