import React from 'react';
import { Home, Package, Plus, Inbox, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsPostModalOpen, requests } = useApp();
  const { currentUser, openAuthModal } = useAuth();

  // Pending incoming requests count for user
  const incomingPendingCount = currentUser 
    ? requests.filter(r => r.ownerId === currentUser.userId && r.status === 'Pending').length 
    : 0;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* My Items */}
        <button
          onClick={() => {
            if (!currentUser) openAuthModal('login');
            else setActiveTab('my-items');
          }}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'my-items' ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Package className={`w-5 h-5 ${activeTab === 'my-items' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">My Items</span>
        </button>

        {/* Center Share Floating Button */}
        <button
          onClick={() => {
            if (!currentUser) openAuthModal('login');
            else setIsPostModalOpen(true);
          }}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Share Item"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Share</span>
        </button>

        {/* Requests */}
        <button
          onClick={() => {
            if (!currentUser) openAuthModal('login');
            else setActiveTab('requests');
          }}
          className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'requests' ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Inbox className={`w-5 h-5 ${activeTab === 'requests' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Requests</span>
          {incomingPendingCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {incomingPendingCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            if (!currentUser) openAuthModal('login');
            else setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>

      </div>
    </div>
  );
};
