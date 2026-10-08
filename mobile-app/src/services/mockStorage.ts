import { SharedItem, UserProfile, ItemRequest } from '../types';

export const INITIAL_USERS: Record<string, UserProfile> = {
  'user-demo-101': {
    userId: 'user-demo-101',
    name: 'Alex Rivera',
    email: 'alex.rivera@ecoshare.org',
    ecoPoints: 450,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2024-01-15T08:00:00.000Z',
    itemsSharedCount: 6
  },
  'user-elena-202': {
    userId: 'user-elena-202',
    name: 'Elena Rostova',
    email: 'elena@ecoshare.org',
    ecoPoints: 620,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2023-11-20T10:00:00.000Z',
    itemsSharedCount: 9
  },
  'user-marcus-303': {
    userId: 'user-marcus-303',
    name: 'Marcus Chen',
    email: 'marcus@ecoshare.org',
    ecoPoints: 310,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2024-02-01T14:30:00.000Z',
    itemsSharedCount: 3
  }
};

export const INITIAL_ITEMS: SharedItem[] = [
  {
    itemId: 'item-101',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Classic programming book in pristine condition. Great for anyone looking to level up their code architecture skills.',
    category: 'Books',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-elena-202',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Downtown Tech District',
    listingType: 'Borrow',
    price: null,
    pricingUnit: null,
    currency: '$',
    exchangeFor: null,
    isNegotiable: false,
    condition: 'Like New'
  },
  {
    itemId: 'item-102',
    title: 'DeWalt 20V Cordless Drill & Bit Set',
    description: 'Comes with two lithium-ion batteries, high-speed charger, and complete set of 30 masonry and wood drill bits. Ready for weekend DIY projects.',
    category: 'Tools',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-demo-101',
    ownerName: 'Alex Rivera',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Westside Community Hub',
    listingType: 'Rent',
    price: 12,
    pricingUnit: 'day',
    currency: '$',
    exchangeFor: null,
    isNegotiable: false,
    condition: 'Good'
  },
  {
    itemId: 'item-103',
    title: 'Sony Wireless Noise-Cancelling Headphones (WH-1000XM4)',
    description: 'Perfect for deep study sessions, remote work calls, and flights. Crisp audio quality, active ANC, and 30-hour battery life.',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-marcus-303',
    ownerName: 'Marcus Chen',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'North Campus Library',
    listingType: 'Sell',
    price: 85,
    pricingUnit: 'total',
    currency: '$',
    exchangeFor: null,
    isNegotiable: true,
    condition: 'Like New'
  },
  {
    itemId: 'item-104',
    title: 'Ergonomic Mountain Trekking Backpack (45L)',
    description: 'Waterproof ripstop nylon, padded hip belt, ventilated back panel, and integrated rain cover. Used only once for a weekend camping trip.',
    category: 'Others',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-elena-202',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Greenwood Park Area',
    listingType: 'Exchange',
    price: null,
    pricingUnit: null,
    currency: '$',
    exchangeFor: 'Camping tent or hiking poles',
    isNegotiable: true,
    condition: 'Like New'
  }
];

export const INITIAL_REQUESTS: ItemRequest[] = [
  {
    requestId: 'req-1',
    itemId: 'item-102',
    itemTitle: 'DeWalt 20V Cordless Drill & Bit Set',
    itemImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-demo-101',
    ownerName: 'Alex Rivera',
    requesterId: 'user-marcus-303',
    requesterName: 'Marcus Chen',
    requesterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Pending',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    note: 'Hey Alex! Would love to borrow this for a couple hours on Saturday to mount some bookshelf brackets.'
  }
];
