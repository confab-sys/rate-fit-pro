// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZr2iyPMhbLikh4IFavx3f1rwo0slhCsQ",
  authDomain: "rate-fit-pro.firebaseapp.com",
  projectId: "rate-fit-pro",
  storageBucket: "rate-fit-pro.firebasestorage.app",
  messagingSenderId: "1074885052786",
  appId: "1:1074885052786:web:d3acfc68076adad45875eb",
  measurementId: "G-ZHF47LTX6H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Log initialization status
console.log('Firebase services initialized:', {
  auth: !!auth,
  db: !!db,
  analytics: !!analytics
});

// Test Firebase connection
const testFirebaseConnection = async () => {
  try {
    // Test Firestore connection
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { timestamp: new Date().toISOString() });
    console.log('Firebase Firestore connection successful');
    
    // Verify the test document was saved
    const savedDoc = await getDoc(testDoc);
    if (savedDoc.exists()) {
      console.log('Test document saved and verified:', savedDoc.data());
    } else {
      throw new Error('Test document was not saved properly');
    }
    
    // Test Auth connection
    const currentUser = auth.currentUser;
    console.log('Firebase Auth connection successful');
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    if (error.code === 'permission-denied') {
      console.error('Permission denied. Please check your database rules.');
    } else if (error.code === 'not-found') {
      console.error('Database not found. Please check your configuration.');
    } else {
      console.error('Unknown error:', error);
    }
    return false;
  }
};

// Run connection test
testFirebaseConnection().then(success => {
  if (success) {
    console.log('Firebase connection test passed');
  } else {
    console.error('Firebase connection test failed');
  }
});

export { db, auth, storage, analytics }; 