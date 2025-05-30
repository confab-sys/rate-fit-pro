import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { getWeeklyAnalysis } from './services/weeklyAnalysisService';
import WeeklyAnalysisChart from './components/WeeklyAnalysisChart';
import { FaHome } from 'react-icons/fa';

const ManagerViewStaffReport = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState(null);
  const [weeklyRatings, setWeeklyRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category colors matching the charts
  const categoryColors = {
    'time': 'rgba(255, 99, 132, 0.6)', // Pink
    'creativity': 'rgba(54, 162, 235, 0.6)', // Blue
    'shelf cleanliness': 'rgba(255, 206, 86, 0.6)', // Yellow
    'stock management': 'rgba(75, 192, 192, 0.6)', // Teal
    'customer service': 'rgba(153, 102, 255, 0.6)', // Purple
    'discipline cases': 'rgba(255, 159, 64, 0.6)', // Orange
    'personal grooming': 'rgba(199, 199, 199, 0.6)', // Gray
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get staff details
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (!staffDoc.exists()) {
          throw new Error('Staff not found');
        }
        setStaff(staffDoc.data());

        // Get weekly analysis
        const analysis = await getWeeklyAnalysis(staffId);
        if (analysis && analysis.length > 0) {
          setWeeklyAnalysis(analysis[0]); // Get the most recent analysis
        }

        // Fetch weekly ratings
        const monthlyQuery = query(
          collection(db, 'staff', staffId, 'monthlyRatings')
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const weeklyData = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.week - b.week);

        setWeeklyRatings(weeklyData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchData();
    }
  }, [staffId]);

  // Calculate total average score
  const totalAverage = weeklyRatings.length > 0 ? 
    Math.round(weeklyRatings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0) / weeklyRatings.length) : 
    0;

  const handleViewReport = () => {
    navigate(`/manager-view-weekly-analysis/${staffId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading staff report...</div>
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
    <div className="min-h-screen w-full" style={{ backgroundColor: '#0D1B2A' }}>
      <div className="flex flex-col items-center pt-8 px-4">
        {/* Back Navigation */}
        <div className="w-full max-w-4xl flex justify-start mb-4">
          <button
            onClick={() => navigate('/manager-menu')}
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-200"
          >
            <FaHome className="text-xl" />
            <span>Back to Manager Menu</span>
          </button>
        </div>

        <h1 className="text-white text-3xl font-bold mb-8">Staff Report</h1>
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
              <p className="text-white mb-1 text-center sm:text-left">Date Joined: {staff.dateJoined || 'N/A'}</p>
              <p className="text-white mb-1 text-center sm:text-left">Branch: {staff.branchName || 'N/A'}</p>
            </div>
            <div className="flex-1 flex justify-end items-center mt-4 sm:mt-0">
              <div className="bg-white bg-opacity-90 rounded-lg px-6 py-4 flex flex-col items-center justify-center shadow-md">
                <span className="text-[#0D1B2A] text-2xl sm:text-3xl font-extrabold leading-none">
                  {totalAverage}%
                </span>
                <span className="text-[#0D1B2A] text-xs sm:text-sm font-semibold mt-1">Total Average</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleViewReport}
          className="px-8 py-3 rounded-lg text-white font-bold text-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          View Staff Reports
        </button>

        {/* Weekly Analysis Section */}
        {weeklyAnalysis ? (
          <div className="space-y-6">
            {/* Performance Charts */}
            <WeeklyAnalysisChart analysisData={weeklyAnalysis} />

            {/* Weekly Summary */}
            <div className="bg-[#1B263B] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Weekly Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Overall Performance</h3>
                  <p className="text-3xl font-bold text-green-400">{weeklyAnalysis.averageScore}%</p>
                  <p className="text-gray-400 text-sm mt-1">Average Score</p>
                </div>
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Week Information</h3>
                  <p className="text-gray-300">Week {weeklyAnalysis.week}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(weeklyAnalysis.weekStart).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Details */}
            <div className="w-full max-w-3xl mx-auto mt-8">
              <h3 className="text-white text-2xl font-bold mb-4">Category Details</h3>
              <div className="space-y-4">
                {weeklyAnalysis?.categoryScores ? (
                  Object.entries(weeklyAnalysis.categoryScores).map(([category, scoreData]) => (
                    <div key={category} className="bg-[#1B263B] rounded-lg p-4 shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold capitalize">{category.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-300 text-sm">{scoreData.points} points</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${scoreData.percentage}%`,
                            backgroundColor: categoryColors[category.toLowerCase()] || 'gray',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No detailed category data available for this week.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            No weekly analysis data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerViewStaffReport; 