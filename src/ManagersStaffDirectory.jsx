import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const ManagersStaffDirectory = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [groupedManagers, setGroupedManagers] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [branchStaffCounts, setBranchStaffCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch managers
        const managersRef = collection(db, 'managers');
        const managersQuery = query(managersRef);
        const managersSnapshot = await getDocs(managersQuery);
        
        const managersData = managersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch staff
        const staffRef = collection(db, 'staff');
        const staffQuery = query(staffRef);
        const staffSnapshot = await getDocs(staffQuery);
        
        // Count staff per branch
        const counts = {};
        staffSnapshot.docs.forEach(doc => {
          const staffData = doc.data();
          if (staffData.branchName) {
            // Initialize the branch count if it doesn't exist
            if (!counts[staffData.branchName]) {
              counts[staffData.branchName] = 0;
            }
            // Increment the count for this branch
            counts[staffData.branchName]++;
          }
        });

        console.log('Branch staff counts:', counts); // Debug log

        // Sort managers by branch name
        const sortedManagers = managersData.sort((a, b) => 
          (a.branch || 'Unassigned').localeCompare(b.branch || 'Unassigned')
        );

        // Group managers by branch
        const grouped = sortedManagers.reduce((acc, manager) => {
          const branch = manager.branch || 'Unassigned';
          if (!acc[branch]) {
            acc[branch] = [];
          }
          acc[branch].push(manager);
          return acc;
        }, {});

        setGroupedManagers(grouped);
        setManagers(managersData);
        setBranchStaffCounts(counts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredManagers = managers.filter(manager => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (manager.name?.toLowerCase().includes(searchLower) ||
      manager.email?.toLowerCase().includes(searchLower) ||
      manager.branch?.toLowerCase().includes(searchLower) ||
      manager.department?.toLowerCase().includes(searchLower)) &&
      (selectedBranch === 'All' || manager.branch === selectedBranch)
    );
  });

  const handleManagerClick = (manager) => {
    setSelectedManager(manager);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedManager(null);
  };

  const handleBack = () => {
    navigate('/new-admin-menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Loading managers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-2xl sm:text-3xl font-bold">Managers Directory</h1>
          <button
            onClick={handleBack}
            className="bg-[#1B263B] text-white px-4 py-2 rounded-lg hover:bg-[#2C3E50] transition-colors"
          >
            Back to Menu
          </button>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-4 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#415A77]"
          />
        </div>

        {/* Branch Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.keys(groupedManagers).map(branch => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedBranch === branch
                  ? 'bg-[#415A77] text-white'
                  : 'bg-[#1B263B] text-gray-300 hover:bg-[#2C3E50]'
              }`}
            >
              {branch} ({groupedManagers[branch].length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManagers.map(manager => (
            <div
              key={manager.id}
              onClick={() => handleManagerClick(manager)}
              className="bg-[#1B263B] rounded-lg p-6 cursor-pointer hover:bg-[#2C3E50] transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#415A77] flex items-center justify-center">
                  {manager.photo ? (
                    <img
                      src={manager.photo}
                      alt={manager.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white">
                      {manager.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{manager.name}</h3>
                  <p className="text-gray-400">{manager.email}</p>
                  <p className="text-gray-400">{manager.branch}</p>
                  <p className="text-gray-400">{manager.department}</p>
                  <p className="text-green-400 font-medium mt-2">
                    Managing {branchStaffCounts[manager.branch] || 0} staff
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && selectedManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#1B263B] rounded-lg p-6 max-w-lg w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-white text-xl font-bold">{selectedManager.name}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400">Email</label>
                  <p className="text-white">{selectedManager.email}</p>
                </div>
                <div>
                  <label className="text-gray-400">Branch</label>
                  <p className="text-white">{selectedManager.branch}</p>
                </div>
                <div>
                  <label className="text-gray-400">Department</label>
                  <p className="text-white">{selectedManager.department}</p>
                </div>
                <div>
                  <label className="text-gray-400">Phone</label>
                  <p className="text-white">{selectedManager.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-gray-400">Status</label>
                  <p className="text-white">{selectedManager.status || 'Active'}</p>
                </div>
                <div>
                  <label className="text-gray-400">Staff Members</label>
                  <p className="text-green-400 font-medium">
                    Managing {branchStaffCounts[selectedManager.branch] || 0} staff
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagersStaffDirectory; 