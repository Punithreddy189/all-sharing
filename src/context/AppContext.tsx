import React, { createContext, useContext, useState, useEffect } from 'react';
import { SharedItem, ItemRequest, AppNotification, ItemCategory, FilterState, Currency, ListingType, PricingUnit, ItemCondition, SortOption } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'points';
  title: string;
  message: string;
}

interface AppContextType {
  items: SharedItem[];
  requests: ItemRequest[];
  notifications: AppNotification[];
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedListingType: (listingType: string) => void;
  setSelectedStatus: (status: string) => void;
  setSortBy: (sort: import('../types').SortOption) => void;
  activeTab: 'home' | 'my-items' | 'requests' | 'profile';
  setActiveTab: (tab: 'home' | 'my-items' | 'requests' | 'profile') => void;
  selectedItem: SharedItem | null;
  setSelectedItem: (item: SharedItem | null) => void;
  isPostModalOpen: boolean;
  setIsPostModalOpen: (open: boolean) => void;
  isConfigModalOpen: boolean;
  setIsConfigModalOpen: (open: boolean) => void;
  isNotifDrawerOpen: boolean;
  setIsNotifDrawerOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  triggerConfetti: () => void;
  // Core Actions
  postNewItem: (item: {
    title: string;
    description: string;
    category: ItemCategory;
    imageUrl: string;
    location?: string;
    listingType: ListingType;
    price?: number | null;
    pricingUnit?: PricingUnit | null;
    currency?: Currency;
    exchangeFor?: string | null;
    isNegotiable?: boolean;
    condition?: ItemCondition;
    aiGenerated?: boolean;
    aiConfidence?: number;
    aiSource?: 'gemini' | 'cache' | 'fallback';
    aiReasoning?: string;
    ecoPoints?: number;
    co2Saved?: number;
    tags?: string[];
  }) => Promise<void>;
  requestAnItem: (itemId: string, note?: string) => Promise<void>;
  acceptAnItemRequest: (requestId: string, itemId: string) => Promise<void>;
  rejectAnItemRequest: (requestId: string, itemId: string) => Promise<void>;
  markNotifRead: (notifId: string) => void;
  deleteAnItem: (itemId: string) => Promise<void>;
  userCategoriesHistory: ItemCategory[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, openAuthModal } = useAuth();
  const [items, setItems] = useState<SharedItem[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'home' | 'my-items' | 'requests' | 'profile'>('home');
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [userCategoriesHistory, setUserCategoriesHistory] = useState<ItemCategory[]>(['Tools', 'Electronics']);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'All',
    selectedListingType: 'All',
    selectedStatus: 'All',
    sortBy: 'newest',
  });

  // Subscribe to real-time items
  useEffect(() => {
    const unsubItems = dataService.subscribeToItems((freshItems) => {
      setItems(freshItems);
      // If modal is viewing an item, update it in place
      if (selectedItem) {
        const updated = freshItems.find(i => i.itemId === selectedItem.itemId);
        if (updated) setSelectedItem(updated);
      }
    });

    return () => unsubItems();
  }, [selectedItem?.itemId]);

  // Subscribe to real-time requests
  useEffect(() => {
    const unsubRequests = dataService.subscribeToRequests((freshRequests) => {
      setRequests(freshRequests);
    });

    return () => unsubRequests();
  }, []);

  // Subscribe to real-time notifications for current user
  useEffect(() => {
    if (!currentUser?.userId) {
      setNotifications([]);
      return;
    }

    const unsubNotifs = dataService.subscribeToNotifications(currentUser.userId, (freshNotifs) => {
      setNotifications(freshNotifs);
    });

    return () => unsubNotifs();
  }, [currentUser?.userId]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 4);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // ignore
    }
  };

  // Filter modifiers
  const setSearchQuery = (query: string) => setFilters(f => ({ ...f, searchQuery: query }));
  const setSelectedCategory = (category: string) => {
    setFilters(f => ({ ...f, selectedCategory: category }));
    if (category !== 'All') {
      setUserCategoriesHistory(prev => Array.from(new Set([category as ItemCategory, ...prev])));
    }
  };
  const setSelectedListingType = (listingType: string) => setFilters(f => ({ ...f, selectedListingType: listingType }));
  const setSelectedStatus: (status: string) => void = (status: string) => setFilters(f => ({ ...f, selectedStatus: status }));
  const setSortBy = (sort: import('../types').SortOption) => setFilters(f => ({ ...f, sortBy: sort }));

  // Post item action
  const postNewItem = async (itemData: {
    title: string;
    description: string;
    category: ItemCategory;
    imageUrl: string;
    location?: string;
    listingType: ListingType;
    price?: number | null;
    pricingUnit?: PricingUnit | null;
    currency?: Currency;
    exchangeFor?: string | null;
    isNegotiable?: boolean;
    condition?: ItemCondition;
    aiGenerated?: boolean;
    aiConfidence?: number;
    aiSource?: 'gemini' | 'cache' | 'fallback';
    aiReasoning?: string;
    ecoPoints?: number;
    co2Saved?: number;
    tags?: string[];
  }) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    await dataService.addItem({
      ...itemData,
      ownerId: currentUser.userId,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatarUrl,
    });

    setIsPostModalOpen(false);
    triggerConfetti();
    const pointsAwarded = itemData.ecoPoints || 10;
    const co2SavedKg = itemData.co2Saved ? ` (~${itemData.co2Saved} kg CO₂ saved)` : '';
    showToast({
      type: 'points',
      title: `+${pointsAwarded} EcoPoints Earned! 🌱`,
      message: `"${itemData.title}" was listed as ${itemData.listingType}${co2SavedKg}. Thank you for participating in the circular economy!`,
    });
  };

  // Request item action
  const requestAnItem = async (itemId: string, note?: string) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    const item = items.find(i => i.itemId === itemId);
    if (!item) return;

    if (item.ownerId === currentUser.userId) {
      showToast({
        type: 'error',
        title: 'Own Item',
        message: 'You already own this item!',
      });
      return;
    }

    if (item.status !== 'Available') {
      showToast({
        type: 'info',
        title: 'Item Unavailable',
        message: 'This item has already been requested or shared.',
      });
      return;
    }

    await dataService.requestItem({
      itemId: item.itemId,
      itemTitle: item.title,
      itemImage: item.imageUrl,
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      requesterId: currentUser.userId,
      requesterName: currentUser.name,
      requesterAvatar: currentUser.avatarUrl,
      note,
    });

    showToast({
      type: 'success',
      title: 'Request Sent! 🚀',
      message: `Your request for "${item.title}" was sent to ${item.ownerName}.`,
    });
  };

  // Accept request action (+20 EcoPoints)
  const acceptAnItemRequest = async (requestId: string, itemId: string) => {
    if (!currentUser) return;

    await dataService.acceptRequest(requestId, itemId, currentUser.userId);
    triggerConfetti();
    showToast({
      type: 'points',
      title: '+20 EcoPoints Earned! 🎉',
      message: 'Request accepted! Item is now marked as Shared. Great job reducing waste!',
    });
  };

  // Reject request action
  const rejectAnItemRequest = async (requestId: string, itemId: string) => {
    await dataService.rejectRequest(requestId, itemId);
    showToast({
      type: 'info',
      title: 'Request Declined',
      message: 'The item has been made available back in the community pool.',
    });
  };

  const markNotifRead = (notifId: string) => {
    if (!currentUser) return;
    dataService.markNotificationRead(currentUser.userId, notifId);
  };

  const deleteAnItem = async (itemId: string) => {
    await dataService.deleteItem(itemId);
    setSelectedItem(null);
    showToast({
      type: 'info',
      title: 'Item Removed',
      message: 'Item has been removed from your listings.',
    });
  };

  return (
    <AppContext.Provider
      value={{
        items,
        requests,
        notifications,
        filters,
        setSearchQuery,
        setSelectedCategory,
        setSelectedListingType,
        setSelectedStatus,
        setSortBy,
        activeTab,
        setActiveTab,
        selectedItem,
        setSelectedItem,
        isPostModalOpen,
        setIsPostModalOpen,
        isConfigModalOpen,
        setIsConfigModalOpen,
        isNotifDrawerOpen,
        setIsNotifDrawerOpen,
        toasts,
        showToast,
        triggerConfetti,
        postNewItem,
        requestAnItem,
        acceptAnItemRequest,
        rejectAnItemRequest,
        markNotifRead,
        deleteAnItem,
        userCategoriesHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
