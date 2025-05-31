import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Staff analysis endpoint
app.post('/api/analyze-staff-decline', async (req, res) => {
  try {
    const { staffData, question } = req.body;

    if (!staffData || !Array.isArray(staffData)) {
      return res.status(400).json({ error: 'Invalid staff data provided' });
    }

    // Prepare the prompt based on whether it's a question or general analysis
    let prompt;
    if (question) {
      prompt = `Based on the following staff performance data, please answer this question: "${question}"\n\nStaff Data:\n${JSON.stringify(staffData, null, 2)}`;
    } else {
      prompt = `Analyze the following staff performance data and provide insights about performance trends, areas of concern, and recommendations for improvement:\n\n${JSON.stringify(staffData, null, 2)}`;
    }

    console.log('Sending request to OpenAI with model: gpt-3.5-turbo');

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes staff performance data. Provide clear, concise, and actionable insights. Focus on identifying trends, patterns, and specific areas for improvement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      console.log('OpenAI response received successfully');
      const analysis = completion.choices[0].message.content;
      res.json({ analysis });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      throw new Error(`OpenAI API Error: ${openaiError.message}`);
    }
  } catch (error) {
    console.error('Error in staff analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze staff data',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment variables loaded:', {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
  });
}); 