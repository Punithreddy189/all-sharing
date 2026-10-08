import React, { useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Wrench, 
  Smartphone, 
  Package, 
  Filter, 
  Layers, 
  X, 
  Leaf, 
  ArrowRight,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ItemCard } from '../ItemCard';
import { ItemCategory } from '../../types';

export const HomeScreen: React.FC = () => {
  const { 
    items, 
    filters, 
    setSearchQuery, 
    setSelectedCategory, 
    setSelectedListingType,
    setSelectedStatus,
    setIsPostModalOpen,
    userCategoriesHistory
  } = useApp();
  const { currentUser, openAuthModal } = useAuth();

  const categories: { label: string; value: string; icon: any }[] = [
    { label: 'All Categories', value: 'All', icon: Layers },
    { label: 'Books', value: 'Books', icon: BookOpen },
    { label: 'Tools', value: 'Tools', icon: Wrench },
    { label: 'Electronics', value: 'Electronics', icon: Smartphone },
    { label: 'Others', value: 'Others', icon: Package },
  ];

  const listingTypes = [
    { label: 'All Types', value: 'All', emoji: '✨' },
    { label: 'Borrow', value: 'Borrow', emoji: '🤝' },
    { label: 'Sell', value: 'Sell', emoji: '💰' },
    { label: 'Rent', value: 'Rent', emoji: '⏳' },
    { label: 'Exchange', value: 'Exchange', emoji: '🔄' },
  ];

  const statuses = ['All', 'Available', 'Requested', 'Shared'];

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesListing = (item.listingType || 'Borrow').toLowerCase().includes(q);
        const matchesLocation = item.location?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesListing && !matchesLocation) return false;
      }

      // Category
      if (filters.selectedCategory !== 'All' && item.category !== filters.selectedCategory) {
        return false;
      }

      // Listing Type
      const itemListingType = item.listingType || 'Borrow';
      if (filters.selectedListingType !== 'All' && itemListingType !== filters.selectedListingType) {
        return false;
      }

      // Status
      if (filters.selectedStatus !== 'All' && item.status !== filters.selectedStatus) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  // Basic Recommendation: items from same category as user activity
  const recommendedItems = useMemo(() => {
    if (items.length <= 2) return [];
    return items
      .filter(i => i.status === 'Available' && userCategoriesHistory.includes(i.category))
      .slice(0, 3);
  }, [items, userCategoriesHistory]);

  const totalSharedCount = items.filter(i => i.status === 'Shared').length;

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-soft-lg">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold mb-3 backdrop-blur-sm">
            <Leaf className="w-3.5 h-3.5" />
            <span>Community Circular Economy</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Borrow, Sell, Rent & Swap. <br className="hidden sm:inline" />
            Share what you don't use.
          </h1>

          <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
            Join neighbors in sharing household tools, books, and electronics. 
            Earn <strong className="text-amber-300 font-bold">EcoPoints</strong> with every share!
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setIsPostModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs sm:text-sm font-bold shadow-lg hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>List an Item (+10 pts)</span>
            </button>

            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-200 pl-2">
              <div>
                <span className="text-white font-extrabold text-sm">{items.length}</span> Items Listed
              </div>
              <div>
                <span className="text-amber-300 font-extrabold text-sm">{totalSharedCount + 12}</span> Reuses Completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters Controls */}
      <div className="space-y-3">
        
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by title, category, intent (Sell, Rent, Swap, Borrow)..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-slate-200/90 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Listing Type Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Intent:
          </span>
          {listingTypes.map((lt) => {
            const isSelected = filters.selectedListingType === lt.value;
            const count = lt.value === 'All'
              ? items.length
              : items.filter(i => (i.listingType || 'Borrow') === lt.value).length;

            return (
              <button
                key={lt.value}
                onClick={() => setSelectedListingType(lt.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{lt.emoji}</span>
                <span>{lt.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = filters.selectedCategory === cat.value;
            const count = cat.value === 'All' 
              ? items.length 
              : items.filter(i => i.category === cat.value).length;

            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 font-semibold text-[11px] uppercase mr-1">Status:</span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filters.selectedStatus === st
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium shrink-0">
            Showing <strong className="text-slate-700">{filteredItems.length}</strong> items
          </div>
        </div>

      </div>

      {/* Recommended for You (Category Activity Based) */}
      {recommendedItems.length > 0 && filters.selectedCategory === 'All' && !filters.searchQuery && (
        <section className="bg-emerald-50/70 border border-emerald-200/60 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 fill-emerald-500" />
              <h2 className="text-sm font-bold text-emerald-950">Recommended in Your Favorite Categories</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {userCategoriesHistory.join(', ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedItems.map(item => (
              <ItemCard key={`rec-${item.itemId}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Main Items Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            {filters.selectedCategory === 'All' ? 'All Community Items' : `${filters.selectedCategory} Listings`}
          </h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Package className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No items found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {filters.searchQuery || filters.selectedCategory !== 'All'
                ? "Try adjusting your search filters or browse other categories."
                : "Be the first to list an item in this category and earn +10 EcoPoints!"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {(filters.searchQuery || filters.selectedCategory !== 'All' || filters.selectedStatus !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedStatus('All');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  if (!currentUser) openAuthModal('login');
                  else setIsPostModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                + Post New Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <ItemCard key={item.itemId} item={item} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
