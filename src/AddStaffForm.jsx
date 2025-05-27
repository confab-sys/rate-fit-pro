import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const AddStaffForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    idNo: '',
    staffIdNo: '',
    email: '',
    department: '',
    dateJoined: ''
  });
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Check if user came from supervisor menu
  const fromSupervisorMenu = location.state?.fromSupervisorMenu;
  
  console.log('Navigation state:', location.state); // Debug log
  console.log('From supervisor menu:', fromSupervisorMenu); // Debug log

  const photoUploaderUrl = new URL('./assets/photo-uploader icon.svg', import.meta.url).href;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'idNo' || name === 'staffIdNo') && !/^\d*$/.test(value)) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCameraPhoto = async () => {
    // First check if the API is available
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      alert('Camera access is not supported by your device/browser');
      return;
    }

    try {
      // Try standard API first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      
      // Handle different error cases
      if (err.name === 'NotAllowedError') {
        alert('Please enable camera permissions in your browser settings');
      } else if (err.name === 'NotFoundError') {
        alert('No camera found on your device');
      } else {
        alert('Camera not supported: ' + err.message);
      }
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg');
    setUploadedPhoto(photoData);
    
    // Stop camera stream
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleDeviceUpload = () => {
    fileInputRef.current.click();
    setShowModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    
    if (!uploadedPhoto) {
      alert('Please upload or take a photo');
      return;
    }

    if (!formData.name || !formData.staffIdNo || !formData.email || !formData.department || !formData.dateJoined) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if staff ID already exists
      const staffQuery = query(
        collection(db, 'staff'),
        where('staffIdNo', '==', formData.staffIdNo)
      );
      
      const querySnapshot = await getDocs(staffQuery);
      if (!querySnapshot.empty) {
        alert('A staff member with this ID already exists. Please use a different ID.');
        return;
      }

      // Check if email already exists
      const emailQuery = query(
        collection(db, 'staff'),
        where('email', '==', formData.email)
      );
      
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        alert('A staff member with this email already exists. Please use a different email.');
        return;
      }

      const staffData = {
        ...formData,
        photo: uploadedPhoto,
        createdAt: new Date().toISOString()
      };

      // Add to Firestore
      await addDoc(collection(db, 'staff'), staffData);
      
      alert('Staff member added successfully!');
      setFormData({
        name: '',
        idNo: '',
        staffIdNo: '',
        email: '',
        department: '',
        dateJoined: ''
      });
      setUploadedPhoto(null);
      navigate('/staff-directory', { state: { fromSupervisorMenu } });
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
      <h1 className="text-white text-xl mb-6 text-left">Add Staff</h1>
      
      {/* Navigation Buttons */}
      <div className="max-w-xl mx-auto mb-6 space-y-2">
        {/* Return to HR Menu Button - Hide if coming from supervisor menu */}
        {!fromSupervisorMenu && (
          <button
            onClick={() => navigate('/human-resource-menu')}
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
        )}

        {/* Main Menu Button - Only show if coming from supervisor menu */}
        {fromSupervisorMenu && (
          <button
            onClick={() => navigate('/supervisor-menu')}
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            <span>Main Menu</span>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
        <div className="flex justify-center mb-6">
          <img
            src={uploadedPhoto || photoUploaderUrl}
            alt="Photo Uploader"
            className="w-32 h-32 cursor-pointer hover:scale-110 transition-transform duration-300 object-cover rounded-full"
            onClick={() => setShowModal(true)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-white block text-sm">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-white block text-sm">ID Number</label>
            <input
              type="text"
              name="idNo"
              value={formData.idNo}
              onChange={handleInputChange}
              pattern="\d*"
              inputMode="numeric"
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Numbers only"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-white block text-sm">Staff ID Number</label>
            <input
              type="text"
              name="staffIdNo"
              value={formData.staffIdNo}
              onChange={handleInputChange}
              pattern="\d*"
              inputMode="numeric"
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Numbers only"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-white block text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-white block text-sm">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-white block text-sm">Date Joined</label>
            <input
              type="date"
              name="dateJoined"
              value={formData.dateJoined}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-[#00A36C] text-white rounded hover:bg-[#2E8B57] transition-colors font-semibold text-sm ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Adding Staff...' : 'Add Staff'}
          </button>
        </div>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-64">
            <div className="space-y-3">
              <button
                onClick={handleCameraPhoto}
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Take Camera Photo
              </button>
              <button
                onClick={handleDeviceUpload}
                className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Upload Photo from Device
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="mb-4 rounded"
              style={{ width: '100%', maxWidth: '400px' }}
            />
            <div className="space-y-3">
              <button
                onClick={capturePhoto}
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Capture Photo
              </button>
              <button
                onClick={() => {
                  const tracks = videoRef.current.srcObject.getTracks();
                  tracks.forEach(track => track.stop());
                  setShowCamera(false);
                }}
                className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AddStaffForm;