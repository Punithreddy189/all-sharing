export type ItemCategory = 'Books' | 'Tools' | 'Electronics' | 'Others';

export type ItemStatus = 'Available' | 'Requested' | 'Shared';

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected';

export type ListingType = 'Sell' | 'Borrow' | 'Exchange' | 'Rent';

export type PricingUnit = 'total' | 'day' | 'week';

export type Currency = 'USD' | 'INR' | 'EUR';

export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair';

export type SortOption = 'newest' | 'points' | 'price_asc' | 'price_desc';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  ecoPoints: number;
  avatarUrl?: string;
  joinedAt?: string;
  itemsSharedCount?: number;
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
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'points_earned' | 'item_posted';
  read: boolean;
  createdAt: string;
  relatedItemId?: string;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string; // 'All' | ItemCategory
  selectedListingType: string; // 'All' | ListingType
  selectedStatus: string; // 'All' | ItemStatus
  sortBy: SortOption;
}


