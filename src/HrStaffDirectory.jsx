import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const HrStaffDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useQuery();
  const deleteMode = queryParams.get('deleteMode') === 'true';
  const rateMode = queryParams.get('rateMode') === 'true';
  const analysisMode = queryParams.get('analysisMode') === 'true';
  const fromHrMenu = queryParams.get('fromHrMenu') === 'true';
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [ratedStaffIds, setRatedStaffIds] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [lastRatedDates, setLastRatedDates] = useState({});
  const [groupedStaff, setGroupedStaff] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [staffPerformance, setStaffPerformance] = useState({});

  // Function to get color based on performance score
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Function to check if a staff member was rated within the last week
  const isRatedWithinLastWeek = (staffId) => {
    const lastRatedDate = lastRatedDates[staffId];
    if (!lastRatedDate) return false;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return new Date(lastRatedDate) > oneWeekAgo;
  };

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        const staffData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort staff by branch name
        const sortedStaff = staffData.sort((a, b) => {
          const branchA = a.branchName || '';
          const branchB = b.branchName || '';
          return branchA.localeCompare(branchB);
        });
        
        setStaffMembers(sortedStaff);

        // Group staff by branch
        const grouped = sortedStaff.reduce((acc, staff) => {
          const branch = staff.branchName || 'Unassigned';
          if (!acc[branch]) {
            acc[branch] = [];
          }
          acc[branch].push(staff);
          return acc;
        }, {});
        
        setGroupedStaff(grouped);

        // Fetch performance data for each staff member
        const performanceData = {};
        for (const staff of staffData) {
          const ratingsQuery = query(
            collection(db, 'staff', staff.id, 'monthlyRatings'),
            orderBy('timestamp', 'desc')
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          let totalAverage = 0;
          
          if (!ratingsSnapshot.empty) {
            // Calculate total average from all ratings
            const ratings = ratingsSnapshot.docs.map(doc => doc.data());
            const totalPercentage = ratings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0);
            totalAverage = Math.round(totalPercentage / ratings.length);
          }
          
          performanceData[staff.id] = totalAverage;
        }
        setStaffPerformance(performanceData);

        // Fetch last rated dates for each staff member
        const ratedDates = {};
        for (const staff of staffData) {
          const ratingsQuery = query(
            collection(db, 'staff', staff.id, 'monthlyRatings'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          if (!ratingsSnapshot.empty) {
            const lastRating = ratingsSnapshot.docs[0].data();
            ratedDates[staff.id] = lastRating.timestamp;
          }
        }
        setLastRatedDates(ratedDates);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setError('Failed to fetch staff data');
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  // Fetch staff ratings when in rate mode
  useEffect(() => {
    if (rateMode) {
      const fetchRatedStaff = async () => {
        try {
          const ratingsSnapshot = await getDocs(collection(db, 'staff_ratings'));
          
          const ratedIds = [];
          ratingsSnapshot.docs.forEach(doc => {
            const rating = doc.data();
            if (rating.staffId && !ratedIds.includes(rating.staffId)) {
              ratedIds.push(rating.staffId);
            }
          });
          
          setRatedStaffIds(ratedIds);
        } catch (err) {
          console.error('Error fetching rated staff:', err);
        }
      };
      
      fetchRatedStaff();
    }
  }, [rateMode]);

  // Get unique branch names for filter buttons
  const branchNames = ['All', ...Object.keys(groupedStaff).sort()];

  // Calculate total staff count for each branch
  const branchCounts = {
    'All': staffMembers.length,
    ...Object.entries(groupedStaff).reduce((acc, [branch, staff]) => {
      acc[branch] = staff.length;
      return acc;
    }, {})
  };

  // Filter staff based on selected branch and search
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = (
      staff.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      staff.idNo?.toLowerCase().includes(search.trim().toLowerCase()) ||
      staff.staffIdNo?.toLowerCase().includes(search.trim().toLowerCase()) ||
      staff.department?.toLowerCase().includes(search.trim().toLowerCase())
    );
    
    const matchesBranch = selectedBranch === 'All' || staff.branchName === selectedBranch;
    
    return matchesSearch && matchesBranch;
  });

  // Group filtered staff by branch
  const filteredGroupedStaff = filteredStaff.reduce((acc, staff) => {
    const branch = staff.branchName || 'Unassigned';
    if (!acc[branch]) {
      acc[branch] = [];
    }
    acc[branch].push(staff);
    return acc;
  }, {});

  const handleStaffClick = (staff) => {
    if (deleteMode) {
      navigate(`/confirm-delete/${staff.id}`, { state: { fromHrMenu } });
    } else if (rateMode) {
      navigate(`/rate-time/${staff.id}`);
    } else if (analysisMode) {
      navigate(`/staff-analysis/${staff.id}`);
    } else {
      navigate(`/hr-view-report/${staff.id}`, { state: { fromHrStaffDirectory: true } });
    }
  };

  useEffect(() => {
    const adminName = sessionStorage.getItem('adminName');
    
    if (!adminName) {
      navigate('/new-hr-login');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading staff directory...</div>
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
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-2 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center flex-1">
            {rateMode ? 'Rate Staff' : 'HR Staff Directory'}
          </h1>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-2">
            {/* Return to HR Menu Button */}
            <button
              onClick={() => navigate('/new-hr-menu')}
              className="px-4 py-3 rounded-lg bg-[#1B263B] text-white hover:bg-[#22304a] transition-colors flex items-center justify-center space-x-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Return to HR Menu</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4 sm:mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <svg
              className="absolute right-2 top-2.5 sm:right-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Branch Filter Buttons */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {branchNames.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedBranch === branch
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1B263B] text-gray-300 hover:bg-[#22304a]'
                }`}
              >
                {branch} <span className="ml-1 text-xs opacity-75">({branchCounts[branch]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid by Branch */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {Object.entries(filteredGroupedStaff).map(([branch, staffList]) => (
            <div key={branch} className="mb-8">
              <h2 className="text-white text-lg sm:text-xl font-semibold mb-4 border-b border-[#1B263B] pb-2">
                {branch}
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {staffList.map((staff) => {
                  const isRated = ratedStaffIds.includes(staff.id);
                  const isRecentlyRated = isRatedWithinLastWeek(staff.id);
                  const performanceScore = staffPerformance[staff.id] || 0;
                  
                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleStaffClick(staff)}
                      className={`bg-[#1B263B] rounded-lg p-2 sm:p-3 hover:shadow-lg transition-shadow cursor-pointer ${
                        isRecentlyRated ? 'border-2 border-green-500' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex-shrink-0">
                          <img
                            src={staff.photo || 'https://via.placeholder.com/64'}
                            alt={staff.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 w-full text-center">
                          <h2 className="text-white text-xs sm:text-sm font-semibold truncate">
                            {staff.name}
                          </h2>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">ID: {staff.staffIdNo}</p>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">Department: {staff.department}</p>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getScoreColor(performanceScore)}`}></div>
                            <span className="text-white font-semibold text-xs sm:text-sm">{performanceScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found. Add some staff members to get started.
          </div>
        )}

        {/* Staff Details Modal */}
        {selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1B263B] rounded-lg p-6 w-[90%] max-w-2xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-white text-2xl font-bold">{selectedStaff.name}</h2>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-white hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img
                    src={selectedStaff.photo || 'https://via.placeholder.com/200'}
                    alt={selectedStaff.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-white"><span className="text-gray-400">Staff ID:</span> {selectedStaff.staffIdNo}</p>
                  <p className="text-white"><span className="text-gray-400">Department:</span> {selectedStaff.department}</p>
                  <p className="text-white"><span className="text-gray-400">Branch:</span> {selectedStaff.branchName}</p>
                  <p className="text-white"><span className="text-gray-400">Status:</span> {selectedStaff.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrStaffDirectory; 