import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const t60Url = new URL('./assets/T-60%.svg', import.meta.url).href;
const beginRatingUrl = new URL('./assets/begin-rating.svg', import.meta.url).href;
const arrowBackUrl = new URL('./assets/arrow-back.svg', import.meta.url).href;

const RatingStaff1 = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageScore, setAverageScore] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const fetchStaffAndRatings = async () => {
      try {
        // Fetch staff data
        const docRef = doc(db, 'staff', staffId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStaff(docSnap.data());
        } else {
          setError('Staff record not found.');
        }

        // Fetch ratings data
        const ratingsRef = collection(db, 'staff', staffId, 'monthlyRatings');
        const ratingsSnapshot = await getDocs(ratingsRef);
        const ratings = ratingsSnapshot.docs.map(doc => doc.data());

        if (ratings.length > 0) {
          // Calculate average score from all ratings
          const totalPercentage = ratings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0);
          const avgScore = Math.round(totalPercentage / ratings.length);
          setAverageScore(avgScore);

          // Sort ratings by week and prepare weekly data
          const sortedRatings = ratings.sort((a, b) => a.week - b.week);
          setWeeklyData(sortedRatings);
        }
      } catch (err) {
        setError('Failed to fetch staff record.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaffAndRatings();
  }, [staffId]);

  const chartData = {
    labels: weeklyData.map(rating => `Week ${rating.week}`),
    datasets: [
      {
        label: 'Weekly Average Score',
        data: weeklyData.map(rating => rating.averagePercentage),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: 'Weekly Progress',
        color: 'white',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex items-center justify-center min-h-screen text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between" style={{ backgroundColor: '#0D1B2A' }}>
      <div className="flex flex-col items-center pt-6 sm:pt-10">
        <div
          className="flex flex-col sm:flex-row items-center w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8"
          style={{ background: 'rgba(217, 217, 217, 0.12)', padding: '1.5rem 1rem', minHeight: '160px' }}
        >
          <img
            src={staff.photo || ''}
            alt={staff.name || 'Staff'}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white mb-4 sm:mb-0"
          />
          <div className="sm:ml-8 flex flex-col justify-center min-w-[180px] w-full">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 text-center sm:text-left">{staff.name || 'N/A'}</h2>
            <p className="text-white mb-1 text-center sm:text-left">Staff ID No: {staff.staffIdNo || 'N/A'}</p>
            <p className="text-white mb-1 text-center sm:text-left">Department: {staff.department || 'N/A'}</p>
            <p className="text-white mb-1 text-center sm:text-left">Date Joined: {staff.dateJoined || 'N/A'}</p>
          </div>
          {/* Percentage box on the right side of the rectangle */}
          <div className="flex-1 flex justify-end items-center mt-4 sm:mt-0">
            <div className="bg-white bg-opacity-90 rounded-lg px-6 py-4 flex flex-col items-center justify-center shadow-md">
              <span className="text-[#0D1B2A] text-2xl sm:text-3xl font-extrabold leading-none">{averageScore}%</span>
              <span className="text-[#0D1B2A] text-xs sm:text-sm font-semibold mt-1">Average Rating</span>
            </div>
          </div>
        </div>
        {/* Add the bar chart after the staff info card */}
        <div
          className="w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8 p-4"
          style={{ background: 'rgba(217, 217, 217, 0.12)' }}
        >
          <Bar data={chartData} options={chartOptions} />
        </div>
        {/* Second empty rectangle below the first one */}
        <div
          className="w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8 flex flex-col items-center justify-start relative"
          style={{ background: 'rgba(217, 217, 217, 0.12)', padding: '1.5rem 1rem', minHeight: '120px' }}
        >
          <div className="absolute left-0 right-0 top-4 flex justify-center">
            <span className="text-white text-lg sm:text-xl font-bold">Core Strength🏋🏻</span>
          </div>
        </div>
        {/* Third empty rectangle below the second one */}
        <div
          className="w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8 flex flex-col items-center justify-start relative"
          style={{ background: 'rgba(217, 217, 217, 0.12)', padding: '1.5rem 1rem', minHeight: '120px' }}
        >
          <div className="absolute left-0 right-0 top-4 flex justify-center">
            <span className="text-white text-lg sm:text-xl font-bold">Weakness 😔</span>
          </div>
        </div>
        {/* Fourth empty rectangle below the third one */}
        <div
          className="w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8 flex flex-col items-center justify-start relative"
          style={{ background: 'rgba(217, 217, 217, 0.12)', padding: '1.5rem 1rem', minHeight: '120px' }}
        >
          <div className="absolute left-0 right-0 top-4 flex justify-center">
            <span className="text-white text-lg sm:text-xl font-bold">Implementation 🛠️</span>
          </div>
        </div>
        {/* You can add rating form or other content below this section */}
      </div>
      <div className="flex justify-center pb-2">
        <img
          src={beginRatingUrl}
          alt="Begin Rating"
          className="w-28 h-28 sm:w-36 sm:h-36 cursor-pointer"
          onClick={() => navigate(`/rate-time/${staffId}`)}
        />
      </div>
      <div className="flex justify-center pb-8">
        <img src={arrowBackUrl} alt="Back" className="w-12 h-12 sm:w-16 sm:h-16 cursor-pointer" />
      </div>
    </div>
  );
};

export default RatingStaff1; 