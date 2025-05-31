import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { fetchAggregatedRatings } from './utils/aggregatedRatingsUtils';
import RatingCharts from './components/RatingCharts';
import { FaHome, FaDownload } from 'react-icons/fa';
import { usePDF } from 'react-to-pdf';

const HrWeeklyAnalysis = () => {
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

  // Add PDF functionality for category analysis
  const { toPDF, targetRef } = usePDF({
    filename: staff ? `${staff.name}_category_analysis.pdf` : 'category_analysis.pdf',
    page: { margin: 20 }
  });

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

  const handleMainMenu = () => {
    const isAdmin = sessionStorage.getItem('adminName');
    if (isAdmin) {
      navigate('/reports', { state: { fromSupervisorMenu: false } });
    } else {
      navigate('/reports', { state: { fromSupervisorMenu: true } });
    }
  };

  const generatePerformanceSummary = () => {
    if (!weeklyRatings.length || !staff) return null;

    const totalWeeks = weeklyRatings.length;
    const averageScore = Math.round(weeklyRatings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0) / totalWeeks);
    
    // Get the highest and lowest weeks
    const sortedRatings = [...weeklyRatings].sort((a, b) => b.averagePercentage - a.averagePercentage);
    const highestWeek = sortedRatings[0];
    const lowestWeek = sortedRatings[totalWeeks - 1];

    // Calculate performance trend
    const recentWeeks = weeklyRatings.slice(-3);
    const recentAverage = Math.round(recentWeeks.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0) / recentWeeks.length);
    const trend = recentAverage > averageScore ? 'improving' : recentAverage < averageScore ? 'declining' : 'stable';

    // Generate the summary text
    return (
      <div className="bg-[#1B263B] rounded-lg p-6 mb-8 max-w-4xl w-full">
        <h2 className="text-white text-xl font-bold mb-4">Performance Summary Report</h2>
        <div className="text-gray-300 space-y-3">
          <p>
            {staff.name}'s overall performance shows an average score of {averageScore}% across {totalWeeks} weeks of evaluation.
          </p>
          <p>
            The highest performance was recorded in Week {highestWeek.week} with a score of {Math.round(highestWeek.averagePercentage)}%, 
            while the lowest performance was in Week {lowestWeek.week} with a score of {Math.round(lowestWeek.averagePercentage)}%.
          </p>
          <p>
            Recent performance trend is {trend}, with the last three weeks averaging {recentAverage}%.
          </p>
          {trend === 'improving' && (
            <p className="text-green-400">
              This indicates positive development in performance metrics.
            </p>
          )}
          {trend === 'declining' && (
            <p className="text-yellow-400">
              This suggests areas that may need additional attention or support.
            </p>
          )}
          {trend === 'stable' && (
            <p className="text-blue-400">
              Performance has remained consistent over the recent period.
            </p>
          )}
        </div>
      </div>
    );
  };

  const generateCategoryAveragesReport = () => {
    if (!weeklyRatings.length || !staff) return null;

    // Use the same category configuration as the chart
    const categoryConfig = {
      time: { label: 'Time Management' },
      creativity: { label: 'Creativity' },
      shelf_cleanliness: { label: 'Shelf Cleanliness' },
      stock_management: { label: 'Stock Management' },
      customer_service: { label: 'Customer Service' },
      discipline_cases: { label: 'Discipline Cases' },
      personal_grooming: { label: 'Personal Grooming' }
    };

    // Calculate averages using the same method as the chart
    const categoryAverages = Object.keys(categoryConfig).map(categoryKey => {
      const categoryRatings = weeklyRatings
        .map(rating => rating[categoryKey]?.percentage || 0)
        .filter(percentage => percentage > 0);
      
      const average = categoryRatings.length > 0 
        ? Math.round(categoryRatings.reduce((total, percentage) => total + percentage, 0) / categoryRatings.length)
        : 0;

      return {
        category: categoryConfig[categoryKey].label,
        score: average
      };
    });

    // Sort categories by performance
    const sortedCategories = [...categoryAverages].sort((a, b) => b.score - a.score);

    // Calculate overall category average
    const overallCategoryAverage = Math.round(
      categoryAverages.reduce((sum, cat) => sum + cat.score, 0) / categoryAverages.length
    );

    return (
      <div className="bg-[#1B263B] rounded-lg p-6 mb-8 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Category Performance Analysis</h2>
          <button
            onClick={() => toPDF()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm"
          >
            <FaDownload />
            <span>Download Report</span>
          </button>
        </div>
        <div ref={targetRef} className="bg-white rounded-lg p-6">
          <div className="text-black space-y-6">
            {/* Staff Information Section */}
            <div className="border-b pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={staff.photo || ''}
                  alt={staff.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h3 className="text-2xl font-bold text-black mb-1">{staff.name}</h3>
                  <p className="text-gray-600">Staff ID: {staff.staffIdNo || 'N/A'}</p>
                  <p className="text-gray-600">Department: {staff.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-black font-semibold mb-2">Overall Category Performance</h3>
              <p className="text-black">
                Across all performance categories, {staff.name} maintains an average score of {overallCategoryAverage}%.
                This provides a comprehensive view of their performance across different aspects of their role.
              </p>
              <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black">Total Average Score</span>
                  <span className={`font-bold text-2xl ${
                    overallCategoryAverage >= 80 ? 'text-green-600' : 
                    overallCategoryAverage >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {overallCategoryAverage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className={`h-3 rounded-full ${
                      overallCategoryAverage >= 80 ? 'bg-green-600' : 
                      overallCategoryAverage >= 60 ? 'bg-yellow-600' : 
                      'bg-red-600'
                    }`}
                    style={{ width: `${overallCategoryAverage}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-black font-semibold mb-2">Category Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedCategories.map(({ category, score }) => (
                  <div key={category} className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-black">{category}</span>
                      <span className={`font-bold ${
                        score >= 80 ? 'text-green-600' : 
                        score >= 60 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          score >= 80 ? 'bg-green-600' : 
                          score >= 60 ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-black font-semibold mb-2">Performance Insights</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li className="text-black">
                  <span className="text-green-600 font-semibold">Top Performing Area:</span> {sortedCategories[0].category} 
                  with {sortedCategories[0].score}%
                </li>
                <li className="text-black">
                  <span className="text-yellow-600 font-semibold">Area for Improvement:</span> {sortedCategories[sortedCategories.length - 1].category} 
                  with {sortedCategories[sortedCategories.length - 1].score}%
                </li>
                {overallCategoryAverage >= 80 && (
                  <li className="text-green-600">
                    Overall performance is strong across all categories
                  </li>
                )}
                {overallCategoryAverage < 60 && (
                  <li className="text-red-600">
                    Overall performance needs improvement across multiple categories
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
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
        <div className="w-full max-w-4xl flex justify-start mb-4">
          <button
            onClick={() => navigate('/new-hr-menu')}
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-200"
          >
            <FaHome className="text-xl" />
            <span>Back to HR Menu</span>
          </button>
        </div>
        <h1 className="text-white text-3xl font-bold mb-8">HR Weekly Analysis</h1>
        
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

        {/* Performance Summary Report */}
        {generatePerformanceSummary()}

        {/* Category Averages Report */}
        {generateCategoryAveragesReport()}

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
      </div>
    </div>
  );
};

export default HrWeeklyAnalysis; 