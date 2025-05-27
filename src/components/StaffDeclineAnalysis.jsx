import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const StaffDeclineAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      console.log('Fetching staff data from Firestore...');
      
      const staffRef = collection(db, 'staff');
      const staffSnapshot = await getDocs(staffRef);
      
      if (staffSnapshot.empty) {
        console.log('No staff documents found in Firestore');
        setError('No staff data found in the database');
        return;
      }

      console.log(`Found ${staffSnapshot.docs.length} staff documents`);
      const staffList = [];

      for (const staffDoc of staffSnapshot.docs) {
        try {
          const staffId = staffDoc.id;
          const staffInfo = staffDoc.data();
          console.log(`Processing staff member:`, {
            id: staffId,
            name: staffInfo.name,
            department: staffInfo.department,
            dateJoined: staffInfo.dateJoined
          });

          const weeklyRatingsRef = collection(db, 'staff', staffId, 'weeklyRatings');
          const weeklyQuery = query(
            weeklyRatingsRef,
            orderBy('date', 'desc'),
            limit(12)
          );
          
          const weeklySnapshot = await getDocs(weeklyQuery);
          
          if (weeklySnapshot.empty) {
            console.log(`No weekly ratings found for staff member: ${staffInfo.name || staffId}`);
            continue;
          }

          const weeklyData = weeklySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log(`Found ${weeklyData.length} weekly ratings for ${staffInfo.name || staffId}`);

          const performanceMetrics = calculatePerformanceMetrics(weeklyData);
          console.log('Calculated performance metrics:', performanceMetrics);

          staffList.push({
            id: staffId,
            name: staffInfo.name,
            department: staffInfo.department,
            dateJoined: staffInfo.dateJoined,
            weeklyRatings: weeklyData,
            performanceMetrics
          });
        } catch (error) {
          console.error(`Error processing staff member ${staffDoc.id}:`, error);
        }
      }

      if (staffList.length === 0) {
        console.log('No valid staff data found after processing');
        setError('No valid staff data found to analyze');
        return;
      }

      console.log('Successfully processed staff data:', {
        totalStaff: staffList.length,
        staffWithRatings: staffList.filter(staff => staff.weeklyRatings.length > 0).length,
        sampleStaffData: staffList[0]
      });

      setStaffData(staffList);
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError(`Failed to fetch staff data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (weeklyData) => {
    if (!weeklyData.length) return {};

    const metrics = {
      averageScore: 0,
      trend: 'stable',
      declineRate: 0,
      categories: {}
    };

    const totalScore = weeklyData.reduce((sum, week) => sum + (week.score || 0), 0);
    metrics.averageScore = totalScore / weeklyData.length;

    if (weeklyData.length >= 2) {
      const recentScores = weeklyData.slice(0, 4).map(week => week.score || 0);
      const olderScores = weeklyData.slice(4, 8).map(week => week.score || 0);
      
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      
      metrics.declineRate = ((olderAvg - recentAvg) / olderAvg) * 100;
      metrics.trend = recentAvg < olderAvg ? 'declining' : recentAvg > olderAvg ? 'improving' : 'stable';
    }

    const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 'customer_service', 'discipline_cases', 'personal_grooming'];
    categories.forEach(category => {
      const categoryScores = weeklyData.map(week => week[category] || 0);
      metrics.categories[category] = {
        average: categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length,
        trend: calculateTrend(categoryScores)
      };
    });

    return metrics;
  };

  const calculateTrend = (scores) => {
    if (scores.length < 2) return 'stable';
    const recent = scores.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
    const older = scores.slice(4, 8).reduce((a, b) => a + b, 0) / 4;
    return recent < older ? 'declining' : recent > older ? 'improving' : 'stable';
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/analyze-staff-decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'same-origin',
        body: JSON.stringify({ 
          staffData: staffData,
          question: userMessage 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.analysis }]);
    } catch (err) {
      console.error('Error in chat:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your question. Please try again.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Loading staff data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-3xl font-bold">Staff Analysis Chat</h1>
          <button 
            onClick={() => navigate('/deep-research')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Deep Research
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-[#1B263B] rounded-lg p-6 mb-6 h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#2A3B55] text-gray-300'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#2A3B55] text-gray-300 rounded-lg p-4">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about staff performance..."
              className="flex-1 bg-[#2A3B55] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isChatLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Staff Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffData.map((staff) => (
            <div 
              key={staff.id}
              className="bg-[#1B263B] rounded-lg p-6 hover:bg-[#2A3B55] transition-colors"
            >
              <div className="flex items-center space-x-4">
                <img 
                  src={staff.photo || 'https://via.placeholder.com/50'} 
                  alt={staff.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">{staff.name}</h3>
                  <p className="text-gray-400">Department: {staff.department}</p>
                  <p className="text-gray-400">Joined: {staff.dateJoined}</p>
                  {staff.performanceMetrics && (
                    <div className="mt-2">
                      <p className={`text-sm ${
                        staff.performanceMetrics.trend === 'declining' ? 'text-red-400' :
                        staff.performanceMetrics.trend === 'improving' ? 'text-green-400' :
                        'text-yellow-400'
                      }`}>
                        Trend: {staff.performanceMetrics.trend}
                      </p>
                      <p className="text-sm text-gray-400">
                        Avg Score: {staff.performanceMetrics.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDeclineAnalysis; 