import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export const addUser = async (userData, userType = 'supervisor') => {
  try {
    console.log('Creating user with data:', { ...userData, pin: '***' }); // Log data without exposing PIN

    // Verify Firebase Auth is properly initialized
    if (!auth) {
      throw new Error('Firebase Authentication is not properly initialized');
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.pin // Using PIN as password
    );

    console.log('Firebase Auth user created:', userCredential.user.uid);

    // Store additional user data in Firestore
    const userDoc = {
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString(),
      biometricRegistered: userData.biometricRegistered || false,
      uid: userCredential.user.uid, // Store the Firebase Auth UID
      pin: userData.pin, // Store PIN for biometric authentication
      role: userType // Add role field
    };

    // Store in appropriate collection based on user type
    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    await setDoc(doc(db, collectionName, userData.email), userDoc);
    console.log(`User data stored in ${collectionName} collection`);

    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    // Log specific error details
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('PIN is too weak');
    } else if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Authentication is not properly configured. Please contact support.');
    } else {
      throw error;
    }
  }
};

export const getUser = async (email, userType = 'supervisor') => {
  try {
    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    const userDoc = await getDoc(doc(db, collectionName, email));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUser = async (email, userData) => {
  try {
    await setDoc(doc(db, 'supervisors', email), userData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const loginUser = async (email, pin, userType = 'supervisor') => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pin);
    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    const userDoc = await getDoc(doc(db, collectionName, email));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
