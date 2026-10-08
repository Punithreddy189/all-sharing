import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SharedItem, ItemCategory, ListingType, AppNotification } from '../types';
import { Search, MapPin, Sparkles, Plus, BookOpen, Wrench, Laptop, Package, Tag, MessageSquare, Bell } from 'lucide-react-native';
import { LISTING_TYPE_CONFIGS, LISTING_TYPES, getListingConfig, formatListingPrice } from '../utils/listingConfig';
import { dataService } from '../services/dataService';

const CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: 'All', value: 'All', icon: Sparkles },
  { label: 'Books', value: 'Books', icon: BookOpen },
  { label: 'Tools', value: 'Tools', icon: Wrench },
  { label: 'Electronics', value: 'Electronics', icon: Laptop },
  { label: 'Others', value: 'Others', icon: Package }
];

const LISTING_FILTERS = [
  { label: 'All', value: 'All', emoji: '✨' },
  { label: 'Borrow', value: 'Borrow', emoji: '🤝' },
  { label: 'Sell', value: 'Sell', emoji: '💰' },
  { label: 'Rent', value: 'Rent', emoji: '⏳' },
  { label: 'Exchange', value: 'Exchange', emoji: '🔄' },
];

export const HomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { 
    items, 
    selectedCategory, 
    setSelectedCategory, 
    selectedListingType,
    setSelectedListingType,
    searchQuery, 
    setSearchQuery, 
    submitRequest 
  } = useApp();
  const { currentUser } = useAuth();
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.userId) return;
    const unsub = dataService.subscribeToNotifications(currentUser.userId, (notifs) => {
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadNotifCount(unread);
    });
    return () => unsub();
  }, [currentUser?.userId]);

  const handleChatWithOwner = async (item: SharedItem) => {
    if (!currentUser) return;
    if (item.ownerId === currentUser.userId) {
      Alert.alert('Your Item', 'This is your own shared item.');
      return;
    }
    try {
      const convId = await dataService.getOrCreateConversation(item, currentUser);
      navigation?.navigate('MessagesTab', {
        screen: 'ChatDetail',
        params: {
          conversationId: convId,
          itemTitle: item.title,
          itemImage: item.imageUrl,
          recipientName: item.ownerName
        }
      });
    } catch (e) {
      console.warn('Could not open chat:', e);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const itemListingType = item.listingType || 'Borrow';
    const matchesListingType = selectedListingType === 'All' || itemListingType === selectedListingType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      itemListingType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesListingType && matchesSearch;
  });

  const handleOpenRequestModal = (item: SharedItem) => {
    if (item.ownerId === currentUser?.userId) {
      Alert.alert('Your Item', 'This is your own shared item.');
      return;
    }
    setSelectedItem(item);
    setRequestNote('');
    setRequestModalVisible(true);
  };

  const handleSendRequest = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await submitRequest(selectedItem.itemId, requestNote);
      setRequestModalVisible(false);
      Alert.alert('Request Sent! 🎉', `Your request for "${selectedItem.title}" has been sent to ${selectedItem.ownerName}.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItemCard = ({ item }: { item: SharedItem }) => {
    const isOwner = item.ownerId === currentUser?.userId;
    const listingConfig = getListingConfig(item.listingType);
    const priceFormatted = formatListingPrice(item);

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        
        {/* Badges Container */}
        <View style={styles.cardBadgeContainer}>
          <View style={[styles.listingTypeBadge, { backgroundColor: listingConfig.color.bg, borderColor: listingConfig.color.border }]}>
            <Text style={[styles.listingTypeBadgeText, { color: listingConfig.color.text }]}>
              {listingConfig.emoji} {listingConfig.label}
            </Text>
          </View>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>

        {/* Price & Condition Badge Overlay */}
        <View style={styles.priceOverlayBadge}>
          <Text style={styles.priceOverlayText}>{priceFormatted}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>

          {item.listingType === 'Exchange' && item.exchangeFor && (
            <View style={styles.exchangeBox}>
              <Text style={styles.exchangeText} numberOfLines={1}>
                Swap for: {item.exchangeFor}
              </Text>
            </View>
          )}

          {item.location && (
            <View style={styles.locationRow}>
              <MapPin size={13} color="#64748b" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.ownerRow}>
              {item.ownerAvatar ? (
                <Image source={{ uri: item.ownerAvatar }} style={styles.ownerAvatar} />
              ) : (
                <View style={styles.ownerAvatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{(item.ownerName && item.ownerName[0]) || 'U'}</Text>
                </View>
              )}
              <Text style={styles.ownerName} numberOfLines={1}>
                {item.ownerName || 'Neighbor'} {isOwner ? '(You)' : ''}
              </Text>
            </View>

            {item.status === 'Available' && !isOwner && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={styles.chatIconButton}
                  onPress={() => handleChatWithOwner(item)}
                >
                  <MessageSquare size={16} color="#059669" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.requestButton, { backgroundColor: listingConfig.color.primary }]}
                  onPress={() => handleOpenRequestModal(item)}
                >
                  <Text style={styles.requestButtonText}>
                    {item.listingType === 'Sell' ? 'Buy / Offer' : item.listingType === 'Rent' ? 'Rent' : item.listingType === 'Exchange' ? 'Swap' : 'Borrow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const selectedItemConfig = getListingConfig(selectedItem?.listingType);

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <Text style={styles.appName}>EcoShare 🌱</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.pointsPill}>
              <Sparkles size={14} color="#d97706" />
              <Text style={styles.pointsPillText}>{currentUser?.ecoPoints || 0} pts</Text>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation?.navigate('Notifications')}
            >
              <Bell size={18} color="#0f172a" />
              {unreadNotifCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>Borrow, Sell, Rent, and Swap with Neighbors</Text>

        <View style={styles.searchBox}>
          <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, tools, sell, rent, swap..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Listing Type Filter Row */}
      <View style={styles.filterBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {LISTING_FILTERS.map((lt) => {
            const isSelected = selectedListingType === lt.value;
            return (
              <TouchableOpacity
                key={lt.value}
                style={[styles.listingFilterChip, isSelected && styles.listingFilterChipActive]}
                onPress={() => setSelectedListingType(lt.value)}
              >
                <Text style={styles.filterEmoji}>{lt.emoji}</Text>
                <Text style={[styles.listingFilterText, isSelected && styles.listingFilterTextActive]}>
                  {lt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Categories Horizontal Bar */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Icon size={13} color={isSelected ? '#ffffff' : '#475569'} style={{ marginRight: 4 }} />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items Feed */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.itemId}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyDesc}>
              Try changing your search term or select another category or listing type.
            </Text>
          </View>
        }
      />

      {/* Request Modal */}
      <Modal visible={requestModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedItemConfig.emoji} {selectedItemConfig.ctaLabel}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedItem?.title} • <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatListingPrice(selectedItem || {})}</Text>
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder={selectedItemConfig.requestPlaceholder}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={requestNote}
              onChangeText={setRequestNote}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRequestModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: selectedItemConfig.color.primary }, submitting && { opacity: 0.7 }]}
                disabled={submitting}
                onPress={handleSendRequest}
              >
                <Text style={styles.confirmButtonText}>
                  {submitting ? 'Sending...' : 'Confirm Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.5
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  pointsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
    marginLeft: 4
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    position: 'relative'
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  categoryScrollWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  filterBarWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  listingFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6
  },
  listingFilterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  filterEmoji: {
    fontSize: 13,
    marginRight: 4
  },
  listingFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  listingFilterTextActive: {
    color: '#ffffff'
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 6
  },
  categoryChipActive: {
    backgroundColor: '#059669'
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  categoryChipTextActive: {
    color: '#ffffff'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0'
  },
  cardBadgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listingTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  listingTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  priceOverlayBadge: {
    position: 'absolute',
    top: 145,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  priceOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600'
  },
  exchangeBox: {
    backgroundColor: '#faf5ff',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginBottom: 8
  },
  exchangeText: {
    fontSize: 11,
    color: '#7e22ce',
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusAvailable: {
    backgroundColor: '#d1fae5'
  },
  statusShared: {
    backgroundColor: '#f1f5f9'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  textEmerald: {
    color: '#047857'
  },
  textSlate: {
    color: '#64748b'
  },
  cardBody: {
    padding: 14
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  ownerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8
  },
  ownerAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  ownerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  requestButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10
  },
  requestButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center'
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
