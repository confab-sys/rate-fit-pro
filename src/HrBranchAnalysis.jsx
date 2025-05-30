import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const HrBranchAnalysis = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all managers and their branches
        const managersSnapshot = await getDocs(collection(db, 'managers'));
        const managersList = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

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
            const ratings = ratingsSnapshot.docs.map(doc => doc.data());
            const totalPercentage = ratings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0);
            totalAverage = Math.round(totalPercentage / ratings.length);
          }

          staffList.push({
            id: staffDoc.id,
            name: staffInfo.name,
            department: staffInfo.department,
            totalAverage,
            branch: staffInfo.branchName || 'Not Assigned'
          });
        }

        // Create branches list with performance data
        const branchesList = managersList.map(manager => {
          const branchStaff = staffList.filter(staff => staff.branch === manager.branch);
          const staffCount = branchStaff.length;
          
          // Calculate branch performance
          let branchPerformance = 0;
          if (staffCount > 0) {
            const totalPerformance = branchStaff.reduce((sum, staff) => sum + staff.totalAverage, 0);
            branchPerformance = Math.round(totalPerformance / staffCount);
          }

          // Calculate department distribution
          const departments = branchStaff.reduce((acc, staff) => {
            acc[staff.department] = (acc[staff.department] || 0) + 1;
            return acc;
          }, {});

          // Calculate performance distribution
          const highPerformers = branchStaff.filter(staff => staff.totalAverage >= 80).length;
          const averagePerformers = branchStaff.filter(staff => staff.totalAverage >= 50 && staff.totalAverage < 80).length;
          const lowPerformers = branchStaff.filter(staff => staff.totalAverage < 50).length;

          return {
            id: manager.id,
            name: manager.branch,
            manager: manager.name,
            staffCount,
            performance: branchPerformance,
            departments,
            performanceDistribution: [
              { name: 'High Performers', value: highPerformers },
              { name: 'Average Performers', value: averagePerformers },
              { name: 'Low Performers', value: lowPerformers }
            ]
          };
        });

        setBranches(branchesList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch branch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A]">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center">HR Branch Analysis</h1>
        </div>

        {/* Navigation Button */}
        <div className="max-w-2xl mx-auto mb-8 space-y-2">
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

        {/* Branch Performance Comparison Chart */}
        <div className="bg-[#1B263B] rounded-lg p-6 mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">Branch Performance Comparison</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branches}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B263B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="performance" name="Performance %" fill="#8884d8" />
                <Bar dataKey="staffCount" name="Staff Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Chart */}
        <div className="bg-[#1B263B] rounded-lg p-6 mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">Department Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div key={branch.id} className="bg-[#2C3E50] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-md font-medium">{branch.name}</h3>
                  <div className="flex items-center space-x-2">
                    {Object.entries(branch.departments).map(([dept, count], index) => (
                      <div key={dept} className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-white text-xs">{dept}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(branch.departments).map(([name, value]) => ({
                          name,
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(branch.departments).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1B263B',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [`${value} staff`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {Object.entries(branch.departments).map(([dept, count], index) => (
                    <div key={dept} className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{dept}</span>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: COLORS[index % COLORS.length] }}
                      >
                        {count} staff
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-[#1B263B] rounded-lg p-6">
          <h2 className="text-white text-lg font-semibold mb-4">Performance Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div key={branch.id} className="bg-[#2C3E50] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-md font-medium">{branch.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#00C49F]"></div>
                    <span className="text-white text-sm">High</span>
                    <div className="w-2 h-2 rounded-full bg-[#FFBB28]"></div>
                    <span className="text-white text-sm">Average</span>
                    <div className="w-2 h-2 rounded-full bg-[#FF8042]"></div>
                    <span className="text-white text-sm">Low</span>
                  </div>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={branch.performanceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {branch.performanceDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'High Performers' ? '#00C49F' :
                              entry.name === 'Average Performers' ? '#FFBB28' :
                              '#FF8042'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1B263B',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [`${value} staff`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {branch.performanceDistribution.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{item.name}</span>
                      <span className={`text-sm font-medium ${
                        item.name === 'High Performers' ? 'text-[#00C49F]' :
                        item.name === 'Average Performers' ? 'text-[#FFBB28]' :
                        'text-[#FF8042]'
                      }`}>
                        {item.value} staff
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrBranchAnalysis; 