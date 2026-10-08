import React from 'react';
import { BookOpen, Wrench, Smartphone, Package, MapPin, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { SharedItem, ItemCategory } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getListingConfig, formatListingPrice } from '../utils/listingConfig';

interface ItemCardProps {
  item: SharedItem;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const { setSelectedItem } = useApp();
  const { currentUser } = useAuth();
  const isOwner = currentUser?.userId === item.ownerId;

  // Category Icon & Color
  const getCategoryMeta = (cat: ItemCategory) => {
    switch (cat) {
      case 'Books':
        return { icon: BookOpen, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'Tools':
        return { icon: Wrench, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Electronics':
        return { icon: Smartphone, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { icon: Package, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status: SharedItem['status']) => {
    switch (status) {
      case 'Available':
        return {
          label: 'Available',
          className: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
        };
      case 'Requested':
        return {
          label: 'Requested',
          className: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
        };
      case 'Shared':
        return {
          label: 'Shared',
          className: 'bg-slate-600 text-white shadow-sm'
        };
    }
  };

  const catMeta = getCategoryMeta(item.category);
  const CategoryIcon = catMeta.icon;
  const statusBadge = getStatusBadge(item.status);
  const listingConfig = getListingConfig(item.listingType);
  const priceDisplay = formatListingPrice(item);

  return (
    <div
      onClick={() => setSelectedItem(item)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Image & Badges Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Top Badges: Listing Type & Category */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {/* Listing Type Badge */}
          <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-full backdrop-blur-md shadow-sm border ${listingConfig.color.bg} ${listingConfig.color.text} ${listingConfig.color.border}`}>
            <span>{listingConfig.emoji}</span>
            <span>{listingConfig.label}</span>
          </span>

          {/* Status Badge if not Available */}
          {item.status !== 'Available' && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 right-3">
          <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md border ${catMeta.bg}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{item.category}</span>
          </span>
        </div>

        {/* Bottom Left Price / Terms Pill & AI Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-900/85 backdrop-blur-md text-white border border-white/20 shadow-md">
            {priceDisplay}
          </span>
          {item.condition && (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/90 text-slate-700 backdrop-blur-md border border-slate-200 shadow-xs">
              {item.condition}
            </span>
          )}
          {item.aiGenerated && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/40 shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>AI</span>
            </span>
          )}
        </div>

        {/* Is Owner Tag */}
        {isOwner && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600/90 backdrop-blur-sm text-white border border-emerald-400/40">
              Your Listing
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {item.title}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Exchange wishlist line if exchange item */}
          {item.listingType === 'Exchange' && item.exchangeFor && (
            <div className="mt-2 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-lg line-clamp-1 border border-purple-100">
              Trade for: <span className="font-bold">{item.exchangeFor}</span>
            </div>
          )}
        </div>

        {/* Footer: Owner & Location */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src={item.ownerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.ownerName}`}
              alt={item.ownerName}
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
            <span className="font-medium text-slate-700 truncate max-w-[110px]">
              {item.ownerName}
            </span>
          </div>

          {item.location && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[90px]">{item.location.split('(')[0].trim()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

