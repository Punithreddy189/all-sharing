import { ListingType, SharedItem, PricingUnit, ItemCondition, Currency } from '../types';

export interface ListingTypeConfig {
  type: ListingType;
  label: string;
  emoji: string;
  shortDesc: string;
  tagline: string;
  color: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    pillBg: string;
    pillText: string;
  };
  ctaLabel: string;
  requestPlaceholder: string;
  requiresPrice: boolean;
  requiresUnit: boolean;
  requiresExchange: boolean;
}

export const LISTING_TYPES: ListingType[] = ['Borrow', 'Sell', 'Rent', 'Exchange'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
};

export const getCurrencySymbol = (currency?: Currency | string): string => {
  if (!currency) return '$';
  if (currency === 'INR' || currency === '₹') return '₹';
  if (currency === 'EUR' || currency === '€') return '€';
  return '$';
};

export const LISTING_TYPE_CONFIGS: Record<ListingType, ListingTypeConfig> = {
  Borrow: {
    type: 'Borrow',
    label: 'Borrow',
    emoji: '🤝',
    shortDesc: 'Free community sharing',
    tagline: 'Lend out to neighbors for free & earn EcoPoints',
    color: {
      primary: '#0d9488', // Teal-600
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      badgeBg: 'bg-teal-600',
      badgeText: 'text-white',
      pillBg: 'bg-teal-100/80',
      pillText: 'text-teal-800'
    },
    ctaLabel: 'Request to Borrow',
    requestPlaceholder: 'Hi! I would love to borrow this for a quick project this weekend...',
    requiresPrice: false,
    requiresUnit: false,
    requiresExchange: false
  },
  Sell: {
    type: 'Sell',
    label: 'Sell',
    emoji: '💰',
    shortDesc: 'Give it a new permanent home',
    tagline: 'Sell directly to someone in your local community',
    color: {
      primary: '#16a34a', // Green-600
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      pillBg: 'bg-emerald-100/80',
      pillText: 'text-emerald-800'
    },
    ctaLabel: 'Buy Now / Make Offer',
    requestPlaceholder: 'Hi! I am interested in purchasing this item. Is it still available?',
    requiresPrice: true,
    requiresUnit: false,
    requiresExchange: false
  },
  Rent: {
    type: 'Rent',
    label: 'Rent',
    emoji: '⏳',
    shortDesc: 'Affordable temporary rental',
    tagline: 'Rent it out by the day or week at a fair rate',
    color: {
      primary: '#2563eb', // Blue-600
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      pillBg: 'bg-blue-100/80',
      pillText: 'text-blue-800'
    },
    ctaLabel: 'Request Rental',
    requestPlaceholder: 'Hi! I would like to rent this item for a few days. Can we coordinate dates?',
    requiresPrice: true,
    requiresUnit: true,
    requiresExchange: false
  },
  Exchange: {
    type: 'Exchange',
    label: 'Exchange',
    emoji: '🔄',
    shortDesc: 'Swap with another item',
    tagline: 'Trade for tools, books, or electronics you need',
    color: {
      primary: '#9333ea', // Purple-600
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badgeBg: 'bg-purple-600',
      badgeText: 'text-white',
      pillBg: 'bg-purple-100/80',
      pillText: 'text-purple-800'
    },
    ctaLabel: 'Propose Swap',
    requestPlaceholder: 'Hi! I have an item to trade with you. Here is what I can offer in exchange...',
    requiresPrice: false,
    requiresUnit: false,
    requiresExchange: true
  }
};

export const getListingConfig = (type?: ListingType): ListingTypeConfig => {
  if (!type || !LISTING_TYPE_CONFIGS[type]) {
    return LISTING_TYPE_CONFIGS.Borrow;
  }
  return LISTING_TYPE_CONFIGS[type];
};

/** Smart short badge display: e.g. "💰 $450", "⏳ $5/day", "🔄 Swap", "🤝 Free Borrow" */
export const getListingBadgeLabel = (item: Partial<SharedItem>): { emoji: string; label: string } => {
  const type = item.listingType || 'Borrow';
  const symbol = getCurrencySymbol(item.currency);

  if (type === 'Borrow') {
    return { emoji: '🤝', label: 'Free Borrow' };
  }
  if (type === 'Sell') {
    if (item.price && item.price > 0) {
      return { emoji: '💰', label: `${symbol}${item.price}` };
    }
    return { emoji: '💰', label: 'For Sale' };
  }
  if (type === 'Rent') {
    if (item.price && item.price > 0) {
      const unit = item.pricingUnit === 'week' ? '/wk' : '/day';
      return { emoji: '⏳', label: `${symbol}${item.price}${unit}` };
    }
    return { emoji: '⏳', label: 'For Rent' };
  }
  if (type === 'Exchange') {
    return { emoji: '🔄', label: 'Swap' };
  }

  return { emoji: '🤝', label: 'Borrow' };
};

/** Formats price display string for cards, modals and lists */
export const formatListingPrice = (item: Partial<SharedItem>): string => {
  const type = item.listingType || 'Borrow';
  const symbol = getCurrencySymbol(item.currency);

  if (type === 'Borrow') {
    return 'Free Community Borrow';
  }

  if (type === 'Sell') {
    if (item.price === undefined || item.price === null || item.price <= 0) {
      return 'For Sale';
    }
    return `${symbol}${item.price}${item.isNegotiable ? ' (Negotiable)' : ''}`;
  }

  if (type === 'Rent') {
    if (item.price === undefined || item.price === null || item.price <= 0) {
      return 'For Rent';
    }
    const unit = item.pricingUnit === 'week' ? '/week' : '/day';
    return `${symbol}${item.price} ${unit}`;
  }

  if (type === 'Exchange') {
    if (item.exchangeFor?.trim()) {
      return `Trade Wishlist: ${item.exchangeFor.trim()}`;
    }
    return 'Item Swap';
  }

  return 'Available';
};

/** Validates listing before creation */
export const validateListing = (data: {
  title: string;
  description: string;
  listingType: ListingType;
  price?: number | null;
  pricingUnit?: PricingUnit | null;
  exchangeFor?: string | null;
}): { valid: boolean; error?: string } => {
  if (!data.title || !data.title.trim()) {
    return { valid: false, error: 'Please provide an item title.' };
  }
  if (!data.description || !data.description.trim()) {
    return { valid: false, error: 'Please provide a short description.' };
  }

  if (data.listingType === 'Sell') {
    if (data.price === undefined || data.price === null || isNaN(data.price) || data.price <= 0) {
      return { valid: false, error: 'Please enter a valid selling price greater than 0.' };
    }
  }

  if (data.listingType === 'Rent') {
    if (data.price === undefined || data.price === null || isNaN(data.price) || data.price <= 0) {
      return { valid: false, error: 'Please enter a valid rental price greater than 0.' };
    }
  }

  if (data.listingType === 'Exchange') {
    if (!data.exchangeFor || !data.exchangeFor.trim()) {
      return { valid: false, error: 'Please describe the items or trade you are looking to exchange for.' };
    }
  }

  return { valid: true };
};

