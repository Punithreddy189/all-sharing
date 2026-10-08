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
import { auth, db, storage } from '../services/firebase';
import { UserProfile, UserSettings } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  updateUserProfile: (name: string, avatarUrl?: string) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  uploadAvatarImage: (uri: string) => Promise<string>;
  loginDemo: (demoEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: true,
  emailDigest: true,
  publicProfile: true,
  soundEffects: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize or ensure Firestore user doc exists
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
      console.warn('[Firestore] Error ensuring user doc:', e);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    console.log('[Auth] 📡 Subscribing to onAuthStateChanged...');
    let firestoreUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
      console.log('[Auth] 🔔 Auth state changed:', fbUser ? fbUser.email : 'No user');
      setFirebaseUser(fbUser);

      if (firestoreUnsub) {
        firestoreUnsub();
        firestoreUnsub = null;
      }

      if (fbUser) {
        await ensureUserDoc(fbUser);

        if (db) {
          console.log('[Firestore] 📡 Subscribing to live user doc for:', fbUser.uid);
          const userRef = doc(db, 'users', fbUser.uid);
          firestoreUnsub = onSnapshot(
            userRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const profile: UserProfile = {
                  userId: fbUser.uid,
                  name: data.name || fbUser.displayName || 'Eco Member',
                  email: data.email || fbUser.email || '',
                  ecoPoints: data.ecoPoints ?? 50,
                  avatarUrl: data.avatarUrl || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/png?seed=${fbUser.uid}`,
                  joinedAt: data.joinedAt || new Date().toISOString(),
                  itemsSharedCount: data.itemsSharedCount ?? 0,
                  settings: data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS
                };
                console.log('[Auth] 🔄 Live user update:', profile.name, `(${profile.ecoPoints} pts)`);
                setCurrentUser(profile);
              }
              setLoading(false);
            },
            (err) => {
              console.error('[Firestore] User listener error:', err);
              setLoading(false);
            }
          );
        } else {
          setCurrentUser({
            userId: fbUser.uid,
            name: fbUser.displayName || 'Eco Member',
            email: fbUser.email || '',
            ecoPoints: 50,
            avatarUrl: fbUser.photoURL || undefined,
            joinedAt: new Date().toISOString(),
            itemsSharedCount: 0,
            settings: DEFAULT_SETTINGS
          });
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    console.log('[Auth] 🔑 Signing in:', email);
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    console.log('[Auth] 📝 Registering new user:', email);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not set displayName on Firebase user:', e);
    }
  };

  const updateUserProfile = async (name: string, avatarUrl?: string) => {
    if (!auth?.currentUser) throw new Error('No user logged in');
    console.log('[Auth] ✏️ Updating profile for:', auth.currentUser.uid, { name, avatarUrl });

    // 1. Update Firebase Auth
    await updateProfile(auth.currentUser, {
      displayName: name.trim(),
      photoURL: avatarUrl?.trim() || null
    });

    // 2. Update Firestore document
    if (db) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        avatarUrl: avatarUrl?.trim() || '',
        updatedAt: serverTimestamp()
      });
    }

    console.log('[Auth] ✅ User profile updated in Auth and Firestore');
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!auth?.currentUser) throw new Error('No user logged in');
    console.log('[Auth] ⚙️ Persisting updated settings to Firestore:', settings);

    if (db) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const current = currentUser?.settings || DEFAULT_SETTINGS;
      const merged = { ...current, ...settings };
      await updateDoc(userRef, {
        settings: merged,
        updatedAt: serverTimestamp()
      });
      console.log('[Auth] ✅ Settings persisted to Firestore successfully');
    }
  };

  const uploadAvatarImage = async (uri: string): Promise<string> => {
    if (!auth?.currentUser) throw new Error('No user logged in');
    if (!storage) {
      console.warn('[Storage] Storage not available, using URI');
      return uri;
    }

    console.log('[Storage] 📤 Uploading avatar image to Cloud Storage...');
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, `avatars/${auth.currentUser.uid}_${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);
    console.log('[Storage] ✅ Image uploaded successfully, URL:', downloadURL);
    return downloadURL;
  };

  const loginDemo = async (demoEmail: string = 'demo@ecoshare.org') => {
    try {
      await signIn(demoEmail, 'EcoShare123!');
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        await signUp(demoEmail, 'EcoShare123!', 'Alex Rivera');
      } else {
        throw err;
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    console.log('[Auth] 🚪 Logging out...');
    await signOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const refreshProfile = async () => {
    // onSnapshot automatically keeps it up to date!
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
        loginDemo,
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
