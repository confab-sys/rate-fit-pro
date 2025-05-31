import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const HrCategoryBranchReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSupervisorMenu = location.state?.fromSupervisorMenu || false;
  const [staffMembers, setStaffMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [expandedBranches, setExpandedBranches] = useState({});

  // Define category colors and labels
  const categoryConfig = {
    time: {
      label: 'Time',
      color: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)'
    },
    creativity: {
      label: 'Creativity',
      color: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)'
    },
    shelf_cleanliness: {
      label: 'S. clean',
      color: 'rgba(250, 204, 21, 0.8)',
      borderColor: 'rgba(250, 204, 21, 1)'
    },
    stock_management: {
      label: 'Stock. M',
      color: 'rgba(45, 212, 191, 0.8)',
      borderColor: 'rgba(45, 212, 191, 1)'
    },
    customer_service: {
      label: 'Customer',
      color: 'rgba(249, 115, 22, 0.8)',
      borderColor: 'rgba(249, 115, 22, 1)'
    },
    discipline_cases: {
      label: 'Discipline',
      color: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)'
    },
    personal_grooming: {
      label: 'P.grooming',
      color: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)'
    }
  };

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

          // Find the manager for this staff member's branch
          const manager = managersList.find(m => m.branch === staffInfo.branchName);

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            staffIdNo: staffInfo.staffIdNo,
            department: staffInfo.department,
            photo: staffInfo.photo,
            totalAverage,
            categoryAverages,
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

          // Calculate category averages for the branch
          const categoryAverages = {};
          Object.keys(categoryConfig).forEach(category => {
            if (staffCount > 0) {
              const totalCategoryScore = branchStaff.reduce((sum, staff) => sum + (staff.categoryAverages[category] || 0), 0);
              categoryAverages[category] = Math.round(totalCategoryScore / staffCount);
            } else {
              categoryAverages[category] = 0;
            }
          });

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
              departments,
              categoryAverages
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

  const handleBack = () => {
    navigate('/supervisor-menu');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredBranches = branches.filter(branch => {
    const searchTerm = search.toLowerCase().trim();
    const matchesSearch = 
      branch.name?.toLowerCase().includes(searchTerm) ||
      branch.manager?.toLowerCase().includes(searchTerm);

    if (!matchesSearch) return false;

    // If a category filter is active, filter branches based on that category's performance
    if (activeCategoryFilter) {
      return branch.metrics.categoryAverages[activeCategoryFilter] >= 50;
    }

    return true;
  }).sort((a, b) => {
    // If a category filter is active, sort by that category's performance
    if (activeCategoryFilter) {
      return b.metrics.categoryAverages[activeCategoryFilter] - a.metrics.categoryAverages[activeCategoryFilter];
    }
    // Otherwise, sort by overall performance
    return b.performance - a.performance;
  });

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

      return true;
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
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center flex-1">HR Category Branch Reports</h1>
          
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              <span>Return to HR Menu</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mx-auto mb-3 sm:mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === key ? null : key)}
              className={`px-4 py-2 rounded-lg ${
                activeCategoryFilter === key ? config.color : 'bg-[#1B263B]'
              } text-white hover:opacity-90 transition-colors`}
              style={{
                border: activeCategoryFilter === key ? `2px solid ${config.borderColor}` : 'none'
              }}
            >
              {config.label} {activeCategoryFilter === key && '↓'}
            </button>
          ))}
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

                    {/* Category Averages */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-white font-semibold text-sm mb-2">Category Averages</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(categoryConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">{config.label}</span>
                            <div className={`px-2 py-1 rounded-full ${getScoreColor(branch.metrics.categoryAverages[key])} text-white text-xs font-semibold`}>
                              {branch.metrics.categoryAverages[key]}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Performance Reports */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-white font-semibold text-sm mb-2">Performance Reports</h4>
                      
                      {/* Staff Performance Distribution */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400 text-xs">Staff Performance Distribution</span>
                        </div>
                        <div className="flex h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(branch.metrics.highPerformers / branch.staffCount) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-yellow-500 h-full" 
                            style={{ width: `${(branch.metrics.averagePerformers / branch.staffCount) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(branch.metrics.lowPerformers / branch.staffCount) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-green-400">High: {branch.metrics.highPerformers}</span>
                          <span className="text-yellow-400">Avg: {branch.metrics.averagePerformers}</span>
                          <span className="text-red-400">Low: {branch.metrics.lowPerformers}</span>
                        </div>
                      </div>

                      {/* Department Distribution */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400 text-xs">Department Distribution</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(branch.metrics.departments).map(([dept, count]) => (
                            <div key={dept} className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">{dept}</span>
                              <div className="flex items-center">
                                <div className="w-16 h-1.5 bg-gray-700 rounded-full mr-2">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${(count / branch.staffCount) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-white text-xs">{count}</span>
                              </div>
                            </div>
                          ))}
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

        {/* Staff List - Hidden */}
        <div className="hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-[#1B263B] rounded-lg p-4 hover:bg-[#22304a] transition-colors cursor-pointer"
                onClick={() => navigate(`/staff-analysis/${staff.id}`)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img
                      src={staff.photo || 'https://via.placeholder.com/150'}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{staff.name}</h3>
                    <p className="text-gray-400 text-sm">ID: {staff.staffIdNo}</p>
                    <p className="text-gray-400 text-sm">{staff.department}</p>
                    <p className="text-gray-400 text-sm">Branch: {staff.branch}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full ${getScoreColor(staff.totalAverage)} text-white text-sm font-semibold`}>
                      {staff.totalAverage}%
                    </div>
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

export default HrCategoryBranchReports; 