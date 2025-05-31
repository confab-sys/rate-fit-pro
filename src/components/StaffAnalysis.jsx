import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  getWeeklyAnalysis,
  getMonthlyAnalysis,
  getTrimesterAnalysis,
  getSixMonthAnalysis,
  generateMockRatings
} from '../services/ratingService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StaffAnalysis = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [analysisType, setAnalysisType] = useState('weekly');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data;

        switch (analysisType) {
          case 'weekly':
            data = await getWeeklyAnalysis(staffId);
            break;
          case 'monthly':
            data = await getMonthlyAnalysis(staffId);
            break;
          case 'trimester':
            data = await getTrimesterAnalysis(staffId);
            break;
          case 'sixMonth':
            data = await getSixMonthAnalysis(staffId);
            break;
          default:
            data = await getWeeklyAnalysis(staffId);
        }

        setRatings(data);
      } catch (err) {
        setError('Failed to fetch ratings data');
        console.error('Error fetching ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [staffId, analysisType]);

  // Generate mock data for testing
  const handleGenerateMockData = async () => {
    try {
      setLoading(true);
      await generateMockRatings(staffId);
      // Refresh the current analysis
      const data = await getWeeklyAnalysis(staffId);
      setRatings(data);
    } catch (err) {
      setError('Failed to generate mock data');
      console.error('Error generating mock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const categories = {
      time: 'Time Management',
      creativity: 'Creativity',
      shelf_cleanliness: 'Shelf Cleanliness',
      stock_management: 'Stock Management',
      customer_service: 'Customer Service',
      discipline_cases: 'Discipline',
      personal_grooming: 'Personal Grooming'
    };

    // Group ratings by date
    const groupedRatings = ratings.reduce((acc, rating) => {
      const date = new Date(rating.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][rating.category] = rating.percentage;
      return acc;
    }, {});

    const dates = Object.keys(groupedRatings);
    const datasets = Object.keys(categories).map(category => ({
      label: categories[category],
      data: dates.map(date => groupedRatings[date][category] || 0),
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      fill: false
    }));

    return {
      labels: dates,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Staff Performance Analysis</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setAnalysisType('weekly')}
            className={`p-4 rounded ${
              analysisType === 'weekly' ? 'bg-blue-600' : 'bg-gray-700'
            } text-white`}
          >
            Weekly Analysis
          </button>
          <button
            onClick={() => setAnalysisType('monthly')}
            className={`p-4 rounded ${
              analysisType === 'monthly' ? 'bg-blue-600' : 'bg-gray-700'
            } text-white`}
          >
            Monthly Analysis
          </button>
          <button
            onClick={() => setAnalysisType('trimester')}
            className={`p-4 rounded ${
              analysisType === 'trimester' ? 'bg-blue-600' : 'bg-gray-700'
            } text-white`}
          >
            Trimester Analysis
          </button>
          <button
            onClick={() => setAnalysisType('sixMonth')}
            className={`p-4 rounded ${
              analysisType === 'sixMonth' ? 'bg-blue-600' : 'bg-gray-700'
            } text-white`}
          >
            Six Month Analysis
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 mb-8">
          <Line data={prepareChartData()} options={chartOptions} />
        </div>

        <div className="bg-white rounded-lg p-6">
          <Bar data={prepareChartData()} options={chartOptions} />
        </div>

        {/* Test button for generating mock data */}
        <button
          onClick={handleGenerateMockData}
          className="mt-8 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Generate Mock Data
        </button>
      </div>
    </div>
  );
};

export default StaffAnalysis; 