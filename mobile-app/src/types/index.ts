export type ItemCategory = 'Books' | 'Tools' | 'Electronics' | 'Furniture' | 'Clothing' | 'Others';

export type ItemStatus = 'Available' | 'Requested' | 'Shared';

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected';

export type ListingType = 'Sell' | 'Borrow' | 'Exchange' | 'Rent';

export type PricingUnit = 'total' | 'day' | 'week';

export type Currency = 'USD' | 'INR' | 'EUR' | '$' | '₹' | '€';

export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair';

export type SortOption = 'newest' | 'points' | 'price_asc' | 'price_desc';

export interface UserSettings {
  notifications: boolean;
  emailDigest: boolean;
  publicProfile: boolean;
  soundEffects?: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  ecoPoints: number;
  avatarUrl?: string;
  joinedAt?: string;
  itemsSharedCount?: number;
  settings?: UserSettings;
}

export interface SharedItem {
  itemId: string;
  title: string;
  description: string;
  category: ItemCategory;
  imageUrl: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  status: ItemStatus;
  createdAt: string;
  location?: string;

  // Listing Specification
  listingType: ListingType;
  price?: number | null;
  pricingUnit?: PricingUnit | null;
  currency?: Currency;
  exchangeFor?: string | null;
  isNegotiable?: boolean;
  condition?: ItemCondition;

  // AI Vision & Eco Impact Metadata
  aiGenerated?: boolean;
  aiConfidence?: number;
  aiSource?: 'gemini' | 'cache' | 'fallback';
  aiReasoning?: string;
  ecoPoints?: number;
  co2Saved?: number;
  tags?: string[];
}

export type AIVisionStatus = 'idle' | 'analyzing' | 'success' | 'error';

export interface ItemAnalysisData {
  title: string;
  category: ItemCategory;
  condition: ItemCondition;
  tags: string[];
  description: string;
  confidence: number;
  reasoning: string;
  ecoPoints: number;
  co2Saved: number;
}

export interface ItemAnalysisResponse {
  success: boolean;
  data: ItemAnalysisData;
  source: 'gemini' | 'cache' | 'fallback';
  version: string;
}

export interface ItemRequest {
  requestId: string;
  itemId: string;
  itemTitle: string;
  itemImage?: string;
  ownerId: string;
  ownerName?: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  status: RequestStatus;
  createdAt: string;
  note?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'points_earned' | 'item_posted' | 'message_received';
  read: boolean;
  createdAt: string;
  relatedItemId?: string;
  relatedConversationId?: string;
  pointsAwarded?: number;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string; // 'All' | ItemCategory
  selectedListingType: string; // 'All' | ListingType
  selectedStatus: string; // 'All' | ItemStatus
  sortBy: SortOption;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

export interface ChatConversation {
  conversationId: string;
  itemId?: string;
  itemTitle?: string;
  itemImage?: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      name: string;
      avatarUrl?: string;
    };
  };
  lastMessage: string;
  lastMessageTime: string;
  lastSenderId: string;
  unreadCount?: number;
}


