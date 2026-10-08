import React, { createContext, useContext, useState, useEffect } from 'react';
import { SharedItem, ItemRequest, ItemCategory } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';

interface AppContextType {
  items: SharedItem[];
  requests: ItemRequest[];
  loadingItems: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedListingType: string;
  setSelectedListingType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  postNewItem: (item: Omit<SharedItem, 'itemId' | 'createdAt'>) => Promise<string>;
  submitRequest: (itemId: string, note?: string) => Promise<string>;
  handleAcceptRequest: (requestId: string) => Promise<void>;
  handleRejectRequest: (requestId: string) => Promise<void>;
  selectedItem: SharedItem | null;
  setSelectedItem: (item: SharedItem | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, refreshProfile } = useAuth();
  const [items, setItems] = useState<SharedItem[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedListingType, setSelectedListingType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);

  useEffect(() => {
    const unsubItems = dataService.subscribeToItems((newItems) => {
      setItems(newItems);
      setLoadingItems(false);
    });

    let unsubReqs = () => {};
    if (currentUser?.userId) {
      unsubReqs = dataService.subscribeToRequests(currentUser.userId, (newReqs) => {
        setRequests(newReqs);
      });
    }

    return () => {
      unsubItems();
      unsubReqs();
    };
  }, [currentUser?.userId]);

  const postNewItem = async (item: Omit<SharedItem, 'itemId' | 'createdAt'>) => {
    const id = await dataService.postItem(item);
    await refreshProfile();
    return id;
  };

  const submitRequest = async (itemId: string, note?: string) => {
    if (!currentUser) throw new Error('You must be logged in to request an item');
    const targetItem = items.find((i) => i.itemId === itemId);
    if (!targetItem) throw new Error('Item not found');

    const reqId = await dataService.requestItem({
      itemId,
      itemTitle: targetItem.title,
      itemImage: targetItem.imageUrl,
      ownerId: targetItem.ownerId,
      ownerName: targetItem.ownerName,
      requesterId: currentUser.userId,
      requesterName: currentUser.name,
      requesterAvatar: currentUser.avatarUrl,
      note
    });
    return reqId;
  };

  const handleAcceptRequest = async (requestId: string) => {
    await dataService.updateRequestStatus(requestId, 'Accepted');
    await refreshProfile();
  };

  const handleRejectRequest = async (requestId: string) => {
    await dataService.updateRequestStatus(requestId, 'Rejected');
    await refreshProfile();
  };

  return (
    <AppContext.Provider
      value={{
        items,
        requests,
        loadingItems,
        selectedCategory,
        setSelectedCategory,
        selectedListingType,
        setSelectedListingType,
        searchQuery,
        setSearchQuery,
        postNewItem,
        submitRequest,
        handleAcceptRequest,
        handleRejectRequest,
        selectedItem,
        setSelectedItem
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

