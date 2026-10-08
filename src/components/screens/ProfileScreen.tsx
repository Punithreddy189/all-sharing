import React, { useState } from 'react';
import { 
  Sparkles, 
  Package, 
  Inbox, 
  Send, 
  LogOut, 
  Check, 
  X, 
  Leaf, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  HeartHandshake, 
  TreePine, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ItemCard } from '../ItemCard';

export const ProfileScreen: React.FC = () => {
  const { currentUser, logout, openAuthModal } = useAuth();
  const { 
    items, 
    requests, 
    acceptAnItemRequest, 
    rejectAnItemRequest, 
    setIsPostModalOpen, 
    setSelectedItem,
    deleteAnItem
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'my-items' | 'incoming' | 'outgoing'>('my-items');

  if (!currentUser) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your EcoShare Profile</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Track your EcoPoints, manage your shared items, and respond to neighbor borrow requests.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  // Filter items owned by current user
  const myItems = items.filter(i => i.ownerId === currentUser.userId);

  // Incoming requests (requests made by others for my items)
  const incomingRequests = requests.filter(r => r.ownerId === currentUser.userId);

  // Outgoing requests (requests made by me for others' items)
  const outgoingRequests = requests.filter(r => r.requesterId === currentUser.userId);

  const ecoPoints = currentUser.ecoPoints || 0;

  // Tier calculation
  const getTierInfo = (points: number) => {
    if (points >= 150) return { title: 'Planet Hero 🌍', nextGoal: 200, progress: 100 };
    if (points >= 80) return { title: 'Eco Guardian 🛡️', nextGoal: 150, progress: Math.round(((points - 80) / 70) * 100) };
    if (points >= 30) return { title: 'Green Pioneer 🌿', nextGoal: 80, progress: Math.round(((points - 30) / 50) * 100) };
    return { title: 'Eco Sprout 🌱', nextGoal: 30, progress: Math.round((points / 30) * 100) };
  };

  const tier = getTierInfo(ecoPoints);

  // Estimated stats
  const itemsSharedCount = myItems.filter(i => i.status === 'Shared').length;
  const co2SavedKg = Math.round((itemsSharedCount + (ecoPoints / 10)) * 4.2);

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-300">
      
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-400/50 shadow-lg bg-emerald-950"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  {tier.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{currentUser.email}</p>
              
              <div className="mt-2.5 flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold shadow-sm">
                  <Sparkles className="w-4 h-4 fill-amber-300" />
                  <span>{ecoPoints} Total EcoPoints</span>
                </div>
              </div>
            </div>
          </div>

          {/* Eco Impact Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-center p-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">Items Listed</p>
              <p className="text-lg font-extrabold text-white">{myItems.length}</p>
            </div>
            <div className="text-center p-2 border-l border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Reuses Made</p>
              <p className="text-lg font-extrabold text-emerald-400">{itemsSharedCount}</p>
            </div>
            <div className="text-center p-2 border-l border-white/10 col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase font-bold text-teal-300">Est. CO2 Saved</p>
              <p className="text-lg font-extrabold text-teal-300">{co2SavedKg} kg</p>
            </div>
          </div>

        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span>Next Level Progress</span>
              <span className="text-emerald-300">{ecoPoints} / {tier.nextGoal} pts ({tier.progress}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(tier.progress, 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="sm:ml-6 mt-2 sm:mt-0 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors self-end"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Profile Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('my-items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'my-items'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Shared Items ({myItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'incoming'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests ({incomingRequests.length})</span>
          {incomingRequests.filter(r => r.status === 'Pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'outgoing'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Borrow Requests ({outgoingRequests.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: My Items */}
      {activeSubTab === 'my-items' && (
        <section>
          {myItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <Package className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <h3 className="text-base font-bold text-slate-800">You haven't listed any items yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Have a drill, textbook, or electronics gathering dust? List it and earn +10 EcoPoints!
              </p>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md"
              >
                + Post Your First Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myItems.map(item => (
                <div key={item.itemId} className="relative group">
                  <ItemCard item={item} />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-[11px] text-slate-500">Status: <strong className="text-slate-800">{item.status}</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove listing "${item.title}"?`)) deleteAnItem(item.itemId);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sub-Tab 2: Incoming Requests (Owner Accept/Reject) */}
      {activeSubTab === 'incoming' && (
        <section className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <Inbox className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <h3 className="text-base font-bold text-slate-800">No incoming borrow requests</h3>
              <p className="text-xs text-slate-500 mt-1">
                When a neighbor requests to borrow one of your listed items, you will see it here to accept or decline.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.requestId}
                className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  req.status === 'Pending' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={req.itemImage || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200'}
                    alt={req.itemTitle}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{req.itemTitle}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      Requested by: <strong className="text-slate-800">{req.requesterName}</strong>
                    </p>

                    {req.note && (
                      <p className="text-xs text-slate-500 mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{req.note}"
                      </p>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions: Accept (+20 pts) / Reject */}
                {req.status === 'Pending' ? (
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => rejectAnItemRequest(req.requestId, req.itemId)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>

                    <button
                      onClick={() => acceptAnItemRequest(req.requestId, req.itemId)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept (+20 pts)</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 self-end md:self-center">
                    {req.status === 'Accepted' && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Request Approved (+20 pts awarded)
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="text-slate-400">Declined</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* Sub-Tab 3: Outgoing Requests */}
      {activeSubTab === 'outgoing' && (
        <section className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <Send className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <h3 className="text-base font-bold text-slate-800">No borrow requests sent</h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse the community catalog on the Home screen to request tools, books, and appliances!
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.requestId}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.itemImage || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200'}
                    alt={req.itemTitle}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{req.itemTitle}</h4>
                    <p className="text-xs text-slate-500">
                      Owner: <strong className="text-slate-700">{req.ownerName || 'Community Member'}</strong>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Sent {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    req.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : req.status === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {req.status === 'Pending' && '⏳ Pending Owner Review'}
                    {req.status === 'Accepted' && '🎉 Approved by Owner!'}
                    {req.status === 'Rejected' && 'Declined'}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      )}

    </div>
  );
};
