import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const ManagerInsightTrends = () => {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [managerBranch, setManagerBranch] = useState('');

  // Define category colors and labels
  const categoryConfig = {
    time: {
      label: 'Time Management',
      color: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)'
    },
    creativity: {
      label: 'Creativity',
      color: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)'
    },
    shelf_cleanliness: {
      label: 'Shelf Cleanliness',
      color: 'rgba(250, 204, 21, 0.8)',
      borderColor: 'rgba(250, 204, 21, 1)'
    },
    stock_management: {
      label: 'Stock Management',
      color: 'rgba(45, 212, 191, 0.8)',
      borderColor: 'rgba(45, 212, 191, 1)'
    },
    customer_service: {
      label: 'Customer Service',
      color: 'rgba(249, 115, 22, 0.8)',
      borderColor: 'rgba(249, 115, 22, 1)'
    },
    discipline_cases: {
      label: 'Discipline Cases',
      color: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)'
    },
    personal_grooming: {
      label: 'Personal Grooming',
      color: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)'
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get manager's branch from session storage
        const managerName = sessionStorage.getItem('managerName');
        if (!managerName) {
          throw new Error('Manager not logged in');
        }

        // Fetch manager's branch
        const managersRef = collection(db, 'managers');
        const managerQuery = query(managersRef, where('name', '==', managerName));
        const managerSnapshot = await getDocs(managerQuery);
        
        if (managerSnapshot.empty) {
          throw new Error('Manager not found');
        }

        const managerData = managerSnapshot.docs[0].data();
        setManagerBranch(managerData.branch);

        // Fetch staff members from manager's branch
        const staffRef = collection(db, 'staff');
        const staffQuery = query(staffRef, where('branchName', '==', managerData.branch));
        const staffSnapshot = await getDocs(staffQuery);
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
          let categoryAverages = {};
          
          if (!ratingsSnapshot.empty) {
            // Calculate total average and category averages from all ratings
            const ratings = ratingsSnapshot.docs.map(doc => doc.data());
            
            // Initialize category totals
            Object.keys(categoryConfig).forEach(category => {
              categoryAverages[category] = {
                total: 0,
                count: 0
              };
            });

            // Calculate totals for each category
            ratings.forEach(rating => {
              Object.keys(categoryConfig).forEach(category => {
                if (rating[category]?.percentage) {
                  categoryAverages[category].total += rating[category].percentage;
                  categoryAverages[category].count += 1;
                }
              });
            });

            // Calculate final averages for each category
            Object.keys(categoryAverages).forEach(category => {
              if (categoryAverages[category].count > 0) {
                categoryAverages[category] = Math.round(
                  categoryAverages[category].total / categoryAverages[category].count
                );
              } else {
                categoryAverages[category] = 0;
              }
            });

            // Calculate total average
            const totalPercentage = ratings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0);
            totalAverage = Math.round(totalPercentage / ratings.length);
          }

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            staffIdNo: staffInfo.staffIdNo,
            department: staffInfo.department,
            photo: staffInfo.photo,
            totalAverage,
            categoryAverages
          });
        }

        setStaffMembers(staffList);
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

  const filteredStaff = staffMembers
    .filter(staff => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = 
        staff.name?.toLowerCase().includes(searchTerm) ||
        staff.staffIdNo?.toLowerCase().includes(searchTerm) ||
        staff.department?.toLowerCase().includes(searchTerm);

      if (!matchesSearch) return false;

      // Apply category filter if active
      if (activeCategoryFilter) {
        return staff.categoryAverages[activeCategoryFilter] >= 50;
      }

      // Apply performance filter if no category filter is active
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
    })
    .sort((a, b) => {
      // If a category filter is active, sort by that category's score
      if (activeCategoryFilter) {
        return b.categoryAverages[activeCategoryFilter] - a.categoryAverages[activeCategoryFilter];
      }
      // Otherwise, sort by total average
      return b.totalAverage - a.totalAverage;
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
        {/* Back Button */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => navigate('/manager-menu')}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Manager Menu
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">Insight Trends</h1>
        </div>

        {/* Branch Info */}
        <div className="w-full max-w-4xl mx-auto bg-[#1B263B] rounded-lg p-4 mb-8">
          <h2 className="text-white text-xl font-semibold mb-2">Branch Information</h2>
          <p className="text-gray-300">Branch: {managerBranch}</p>
          <p className="text-gray-300">Total Staff: {staffMembers.length}</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name, ID, or department..."
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

        {/* Category Filter Buttons */}
        <div className="max-w-2xl mx-auto mb-8 flex flex-wrap justify-center gap-2">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === key ? null : key)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeCategoryFilter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1B263B] text-white hover:bg-blue-500/20'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-[#1B263B] rounded-lg p-4 hover:bg-[#22304a] transition-colors cursor-pointer"
              onClick={() => navigate(`/weekly-analysis/${staff.id}`, { state: { fromManagerDashboard: true } })}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={staff.photo || 'https://via.placeholder.com/50'}
                  alt={staff.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/50';
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{staff.name}</h3>
                  <p className="text-gray-400 text-sm">ID: {staff.staffIdNo}</p>
                  <p className="text-gray-400 text-sm">{staff.department}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getScoreColor(staff.totalAverage)}`}></div>
                  <span className="text-white font-semibold">{staff.totalAverage}%</span>
                </div>
              </div>

              {/* Category Scores */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{config.label}</span>
                    <div className={`px-2 py-1 rounded-full ${getScoreColor(staff.categoryAverages[key])} text-white text-xs font-semibold`}>
                      {staff.categoryAverages[key]}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No staff members found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerInsightTrends; 