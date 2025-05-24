import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getWeeklyAnalysis, getMonthlyAnalysis, getAllMonthlyAnalyses } from '../services/analysisService';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StaffAnalysisDashboard = () => {
  const { staffId } = useParams();
  const [staff, setStaff] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [allMonthlyData, setAllMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('weekly'); // 'weekly' or 'monthly'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get staff details
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (!staffDoc.exists()) {
          throw new Error('Staff not found');
        }
        setStaff(staffDoc.data());

        // Get weekly analysis
        const weekly = await getWeeklyAnalysis(staffId);
        setWeeklyData(weekly);

        // Get current month's analysis
        const monthly = await getMonthlyAnalysis(staffId);
        setMonthlyData(monthly);

        // Get all monthly analyses
        const allMonthly = await getAllMonthlyAnalyses(staffId);
        setAllMonthlyData(allMonthly);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchData();
    }
  }, [staffId]);

  const prepareWeeklyChartData = () => {
    if (!weeklyData) return null;

    const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 
                       'customer_service', 'discipline_cases', 'personal_grooming'];
    
    const datasets = categories.map(category => {
      const data = [];
      for (let week = 1; week <= 4; week++) {
        const weekRatings = weeklyData[`week_${week}`] || [];
        const avg = weekRatings.reduce((sum, r) => sum + (r[category] || 0), 0) / 
                   (weekRatings.length || 1);
        data.push(avg);
      }
      return {
        label: category.replace(/_/g, ' ').toUpperCase(),
        data,
        borderColor: getCategoryColor(category),
        backgroundColor: getCategoryColor(category, 0.2),
        fill: false
      };
    });

    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets
    };
  };

  const prepareMonthlyChartData = () => {
    if (!monthlyData) return null;

    const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 
                       'customer_service', 'discipline_cases', 'personal_grooming'];
    
    return {
      labels: categories.map(cat => cat.replace(/_/g, ' ').toUpperCase()),
      datasets: [{
        label: 'Monthly Average',
        data: categories.map(cat => monthlyData.averages[cat] || 0),
        backgroundColor: categories.map(cat => getCategoryColor(cat, 0.6)),
        borderColor: categories.map(cat => getCategoryColor(cat)),
        borderWidth: 1
      }]
    };
  };

  const getCategoryColor = (category, alpha = 1) => {
    const colors = {
      time: `rgba(255, 99, 132, ${alpha})`,
      creativity: `rgba(54, 162, 235, ${alpha})`,
      shelf_cleanliness: `rgba(255, 206, 86, ${alpha})`,
      stock_management: `rgba(75, 192, 192, ${alpha})`,
      customer_service: `rgba(153, 102, 255, ${alpha})`,
      discipline_cases: `rgba(255, 159, 64, ${alpha})`,
      personal_grooming: `rgba(199, 199, 199, ${alpha})`
    };
    return colors[category] || `rgba(128, 128, 128, ${alpha})`;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: view === 'weekly' ? 'Weekly Performance Trends' : 'Monthly Performance Overview',
        color: 'white'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading analysis data...</div>
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
    <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Staff Information Header */}
        <div className="bg-[#1B263B] rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={staff.photo || ''}
              alt={staff.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{staff.name}</h1>
              <p className="text-gray-300">Staff ID: {staff.staffIdNo}</p>
              <p className="text-gray-300">Department: {staff.department}</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#1B263B] rounded-lg p-1">
            <button
              onClick={() => setView('weekly')}
              className={`px-4 py-2 rounded-lg ${
                view === 'weekly' ? 'bg-blue-600' : 'bg-transparent'
              } text-white`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-4 py-2 rounded-lg ${
                view === 'monthly' ? 'bg-blue-600' : 'bg-transparent'
              } text-white`}
            >
              Monthly View
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-[#1B263B] rounded-lg p-6">
          {view === 'weekly' ? (
            weeklyData ? (
              <Line data={prepareWeeklyChartData()} options={chartOptions} />
            ) : (
              <p className="text-gray-300 text-center">No weekly data available</p>
            )
          ) : (
            monthlyData ? (
              <Bar data={prepareMonthlyChartData()} options={chartOptions} />
            ) : (
              <p className="text-gray-300 text-center">No monthly data available</p>
            )
          )}
        </div>

        {/* Monthly History */}
        {view === 'monthly' && allMonthlyData.length > 0 && (
          <div className="mt-6 bg-[#1B263B] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Monthly History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMonthlyData.map(month => (
                <div key={month.id} className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">{month.month}</h3>
                  <div className="space-y-2">
                    {Object.entries(month.averages).map(([category, average]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm text-gray-300">
                          <span>{category.replace(/_/g, ' ').toUpperCase()}</span>
                          <span>{average.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${average}%`,
                              backgroundColor: getCategoryColor(category)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAnalysisDashboard; 