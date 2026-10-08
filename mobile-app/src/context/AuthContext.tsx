import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../services/firebase';
import { UserProfile, UserSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  updateUserProfile: (name: string, avatarUrl?: string) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  uploadAvatarImage: (uri: string) => Promise<string>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: true,
  emailDigest: true,
  publicProfile: true,
  soundEffects: true
};

const STORAGE_SESSION_KEY = 'ecoshare_mobile_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize or ensure Firestore user doc exists for real Firebase users
  const ensureUserDoc = async (fbUser: FirebaseUser) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        console.log('[Firestore] 🆕 Creating new user profile doc for:', fbUser.uid);
        await setDoc(userRef, {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Eco Member',
          email: fbUser.email || '',
          ecoPoints: 50,
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/png?seed=${fbUser.uid}`,
          joinedAt: new Date().toISOString(),
          itemsSharedCount: 0,
          settings: DEFAULT_SETTINGS,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('[Firestore] Note: Could not sync user doc with Firestore rules:', e);
    }
  };

  useEffect(() => {
    let firestoreUnsub: (() => void) | null = null;
    let authUnsub: (() => void) | null = null;

    // 1. Initial Load: Check AsyncStorage first for an existing session (e.g. demo or saved account)
    const loadSavedSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.userId) {
            console.log('[Auth] 💾 Loaded active session from AsyncStorage:', parsed.name, parsed.userId);
            setCurrentUser(parsed);
          }
        }
      } catch (err) {
        console.warn('[Auth] Failed to load AsyncStorage session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedSession();

    // 2. Firebase Auth State Listener
    if (auth) {
      console.log('[Auth] 📡 Subscribing to Firebase onAuthStateChanged...');
      authUnsub = onAuthStateChanged(auth, async (fbUser) => {
        console.log('[Auth] 🔔 Firebase Auth State:', fbUser ? fbUser.email : 'NO USER');
        setFirebaseUser(fbUser);

        if (firestoreUnsub) {
          firestoreUnsub();
          firestoreUnsub = null;
        }

        if (fbUser) {
          const profile: UserProfile = {
            userId: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Eco Member',
            email: fbUser.email || '',
            ecoPoints: 50,
            avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/png?seed=${fbUser.uid}`,
            joinedAt: new Date().toISOString(),
            itemsSharedCount: 0,
            settings: DEFAULT_SETTINGS
          };

          setCurrentUser(profile);
          AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile)).catch(() => {});
          setLoading(false);

          await ensureUserDoc(fbUser);

          if (db) {
            const userRef = doc(db, 'users', fbUser.uid);
            firestoreUnsub = onSnapshot(
              userRef,
              (snap) => {
                if (snap.exists()) {
                  const data = snap.data();
                  const updatedProfile: UserProfile = {
                    userId: fbUser.uid,
                    name: data.name || fbUser.displayName || 'Eco Member',
                    email: data.email || fbUser.email || '',
                    ecoPoints: data.ecoPoints ?? 50,
                    avatarUrl: data.avatarUrl || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/png?seed=${fbUser.uid}`,
                    joinedAt: data.joinedAt || new Date().toISOString(),
                    itemsSharedCount: data.itemsSharedCount ?? 0,
                    settings: data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS
                  };
                  console.log('[Auth] 🔄 Live user update:', updatedProfile.name, `(${updatedProfile.ecoPoints} pts)`);
                  setCurrentUser(updatedProfile);
                  AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedProfile)).catch(() => {});
                }
              },
              (err) => {
                console.warn('[Firestore] User listener notice:', err);
              }
            );
          }
        } else {
          // IMPORTANT: Do NOT wipe currentUser when Firebase returns null (e.g. demo account or offline)
          setLoading(false);
        }
      });
    }

    return () => {
      if (authUnsub) authUnsub();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, []);

  // Strict Firebase Sign In
  const signIn = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    console.log('[Auth] 🔑 Attempting Firebase login:', email);

    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    console.log('[Auth] ✅ Firebase login success:', cred.user.uid);

    const profile: UserProfile = {
      userId: cred.user.uid,
      name: cred.user.displayName || email.split('@')[0],
      email: cred.user.email || email.trim(),
      ecoPoints: 50,
      avatarUrl: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/png?seed=${cred.user.uid}`,
      joinedAt: new Date().toISOString(),
      itemsSharedCount: 0,
      settings: DEFAULT_SETTINGS
    };

    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
    setCurrentUser(profile);
  };

  // Strict Firebase Sign Up
  const signUp = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    console.log('[Auth] 📝 Attempting Firebase registration:', email);

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update displayName:', e);
    }

    console.log('[Auth] ✅ Account created successfully:', cred.user.uid);

    const profile: UserProfile = {
      userId: cred.user.uid,
      name: name.trim(),
      email: cred.user.email || email.trim(),
      ecoPoints: 50,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/png?seed=${cred.user.uid}`,
      joinedAt: new Date().toISOString(),
      itemsSharedCount: 0,
      settings: DEFAULT_SETTINGS
    };

    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
    setCurrentUser(profile);
    await ensureUserDoc(cred.user);
  };

  // Dedicated Demo Account Login (Independent from Firebase backend)
  const demoLogin = async () => {
    console.log('🔥 DEMO FUNCTION CALLED');

    const demoProfile: UserProfile = {
      userId: 'user-demo-101',
      name: 'Alex Rivera',
      email: 'demo.user@ecoshare.org',
      ecoPoints: 450,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedAt: '2024-01-15T08:00:00.000Z',
      itemsSharedCount: 6,
      settings: DEFAULT_SETTINGS
    };

    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(demoProfile));
    setCurrentUser(demoProfile);
    console.log('🔥 USER SET');
    console.log('[Auth] ✅ Demo user set in state & storage:', demoProfile);

    // Register Push Notifications
    notificationService.registerForPushNotificationsAsync(demoProfile.userId);
  };

  const updateUserProfile = async (name: string, avatarUrl?: string) => {
    if (!currentUser) throw new Error('No user logged in');
    console.log('[Auth] ✏️ Updating profile for:', currentUser.userId, { name, avatarUrl });

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      avatarUrl: avatarUrl?.trim() || currentUser.avatarUrl
    };

    setCurrentUser(updated);
    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));

    if (auth?.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
          photoURL: avatarUrl?.trim() || null
        });
      } catch {}
    }

    if (db && !currentUser.userId.startsWith('user-demo')) {
      try {
        const userRef = doc(db, 'users', currentUser.userId);
        await updateDoc(userRef, {
          name: name.trim(),
          avatarUrl: avatarUrl?.trim() || '',
          updatedAt: serverTimestamp()
        });
      } catch {}
    }
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!currentUser) throw new Error('No user logged in');
    const merged = { ...(currentUser.settings || DEFAULT_SETTINGS), ...settings };
    const updated: UserProfile = { ...currentUser, settings: merged };
    setCurrentUser(updated);
    await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));

    if (db && !currentUser.userId.startsWith('user-demo')) {
      try {
        const userRef = doc(db, 'users', currentUser.userId);
        await updateDoc(userRef, {
          settings: merged,
          updatedAt: serverTimestamp()
        });
      } catch {}
    }
  };

  const uploadAvatarImage = async (uri: string): Promise<string> => {
    if (!currentUser) throw new Error('No user logged in');
    if (!storage || currentUser.userId.startsWith('user-demo')) return uri;

    try {
      console.log('[Storage] 📤 Uploading avatar image to Cloud Storage...');
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `avatars/${currentUser.userId}_${Date.now()}.jpg`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch {
      return uri;
    }
  };

  const logout = async () => {
    console.log('[Auth] 🚪 Logging out...');
    try {
      await AsyncStorage.removeItem(STORAGE_SESSION_KEY);
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const refreshProfile = async () => {
    // Live listeners automatically update state
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        signIn,
        signUp,
        updateUserProfile,
        updateUserSettings,
        uploadAvatarImage,
        demoLogin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
