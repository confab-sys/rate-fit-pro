import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const ConfirmDeleteStaff = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSupervisorMenu = location.state?.fromSupervisorMenu || false;
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const docRef = doc(db, 'staff', staffId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStaff(docSnap.data());
        } else {
          setError('Staff record not found.');
        }
      } catch (err) {
        setError('Failed to fetch staff record.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [staffId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'staff', staffId));
      navigate('/new-hr-menu');
    } catch (err) {
      setError('Failed to delete staff record.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center text-white">Loading...</div>;
  }
  if (error) {
    return <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col items-center">
        <img src={staff.photo} alt={staff.name} className="w-24 h-24 rounded-full object-cover mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">{staff.name}</h2>
        <p className="text-gray-400 mb-1">ID: {staff.staffIdNo}</p>
        <p className="text-gray-400 mb-1">Department: {staff.department}</p>
        <p className="text-gray-400 mb-4">Email: {staff.email}</p>
        <p className="text-white mb-6">Are you sure you want to delete this staff record?</p>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-semibold"
            onClick={() => navigate('/new-hr-menu')}
            disabled={deleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteStaff; 