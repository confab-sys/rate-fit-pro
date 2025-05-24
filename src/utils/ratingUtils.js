// Function to get the current week number (1-52)
export const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil(diff / oneWeek);
};

// Function to get the current month and year
export const getMonthYear = () => {
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[now.getMonth()]}${now.getFullYear()}`;
};

// Function to store a rating in sessionStorage
export const storeRating = (category, score, percentage) => {
  const ratings = JSON.parse(sessionStorage.getItem('ratings') || '{}');
  ratings[category] = {
    score,
    percentage,
    timestamp: new Date().toISOString()
  };
  sessionStorage.setItem('ratings', JSON.stringify(ratings));
};

// Function to get all stored ratings
export const getAllRatings = () => {
  return JSON.parse(sessionStorage.getItem('ratings') || '{}');
};

// Function to clear all stored ratings
export const clearRatings = () => {
  sessionStorage.removeItem('ratings');
};

// Function to calculate average percentage from ratings
export const calculateAveragePercentage = (ratings) => {
  const percentages = Object.values(ratings).map(rating => rating.percentage);
  if (percentages.length === 0) return 0;
  return percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length;
};

// Function to get the current rating week for a staff
export const getStaffRatingWeek = async (db, staffId) => {
  try {
    const monthlyAnalysisRef = doc(db, 'monthly_analysis', staffId);
    const monthlyDoc = await getDoc(monthlyAnalysisRef);
    
    if (!monthlyDoc.exists()) {
      // If no monthly analysis exists, start with week 1
      return 1;
    }

    const data = monthlyDoc.data();
    const currentWeek = data.currentWeek || 1;
    
    // If we've reached week 4, reset to week 1
    if (currentWeek >= 4) {
      return 1;
    }
    
    return currentWeek;
  } catch (error) {
    console.error('Error getting staff rating week:', error);
    return 1;
  }
};

// Function to update staff rating week
export const updateStaffRatingWeek = async (db, staffId, currentWeek) => {
  try {
    const monthlyAnalysisRef = doc(db, 'monthly_analysis', staffId);
    await setDoc(monthlyAnalysisRef, {
      currentWeek: currentWeek + 1,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating staff rating week:', error);
  }
}; 