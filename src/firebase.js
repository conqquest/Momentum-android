import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to check if custom config exists in localStorage
export const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('firebase_config');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isRealFirebase = false;

const config = getSavedFirebaseConfig();

if (config && config.apiKey && config.authDomain && config.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isRealFirebase = true;
    console.log('Firebase initialized successfully with custom config.');
  } catch (err) {
    console.error('Failed to initialize Firebase with custom config:', err);
  }
}

// Mock auth interface for offline/no-config demo mode
const mockUser = {
  uid: 'demo_user_123',
  displayName: 'Demo Adventurer',
  email: 'demo@antigravity.io',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=demo',
};

export { isRealFirebase, db };

export const loginWithGoogle = async () => {
  if (isRealFirebase && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  } else {
    // Simulate API delay
    await new Promise((res) => setTimeout(res, 800));
    localStorage.setItem('demo_logged_in', 'true');
    return mockUser;
  }
};

export const logout = async () => {
  if (isRealFirebase && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem('demo_logged_in');
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (isRealFirebase && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Mock subscription
    const checkDemoAuth = () => {
      const isLoggedIn = localStorage.getItem('demo_logged_in') === 'true';
      callback(isLoggedIn ? mockUser : null);
    };
    
    // Check initially
    setTimeout(checkDemoAuth, 100);
    
    // Return a dummy unsubscribe function
    return () => {};
  }
};
