import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  BookOpen, 
  Wrench, 
  Smartphone, 
  Package, 
  Check, 
  MapPin, 
  DollarSign,
  Clock,
  RefreshCw,
  Handshake,
  AlertCircle,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ItemCategory, ListingType, PricingUnit, ItemCondition } from '../../types';
import { SAMPLE_ITEM_IMAGES } from '../../services/mockStorage';
import { LISTING_TYPE_CONFIGS, LISTING_TYPES, getListingConfig, validateListing } from '../../utils/listingConfig';

/** Compresses uploaded image to under 50KB to fit Firestore document limits */
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const PostItemModal: React.FC = () => {
  const { isPostModalOpen, setIsPostModalOpen, postNewItem, showToast } = useApp();
  const { currentUser, openAuthModal } = useAuth();

  const [listingType, setListingType] = useState<ListingType>('Borrow');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Tools');
  const [imageUrl, setImageUrl] = useState(SAMPLE_ITEM_IMAGES.Tools[0]);
  const [location, setLocation] = useState('Central Community Library Drop-off');
  
  // Listing specific fields
  const [priceInput, setPriceInput] = useState<string>('');
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>('day');
  const [currency, setCurrency] = useState('$');
  const [exchangeFor, setExchangeFor] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [condition, setCondition] = useState<ItemCondition>('Like New');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customImageError, setCustomImageError] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const exchangeInputRef = useRef<HTMLInputElement | null>(null);

  if (!isPostModalOpen) return null;

  const currentConfig = getListingConfig(listingType);

  const handleListingTypeChange = (newType: ListingType) => {
    setListingType(newType);
    setFormError(null);
    if (newType === 'Sell' || newType === 'Rent') {
      setTimeout(() => priceInputRef.current?.focus(), 100);
    } else if (newType === 'Exchange') {
      setTimeout(() => exchangeInputRef.current?.focus(), 100);
    }
  };

  const handleCategoryChange = (newCat: ItemCategory) => {
    setCategory(newCat);
    setImageUrl(SAMPLE_ITEM_IMAGES[newCat][0]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCustomImageError('');
      const compressed = await compressImage(file, 800, 800, 0.75);
      setImageUrl(compressed);
    } catch {
      setCustomImageError('Failed to process image. Please choose another.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    const parsedPrice = priceInput.trim() ? parseFloat(priceInput.trim()) : null;

    // Validate using centralized rules
    const validation = validateListing({
      title,
      description,
      listingType,
      price: parsedPrice,
      pricingUnit: listingType === 'Rent' ? pricingUnit : null,
      exchangeFor: listingType === 'Exchange' ? exchangeFor : null,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Please fill in all required fields.');
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: validation.error || 'Please check your inputs.',
      });
      return;
    }

    setFormError(null);

    try {
      setIsSubmitting(true);
      await postNewItem({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl: imageUrl || SAMPLE_ITEM_IMAGES[category][0],
        location: location.trim(),
        listingType,
        price: parsedPrice,
        pricingUnit: listingType === 'Rent' ? pricingUnit : null,
        currency,
        exchangeFor: listingType === 'Exchange' ? exchangeFor.trim() : null,
        isNegotiable,
        condition,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriceInput('');
      setExchangeFor('');
      setIsNegotiable(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not post item. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={() => setIsPostModalOpen(false)}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 fill-amber-300" />
            <span>Earn +10 EcoPoints Reward</span>
          </div>

          <h2 className="text-xl font-extrabold text-white">List an Item on EcoShare</h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            Specify whether your item is for <strong>Borrow</strong>, <strong>Sell</strong>, <strong>Rent</strong>, or <strong>Exchange</strong>.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: Listing Intent / Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                1. What is this listing for? *
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Selected: {currentConfig.label} {currentConfig.emoji}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LISTING_TYPES.map((type) => {
                const config = LISTING_TYPE_CONFIGS[type];
                const isSelected = listingType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleListingTypeChange(type)}
                    className={`relative p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? `${config.color.bg} ${config.color.border} ring-2 ring-offset-1 ring-emerald-600/40 shadow-sm`
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{config.emoji}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{config.label}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{config.shortDesc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 italic pl-0.5">{currentConfig.tagline}</p>
          </div>

          {/* Contextual Fields for Listing Type */}
          {/* 1. SELL Context */}
          {listingType === 'Sell' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Selling Price & Options</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                    <input
                      ref={priceInputRef}
                      type="number"
                      min="0.5"
                      step="0.01"
                      required
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 py-2 px-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Price is Negotiable (OBO)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. RENT Context */}
          {listingType === 'Rent' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Rental Rate & Frequency</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rental Rate ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                    <input
                      ref={priceInputRef}
                      type="number"
                      min="0.5"
                      step="0.01"
                      required
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="e.g. 5.00"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Per Duration *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPricingUnit('day')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        pricingUnit === 'day'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      / Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingUnit('week')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        pricingUnit === 'week'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      / Week
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. EXCHANGE Context */}
          {listingType === 'Exchange' && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <span>Trade Wishlist / Exchange Preference *</span>
              </div>
              <input
                ref={exchangeInputRef}
                type="text"
                required
                value={exchangeFor}
                onChange={(e) => setExchangeFor(e.target.value)}
                placeholder="e.g. Looking for hand sander, fantasy novels, or Arduino kit..."
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
              />
              <p className="text-[10px] text-purple-700">
                Describe items or categories you are open to swapping for.
              </p>
            </div>
          )}

          {/* 4. BORROW Context */}
          {listingType === 'Borrow' && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-teal-800 text-xs font-medium">
              <Handshake className="w-5 h-5 text-teal-600 shrink-0" />
              <span>
                Free community sharing helps neighbors save money and cuts environmental waste. You will earn <strong>+10 EcoPoints</strong> immediately upon listing!
              </span>
            </div>
          )}

          {/* STEP 2: Item Details */}
          <div className="space-y-3 pt-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DeWalt 20V Cordless Drill with Battery"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Category & Condition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Books', icon: BookOpen },
                    { label: 'Tools', icon: Wrench },
                    { label: 'Electronics', icon: Smartphone },
                    { label: 'Others', icon: Package },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleCategoryChange(label as ItemCategory)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                        category === label
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Item Condition *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['New', 'Like New', 'Good', 'Fair'] as ItemCondition[]).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                        condition === cond
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description & Notes *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention working condition, accessories included, or specific guidelines..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Photo Selection / Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Photo *
            </label>
            
            {/* Custom Upload Box */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-3">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700">Choose photo or upload custom</p>
                <div className="mt-1 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {customImageError && (
                    <span className="text-[11px] text-rose-500 font-semibold">{customImageError}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Or pick from {category} photo presets:</p>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_ITEM_IMAGES[category].map((presetUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(presetUrl)}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                    imageUrl === presetUrl
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:opacity-80'
                  }`}
                >
                  <img
                    src={presetUrl}
                    alt={`${category} preset ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {imageUrl === presetUrl && (
                    <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pickup Location / Community Hub
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library, Green Park, Downtown Hub..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Error display */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Posting for:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${currentConfig.color.pillBg} ${currentConfig.color.pillText}`}>
                {currentConfig.emoji} {currentConfig.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>{isSubmitting ? 'Publishing...' : `List for ${currentConfig.label}`}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
