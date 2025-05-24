import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Check if this is the 4th rating for a staff member
export const isFourthRating = async (staffId) => {
  try {
    const weeklyQuery = query(
      collection(db, 'staff', staffId, 'WeeklyRatings'),
      where('week', '>=', 1),
      where('week', '<=', 4)
    );
    const snapshot = await getDocs(weeklyQuery);
    return snapshot.size === 3; // If we have 3 ratings, this will be the 4th
  } catch (error) {
    console.error('Error checking rating count:', error);
    return false;
  }
};

// Fetch all weekly ratings for a staff member
export const fetchWeeklyRatings = async (staffId) => {
  try {
    const weeklyQuery = query(
      collection(db, 'staff', staffId, 'WeeklyRatings'),
      where('week', '>=', 1),
      where('week', '<=', 4)
    );
    const snapshot = await getDocs(weeklyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching weekly ratings:', error);
    return [];
  }
};

// Calculate averages for each category
export const calculateCategoryAverages = (ratings) => {
  const categories = [
    'timeManagement',
    'creativity',
    'shelfCleanliness',
    'stockManagement',
    'customerService',
    'disciplineCases',
    'personalGrooming'
  ];

  const averages = {};
  let totalOverall = 0;

  categories.forEach(category => {
    const validRatings = ratings
      .map(rating => rating[category]?.percentage || 0)
      .filter(percentage => percentage > 0);
    
    const average = validRatings.length > 0
      ? Math.round(validRatings.reduce((a, b) => a + b, 0) / validRatings.length)
      : 0;
    
    averages[category] = average;
    totalOverall += average;
  });

  averages.overallAverage = Math.round(totalOverall / categories.length);
  return averages;
};

// Store aggregated ratings
export const storeAggregatedRatings = async (staffId, ratings, averages) => {
  try {
    const aggregatedData = {
      weeks: ratings.reduce((acc, rating) => {
        acc[`week${rating.week}`] = rating;
        return acc;
      }, {}),
      averageScores: averages,
      timestamp: new Date().toISOString()
    };

    await setDoc(
      doc(db, 'staff', staffId, 'AggregatedRatings', 'first_quarter'),
      aggregatedData
    );

    return true;
  } catch (error) {
    console.error('Error storing aggregated ratings:', error);
    return false;
  }
};

// Fetch aggregated ratings
export const fetchAggregatedRatings = async (staffId) => {
  try {
    const docRef = doc(db, 'staff', staffId, 'AggregatedRatings', 'first_quarter');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching aggregated ratings:', error);
    return null;
  }
};