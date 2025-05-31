import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const InsightTrends = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSupervisorMenu = location.state?.fromSupervisorMenu || false;
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);

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
        console.error('Error fetching staff data:', err);
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const handleBack = () => {
    navigate('/supervisor-menu');
  };

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
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center flex-1">Insight Trends</h1>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-2">
            {/* Return to HR Menu Button - Show when not coming from supervisor menu */}
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
        <div className="w-full max-w-2xl mx-auto mb-3 sm:mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <svg
              className="absolute right-3 top-2.5 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

        {/* Performance Filter Buttons */}
        <div className="w-full max-w-2xl mx-auto mb-3 sm:mb-4 flex flex-wrap justify-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'priority' ? 'all' : 'priority');
              setActiveCategoryFilter(null);
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeFilter === 'priority' && !activeCategoryFilter
                ? 'bg-red-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-red-500/20'
            }`}
          >
            Priority
          </button>
          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'average' ? 'all' : 'average');
              setActiveCategoryFilter(null);
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeFilter === 'average' && !activeCategoryFilter
                ? 'bg-yellow-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-yellow-500/20'
            }`}
          >
            Average
          </button>
          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'top' ? 'all' : 'top');
              setActiveCategoryFilter(null);
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeFilter === 'top' && !activeCategoryFilter
                ? 'bg-green-500 text-white'
                : 'bg-[#1B263B] text-white hover:bg-green-500/20'
            }`}
          >
            Top Performance
          </button>
        </div>

        {/* Category Filter Buttons */}
        <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveCategoryFilter(activeCategoryFilter === key ? null : key);
                  setActiveFilter('all');
                }}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                  activeCategoryFilter === key
                    ? `${config.color} text-white`
                    : 'bg-[#1B263B] text-white hover:bg-opacity-80'
                }`}
                style={{
                  backgroundColor: activeCategoryFilter === key ? config.color : '',
                  borderColor: config.borderColor,
                  borderWidth: '1px'
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Display */}
        {activeCategoryFilter ? (
          // List View for Category Filters
          <div className="w-full max-w-6xl mx-auto overflow-x-auto">
            <div className="rounded-lg overflow-hidden min-w-[800px]">
              {/* List Header */}
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 bg-[#0D1B2A] text-white font-semibold text-xs sm:text-sm">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">Staff Member</div>
                <div className="col-span-2">Department</div>
                {activeCategoryFilter && (
                  <div className="col-span-1 text-center">{categoryConfig[activeCategoryFilter].label}</div>
                )}
                {Object.entries(categoryConfig).map(([key, config]) => (
                  key !== activeCategoryFilter && key !== 'personal_grooming' && (
                    <div key={key} className="col-span-1 text-center">{config.label}</div>
                  )
                ))}
              </div>

              {/* Staff List Items */}
              {filteredStaff.map((staff, index) => (
                <div
                  key={staff.id}
                  className="grid grid-cols-12 gap-2 sm:gap-4 p-4 sm:p-6 text-white border border-white/20 hover:bg-[#22304a] transition-colors text-xs sm:text-sm my-4 rounded-lg"
                >
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="font-semibold">{index + 1}</span>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2 sm:space-x-3">
                    <img 
                      src={staff.photo || 'https://via.placeholder.com/50'} 
                      alt={staff.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/50';
                      }}
                    />
                    <div>
                      <div className="font-semibold truncate">{staff.name}</div>
                      <div className="text-gray-400 truncate">ID: {staff.staffIdNo}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center truncate">
                    {staff.department}
                  </div>
                  {activeCategoryFilter && (
                    <div className="col-span-1 flex items-center justify-center">
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded ${getScoreColor(staff.categoryAverages[activeCategoryFilter])}`}>
                        {staff.categoryAverages[activeCategoryFilter]}%
                      </span>
                    </div>
                  )}
                  {Object.entries(staff.categoryAverages).map(([category, percentage]) => (
                    category !== activeCategoryFilter && (
                      <div key={category} className="col-span-1 flex items-center justify-center">
                        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </div>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Card Grid View for other filters
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

                  {/* Category Averages */}
                  <div className="w-full grid grid-cols-2 gap-1 sm:gap-1.5 mt-2">
                    {Object.entries(staff.categoryAverages).map(([category, percentage]) => (
                      <div key={category} className="flex items-center justify-between bg-[#0D1B2A] rounded-lg p-1">
                        <span className="text-gray-400 text-[8px] sm:text-xs truncate">{categoryConfig[category].label}</span>
                        <span className={`text-[8px] sm:text-xs font-semibold ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-6 sm:mt-10 text-sm sm:text-base">
            No staff members found matching your search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightTrends;
 