import { collection, addDoc, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Calculate average score for a set of ratings
const calculateAverageScore = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.percentage, 0);
  return Math.round(sum / ratings.length);
};

// Get current week number (1-4)
const getCurrentWeek = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  return Math.ceil(dayOfMonth / 7);
};

// Store weekly analysis
export const storeWeeklyAnalysis = async (staffId, ratings) => {
  try {
    const currentWeek = getCurrentWeek();
    const weekStart = new Date();
    weekStart.setDate(1 + (currentWeek - 1) * 7);
    
    const analysisData = {
      staffId,
      week: currentWeek,
      weekStart: weekStart.toISOString(),
      ratings: ratings,
      averageScore: calculateAverageScore(ratings),
      categories: {
        time: calculateAverageScore(ratings.filter(r => r.category === 'time')),
        creativity: calculateAverageScore(ratings.filter(r => r.category === 'creativity')),
        shelf_cleanliness: calculateAverageScore(ratings.filter(r => r.category === 'shelf_cleanliness')),
        stock_management: calculateAverageScore(ratings.filter(r => r.category === 'stock_management')),
        customer_service: calculateAverageScore(ratings.filter(r => r.category === 'customer_service')),
        discipline_cases: calculateAverageScore(ratings.filter(r => r.category === 'discipline_cases')),
        personal_grooming: calculateAverageScore(ratings.filter(r => r.category === 'personal_grooming'))
      },
      timestamp: new Date().toISOString()
    };

    // Store in weekly_analysis collection
    const docId = `${staffId}_week_${currentWeek}_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    await setDoc(doc(db, 'weekly_analysis', docId), analysisData);

    return analysisData;
  } catch (error) {
    console.error('Error storing weekly analysis:', error);
    throw error;
  }
};

// Get weekly analysis for a staff member
export const getWeeklyAnalysis = async (staffId, week = null) => {
  try {
    let q;
    if (week) {
      q = query(
        collection(db, 'weekly_analysis'),
        where('staffId', '==', staffId),
        where('week', '==', week)
      );
    } else {
      q = query(
        collection(db, 'weekly_analysis'),
        where('staffId', '==', staffId),
        orderBy('timestamp', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting weekly analysis:', error);
    throw error;
  }
};

// Get all weekly analyses for a staff member
export const getAllWeeklyAnalyses = async (staffId) => {
  try {
    const q = query(
      collection(db, 'weekly_analysis'),
      where('staffId', '==', staffId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all weekly analyses:', error);
    throw error;
  }
};