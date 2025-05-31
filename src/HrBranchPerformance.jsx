import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const HrBranchPerformance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffMembers, setStaffMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedBranches, setExpandedBranches] = useState({});

  // Check if user came from hr menu
  const fromHrMenu = location.state?.fromNewHrMenu;

  const toggleBranch = (branchId) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all managers first
        const managersSnapshot = await getDocs(collection(db, 'managers'));
        const managersList = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManagers(managersList);

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

        // Create branches list from managers data with staff count and performance
        const branchesList = managersList.map(manager => {
          const branchStaff = staffList.filter(staff => staff.branch === manager.branch);
          const staffCount = branchStaff.length;
          
          // Calculate branch performance
          let branchPerformance = 0;
          if (staffCount > 0) {
            const totalPerformance = branchStaff.reduce((sum, staff) => sum + staff.totalAverage, 0);
            branchPerformance = Math.round(totalPerformance / staffCount);
          }

          // Calculate additional metrics
          const highPerformers = branchStaff.filter(staff => staff.totalAverage >= 80).length;
          const averagePerformers = branchStaff.filter(staff => staff.totalAverage >= 50 && staff.totalAverage < 80).length;
          const lowPerformers = branchStaff.filter(staff => staff.totalAverage < 50).length;

          // Calculate department distribution
          const departments = branchStaff.reduce((acc, staff) => {
            acc[staff.department] = (acc[staff.department] || 0) + 1;
            return acc;
          }, {});

          return {
            id: manager.id,
            name: manager.branch,
            manager: manager.name,
            staffCount,
            performance: branchPerformance,
            metrics: {
              highPerformers,
              averagePerformers,
              lowPerformers,
              departments
            }
          };
        });
        setBranches(branchesList);

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

    // Get the branch performance for this staff's branch
    const staffBranch = branches.find(b => b.name === staff.branch);
    if (!staffBranch) return true;

    switch (activeFilter) {
      case 'priority':
        return staffBranch.performance < 50;
      case 'average':
        return staffBranch.performance >= 50 && staffBranch.performance < 80;
      case 'top':
        return staffBranch.performance >= 80;
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort staff by performance when a filter is active
    if (activeFilter !== 'all') {
      return a.totalAverage - b.totalAverage; // Ascending order (least to top performing)
    }
    return 0; // No sorting when no filter is active
  });

  const filteredBranches = branches.filter(branch => {
    const searchTerm = search.toLowerCase().trim();
    const matchesSearch = 
      branch.name?.toLowerCase().includes(searchTerm) ||
      branch.manager?.toLowerCase().includes(searchTerm);

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'priority':
        return branch.performance < 50;
      case 'average':
        return branch.performance >= 50 && branch.performance < 80;
      case 'top':
        return branch.performance >= 80;
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
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">HR Branch Performance</h1>
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-2xl mx-auto mb-4 space-y-2">
          {/* Return to HR Menu Button */}
          <button
            onClick={() => navigate('/new-hr-menu')}
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
            Least Performing Branch
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'average' ? 'all' : 'average')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'average'
                ? 'bg-yellow-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-yellow-500/20'
            }`}
          >
            Average Performing Branch
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'top' ? 'all' : 'top')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'top'
                ? 'bg-green-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-green-500/20'
            }`}
          >
            Top Performing Branch
          </button>
        </div>

        {/* Branch Cards */}
        <div className="mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">Branches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-[#1B263B] rounded-lg p-4 hover:bg-[#22304a] transition-colors"
                >
                  <div className="flex flex-col">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{branch.name}</h3>
                      <p className="text-gray-400 text-sm">Managed by: {branch.manager}</p>
                      <p className="text-gray-400 text-sm mt-1">Total Staff: {branch.staffCount}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${getScoreColor(branch.performance)}`}></div>
                        <p className="text-white text-sm">Performance: {branch.performance}%</p>
                      </div>
                    </div>
                    
                    {/* Performance Analysis - Always visible */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-white font-semibold text-sm mb-2">Performance Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">High Performers</span>
                          <span className="text-green-400 text-xs">{branch.metrics.highPerformers} staff</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Average Performers</span>
                          <span className="text-yellow-400 text-xs">{branch.metrics.averagePerformers} staff</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Low Performers</span>
                          <span className="text-red-400 text-xs">{branch.metrics.lowPerformers} staff</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-white text-center">
                No branches found
              </div>
            )}
          </div>
        </div>

        {filteredBranches.length === 0 && (
          <div className="text-white text-center mt-10">
            No results found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default HrBranchPerformance; 