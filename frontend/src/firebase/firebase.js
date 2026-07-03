// Mock Firebase configuration - easily replaceable with real Firebase Config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-health-sync.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-health-sync",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-health-sync.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

export const IS_MOCKED = true; // Set to false to enable real Firebase connection

export default firebaseConfig;
