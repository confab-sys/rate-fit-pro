const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  category: {
    type: String,
    required: true,
    enum: ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 'customer_service', 'discipline_cases', 'personal_grooming']
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  percentage: {
    type: Number,
    required: true,
    min: 20,
    max: 100
  },
  week: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  ratingDate: {
    type: Date,
    required: true
  }
});

// Index for efficient querying
ratingSchema.index({ staffId: 1, timestamp: -1 });
ratingSchema.index({ staffId: 1, category: 1, timestamp: -1 });

module.exports = mongoose.model('Rating', ratingSchema); 