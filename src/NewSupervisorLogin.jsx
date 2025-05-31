import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const NewSupervisorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        const querySnapshot = await getDocs(branchesRef);
        const branchesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().branchName
        }));
        setBranches(branchesList);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please refresh the page.');
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // Handle PIN input to ensure only numbers and max length of 6
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields are filled
    if (!selectedBranch || !email || !pin) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Validate PIN length
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      setLoading(false);
      return;
    }

    try {
      // Query supervisors collection with all three criteria
      const supervisorsRef = collection(db, 'supervisors');
      const q = query(
        supervisorsRef,
        where('email', '==', email.toLowerCase().trim()),
        where('branch', '==', selectedBranch),
        where('pin', '==', pin)
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid credentials. Please check your branch, email, and PIN.');
        setLoading(false);
        return;
      }

      const supervisorData = querySnapshot.docs[0].data();

      // Double-check all fields match exactly
      if (
        supervisorData.email.toLowerCase().trim() !== email.toLowerCase().trim() ||
        supervisorData.branch !== selectedBranch ||
        supervisorData.pin !== pin
      ) {
        setError('Invalid credentials. Please check your branch, email, and PIN.');
        setLoading(false);
        return;
      }

      // Store supervisor info in session storage
      sessionStorage.setItem('supervisorName', supervisorData.name);
      sessionStorage.setItem('supervisorId', querySnapshot.docs[0].id);
      sessionStorage.setItem('supervisorDepartment', supervisorData.department || '');
      sessionStorage.setItem('supervisorBranch', selectedBranch);
      
      // Navigate to welcome page
      navigate('/welcome-supervisor');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-[#1B263B] rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Supervisor Login</h1>
            <p className="text-gray-400">Welcome back! Please login to your account.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Branch Selection */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-300 mb-2">
                Select Branch
              </label>
              <select
                id="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0D1B2A] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                disabled={loadingBranches}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {loadingBranches && (
                <p className="text-gray-400 text-xs mt-1">Loading branches...</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0D1B2A] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* PIN Input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-2">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={handlePinChange}
                className="w-full px-4 py-3 rounded-lg bg-[#0D1B2A] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center tracking-widest font-mono"
                placeholder="Enter your 6-digit PIN"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                required
              />
              <p className="text-gray-400 text-xs mt-1">Enter your 6-digit PIN</p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || pin.length !== 6 || !selectedBranch || !email}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                loading || pin.length !== 6 || !selectedBranch || !email
                  ? 'bg-blue-500/50 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Back to Main Menu */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSupervisorLogin; 