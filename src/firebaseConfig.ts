// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAnalytics, type Analytics } from "firebase/analytics"; // Keep Analytics as it was in the snippet

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuBsqnmVcE99kwQ3_ziy12FqoZL6ZRjkk",
  authDomain: "windfleet-e4690.firebaseapp.com",
  projectId: "windfleet-e4690",
  storageBucket: "windfleet-e4690.appspot.com", // Corrected domain
  messagingSenderId: "134398124258",
  appId: "1:134398124258:web:9b1c619acfd91be19fbebb",
  measurementId: "G-B9L03N6R6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize and export Firestore

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