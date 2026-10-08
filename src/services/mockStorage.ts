import { SharedItem, UserProfile, ItemRequest, AppNotification } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    userId: 'user-sarah-101',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    ecoPoints: 60,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    itemsSharedCount: 3,
  },
  {
    userId: 'user-alex-202',
    name: 'Alex Rivera',
    email: 'alex.r@example.com',
    ecoPoints: 40,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    itemsSharedCount: 2,
  },
  {
    userId: 'user-marcus-303',
    name: 'Marcus Chen',
    email: 'marcus.c@example.com',
    ecoPoints: 90,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    itemsSharedCount: 4,
  }
];

export const INITIAL_ITEMS: SharedItem[] = [
  {
    itemId: 'item-101',
    title: 'DeWalt Cordless Drill Kit (20V MAX)',
    description: 'High performance 2-speed compact drill with battery and charger. Ideal for home repairs, woodwork, and hanging shelves.',
    category: 'Tools',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-alex-202',
    ownerName: 'Alex Rivera',
    ownerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Downtown Community Hub (0.8 miles away)',
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
    title: 'Clean Code & Pragmatic Programmer Books',
    description: 'Two classic software engineering books in mint condition. Great for budding software developers or university students.',
    category: 'Books',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-sarah-101',
    ownerName: 'Sarah Jenkins',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Westside Library drop-off (1.2 miles away)',
    listingType: 'Exchange',
    price: null,
    pricingUnit: null,
    currency: '$',
    exchangeFor: 'Design Patterns book or React Native guide',
    isNegotiable: true,
    condition: 'Like New'
  },
  {
    itemId: 'item-103',
    title: 'Sony Wireless Noise-Cancelling Headphones',
    description: 'WH-CH710N over-ear headphones. Working perfectly, cleaned with sanitizing alcohol. Great for studying or remote work.',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-marcus-303',
    ownerName: 'Marcus Chen',
    ownerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    status: 'Requested',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Oakridge Park District (2.1 miles away)',
    listingType: 'Rent',
    price: 8,
    pricingUnit: 'day',
    currency: '$',
    exchangeFor: null,
    isNegotiable: false,
    condition: 'Good'
  },
  {
    itemId: 'item-104',
    title: 'Digital Kitchen Food Scale & Baking Set',
    description: 'Stainless steel high-precision digital food scale with measuring cups and silicone baking mats. Hardly used.',
    category: 'Others',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-sarah-101',
    ownerName: 'Sarah Jenkins',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Westside Community Center (1.0 mile away)',
    listingType: 'Sell',
    price: 18,
    pricingUnit: 'total',
    currency: '$',
    exchangeFor: null,
    isNegotiable: true,
    condition: 'Like New'
  },
  {
    itemId: 'item-105',
    title: 'Arduino Starter Kit with Sensors & LCD',
    description: 'Complete DIY electronics starter bundle with Arduino Uno, breadboard, servo motors, ultrasonic sensors, and cables.',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-alex-202',
    ownerName: 'Alex Rivera',
    ownerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'Shared',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Innovation Lab (0.5 miles away)',
    listingType: 'Borrow',
    price: null,
    pricingUnit: null,
    currency: '$',
    exchangeFor: null,
    isNegotiable: false,
    condition: 'Good'
  },
  {
    itemId: 'item-106',
    title: 'Heavy Duty 16ft Telescoping Extension Ladder',
    description: 'Aluminum telescoping ladder with safety locking pins. Extends up to 16 feet, rated for 330 lbs. Compact for car transport.',
    category: 'Tools',
    imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-marcus-303',
    ownerName: 'Marcus Chen',
    ownerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    status: 'Available',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'North Hillside (3.0 miles away)',
    listingType: 'Rent',
    price: 15,
    pricingUnit: 'day',
    currency: '$',
    exchangeFor: null,
    isNegotiable: false,
    condition: 'Like New'
  }
];

export const INITIAL_REQUESTS: ItemRequest[] = [
  {
    requestId: 'req-201',
    itemId: 'item-103',
    itemTitle: 'Sony Wireless Noise-Cancelling Headphones',
    itemImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-marcus-303',
    ownerName: 'Marcus Chen',
    requesterId: 'user-sarah-101',
    requesterName: 'Sarah Jenkins',
    requesterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    note: 'Hi Marcus! Would love to borrow this for my final exams next week. Will return in pristine condition!',
  },
  {
    requestId: 'req-202',
    itemId: 'item-105',
    itemTitle: 'Arduino Starter Kit with Sensors & LCD',
    itemImage: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80',
    ownerId: 'user-alex-202',
    ownerName: 'Alex Rivera',
    requesterId: 'user-marcus-303',
    requesterName: 'Marcus Chen',
    requesterAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    status: 'Accepted',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    note: 'Building a smart plant watering prototype for high school science fair!',
  }
];

export const SAMPLE_ITEM_IMAGES = {
  Books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3edd1?w=600&auto=format&fit=crop&q=80'
  ],
  Tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80'
  ],
  Electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=600&auto=format&fit=crop&q=80'
  ],
  Others: [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'
  ]
};
