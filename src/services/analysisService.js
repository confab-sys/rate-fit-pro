import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Helper function to get current week number in the month
const getCurrentWeekInMonth = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const pastDaysOfMonth = now.getDate() - firstDayOfMonth.getDate();
  return Math.floor(pastDaysOfMonth / 7) + 1;
};

// Helper function to get month ID (YYYY-MM format)
const getMonthId = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Store a new rating in the appropriate week
export const storeRating = async (staffId, ratingData) => {
  try {
    const staffRef = doc(db, 'staff', staffId);
    const weeklyAnalysisRef = doc(staffRef, 'weekly_analysis', 'weeks');
    
    // Get current weekly analysis document
    const weeklyDoc = await getDoc(weeklyAnalysisRef);
    const currentWeek = getCurrentWeekInMonth();
    
    if (!weeklyDoc.exists()) {
      // Initialize weekly analysis structure
      await setDoc(weeklyAnalysisRef, {
        week_1: [],
        week_2: [],
        week_3: [],
        week_4: [],
        last_updated: new Date().toISOString()
      });
    }

    const weeklyData = weeklyDoc.exists() ? weeklyDoc.data() : {
      week_1: [],
      week_2: [],
      week_3: [],
      week_4: []
    };

    // Add rating to the appropriate week
    const weekKey = `week_${currentWeek}`;
    weeklyData[weekKey] = [...(weeklyData[weekKey] || []), {
      ...ratingData,
      timestamp: new Date().toISOString()
    }];

    // Update the weekly analysis document
    await updateDoc(weeklyAnalysisRef, weeklyData);

    // Check if we need to create monthly analysis
    if (currentWeek === 4 && weeklyData.week_4.length > 0) {
      await createMonthlyAnalysis(staffId, weeklyData);
    }

    return { success: true, week: currentWeek };
  } catch (error) {
    console.error('Error storing rating:', error);
    throw error;
  }
};

// Create monthly analysis from weekly data
const createMonthlyAnalysis = async (staffId, weeklyData) => {
  try {
    const monthId = getMonthId();
    const monthlyAnalysisRef = doc(db, 'staff', staffId, 'monthly_analysis', monthId);

    // Calculate averages for each category across all weeks
    const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 
                       'customer_service', 'discipline_cases', 'personal_grooming'];
    
    const monthlyData = {
      month: monthId,
      weekly_data: weeklyData,
      averages: {},
      trends: {},
      created_at: new Date().toISOString()
    };

    // Calculate category averages
    categories.forEach(category => {
      const allScores = [];
      for (let week = 1; week <= 4; week++) {
        const weekRatings = weeklyData[`week_${week}`] || [];
        weekRatings.forEach(rating => {
          if (rating[category]) {
            allScores.push(rating[category]);
          }
        });
      }
      
      if (allScores.length > 0) {
        monthlyData.averages[category] = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      }
    });

    // Calculate trends (comparing each week's average to the previous week)
    for (let week = 2; week <= 4; week++) {
      const prevWeek = week - 1;
      const trends = {};
      
      categories.forEach(category => {
        const prevWeekRatings = weeklyData[`week_${prevWeek}`] || [];
        const currentWeekRatings = weeklyData[`week_${week}`] || [];
        
        const prevWeekAvg = prevWeekRatings.reduce((sum, r) => sum + (r[category] || 0), 0) / 
                          (prevWeekRatings.length || 1);
        const currentWeekAvg = currentWeekRatings.reduce((sum, r) => sum + (r[category] || 0), 0) / 
                             (currentWeekRatings.length || 1);
        
        trends[category] = currentWeekAvg - prevWeekAvg;
      });
      
      monthlyData.trends[`week_${week}`] = trends;
    }

    // Store monthly analysis
    await setDoc(monthlyAnalysisRef, monthlyData);

    // Clear weekly data for next month
    await updateDoc(doc(db, 'staff', staffId, 'weekly_analysis', 'weeks'), {
      week_1: [],
      week_2: [],
      week_3: [],
      week_4: [],
      last_updated: new Date().toISOString()
    });

    return monthlyData;
  } catch (error) {
    console.error('Error creating monthly analysis:', error);
    throw error;
  }
};

// Get weekly analysis data
export const getWeeklyAnalysis = async (staffId) => {
  try {
    const weeklyAnalysisRef = doc(db, 'staff', staffId, 'weekly_analysis', 'weeks');
    const weeklyDoc = await getDoc(weeklyAnalysisRef);
    
    if (!weeklyDoc.exists()) {
      return null;
    }

    return weeklyDoc.data();
  } catch (error) {
    console.error('Error getting weekly analysis:', error);
    throw error;
  }
};

// Get monthly analysis data
export const getMonthlyAnalysis = async (staffId, monthId = null) => {
  try {
    const month = monthId || getMonthId();
    const monthlyAnalysisRef = doc(db, 'staff', staffId, 'monthly_analysis', month);
    const monthlyDoc = await getDoc(monthlyAnalysisRef);
    
    if (!monthlyDoc.exists()) {
      return null;
    }

    return monthlyDoc.data();
  } catch (error) {
    console.error('Error getting monthly analysis:', error);
    throw error;
  }
};

// Get all monthly analyses for a staff member
export const getAllMonthlyAnalyses = async (staffId) => {
  try {
    const monthlyCollectionRef = collection(db, 'staff', staffId, 'monthly_analysis');
    const monthlyDocs = await getDocs(monthlyCollectionRef);
    
    return monthlyDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all monthly analyses:', error);
    throw error;
  }
}; 