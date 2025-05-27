import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const StaffDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useQuery();
  const deleteMode = queryParams.get('deleteMode') === 'true';
  const rateMode = queryParams.get('rateMode') === 'true';
  const analysisMode = queryParams.get('analysisMode') === 'true';
  const fromHrMenu = queryParams.get('fromHrMenu') === 'true';
  const fromSupervisorMenu = queryParams.get('fromSupervisorMenu') === 'true' || location.state?.fromSupervisorMenu;
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [ratedStaffIds, setRatedStaffIds] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [lastRatedDates, setLastRatedDates] = useState({});

  console.log('Navigation state:', location.state); // Debug log
  console.log('From supervisor menu:', fromSupervisorMenu); // Debug log
  console.log('Rate mode:', rateMode); // Debug log

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
        console.log('Fetched staff data:', staffData); // Debug log
        setStaffMembers(staffData);

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
          console.log('Fetching rated staff...');
          const ratingsSnapshot = await getDocs(collection(db, 'staff_ratings'));
          
          const ratedIds = [];
          ratingsSnapshot.docs.forEach(doc => {
            const rating = doc.data();
            if (rating.staffId && !ratedIds.includes(rating.staffId)) {
              ratedIds.push(rating.staffId);
              console.log('Found rated staff:', rating.staffId);
            }
          });
          
          setRatedStaffIds(ratedIds);
          console.log('Rated staff IDs:', ratedIds);
        } catch (err) {
          console.error('Error fetching rated staff:', err);
        }
      };
      
      fetchRatedStaff();
    }
  }, [rateMode]);

  const filteredStaff = staffMembers.filter(staff => {
    const q = search.trim().toLowerCase();
    return (
      staff.name?.toLowerCase().includes(q) ||
      staff.idNo?.toLowerCase().includes(q) ||
      staff.staffIdNo?.toLowerCase().includes(q) ||
      staff.department?.toLowerCase().includes(q)
    );
  });

  const handleStaffClick = (staff) => {
    if (deleteMode) {
      navigate(`/confirm-delete/${staff.id}`);
    } else if (rateMode) {
      navigate(`/rate-time/${staff.id}`);
    } else if (analysisMode) {
      navigate(`/staff-analysis/${staff.id}`);
    } else {
      setSelectedStaff(staff);
    }
  };

  useEffect(() => {
    const supervisorName = sessionStorage.getItem('supervisorName');
    const adminName = sessionStorage.getItem('adminName');
    
    if (!supervisorName && !adminName) {
      navigate('/supervisor-login');
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
            {rateMode ? 'Rate Staff' : 'Staff Directory'}
          </h1>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-2">
            {/* Return to HR Menu Button - Show when coming from HR menu or not in rate mode */}
            {(!fromSupervisorMenu && (fromHrMenu || !rateMode)) && (
              <button
                onClick={() => navigate('/human-resource-menu')}
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
            )}

            {/* Main Menu Button - Only show if coming from supervisor menu */}
            {fromSupervisorMenu && (
              <button
                onClick={() => navigate('/supervisor-menu')}
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                  />
                </svg>
                <span>Main Menu</span>
              </button>
            )}
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

        {/* Staff Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-7xl mx-auto px-2 sm:px-4">
          {filteredStaff.map((staff) => {
            const isRated = ratedStaffIds.includes(staff.id);
            const isRecentlyRated = isRatedWithinLastWeek(staff.id);
            
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
                  </div>
                </div>
              </div>
            );
          })}
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

export default StaffDirectory;