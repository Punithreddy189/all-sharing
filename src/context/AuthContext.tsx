import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService, dataService } from '../services/dataService';
import { INITIAL_USERS } from '../services/mockStorage';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, avatarUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  demoUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Listen to auth state
    const unsubscribeAuth = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to profile updates (e.g. EcoPoints changes in real-time)
  useEffect(() => {
    if (!currentUser?.userId) return;

    const unsubscribeProfile = dataService.subscribeToUserProfile(currentUser.userId, (updatedProfile) => {
      if (updatedProfile) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
      }
    });

    return () => unsubscribeProfile();
  }, [currentUser?.userId]);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const user = await authService.logIn(email, password);
    setCurrentUser(user);
    closeAuthModal();
  };

  const signup = async (email: string, password: string, name: string, avatarUrl?: string) => {
    const user = await authService.signUp(email, password, name, avatarUrl);
    setCurrentUser(user);
    closeAuthModal();
  };

  const logout = async () => {
    await authService.logOut();
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const user = authService.switchDemoUser(userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        logout,
        switchUser,
        demoUsers: INITIAL_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
