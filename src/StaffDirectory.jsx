import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const StaffDirectory = () => {
  const navigate = useNavigate();
  const queryParams = useQuery();
  const deleteMode = queryParams.get('deleteMode') === 'true';
  const rateMode = queryParams.get('rateMode') === 'true';
  const analysisMode = queryParams.get('analysisMode') === 'true';
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [ratedStaffIds, setRatedStaffIds] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        const staffData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched staff data:', staffData); // Debug log
        setStaffMembers(staffData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff data:', err);
        setError('Failed to fetch staff data');
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  // Fetch staff ratings when in rate mode
  useEffect(() => {
    if (rateMode) {
      const fetchRatedStaff = async () => {
        try {
          console.log('Fetching rated staff...');
          const ratingsSnapshot = await getDocs(collection(db, 'staff_ratings'));
          
          const ratedIds = [];
          ratingsSnapshot.docs.forEach(doc => {
            const rating = doc.data();
            if (rating.staffId && !ratedIds.includes(rating.staffId)) {
              ratedIds.push(rating.staffId);
              console.log('Found rated staff:', rating.staffId);
            }
          });
          
          setRatedStaffIds(ratedIds);
          console.log('Rated staff IDs:', ratedIds);
        } catch (err) {
          console.error('Error fetching rated staff:', err);
        }
      };
      
      fetchRatedStaff();
    }
  }, [rateMode]);

  const filteredStaff = staffMembers.filter(staff => {
    const q = search.trim().toLowerCase();
    return (
      staff.name?.toLowerCase().includes(q) ||
      staff.idNo?.toLowerCase().includes(q) ||
      staff.staffIdNo?.toLowerCase().includes(q) ||
      staff.department?.toLowerCase().includes(q)
    );
  });

  const handleStaffClick = (staff) => {
    if (deleteMode) {
      navigate(`/confirm-delete/${staff.id}`);
    } else if (rateMode) {
      navigate(`/rate-time/${staff.id}`);
    } else if (analysisMode) {
      navigate(`/staff-analysis/${staff.id}`);
    } else {
      setSelectedStaff(staff);
    }
  };

  useEffect(() => {
    const supervisorName = sessionStorage.getItem('supervisorName');
    const adminName = sessionStorage.getItem('adminName');
    
    if (!supervisorName && !adminName) {
      navigate('/supervisor-login');
    }
  }, [navigate]);

  const handleBack = () => {
    const supervisorName = sessionStorage.getItem('supervisorName');
    const adminName = sessionStorage.getItem('adminName');
    
    if (supervisorName) {
      navigate('/supervisor-menu');
    } else if (adminName) {
      navigate('/admin-menu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading staff directory...</div>
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
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-2 sm:p-4">
        {/* Header with back button */}
        <div className="flex items-center mb-4 sm:mb-8">
          <button 
            onClick={handleBack}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 sm:h-8 sm:w-8" 
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
          </button>
          <h1 className="text-white text-xl sm:text-2xl font-bold text-center flex-1">Staff Directory</h1>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4 sm:mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-[#1B263B] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <svg
              className="absolute right-2 top-2.5 sm:right-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {filteredStaff.map((staff) => {
            const isRated = ratedStaffIds.includes(staff.id);
            
            return (
              <div
                key={staff.id}
                onClick={() => handleStaffClick(staff)}
                className={`bg-[#1B263B] rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                  isRated && rateMode ? 'border-2 border-green-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={staff.photo || 'https://via.placeholder.com/64'}
                      alt={staff.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white text-lg font-semibold truncate">
                      {staff.name}
                      {isRated && rateMode && (
                        <span className="ml-2 text-green-500">✓</span>
                      )}
                    </h2>
                    <p className="text-gray-400 text-sm">ID: {staff.staffIdNo}</p>
                    <p className="text-gray-400 text-sm">Department: {staff.department}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found. Add some staff members to get started.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img
                    src={selectedStaff.photo || 'https://via.placeholder.com/200'}
                    alt={selectedStaff.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-white"><span className="text-gray-400">Staff ID:</span> {selectedStaff.staffIdNo}</p>
                  <p className="text-white"><span className="text-gray-400">Department:</span> {selectedStaff.department}</p>
                  <p className="text-white"><span className="text-gray-400">Status:</span> {selectedStaff.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDirectory;