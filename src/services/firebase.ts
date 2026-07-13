import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app;
let auth: any = null;
let isFirebaseConfigured = false;

// Check if API key is defined and not placeholder/empty
if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "" && firebaseConfig.apiKey !== '""') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.warn("Firebase failed to initialize:", error);
  }
}

export { auth, isFirebaseConfigured };
