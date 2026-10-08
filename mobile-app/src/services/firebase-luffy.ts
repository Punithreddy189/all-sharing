import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const activeFirebaseConfig: FirebaseConfigParams = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCjG8Dli1_gD_0NwUpqlU4slkmk4XeWey8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ecoshare-app-353a0.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ecoshare-app-353a0",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ecoshare-app-353a0.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "850341533966",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:850341533966:web:25ef7ddc0e9ce5fc401f5f",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    activeFirebaseConfig.apiKey &&
    activeFirebaseConfig.apiKey.length > 5 &&
    activeFirebaseConfig.projectId &&
    !activeFirebaseConfig.apiKey.includes('YOUR_')
  );
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = !getApps().length ? initializeApp(activeFirebaseConfig) : getApp();
    
    // Use native AsyncStorage persistence for Auth
    try {
      authInstance = initializeAuth(appInstance, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('[Auth] 🔑 Native AsyncStorage persistence initialized');
    } catch {
      authInstance = getAuth(appInstance);
      console.log('[Auth] 🔑 Fallback standard Auth instance initialized');
    }

    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);

    console.log('[Firebase Native] ✅ Firebase initialized successfully for project:', activeFirebaseConfig.projectId);
    console.log('[Firestore] 🗄️ Firestore database connection established');
    console.log('[Auth] 👤 Auth service ready for user operations');
    console.log('[Storage] 📦 Cloud Storage initialized with bucket:', activeFirebaseConfig.storageBucket);
  } catch (error) {
    console.error('[Firebase Native] ❌ Firebase initialization error:', error);
  }
} else {
  console.warn('[Firebase Native] ⚠️ Firebase is not configured. Falling back to local offline mode.');
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
