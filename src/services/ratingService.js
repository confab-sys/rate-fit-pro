import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import cron from 'node-cron';

// Categories for ratings
const CATEGORIES = [
  'time',
  'creativity',
  'shelf_cleanliness',
  'stock_management',
  'customer_service',
  'discipline_cases',
  'personal_grooming'
];

// Generate mock ratings for testing
export const generateMockRatings = async (staffId, weeks = 24) => {
  const today = new Date();
  const ratings = [];

  for (let week = 0; week < weeks; week++) {
    const timestamp = new Date(today);
    timestamp.setDate(today.getDate() - (week * 7));

    for (const category of CATEGORIES) {
      const score = Math.floor(Math.random() * 5) + 1;
      const percentage = score * 20;

      const ratingData = {
        staffId,
        category,
        score,
        percentage,
        week: week + 1,
        timestamp: timestamp.toISOString(),
        ratingDate: timestamp.toISOString()
      };

      try {
        const docRef = await addDoc(collection(db, 'staff_ratings'), ratingData);
        ratings.push({ id: docRef.id, ...ratingData });
      } catch (error) {
        console.error('Error generating mock rating:', error);
      }
    }
  }

  return ratings;
};

// Get weekly analysis
export const getWeeklyAnalysis = async (staffId) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const q = query(
    collection(db, 'staff_ratings'),
    where('staffId', '==', staffId),
    where('timestamp', '>=', weekStart.toISOString()),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get monthly analysis (4 weeks)
export const getMonthlyAnalysis = async (staffId) => {
  const today = new Date();
  const monthStart = new Date(today);
  monthStart.setDate(today.getDate() - 28); // 4 weeks

  const q = query(
    collection(db, 'staff_ratings'),
    where('staffId', '==', staffId),
    where('timestamp', '>=', monthStart.toISOString()),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get trimester analysis (12 weeks)
export const getTrimesterAnalysis = async (staffId) => {
  const today = new Date();
  const trimesterStart = new Date(today);
  trimesterStart.setDate(today.getDate() - 84); // 12 weeks

  const q = query(
    collection(db, 'staff_ratings'),
    where('staffId', '==', staffId),
    where('timestamp', '>=', trimesterStart.toISOString()),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get six-month analysis (24 weeks)
export const getSixMonthAnalysis = async (staffId) => {
  const today = new Date();
  const sixMonthStart = new Date(today);
  sixMonthStart.setDate(today.getDate() - 168); // 24 weeks

  const q = query(
    collection(db, 'staff_ratings'),
    where('staffId', '==', staffId),
    where('timestamp', '>=', sixMonthStart.toISOString()),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Initialize cron jobs
export const initializeCronJobs = () => {
  // Weekly analysis update (every Sunday at 00:00)
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly analysis update...');
    // Add your weekly update logic here
  });

  // For testing: Run every minute
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('* * * * *', async () => {
      console.log('Running test update...');
      // Add your test update logic here
    });
  }
}; 