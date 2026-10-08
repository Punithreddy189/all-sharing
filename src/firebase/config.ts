import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Active project config
export const activeFirebaseConfig: FirebaseConfigParams = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCjG8Dli1_gD_0NwUpqlU4slkmk4XeWey8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecoshare-app-353a0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecoshare-app-353a0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecoshare-app-353a0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "850341533966",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:850341533966:web:25ef7ddc0e9ce5fc401f5f",
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
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    console.log('✅ Firebase initialized successfully with project:', activeFirebaseConfig.projectId);
  } catch (error) {
    console.warn('⚠️ Firebase initialization error:', error);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export const updateFirebaseConfig = (newConfig: FirebaseConfigParams) => {
  localStorage.setItem('ecoshare_custom_firebase_config', JSON.stringify(newConfig));
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem('ecoshare_custom_firebase_config');
  window.location.reload();
};
