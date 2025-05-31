import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const NewAdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin') {
      if (value.length <= 6 && /^\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate PIN length
    if (formData.pin.length !== 6) {
      setError('PIN must be 6 digits');
      setLoading(false);
      return;
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(formData.pin)) {
      setError('PIN must contain only numbers');
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const adminsRef = collection(db, 'admins');
      
      // Query Firestore for admin with matching credentials
      const q = query(
        adminsRef,
        where('name', '==', formData.name),
        where('email', '==', formData.email),
        where('pin', '==', formData.pin)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();

        // Attempt Firebase Authentication
        try {
          // Combine PIN and passKey for authentication
          const combinedPassword = `${formData.pin}${adminData.passKey}`;
          await signInWithEmailAndPassword(auth, formData.email, combinedPassword);
          
          // Store admin name in sessionStorage
          sessionStorage.setItem('adminName', formData.name);
          
          // Navigate to admin menu
          navigate('/new-admin-menu');
        } catch (authError) {
          console.error('Authentication error:', authError);
          setError('Authentication failed. Please check your credentials.');
        }
      } else {
        setError('Invalid admin credentials. Please check your name, email, and PIN.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/blank')}
          className="flex items-center px-4 py-2 text-sm font-medium text-[#2ECC71] bg-[#0D1B2A] hover:bg-[#1B263B] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Sign in to your admin account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#2ECC71]/20 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-200">
                PIN
              </label>
              <div className="mt-1">
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  required
                  value={formData.pin}
                  onChange={handleChange}
                  placeholder="Enter 6-digit PIN"
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2ECC71] hover:bg-[#27AE60] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#2ECC71]/20 text-gray-300">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/admin-create-account')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#2ECC71] bg-[#0D1B2A] hover:bg-[#1B263B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
              >
                Create new account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAdminLogin; 