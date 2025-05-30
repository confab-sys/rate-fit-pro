import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ManagerViewStaffs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useQuery();
  const deleteMode = queryParams.get('deleteMode') === 'true';
  const rateMode = location.state?.rateMode || false;
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [managerBranch, setManagerBranch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get manager's branch from session storage
        const managerName = sessionStorage.getItem('managerName');
        if (!managerName) {
          throw new Error('Manager not logged in');
        }

        // Fetch manager's branch
        const managersRef = collection(db, 'managers');
        const managerQuery = query(managersRef, where('name', '==', managerName));
        const managerSnapshot = await getDocs(managerQuery);
        
        if (managerSnapshot.empty) {
          throw new Error('Manager not found');
        }

        const managerData = managerSnapshot.docs[0].data();
        setManagerBranch(managerData.branch);

        // Fetch staff members from manager's branch
        const staffRef = collection(db, 'staff');
        const staffQuery = query(staffRef, where('branchName', '==', managerData.branch));
        const staffSnapshot = await getDocs(staffQuery);
        
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setStaffMembers(staffData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStaffClick = (staff) => {
    if (deleteMode) {
      setStaffToDelete(staff);
      setShowDeleteConfirm(true);
    } else if (rateMode) {
      navigate(`/rate-time/${staff.id}`);
    } else {
      navigate(`/manager-view-staff-report/${staff.id}`);
    }
  };

  const handleBack = () => {
    navigate('/manager-menu');
  };

  const handleDeleteConfirm = () => {
    if (staffToDelete) {
      navigate(`/confirm-delete/${staffToDelete.id}`, { state: { fromManagerMenu: true } });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };

  // Filter staff based on search
  const filteredStaff = staffMembers.filter(staff => {
    const searchTerm = search.toLowerCase().trim();
    return (
      staff.name?.toLowerCase().includes(searchTerm) ||
      staff.staffIdNo?.toLowerCase().includes(searchTerm) ||
      staff.department?.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading...</div>
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
      <div className="flex flex-col items-center pt-8">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">
            {deleteMode ? 'Delete Staff' : rateMode ? 'Rate Staff' : 'Staff Directory'}
          </h1>
          <button
            onClick={handleBack}
            className="bg-[#1B263B] text-white px-4 py-2 rounded-lg hover:bg-[#2C3E50] transition-colors"
          >
            Back to Menu
          </button>
        </div>

        {/* Branch Info */}
        <div className="w-full max-w-4xl bg-[#1B263B] rounded-lg p-4 mb-8">
          <h2 className="text-white text-xl font-semibold mb-2">Branch Information</h2>
          <p className="text-gray-300">Branch: {managerBranch}</p>
          <p className="text-gray-300">Total Staff: {staffMembers.length}</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name, ID, or department..."
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

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              onClick={() => handleStaffClick(staff)}
              className="bg-[#1B263B] rounded-lg p-4 hover:bg-[#2C3E50] transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#415A77] flex items-center justify-center">
                  {staff.photo ? (
                    <img
                      src={staff.photo}
                      alt={staff.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white">
                      {staff.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{staff.name}</h3>
                  <p className="text-gray-400">ID: {staff.staffIdNo}</p>
                  <p className="text-gray-400">Department: {staff.department}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-white text-center mt-10">
            No staff members found matching your search.
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
                  <p className="text-white"><span className="text-gray-400">Branch:</span> {selectedStaff.branchName}</p>
                  <p className="text-white"><span className="text-gray-400">Status:</span> {selectedStaff.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && staffToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1B263B] rounded-lg p-6 w-[90%] max-w-md">
              <h2 className="text-white text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {staffToDelete.name}'s record? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerViewStaffs; 