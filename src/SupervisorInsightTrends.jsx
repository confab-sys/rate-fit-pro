import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const SupervisorInsightTrends = () => {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [supervisorBranch, setSupervisorBranch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffRatings, setStaffRatings] = useState({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);

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
        // Get supervisor's branch from session storage
        const supervisorName = sessionStorage.getItem('supervisorName');
        if (!supervisorName) {
          throw new Error('Supervisor not logged in');
        }

        // Fetch supervisor's branch
        const supervisorsRef = collection(db, 'supervisors');
        const supervisorQuery = query(supervisorsRef, where('name', '==', supervisorName));
        const supervisorSnapshot = await getDocs(supervisorQuery);
        
        if (supervisorSnapshot.empty) {
          throw new Error('Supervisor not found');
        }

        const supervisorData = supervisorSnapshot.docs[0].data();
        setSupervisorBranch(supervisorData.branch);

        // Fetch staff members from supervisor's branch
        const staffRef = collection(db, 'staff');
        const staffQuery = query(staffRef, where('branchName', '==', supervisorData.branch));
        const staffSnapshot = await getDocs(staffQuery);
        const staffList = [];
        const ratingsData = {};

        for (const staffDoc of staffSnapshot.docs) {
          const staffInfo = staffDoc.data();
          
          // Get all weekly ratings for this staff member
          const ratingsQuery = query(
            collection(db, 'staff', staffDoc.id, 'monthlyRatings'),
            orderBy('timestamp', 'desc')
          );
          
          const ratingsSnapshot = await getDocs(ratingsQuery);
          const ratings = ratingsSnapshot.docs.map(doc => doc.data());
          
          // Calculate category averages
          const categoryAverages = {};
          Object.keys(categoryConfig).forEach(category => {
            const categoryRatings = ratings.map(rating => rating[category]?.percentage || 0);
            const average = categoryRatings.length > 0 
              ? Math.round(categoryRatings.reduce((sum, val) => sum + val, 0) / categoryRatings.length)
              : 0;
            categoryAverages[category] = average;
          });

          // Calculate total average
          const totalAverage = Object.values(categoryAverages).reduce((sum, val) => sum + val, 0) / 
            Object.keys(categoryAverages).length;

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            staffIdNo: staffInfo.staffIdNo,
            department: staffInfo.department,
            photo: staffInfo.photo,
            categoryAverages,
            totalAverage: Math.round(totalAverage)
          });

          ratingsData[staffDoc.id] = ratings;
        }

        setStaffMembers(staffList);
        setStaffRatings(ratingsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredStaff = staffMembers
    .filter(staff => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = 
        staff.name?.toLowerCase().includes(searchTerm) ||
        staff.staffIdNo?.toLowerCase().includes(searchTerm) ||
        staff.department?.toLowerCase().includes(searchTerm);

      if (!matchesSearch) return false;

      // If a category filter is active, only show staff with score above 80%
      if (activeCategoryFilter) {
        return staff.categoryAverages[activeCategoryFilter] >= 80;
      }

      return true;
    })
    .sort((a, b) => {
      if (activeCategoryFilter) {
        // Sort by the selected category's score in descending order
        return b.categoryAverages[activeCategoryFilter] - a.categoryAverages[activeCategoryFilter];
      }
      // Default sort by total average
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
            onClick={() => navigate('/supervisor-menu')}
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
            Back to Menu
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">Insight Trends</h1>
        </div>

        {/* Branch Info */}
        <div className="w-full max-w-4xl mx-auto bg-[#1B263B] rounded-lg p-4 mb-8">
          <h2 className="text-white text-xl font-semibold mb-2">Branch Information</h2>
          <p className="text-gray-300">Branch: {supervisorBranch}</p>
          <p className="text-gray-300">Total Staff: {staffMembers.length}</p>
        </div>

        {/* Category Filter Buttons */}
        <div className="max-w-4xl mx-auto mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoryFilter(null)}
            className={`px-4 py-2 rounded-lg ${
              !activeCategoryFilter 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#1B263B] text-gray-300 hover:bg-[#2C3E50]'
            }`}
          >
            All Categories
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(key)}
              className={`px-4 py-2 rounded-lg ${
                activeCategoryFilter === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#1B263B] text-gray-300 hover:bg-[#2C3E50]'
              }`}
            >
              {config.label} (≥80%)
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search staff by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-[#1B263B] rounded-lg p-6 hover:bg-[#2C3E50] transition-colors cursor-pointer"
              onClick={() => setSelectedStaff(staff)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={staff.photo || 'https://via.placeholder.com/50'}
                  alt={staff.name}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/50';
                  }}
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">{staff.name}</h3>
                  <p className="text-gray-400">ID: {staff.staffIdNo}</p>
                  <p className="text-gray-400">{staff.department}</p>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-400">{config.label}</span>
                    <span className={getScoreColor(staff.categoryAverages[key])}>
                      {staff.categoryAverages[key]}%
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-white font-semibold">Total Average</span>
                  <span className={getScoreColor(staff.totalAverage)}>
                    {staff.totalAverage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found matching your search criteria.
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">Staff ID</p>
                    <p className="text-white">{selectedStaff.staffIdNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Department</p>
                    <p className="text-white">{selectedStaff.department}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-semibold">Category Performance</h3>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-400">{config.label}</span>
                      <span className={getScoreColor(selectedStaff.categoryAverages[key])}>
                        {selectedStaff.categoryAverages[key]}%
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-white font-semibold">Total Average</span>
                    <span className={getScoreColor(selectedStaff.totalAverage)}>
                      {selectedStaff.totalAverage}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => navigate(`/weekly-analysis/${selectedStaff.id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Detailed Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorInsightTrends; 