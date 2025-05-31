import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './OperationsManagerLogin.css';

const OperationsManagerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    pin: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(formData.pin)) {
      setError('PIN must contain only numbers');
      setLoading(false);
      return;
    }

    try {
      // First, verify the operations manager's credentials in Firestore
      const opsManagerQuery = query(
        collection(db, 'operationsManagers'),
        where('email', '==', formData.email),
        where('pin', '==', formData.pin)
      );
      
      const opsManagerSnapshot = await getDocs(opsManagerQuery);

      if (opsManagerSnapshot.empty) {
        setError('Invalid credentials. Please check your email and PIN.');
        setLoading(false);
        return;
      }

      // Get the operations manager's document
      const opsManagerDoc = opsManagerSnapshot.docs[0];
      const opsManagerData = opsManagerDoc.data();

      // Now try to sign in with Firebase Auth using the pass key
      try {
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          opsManagerData.passKey + '00' // Add two zeros to match the stored format
        );
        
        // Store operations manager name in sessionStorage
        sessionStorage.setItem('adminName', opsManagerData.name);
        
        // Navigate to the operations main menu
        navigate('/operations-main-menu');
      } catch (authError) {
        console.error('Authentication error:', authError);
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/create-operations-manager');
  };

  return (
    <div className="operations-manager-login-container">
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate('/blank')}
        className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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

      <div className="login-form-container">
        <h2>Operations Manager Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pin">PIN (6 digits)</label>
            <input
              type="password"
              id="pin"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              maxLength="6"
              pattern="[0-9]{6}"
              required
              placeholder="Enter 6-digit PIN"
            />
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button 
              type="button" 
              className="create-account-button"
              onClick={handleCreateAccount}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperationsManagerLogin; 