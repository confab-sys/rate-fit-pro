import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchAggregatedRatings } from './utils/aggregatedRatingsUtils';
import RatingCharts from './components/RatingCharts';

const WeeklyAnalysis = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState(null);
  const [weeklyRatings, setWeeklyRatings] = useState([]);
  const [monthlyRatings, setMonthlyRatings] = useState([]);
  const [aggregatedRatings, setAggregatedRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState('');
  const [showOnlyCategoryAverages, setShowOnlyCategoryAverages] = useState(
    location.state?.fromDashboard || false
  );

  useEffect(() => {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, options);
    setCurrentDate(formattedDate);

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff details
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (!staffDoc.exists()) {
          throw new Error('Staff not found');
        }
        setStaff(staffDoc.data());

        // Fetch all weekly ratings from monthlyRatings collection
        const monthlyQuery = query(
          collection(db, 'staff', staffId, 'monthlyRatings')
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const weeklyData = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.week - b.week); // Sort by week number

        setWeeklyRatings(weeklyData);
        setMonthlyRatings(weeklyData);

        // Get aggregated ratings
        const aggregated = await fetchAggregatedRatings(staffId);
        setAggregatedRatings(aggregated);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchData();
    }
  }, [staffId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-red-500 text-center mt-10">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
      <div className="flex flex-col items-center pt-8">
        <h1 className="text-white text-3xl font-bold mb-8">Weekly Analysis</h1>
        
        {staff && (
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
            </div>
            <div className="flex-1 flex justify-end items-center mt-4 sm:mt-0">
              <div className="bg-white bg-opacity-90 rounded-lg px-6 py-4 flex flex-col items-center justify-center shadow-md">
                <span className="text-[#0D1B2A] text-2xl sm:text-3xl font-extrabold leading-none">
                  {weeklyRatings.length > 0 ? 
                    Math.round(weeklyRatings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0) / weeklyRatings.length) : 
                    0}%
                </span>
                <span className="text-[#0D1B2A] text-xs sm:text-sm font-semibold mt-1">Total Average</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="w-full max-w-4xl">
          <RatingCharts 
            aggregatedRatings={aggregatedRatings} 
            weeklyRatings={weeklyRatings} 
            currentDate={currentDate}
            staffName={staff?.name}
            showOnlyCategoryAverages={showOnlyCategoryAverages}
          />
        </div>

        <button
          onClick={handleBack}
          className="mt-8 px-8 py-3 rounded-lg text-white font-bold text-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default WeeklyAnalysis;