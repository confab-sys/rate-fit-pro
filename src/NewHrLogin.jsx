import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const NewHrLogin = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pin);
      const user = userCredential.user;
      
      // Check if user has HR role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'hr') {
        sessionStorage.setItem('adminName', userDoc.data().fullName);
        navigate('/new-hr-menu');
      } else {
        setError('Access denied. HR credentials required.');
        await auth.signOut();
      }
    } catch (error) {
      setError('Invalid email or PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/hr-create-account');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#0D1B2A' }}>
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate('/blank')}
        className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors duration-300"
        aria-label="Back to selection"
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

      <div className="bg-[#2ECC71]/20 p-8 rounded-lg shadow-lg w-96 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">HR Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white/90"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-bold mb-2" htmlFor="pin">
              PIN (6 digits)
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(value);
              }}
              pattern="\d{6}"
              maxLength="6"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white/90"
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#00A36C] hover:bg-[#008B5E] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={handleCreateAccount}
              className="bg-[#00A36C] hover:bg-[#008B5E] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-[#00A36C] hover:text-[#008B5E] text-sm">
            Forgot PIN?
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewHrLogin; 