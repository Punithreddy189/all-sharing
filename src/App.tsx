import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { PostItemModal } from './components/screens/PostItemModal';
import { ItemDetailsModal } from './components/screens/ItemDetailsModal';
import { AuthModal } from './components/screens/AuthModal';
import { FirebaseModal } from './components/FirebaseModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ToastContainer } from './components/ToastContainer';
import { Leaf, Heart, ShieldCheck, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'my-items' && <ProfileScreen />}
        {activeTab === 'requests' && <ProfileScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Modals & Drawers */}
      <PostItemModal />
      <ItemDetailsModal />
      <AuthModal />
      <FirebaseModal />
      <NotificationDrawer />
      <ToastContainer />

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200/80 py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 text-sm">EcoShare Community</span>
            <span className="text-slate-400">| Promoting reuse, reducing landfill waste.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Sync</span>
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>EcoPoints Rewards System</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
