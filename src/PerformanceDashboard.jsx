import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const PerformanceDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Check if user came from supervisor menu
  const fromSupervisorMenu = location.state?.fromSupervisorMenu;

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        // Get all staff members
        const staffSnapshot = await getDocs(collection(db, 'staff'));
        const staffList = [];

        for (const staffDoc of staffSnapshot.docs) {
          const staffInfo = staffDoc.data();
          
          // Get all weekly ratings for this staff member
          const ratingsQuery = query(
            collection(db, 'staff', staffDoc.id, 'monthlyRatings'),
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

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            staffIdNo: staffInfo.staffIdNo,
            department: staffInfo.department,
            photo: staffInfo.photo,
            totalAverage
          });
        }

        setStaffMembers(staffList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredStaff = staffMembers.filter(staff => {
    const searchTerm = search.toLowerCase().trim();
    const matchesSearch = 
      staff.name?.toLowerCase().includes(searchTerm) ||
      staff.staffIdNo?.toLowerCase().includes(searchTerm) ||
      staff.department?.toLowerCase().includes(searchTerm);

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'priority':
        return staff.totalAverage < 50;
      case 'average':
        return staff.totalAverage >= 50 && staff.totalAverage < 80;
      case 'top':
        return staff.totalAverage >= 80;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A]">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">Performance Dashboard</h1>
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-2xl mx-auto mb-4 space-y-2">
          {/* Return to HR Menu Button - Hide if coming from supervisor menu */}
          {!fromSupervisorMenu && (
            <button
              onClick={() => navigate('/human-resource-menu')}
              className="w-full px-4 py-3 rounded-lg bg-[#1B263B] text-white hover:bg-[#22304a] transition-colors flex items-center justify-center space-x-2"
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
              className="w-full px-4 py-3 rounded-lg bg-[#1B263B] text-white hover:bg-[#22304a] transition-colors flex items-center justify-center space-x-2"
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

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
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

        {/* Filter Buttons */}
        <div className="max-w-2xl mx-auto mb-8 flex justify-center space-x-4">
          <button
            onClick={() => setActiveFilter(activeFilter === 'priority' ? 'all' : 'priority')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'priority'
                ? 'bg-red-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-red-500/20'
            }`}
          >
            Priority
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'average' ? 'all' : 'average')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'average'
                ? 'bg-yellow-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-yellow-500/20'
            }`}
          >
            Average
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'top' ? 'all' : 'top')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'top'
                ? 'bg-green-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-green-500/20'
            }`}
          >
            Top Performance
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-7xl mx-auto px-2 sm:px-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-[#1B263B] rounded-lg p-2 sm:p-3 flex flex-col items-center cursor-pointer hover:bg-[#22304a] transition-colors"
              onClick={() => navigate(`/weekly-analysis/${staff.id}`, { state: { fromDashboard: true } })}
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
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getScoreColor(staff.totalAverage)}`}></div>
                    <span className="text-white font-semibold text-xs sm:text-sm">{staff.totalAverage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found matching your search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard; 