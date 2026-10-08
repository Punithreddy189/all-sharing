import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Share2,
  DollarSign,
  RefreshCw,
  Handshake,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getListingConfig, formatListingPrice } from '../../utils/listingConfig';

export const ItemDetailsModal: React.FC = () => {
  const { selectedItem, setSelectedItem, requestAnItem, deleteAnItem, showToast } = useApp();
  const { currentUser, openAuthModal } = useAuth();

  const [note, setNote] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!selectedItem) return null;

  const isOwner = currentUser?.userId === selectedItem.ownerId;
  const isAvailable = selectedItem.status === 'Available';
  const listingConfig = getListingConfig(selectedItem.listingType);
  const priceDisplay = formatListingPrice(selectedItem);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    try {
      setIsRequesting(true);
      await requestAnItem(selectedItem.itemId, note);
      setShowNoteInput(false);
      setNote('');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Request Error',
        message: err.message || 'Failed to submit request.',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this listing?')) {
      await deleteAnItem(selectedItem.itemId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Image Header with Close */}
        <div className="relative aspect-[16/9] sm:aspect-[2/1] w-full bg-slate-100 shrink-0">
          <img
            src={selectedItem.imageUrl}
            alt={selectedItem.title}
            className="w-full h-full object-cover"
          />

          {/* Close button */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 flex-wrap">
            {/* Listing Type Badge */}
            <span className={`px-3 py-1 text-xs font-extrabold rounded-full backdrop-blur-md shadow-md border ${listingConfig.color.bg} ${listingConfig.color.text} ${listingConfig.color.border}`}>
              {listingConfig.emoji} For {listingConfig.label}
            </span>

            {/* Status */}
            <span className={`px-3 py-1 text-xs font-extrabold rounded-full uppercase tracking-wider ${
              selectedItem.status === 'Available'
                ? 'bg-emerald-500 text-white shadow-md'
                : selectedItem.status === 'Requested'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-700 text-white shadow-md'
            }`}>
              {selectedItem.status}
            </span>

            {/* Category */}
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/90 text-slate-800 backdrop-blur-md shadow-sm border border-slate-200">
              {selectedItem.category}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Title & Price Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {selectedItem.title}
              </h2>
              
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {selectedItem.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{selectedItem.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Listed {new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-100 shrink-0">
              <div className="text-lg sm:text-2xl font-black text-slate-900">
                {priceDisplay}
              </div>
              {selectedItem.isNegotiable && (
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                  Negotiable (OBO)
                </span>
              )}
            </div>
          </div>

          {/* Listing Details Card (Condition, Wishlist, Terms) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Intent</p>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <span>{listingConfig.emoji}</span>
                <span>{listingConfig.label}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Condition</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {selectedItem.condition || 'Good Condition'}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Reward</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-emerald-500" />
                <span>+10 EcoPoints</span>
              </p>
            </div>
          </div>

          {/* Exchange Wishlist Callout if Exchange */}
          {selectedItem.listingType === 'Exchange' && selectedItem.exchangeFor && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <span>Uploader's Trade Wishlist</span>
              </div>
              <p className="text-xs text-purple-800 font-medium leading-relaxed">
                {selectedItem.exchangeFor}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Item Details & Notes
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {selectedItem.description}
            </p>
          </div>

          {/* Owner Profile Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedItem.ownerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedItem.ownerName}`}
                alt={selectedItem.ownerName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900">{selectedItem.ownerName}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-emerald-800 font-medium">Verified Community Sharer</p>
              </div>
            </div>

            {isOwner && (
              <span className="text-xs font-bold text-slate-600 px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                You Own This
              </span>
            )}
          </div>

          {/* Request Action Area */}
          {!isOwner && (
            <div className="pt-2">
              {isAvailable ? (
                showNoteInput ? (
                  <form onSubmit={handleRequest} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700">
                      Message for {selectedItem.ownerName}:
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={listingConfig.requestPlaceholder}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNoteInput(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isRequesting}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isRequesting ? 'Sending...' : 'Confirm Request'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      if (!currentUser) openAuthModal('login');
                      else setShowNoteInput(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{listingConfig.ctaLabel}</span>
                  </button>
                )
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>
                    {selectedItem.status === 'Requested'
                      ? 'This item currently has a pending request from another member.'
                      : 'This item has already been shared or completed.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">Manage your listing</span>
              <button
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Listing</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

