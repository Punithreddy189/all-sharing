import React, { useState } from 'react';
import { 
  Leaf, 
  Bell, 
  Plus, 
  Sparkles, 
  User, 
  LogOut, 
  Layers, 
  Settings, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { isFirebaseConfigured } from '../firebase/config';

export const Navbar: React.FC = () => {
  const { currentUser, openAuthModal, logout, switchUser, demoUsers } = useAuth();
  const { 
    notifications, 
    setIsNotifDrawerOpen, 
    setIsPostModalOpen, 
    setIsConfigModalOpen,
    setActiveTab,
    activeTab
  } = useApp();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isFirebaseLive = isFirebaseConfigured();

  // Calculate Eco Badge
  const getEcoTier = (points: number) => {
    if (points >= 100) return { title: 'Eco Guardian', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (points >= 50) return { title: 'Green Pioneer', color: 'text-teal-700 bg-teal-100 border-teal-300' };
    return { title: 'Eco Sprout', color: 'text-green-700 bg-green-100 border-green-300' };
  };

  const currentTier = getEcoTier(currentUser?.ecoPoints || 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 fill-emerald-100/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  EcoShare
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Community
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Share • Reuse • Save Earth</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Browse Items
            </button>
            <button
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setActiveTab('my-items');
              }}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'my-items'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setActiveTab('requests');
              }}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'requests'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setActiveTab('profile');
              }}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile & Stats
            </button>
          </nav>

          {/* Actions on Right */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Post Item CTA Button */}
            <button
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setIsPostModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share Item</span>
              <span className="bg-emerald-500/40 text-[11px] px-1.5 py-0.2 rounded-md font-bold text-emerald-50 border border-emerald-400/30">
                +10 pts
              </span>
            </button>

            {/* EcoPoints Badge */}
            {currentUser && (
              <div 
                onClick={() => setActiveTab('profile')}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-bold hover:bg-emerald-100/90 transition-colors shadow-sm"
                title={`You have ${currentUser.ecoPoints || 0} EcoPoints! (${currentTier.title})`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse-subtle" />
                <span className="font-extrabold text-emerald-700">{currentUser.ecoPoints || 0}</span>
                <span className="text-[11px] text-emerald-600 hidden xs:inline">pts</span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Firebase Live Status Switcher */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isFirebaseLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={isFirebaseLive ? 'Connected to Firebase Firestore' : 'Running in Instant Local/Demo Sync Mode (Click to configure)'}
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden lg:inline">{isFirebaseLive ? 'Firebase Live' : 'Demo Mode'}</span>
            </button>

            {/* User Account / Avatar */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <img
                    src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-emerald-50"
                  />
                  <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate hidden md:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 text-slate-700">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Tier:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] border ${currentTier.color}`}>
                            {currentTier.title}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setActiveTab('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 text-left"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>My Profile & EcoPoints</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsPostModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 text-left text-emerald-700"
                        >
                          <Plus className="w-4 h-4 text-emerald-600" />
                          <span>Share a New Item (+10 pts)</span>
                        </button>
                      </div>

                      {/* Switch Demo Personas for Easy Testing */}
                      <div className="border-t border-slate-100 pt-2 pb-1">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Switch Demo User (Testing)
                        </p>
                        {demoUsers.map(user => (
                          <button
                            key={user.userId}
                            onClick={() => {
                              switchUser(user.userId);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg hover:bg-slate-50 ${
                              currentUser.userId === user.userId ? 'bg-emerald-50/80 font-bold text-emerald-800' : 'text-slate-600'
                            }`}
                          >
                            <span className="truncate">{user.name}</span>
                            {currentUser.userId === user.userId && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-rose-50 text-rose-600 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
