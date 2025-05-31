import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const StaffPerformanceNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set());
  const [readTimestamps, setReadTimestamps] = useState({});
  const [recentlyRead, setRecentlyRead] = useState(new Set());
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({
    all: 0,
    improvement: 0,
    decline: 0,
    achievement: 0,
    warning: 0
  });

  useEffect(() => {
    // Load read notifications from localStorage
    const savedReadNotifications = localStorage.getItem('readNotifications');
    if (savedReadNotifications) {
      setReadNotifications(new Set(JSON.parse(savedReadNotifications)));
    }

    // Load read timestamps from localStorage
    const savedReadTimestamps = localStorage.getItem('readTimestamps');
    if (savedReadTimestamps) {
      setReadTimestamps(JSON.parse(savedReadTimestamps));
    }

    // Load recently read notifications from localStorage
    const savedRecentlyRead = localStorage.getItem('recentlyRead');
    if (savedRecentlyRead) {
      setRecentlyRead(new Set(JSON.parse(savedRecentlyRead)));
    }

    // Load expanded notifications from localStorage
    const savedExpandedNotifications = localStorage.getItem('expandedNotifications');
    if (savedExpandedNotifications) {
      const expandedIds = JSON.parse(savedExpandedNotifications);
      setExpandedNotifications(new Set(expandedIds));
      // Find and set the first expanded notification as selected
      if (expandedIds.length > 0) {
        const firstExpandedId = expandedIds[0];
        const expandedNotification = notifications.find(n => n.id === firstExpandedId);
        if (expandedNotification) {
          setSelectedNotification(expandedNotification);
        }
      }
    }
  }, [notifications]); // Add notifications as dependency

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        // First fetch all managers to check branch assignments
        const managersSnapshot = await getDocs(collection(db, 'managers'));
        const managersList = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const staffSnapshot = await getDocs(collection(db, 'staff'));
        const notificationsList = [];

        for (const staffDoc of staffSnapshot.docs) {
          const staffInfo = staffDoc.data();
          
          // Find manager for this staff's branch
          const manager = managersList.find(m => m.branch === staffInfo.branchName);
          
          // Get monthly ratings for trend analysis
          const ratingsQuery = query(
            collection(db, 'staff', staffDoc.id, 'monthlyRatings'),
            orderBy('timestamp', 'desc')
          );
          
          const ratingsSnapshot = await getDocs(ratingsQuery);
          const ratings = ratingsSnapshot.docs.map(doc => doc.data());

          if (ratings.length >= 2) {
            const currentRating = ratings[0];
            const previousRating = ratings[1];
            
            // Calculate performance changes
            const changes = {
              overall: currentRating.averagePercentage - previousRating.averagePercentage,
              categories: {}
            };

            // Calculate category changes
            Object.keys(currentRating).forEach(category => {
              if (category !== 'timestamp' && category !== 'averagePercentage') {
                changes.categories[category] = 
                  (currentRating[category]?.percentage || 0) - 
                  (previousRating[category]?.percentage || 0);
              }
            });

            // Generate notifications based on changes
            if (Math.abs(changes.overall) >= 5) {
              const notificationId = `${staffDoc.id}-overall-${currentRating.timestamp}`;
              notificationsList.push({
                id: notificationId,
                type: changes.overall > 0 ? 'improvement' : 'decline',
                staffId: staffDoc.id,
                staffName: staffInfo.name,
                staffPhoto: staffInfo.photo,
                branchName: staffInfo.branchName || 'No Branch Assigned',
                managerName: manager ? manager.name : 'No Manager Assigned',
                timestamp: currentRating.timestamp,
                message: `${staffInfo.name}'s overall performance has ${changes.overall > 0 ? 'improved' : 'declined'} by ${Math.abs(changes.overall)}%`,
                details: {
                  currentScore: currentRating.averagePercentage,
                  previousScore: previousRating.averagePercentage,
                  change: changes.overall,
                  categoryChanges: changes.categories
                }
              });
            }

            // Check for significant category changes
            Object.entries(changes.categories).forEach(([category, change]) => {
              if (Math.abs(change) >= 10) {
                const notificationId = `${staffDoc.id}-${category}-${currentRating.timestamp}`;
                notificationsList.push({
                  id: notificationId,
                  type: change > 0 ? 'achievement' : 'warning',
                  staffId: staffDoc.id,
                  staffName: staffInfo.name,
                  staffPhoto: staffInfo.photo,
                  branchName: staffInfo.branchName || 'No Branch Assigned',
                  managerName: manager ? manager.name : 'No Manager Assigned',
                  timestamp: currentRating.timestamp,
                  message: `${staffInfo.name} has shown ${change > 0 ? 'significant improvement' : 'significant decline'} in ${category.replace('_', ' ')}`,
                  details: {
                    category,
                    currentScore: currentRating[category]?.percentage || 0,
                    previousScore: previousRating[category]?.percentage || 0,
                    change
                  }
                });
              }
            });
          }
        }

        // Sort notifications by timestamp
        notificationsList.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notificationsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const managersSnapshot = await getDocs(collection(db, 'managers'));
        const branchesList = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().branch
        }));
        setBranches(branchesList);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    // Calculate unread counts for each category based on selected branch
    const counts = {
      all: 0,
      improvement: 0,
      decline: 0,
      achievement: 0,
      warning: 0
    };

    notifications.forEach(notification => {
      // Only count notifications for the selected branch
      const matchesBranch = branchFilter === 'all' || notification.branchName === branchFilter;
      if (matchesBranch && !readNotifications.has(notification.id)) {
        counts.all++;
        counts[notification.type]++;
      }
    });

    setUnreadCounts(counts);
  }, [notifications, readNotifications, branchFilter]);

  useEffect(() => {
    // Update total unread count
    const unread = notifications.filter(notification => {
      const matchesFilter = filter === 'all' || notification.type === filter;
      const matchesBranch = branchFilter === 'all' || notification.branchName === branchFilter;
      return matchesFilter && matchesBranch && !readNotifications.has(notification.id);
    }).length;
    setUnreadCount(unread);
  }, [notifications, readNotifications, filter, branchFilter]);

  const markAsRead = (notificationId) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notificationId);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('readNotifications', JSON.stringify([...newReadNotifications]));

    // Store the timestamp when the notification was read
    const newReadTimestamps = {
      ...readTimestamps,
      [notificationId]: Date.now()
    };
    setReadTimestamps(newReadTimestamps);
    localStorage.setItem('readTimestamps', JSON.stringify(newReadTimestamps));
  };

  const handleNotificationClick = (notification) => {
    const isSelected = selectedNotification?.id === notification.id;
    
    if (isSelected) {
      // When closing the notification
      if (!readNotifications.has(notification.id)) {
        markAsRead(notification.id);
      }
      setSelectedNotification(null);
    } else {
      setSelectedNotification(notification);
    }
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Remove from read notifications if it was there
    if (readNotifications.has(notificationId)) {
      const newReadNotifications = new Set(readNotifications);
      newReadNotifications.delete(notificationId);
      setReadNotifications(newReadNotifications);
      localStorage.setItem('readNotifications', JSON.stringify([...newReadNotifications]));
    }
    
    // Remove from read timestamps if it was there
    if (readTimestamps[notificationId]) {
      const newReadTimestamps = { ...readTimestamps };
      delete newReadTimestamps[notificationId];
      setReadTimestamps(newReadTimestamps);
      localStorage.setItem('readTimestamps', JSON.stringify(newReadTimestamps));
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'improvement':
        return 'bg-green-500/10 border-green-500';
      case 'decline':
        return 'bg-red-500/10 border-red-500';
      case 'achievement':
        return 'bg-blue-500/10 border-blue-500';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500';
      default:
        return 'bg-gray-500/10 border-gray-500';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'improvement':
        return '📈';
      case 'decline':
        return '📉';
      case 'achievement':
        return '🏆';
      case 'warning':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesTypeFilter = filter === 'all' || notification.type === filter;
    const matchesBranchFilter = branchFilter === 'all' || notification.branchName === branchFilter;
    return matchesTypeFilter && matchesBranchFilter;
  }).sort((a, b) => {
    // First sort by read status (unread first)
    const aRead = readNotifications.has(a.id);
    const bRead = readNotifications.has(b.id);
    if (aRead !== bRead) {
      return aRead ? 1 : -1;
    }
    
    // If both are read, sort by read timestamp (most recently read first)
    if (aRead && bRead) {
      return (readTimestamps[b.id] || 0) - (readTimestamps[a.id] || 0);
    }
    
    // If both are unread, sort by notification timestamp (newest first)
    return b.timestamp - a.timestamp;
  });

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A]">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-white text-xl sm:text-2xl font-bold">Performance Notifications</h1>
            <div className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount} unread {filter !== 'all' ? `in ${filter}` : ''} {branchFilter !== 'all' ? `for ${branchFilter}` : ''}
            </div>
          </div>
          <button
            onClick={() => navigate('/new-hr-menu')}
            className="px-4 py-2 rounded-lg bg-[#1B263B] text-white hover:bg-[#22304a] transition-colors"
          >
            Back to HR Menu
          </button>
        </div>

        {/* Branch Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setBranchFilter('all');
              setFilter('all');
            }}
            className={`px-4 py-2 rounded-lg ${
              branchFilter === 'all' ? 'bg-purple-500' : 'bg-[#1B263B]'
            } text-white hover:bg-[#22304a] transition-colors`}
          >
            All Branches
          </button>
          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => {
                setBranchFilter(branch.name);
                setFilter('all');
              }}
              className={`px-4 py-2 rounded-lg ${
                branchFilter === branch.name ? 'bg-purple-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors`}
            >
              {branch.name}
            </button>
          ))}
        </div>

        {/* Type Filter Buttons - Only show when a specific branch is selected */}
        {branchFilter !== 'all' && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-blue-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors relative`}
            >
              All
              {unreadCounts.all > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCounts.all}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('improvement')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'improvement' ? 'bg-green-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors relative`}
            >
              Improvements
              {unreadCounts.improvement > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCounts.improvement}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('decline')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'decline' ? 'bg-red-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors relative`}
            >
              Declines
              {unreadCounts.decline > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCounts.decline}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('achievement')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'achievement' ? 'bg-blue-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors relative`}
            >
              Achievements
              {unreadCounts.achievement > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCounts.achievement}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'warning' ? 'bg-yellow-500' : 'bg-[#1B263B]'
              } text-white hover:bg-[#22304a] transition-colors relative`}
            >
              Warnings
              {unreadCounts.warning > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCounts.warning}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const isRead = readNotifications.has(notification.id);
            const isSelected = selectedNotification?.id === notification.id;
            const isRecentlyRead = recentlyRead.has(notification.id);
            
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !isRead ? getNotificationColor(notification.type) : 'border-gray-700'
                } cursor-pointer hover:bg-opacity-20 transition-colors ${
                  !isRead ? 'border-l-4' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={notification.staffPhoto || 'https://via.placeholder.com/40'}
                          alt={notification.staffName}
                          className="w-8 h-8 rounded-full"
                        />
                        <h3 className="text-white font-semibold">{notification.staffName}</h3>
                        <span className="text-gray-400 text-sm">
                          {new Date(notification.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {!isRead && (
                          <span className="bg-blue-500 w-2 h-2 rounded-full"></span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-400 text-sm">
                        {notification.branchName}
                        {notification.managerName && ` • Managed by ${notification.managerName}`}
                      </span>
                    </div>
                    <p className={`mt-1 ${isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                      {notification.message}
                    </p>
                    
                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-3 p-3 bg-[#1B263B] rounded-lg relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                        <h4 className="text-white font-semibold mb-2">Performance Details</h4>
                        {notification.details.category ? (
                          // Category-specific notification
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Previous Score</span>
                              <span className="text-white">{notification.details.previousScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Current Score</span>
                              <span className="text-white">{notification.details.currentScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Change</span>
                              <span className={`${notification.details.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {notification.details.change > 0 ? '+' : ''}{notification.details.change}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Overall performance notification
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Previous Overall</span>
                              <span className="text-white">{notification.details.previousScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Current Overall</span>
                              <span className="text-white">{notification.details.currentScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Overall Change</span>
                              <span className={`${notification.details.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {notification.details.change > 0 ? '+' : ''}{notification.details.change}%
                              </span>
                            </div>
                            <div className="mt-3">
                              <h5 className="text-gray-400 mb-2">Category Changes</h5>
                              <div className="space-y-1">
                                {Object.entries(notification.details.categoryChanges).map(([category, change]) => (
                                  <div key={category} className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">
                                      {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                    <span className={`${change > 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                                      {change > 0 ? '+' : ''}{change}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => navigate(`/hr-view-report/${notification.staffId}`)}
                          className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          View Full Analysis
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No notifications found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPerformanceNotifications; 