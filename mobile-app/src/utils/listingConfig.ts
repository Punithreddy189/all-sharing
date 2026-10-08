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
    text: string;
    border: string;
    chipBg: string;
    chipText: string;
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
    tagline: 'Lend out for free & earn EcoPoints',
    color: {
      primary: '#0d9488',
      bg: '#f0fdfa',
      text: '#0f766e',
      border: '#99f6e4',
      chipBg: '#ccfbf1',
      chipText: '#115e59'
    },
    ctaLabel: 'Request Item',
    requestPlaceholder: 'Hi! I would love to borrow this item for a project...',
    requiresPrice: false,
    requiresUnit: false,
    requiresExchange: false
  },
  Sell: {
    type: 'Sell',
    label: 'Sell',
    emoji: '💰',
    shortDesc: 'Give it a new permanent home',
    tagline: 'Sell to someone in your local community',
    color: {
      primary: '#16a34a',
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
      chipBg: '#dcfce7',
      chipText: '#166534'
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
    tagline: 'Rent it out by the day or week',
    color: {
      primary: '#2563eb',
      bg: '#eff6ff',
      text: '#1d4ed8',
      border: '#bfdbfe',
      chipBg: '#dbeafe',
      chipText: '#1e40af'
    },
    ctaLabel: 'Request Rental',
    requestPlaceholder: 'Hi! I would like to rent this item. Can we coordinate dates?',
    requiresPrice: true,
    requiresUnit: true,
    requiresExchange: false
  },
  Exchange: {
    type: 'Exchange',
    label: 'Exchange',
    emoji: '🔄',
    shortDesc: 'Swap with another item',
    tagline: 'Trade for tools, books, or gear you need',
    color: {
      primary: '#9333ea',
      bg: '#faf5ff',
      text: '#7e22ce',
      border: '#e9d5ff',
      chipBg: '#f3e8ff',
      chipText: '#6b21a8'
    },
    ctaLabel: 'Propose Swap',
    requestPlaceholder: 'Hi! I have an item to trade. Here is what I can offer in exchange...',
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
    const unit = item.pricingUnit === 'week' ? '/wk' : '/day';
    return `${symbol}${item.price}${unit}`;
  }

  if (type === 'Exchange') {
    if (item.exchangeFor?.trim()) {
      return `Swap: ${item.exchangeFor.trim()}`;
    }
    return 'Item Swap';
  }

  return 'Available';
};

export const validateListing = (data: {
  title: string;
  description: string;
  listingType: ListingType;
  price?: number | null;
  pricingUnit?: PricingUnit | null;
  exchangeFor?: string | null;
}): { valid: boolean; error?: string } => {
  if (!data.title || !data.title.trim()) {
    return { valid: false, error: 'Please enter an item title.' };
  }
  if (!data.description || !data.description.trim()) {
    return { valid: false, error: 'Please enter a description.' };
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
      return { valid: false, error: 'Please specify the items you want to exchange for.' };
    }
  }

  return { valid: true };
};

