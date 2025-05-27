import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db, auth, logSecurityEvent } from '../firebase';
import bcrypt from 'bcryptjs';
import { securityMonitor, validateInput } from './security';

// Security configuration
const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Track failed login attempts
const failedAttempts = new Map();

// Helper function to hash PIN
const hashPin = async (pin) => {
  return await bcrypt.hash(pin, SALT_ROUNDS);
};

// Helper function to verify PIN
const verifyPin = async (pin, hashedPin) => {
  return await bcrypt.compare(pin, hashedPin);
};

// Helper function to check if account is locked
const isAccountLocked = (email) => {
  const attempts = failedAttempts.get(email);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const lockoutTime = attempts.lastAttempt + LOCKOUT_DURATION;
    if (Date.now() < lockoutTime) {
      return true;
    }
    // Reset if lockout period has passed
    failedAttempts.delete(email);
    return false;
  }
  return false;
};

// Helper function to record failed attempt
const recordFailedAttempt = (email) => {
  const attempts = failedAttempts.get(email) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(email, attempts);
  
  logSecurityEvent('Failed Login Attempt', {
    email,
    attemptCount: attempts.count
  });
};

// Helper function to reset failed attempts
const resetFailedAttempts = (email) => {
  failedAttempts.delete(email);
  logSecurityEvent('Login Attempts Reset', { email });
};

export const addUser = async (userData, userType = 'supervisor') => {
  try {
    // Validate input
    if (!validateInput.email(userData.email)) {
      throw new Error('Invalid email format');
    }
    if (!validateInput.pin(userData.pin)) {
      throw new Error('PIN must be 6 digits');
    }
    if (!validateInput.name(userData.name)) {
      throw new Error('Invalid name format');
    }

    logSecurityEvent('User Creation Attempt', {
      email: userData.email,
      userType
    });

    // Verify Firebase Auth is properly initialized
    if (!auth) {
      throw new Error('Firebase Authentication is not properly initialized');
    }

    // Hash the PIN before storing
    const hashedPin = await hashPin(userData.pin);

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.pin
    );

    logSecurityEvent('Firebase Auth User Created', {
      uid: userCredential.user.uid
    });

    // Store additional user data in Firestore
    const userDoc = {
      name: validateInput.sanitizeString(userData.name),
      email: userData.email,
      createdAt: new Date().toISOString(),
      biometricRegistered: userData.biometricRegistered || false,
      uid: userCredential.user.uid,
      pin: hashedPin,
      role: userType,
      lastLogin: null,
      failedAttempts: 0
    };

    // Store in appropriate collection based on user type
    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    await setDoc(doc(db, collectionName, userData.email), userDoc);
    
    logSecurityEvent('User Data Stored', {
      collection: collectionName,
      email: userData.email
    });

    return true;
  } catch (error) {
    logSecurityEvent('User Creation Failed', {
      error: error.message,
      code: error.code
    });
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('PIN is too weak');
    } else {
      throw error;
    }
  }
};

export const getUser = async (email, userType = 'supervisor') => {
  try {
    if (!validateInput.email(email)) {
      throw new Error('Invalid email format');
    }

    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    const userDoc = await getDoc(doc(db, collectionName, email));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Don't return the hashed PIN
      const { pin, ...safeUserData } = userData;
      return safeUserData;
    }
    return null;
  } catch (error) {
    logSecurityEvent('Get User Failed', {
      error: error.message,
      email
    });
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

export const loginUser = async (email, pin, userType = 'supervisor', ip) => {
  try {
    // Validate input
    if (!validateInput.email(email)) {
      throw new Error('Invalid email format');
    }
    if (!validateInput.pin(pin)) {
      throw new Error('Invalid PIN format');
    }

    // Check if account is locked
    if (securityMonitor.isAccountLocked(email, ip)) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    const collectionName = userType === 'hr' ? 'hr_users' : 'supervisors';
    const userDoc = await getDoc(doc(db, collectionName, email));
    
    if (!userDoc.exists()) {
      securityMonitor.recordFailedLogin(email, ip);
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    
    // Verify PIN
    const isValidPin = await verifyPin(pin, userData.pin);
    if (!isValidPin) {
      securityMonitor.recordFailedLogin(email, ip);
      throw new Error('Invalid PIN');
    }

    // Reset failed attempts on successful login
    securityMonitor.resetFailedAttempts(email, ip);

    // Update last login
    await setDoc(doc(db, collectionName, email), {
      ...userData,
      lastLogin: new Date().toISOString(),
      failedAttempts: 0
    }, { merge: true });

    logSecurityEvent('Successful Login', {
      email,
      userType,
      ip
    });

    // Don't return the hashed PIN
    const { pin: _, ...safeUserData } = userData;
    return safeUserData;
  } catch (error) {
    logSecurityEvent('Login Failed', {
      error: error.message,
      email,
      ip
    });
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    if (!validateInput.email(email)) {
      throw new Error('Invalid email format');
    }

    await sendPasswordResetEmail(auth, email);
    logSecurityEvent('Password Reset Email Sent', { email });
    return true;
  } catch (error) {
    logSecurityEvent('Password Reset Failed', {
      error: error.message,
      email
    });
    throw error;
  }
};
