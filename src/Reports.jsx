import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Check if user came from supervisor menu
  const fromSupervisorMenu = location.state?.fromSupervisorMenu;

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const staffSnapshot = await getDocs(collection(db, 'staff'));
        const staffData = await Promise.all(staffSnapshot.docs.map(async (doc) => {
          const staffInfo = doc.data();
          
          // Get ratings for each staff member
          const ratingsRef = collection(db, 'staff', doc.id, 'monthlyRatings');
          const ratingsSnapshot = await getDocs(ratingsRef);
          const ratings = ratingsSnapshot.docs.map(rating => rating.data());
          
          // Calculate average score
          let averageScore = 0;
          if (ratings.length > 0) {
            const total = ratings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0);
            averageScore = Math.round(total / ratings.length);
          }

          return {
            id: doc.id,
            ...staffInfo,
            averageScore
          };
        }));

        setStaffMembers(staffData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setError('Failed to load staff data');
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const filteredStaff = staffMembers.filter(staff => {
    const searchLower = search.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(searchLower) ||
      staff.staffIdNo?.toLowerCase().includes(searchLower) ||
      staff.department?.toLowerCase().includes(searchLower)
    );
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] p-4 sm:p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] p-4 sm:p-6 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Staff Reports</h1>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-2">
            {/* Return to HR Menu Button - Show only when coming from HR menu */}
            {!fromSupervisorMenu && (
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

            {/* Main Menu Button - Show only when coming from supervisor menu */}
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
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-md mx-auto sm:mx-0">
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#1B263B] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
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
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-[#1B263B] rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-[#22304a] transition-colors"
              onClick={() => navigate(`/view-staff-report/${staff.id}`)}
            >
              <div className="flex flex-col items-center w-full">
                <img
                  src={staff.photo || 'https://via.placeholder.com/50'}
                  alt={staff.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/50';
                  }}
                />
                <div className="text-center w-full">
                  <h3 className="text-white font-semibold text-xs sm:text-sm truncate">{staff.name}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs truncate">ID: {staff.staffIdNo}</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs truncate">{staff.department}</p>
                  <div className="flex items-center justify-center mt-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getScoreColor(staff.averageScore)} flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold text-[10px] sm:text-xs">{staff.averageScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-8 sm:mt-10">
            No staff members found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
