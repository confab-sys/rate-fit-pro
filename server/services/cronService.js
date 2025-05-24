const cron = require('node-cron');
const moment = require('moment');
const Rating = require('../models/Rating');
const Staff = require('../models/Staff');

// Function to generate mock ratings for testing
const generateMockRatings = async () => {
  const staff = await Staff.find();
  const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 'customer_service', 'discipline_cases', 'personal_grooming'];
  
  for (const staffMember of staff) {
    // Generate 24 weeks of mock data
    for (let week = 1; week <= 24; week++) {
      const timestamp = moment().subtract(24 - week, 'weeks').toDate();
      
      for (const category of categories) {
        const score = Math.floor(Math.random() * 5) + 1;
        const percentage = score * 20;
        
        await Rating.create({
          staffId: staffMember.staffId,
          category,
          score,
          percentage,
          week,
          timestamp,
          ratingDate: timestamp
        });
      }
    }
  }
};

// Function to analyze weekly ratings
const analyzeWeeklyRatings = async () => {
  const weekStart = moment().startOf('week').toDate();
  const weekEnd = moment().endOf('week').toDate();
  
  const weeklyRatings = await Rating.aggregate([
    {
      $match: {
        timestamp: { $gte: weekStart, $lte: weekEnd }
      }
    },
    {
      $group: {
        _id: {
          staffId: '$staffId',
          category: '$category'
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' }
      }
    }
  ]);
  
  return weeklyRatings;
};

// Function to analyze monthly ratings
const analyzeMonthlyRatings = async () => {
  const monthStart = moment().startOf('month').toDate();
  const monthEnd = moment().endOf('month').toDate();
  
  const monthlyRatings = await Rating.aggregate([
    {
      $match: {
        timestamp: { $gte: monthStart, $lte: monthEnd }
      }
    },
    {
      $group: {
        _id: {
          staffId: '$staffId',
          category: '$category'
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' }
      }
    }
  ]);
  
  return monthlyRatings;
};

// Function to analyze trimester ratings
const analyzeTrimesterRatings = async () => {
  const trimesterStart = moment().subtract(3, 'months').startOf('month').toDate();
  const trimesterEnd = moment().endOf('month').toDate();
  
  const trimesterRatings = await Rating.aggregate([
    {
      $match: {
        timestamp: { $gte: trimesterStart, $lte: trimesterEnd }
      }
    },
    {
      $group: {
        _id: {
          staffId: '$staffId',
          category: '$category'
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' }
      }
    }
  ]);
  
  return trimesterRatings;
};

// Function to analyze 6-month ratings
const analyzeSixMonthRatings = async () => {
  const sixMonthStart = moment().subtract(6, 'months').startOf('month').toDate();
  const sixMonthEnd = moment().endOf('month').toDate();
  
  const sixMonthRatings = await Rating.aggregate([
    {
      $match: {
        timestamp: { $gte: sixMonthStart, $lte: sixMonthEnd }
      }
    },
    {
      $group: {
        _id: {
          staffId: '$staffId',
          category: '$category'
        },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' }
      }
    }
  ]);
  
  return sixMonthRatings;
};

// Initialize cron jobs
const initializeCronJobs = () => {
  // Run every minute for testing (change to weekly in production)
  cron.schedule('* * * * *', async () => {
    console.log('Running weekly analysis...');
    try {
      const weeklyAnalysis = await analyzeWeeklyRatings();
      console.log('Weekly analysis completed:', weeklyAnalysis);
      
      // Check if it's the end of the month
      if (moment().endOf('month').isSame(moment(), 'day')) {
        const monthlyAnalysis = await analyzeMonthlyRatings();
        console.log('Monthly analysis completed:', monthlyAnalysis);
      }
      
      // Check if it's the end of a trimester
      if (moment().endOf('month').isSame(moment(), 'day') && 
          [2, 5, 8, 11].includes(moment().month())) {
        const trimesterAnalysis = await analyzeTrimesterRatings();
        console.log('Trimester analysis completed:', trimesterAnalysis);
      }

      // Check if it's the end of a 6-month period
      if (moment().endOf('month').isSame(moment(), 'day') && 
          [5, 11].includes(moment().month())) {
        const sixMonthAnalysis = await analyzeSixMonthRatings();
        console.log('6-Month analysis completed:', sixMonthAnalysis);
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

module.exports = {
  initializeCronJobs,
  generateMockRatings,
  analyzeWeeklyRatings,
  analyzeMonthlyRatings,
  analyzeTrimesterRatings,
  analyzeSixMonthRatings
}; 