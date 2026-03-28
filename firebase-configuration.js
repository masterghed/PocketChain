// ==========================================
// POCKETCHAIN - FIREBASE CONFIGURATION
// Centralized Firebase SDK Initialization
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeE5T0Q0PQkQMouPlvcIsOvI3l9BgkwNA",
  authDomain: "pocketchain-e1f91.firebaseapp.com",
  projectId: "pocketchain-e1f91",
  storageBucket: "pocketchain-e1f91.firebasestorage.app",
  messagingSenderId: "514803824047",
  appId: "1:514803824047:web:51fa9d02ee389f072c6b5a"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export initialized services
export { app, auth, db, storage, onAuthStateChanged };

// Export current user helper
export const getCurrentUser = () => auth.currentUser;

// Export user ID helper
export const getCurrentUserId = () => auth.currentUser?.uid || null;

// Check if user is authenticated
export const isAuthenticated = () => !!auth.currentUser;
