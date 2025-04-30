// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Import Storage
import { getAnalytics, type Analytics } from "firebase/analytics"; // Keep Analytics as it was in the snippet

// Firebase configuration using Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Add checks for missing env variables during development
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  // In development, throw an error. In production, this might be handled differently.
  if (import.meta.env.DEV) {
      throw new Error("One or more Firebase environment variables are missing. Check your .env file and VITE_ prefixes.");
  } else {
      console.error("Firebase configuration missing. App may not function correctly.");
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize and export Firestore
export const storage = getStorage(app); // Initialize and export Storage

// Initialize Firebase Analytics (optional, but included in user's snippet)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') { // Ensure Analytics only runs in the browser
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Failed to initialize Analytics:", error);
    // Handle potential errors, e.g. if running in an environment without necessary browser APIs
  }
}
export { analytics }; // Export analytics, could be null

export default app; // Export the initialized app itself if needed elsewhere 