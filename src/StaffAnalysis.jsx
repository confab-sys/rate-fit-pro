import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';
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
  const [analysisType, setAnalysisType] = useState('weekly'); // weekly, monthly, trimester, sixMonth
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const today = new Date();
        let startDate = new Date();

        // Set the start date based on analysis type
        switch (analysisType) {
          case 'weekly':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'monthly':
            startDate.setDate(today.getDate() - 28); // 4 weeks
            break;
          case 'trimester':
            startDate.setMonth(today.getMonth() - 3);
            break;
          case 'sixMonth':
            startDate.setMonth(today.getMonth() - 6);
            break;
          default:
            startDate.setDate(today.getDate() - 7);
        }

        const ratingsQuery = query(
          collection(db, 'staff_ratings'),
          where('staffId', '==', staffId),
          where('timestamp', '>=', startDate.toISOString()),
          orderBy('timestamp', 'asc')
        );

        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRatings(ratingsData);
      } catch (err) {
        setError('Failed to fetch ratings data');
        console.error('Error fetching ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [staffId, analysisType]);

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

    const labels = Object.values(categories);
    const datasets = ratings.map(rating => ({
      label: new Date(rating.timestamp).toLocaleDateString(),
      data: Object.keys(categories).map(category => {
        const categoryRating = ratings.find(r => r.category === category && r.timestamp === rating.timestamp);
        return categoryRating ? categoryRating.percentage : 0;
      }),
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      fill: false
    }));

    return {
      labels,
      datasets
    };
  };

  const calculateAverageScore = () => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.percentage, 0);
    return Math.round(total / ratings.length);
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Staff Performance Analysis</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setAnalysisType('weekly')}
              className={`px-4 py-2 rounded ${analysisType === 'weekly' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setAnalysisType('monthly')}
              className={`px-4 py-2 rounded ${analysisType === 'monthly' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnalysisType('trimester')}
              className={`px-4 py-2 rounded ${analysisType === 'trimester' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Trimester
            </button>
            <button
              onClick={() => setAnalysisType('sixMonth')}
              className={`px-4 py-2 rounded ${analysisType === 'sixMonth' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              6 Months
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1B2B3A] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Performance Trend</h2>
            <Line data={prepareChartData()} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: 'white' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
              }
            }} />
          </div>

          <div className="bg-[#1B2B3A] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
            <Bar data={prepareChartData()} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: 'white' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
              }
            }} />
          </div>
        </div>

        <div className="bg-[#1B2B3A] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#2C3E50] rounded-lg">
              <h3 className="text-lg font-medium mb-2">Average Score</h3>
              <p className="text-3xl font-bold">{calculateAverageScore()}%</p>
            </div>
            <div className="p-4 bg-[#2C3E50] rounded-lg">
              <h3 className="text-lg font-medium mb-2">Total Ratings</h3>
              <p className="text-3xl font-bold">{ratings.length}</p>
            </div>
            <div className="p-4 bg-[#2C3E50] rounded-lg">
              <h3 className="text-lg font-medium mb-2">Period</h3>
              <p className="text-3xl font-bold">{analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAnalysis; 