import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const OperationsPerformanceDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffMembers, setStaffMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [groupedStaff, setGroupedStaff] = useState({});

  // Check if user came from operations menu
  const fromOperationsMenu = location.state?.fromOperationsMenu;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all staff members
        const staffSnapshot = await getDocs(collection(db, 'staff'));
        const staffList = [];

        // Get all managers
        const managersSnapshot = await getDocs(collection(db, 'managers'));
        const managersList = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManagers(managersList);

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

          // Find the manager for this staff member's branch
          const manager = managersList.find(m => m.branch === staffInfo.branchName);

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            staffIdNo: staffInfo.staffIdNo,
            department: staffInfo.department,
            photo: staffInfo.photo,
            totalAverage,
            branch: staffInfo.branchName || 'Not Assigned',
            managerName: manager ? manager.name : 'No Manager Assigned'
          });
        }

        setStaffMembers(staffList);

        // Group staff by branch
        const grouped = staffList.reduce((acc, staff) => {
          if (!acc[staff.branch]) {
            acc[staff.branch] = [];
          }
          acc[staff.branch].push(staff);
          return acc;
        }, {});
        setGroupedStaff(grouped);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
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
      staff.department?.toLowerCase().includes(searchTerm) ||
      staff.branch?.toLowerCase().includes(searchTerm);

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

  // Get branches with low performing staff when priority filter is active
  const getPriorityBranches = () => {
    const priorityBranches = {};
    Object.entries(groupedStaff).forEach(([branch, staff]) => {
      const lowPerformers = staff.filter(s => s.totalAverage < 50);
      if (lowPerformers.length > 0) {
        priorityBranches[branch] = lowPerformers;
      }
    });
    return priorityBranches;
  };

  // Get branches with average performing staff when average filter is active
  const getAverageBranches = () => {
    const averageBranches = {};
    Object.entries(groupedStaff).forEach(([branch, staff]) => {
      const averagePerformers = staff.filter(s => s.totalAverage >= 50 && s.totalAverage < 80);
      if (averagePerformers.length > 0) {
        averageBranches[branch] = averagePerformers;
      }
    });
    return averageBranches;
  };

  // Get branches with top performing staff when top filter is active
  const getTopBranches = () => {
    const topBranches = {};
    Object.entries(groupedStaff).forEach(([branch, staff]) => {
      const topPerformers = staff.filter(s => s.totalAverage >= 80);
      if (topPerformers.length > 0) {
        topBranches[branch] = topPerformers;
      }
    });
    return topBranches;
  };

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
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">Operations Performance Dashboard</h1>
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-2xl mx-auto mb-4 space-y-2">
          {/* Return to Operations Menu Button */}
          <button
            onClick={() => navigate('/operations-main-menu')}
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
            <span>Return to Operations Menu</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, department, or branch..."
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

        {activeFilter === 'priority' ? (
          // Display branches with low performing staff
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            {Object.entries(getPriorityBranches()).map(([branch, staff]) => (
              <div key={branch} className="mb-8">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Branch: {branch} <span className="text-gray-400 text-lg">({staff.length} staff members)</span>
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="bg-[#1B263B] rounded-lg p-2 sm:p-3 flex flex-col items-center"
                    >
                      <div className="flex flex-col items-center w-full">
                        <img 
                          src={staffMember.photo || 'https://via.placeholder.com/50'} 
                          alt={staffMember.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                        <div className="text-center w-full">
                          <h3 className="text-white font-semibold text-xs sm:text-sm truncate">{staffMember.name}</h3>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">ID: {staffMember.staffIdNo}</p>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">{staffMember.department}</p>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getScoreColor(staffMember.totalAverage)}`}></div>
                            <span className="text-white font-semibold text-xs sm:text-sm">{staffMember.totalAverage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeFilter === 'average' ? (
          // Display branches with average performing staff
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            {Object.entries(getAverageBranches()).map(([branch, staff]) => (
              <div key={branch} className="mb-8">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Branch: {branch} <span className="text-gray-400 text-lg">({staff.length} staff members)</span>
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="bg-[#1B263B] rounded-lg p-2 sm:p-3 flex flex-col items-center"
                    >
                      <div className="flex flex-col items-center w-full">
                        <img 
                          src={staffMember.photo || 'https://via.placeholder.com/50'} 
                          alt={staffMember.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                        <div className="text-center w-full">
                          <h3 className="text-white font-semibold text-xs sm:text-sm truncate">{staffMember.name}</h3>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">ID: {staffMember.staffIdNo}</p>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">{staffMember.department}</p>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getScoreColor(staffMember.totalAverage)}`}></div>
                            <span className="text-white font-semibold text-xs sm:text-sm">{staffMember.totalAverage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeFilter === 'top' ? (
          // Display branches with top performing staff
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            {Object.entries(getTopBranches()).map(([branch, staff]) => (
              <div key={branch} className="mb-8">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Branch: {branch} <span className="text-gray-400 text-lg">({staff.length} staff members)</span>
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="bg-[#1B263B] rounded-lg p-2 sm:p-3 flex flex-col items-center"
                    >
                      <div className="flex flex-col items-center w-full">
                        <img 
                          src={staffMember.photo || 'https://via.placeholder.com/50'} 
                          alt={staffMember.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                        <div className="text-center w-full">
                          <h3 className="text-white font-semibold text-xs sm:text-sm truncate">{staffMember.name}</h3>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">ID: {staffMember.staffIdNo}</p>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate">{staffMember.department}</p>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getScoreColor(staffMember.totalAverage)}`}></div>
                            <span className="text-white font-semibold text-xs sm:text-sm">{staffMember.totalAverage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular staff grid view for no filter
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-7xl mx-auto px-2 sm:px-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-[#1B263B] rounded-lg p-2 sm:p-3 flex flex-col items-center"
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
                    <p className="text-gray-400 text-[10px] sm:text-xs truncate">Staff from Branch {staff.branch}</p>
                    <p className="text-green-400 text-[10px] sm:text-xs truncate">Managed by: {staff.managerName}</p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getScoreColor(staff.totalAverage)}`}></div>
                      <span className="text-white font-semibold text-xs sm:text-sm">{staff.totalAverage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsPerformanceDashboard; 