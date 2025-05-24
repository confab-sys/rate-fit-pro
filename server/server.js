require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeCronJobs, generateMockRatings } = require('./services/cronService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staff-rating', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  // Initialize cron jobs after successful database connection
  initializeCronJobs();
  
  // Generate mock data for testing
  if (process.env.NODE_ENV === 'development') {
    generateMockRatings()
      .then(() => console.log('Mock data generated successfully'))
      .catch(err => console.error('Error generating mock data:', err));
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/ratings/weekly', async (req, res) => {
  try {
    const weeklyRatings = await analyzeWeeklyRatings();
    res.json(weeklyRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ratings/monthly', async (req, res) => {
  try {
    const monthlyRatings = await analyzeMonthlyRatings();
    res.json(monthlyRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ratings/trimester', async (req, res) => {
  try {
    const trimesterRatings = await analyzeTrimesterRatings();
    res.json(trimesterRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ratings/six-month', async (req, res) => {
  try {
    const sixMonthRatings = await analyzeSixMonthRatings();
    res.json(sixMonthRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 