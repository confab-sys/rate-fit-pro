// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZr2iyPMhbLikh4IFavx3f1rwo0slhCsQ",
  authDomain: "rate-fit-pro.firebaseapp.com",
  projectId: "rate-fit-pro",
  storageBucket: "rate-fit-pro.appspot.com",
  messagingSenderId: "1074885052786",
  appId: "1:1074885052786:web:d3acfc68076adad45875eb",
  measurementId: "G-ZHF47LTX6H"
};

// Initialize Firebase
let app;
let db;
let auth;
let storage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Security logging
const logSecurityEvent = (event, details) => {
  console.log(`[Security Event] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Test Firebase connection
const testFirebaseConnection = async () => {
  if (!db) {
    logSecurityEvent('Connection Test Failed', { 
      error: 'Firestore not initialized',
      code: 'INITIALIZATION_ERROR'
    });
    return false;
  }

  try {
    // Test Firestore connection
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { 
      timestamp: new Date().toISOString(),
      testType: 'security_check'
    });
    logSecurityEvent('Firestore Connection Test', { status: 'success' });
    return true;
  } catch (error) {
    logSecurityEvent('Connection Test Failed', { 
      error: error.message,
      code: error.code
    });
    console.error('Firebase connection error:', error);
    return false;
  }
};

// Run connection test
if (db) {
  testFirebaseConnection().then(success => {
    if (success) {
      logSecurityEvent('Firebase Initialization', { status: 'success' });
    } else {
      logSecurityEvent('Firebase Initialization', { status: 'failed' });
    }
  });
}

export { db, auth, storage, analytics, logSecurityEvent }; 