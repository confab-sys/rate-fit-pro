import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Your Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
  try {
    console.log(`Clearing ${collectionName} collection...`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`Successfully cleared ${collectionName} collection`);
  } catch (error) {
    console.error(`Error clearing ${collectionName} collection:`, error);
  }
}

async function clearDatabase() {
  try {
    // Clear staff_ratings collection
    await clearCollection('staff_ratings');
    
    // Clear staff collection
    await clearCollection('staff');
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Run the clear function
clearDatabase(); 