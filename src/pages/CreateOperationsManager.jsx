import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const CreateOperationsManager = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    confirmPin: '',
    passKey: ''
  });

  const [addManagerData, setAddManagerData] = useState({
    name: '',
    email: '',
    branch: '',
    passKey: '',
    verificationPin: '',
    managerPin: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [addManagerError, setAddManagerError] = useState('');
  const [addManagerLoading, setAddManagerLoading] = useState(false);
  const [generatedPassKey, setGeneratedPassKey] = useState('');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesQuery = query(collection(db, 'branches'));
        const branchesSnapshot = await getDocs(branchesQuery);
        const branchesList = branchesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().branchName
        }));
        setBranches(branchesList);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setAddManagerError('Error loading branches. Please try again.');
      }
    };

    fetchBranches();
  }, []);

  const generatePassKey = () => {
    // Generate a 4-digit pass key
    const passKey = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPassKey(passKey);
    setAddManagerData(prev => ({
      ...prev,
      passKey: passKey
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin' || name === 'confirmPin') {
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

  const handleAddManagerChange = (e) => {
    const { name, value } = e.target;
    if (name === 'verificationPin' || name === 'managerPin') {
      if (value.length <= 6 && /^\d*$/.test(value)) {
        setAddManagerData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setAddManagerData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      setLoading(false);
      return;
    }

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

    if (formData.passKey.length !== 4) {
      setError('Pass key must be exactly 4 digits');
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(formData.passKey)) {
      setError('Pass key must contain only numbers');
      setLoading(false);
      return;
    }

    try {
      // First, verify the pass key against admin's record
      const adminQuery = query(collection(db, 'admins'), where('passKey', '==', formData.passKey));
      const adminSnapshot = await getDocs(adminQuery);

      if (adminSnapshot.empty) {
        setError('Invalid pass key. Please use the correct admin pass key.');
        setLoading(false);
        return;
      }

      // Create user account with pass key as password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.passKey + '00' // Add two zeros to meet Firebase's minimum password length
      );

      // Get the admin's ID
      const adminDoc = adminSnapshot.docs[0];
      const adminId = adminDoc.id;

      // Store additional user data in Firestore
      await setDoc(doc(db, 'operationsManagers', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        pin: formData.pin,
        passKey: formData.passKey,
        role: 'Operations Manager',
        adminId: adminId,
        createdAt: new Date().toISOString()
      });

      navigate('/operations-manager-login');
    } catch (error) {
      console.error('Error creating operations manager:', error);
      if (error.code === 'auth/weak-password') {
        setError('Pass key must be exactly 4 digits');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setAddManagerError('');
    setAddManagerLoading(true);

    if (!addManagerData.passKey) {
      setAddManagerError('Please generate a pass key first');
      setAddManagerLoading(false);
      return;
    }

    if (addManagerData.verificationPin.length !== 6) {
      setAddManagerError('Operations Manager PIN must be exactly 6 digits');
      setAddManagerLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(addManagerData.verificationPin)) {
      setAddManagerError('Operations Manager PIN must contain only numbers');
      setAddManagerLoading(false);
      return;
    }

    if (addManagerData.managerPin.length !== 6) {
      setAddManagerError('Manager PIN must be exactly 6 digits');
      setAddManagerLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(addManagerData.managerPin)) {
      setAddManagerError('Manager PIN must contain only numbers');
      setAddManagerLoading(false);
      return;
    }

    if (addManagerData.passKey.length !== 4) {
      setAddManagerError('Pass key must be exactly 4 digits');
      setAddManagerLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(addManagerData.passKey)) {
      setAddManagerError('Pass key must contain only numbers');
      setAddManagerLoading(false);
      return;
    }

    try {
      // First, verify the operations manager's PIN
      const opsManagerQuery = query(collection(db, 'operationsManagers'), where('pin', '==', addManagerData.verificationPin));
      const opsManagerSnapshot = await getDocs(opsManagerQuery);

      if (opsManagerSnapshot.empty) {
        setAddManagerError('Invalid PIN. Please enter the correct operations manager PIN.');
        setAddManagerLoading(false);
        return;
      }

      // Get the operations manager's ID
      const opsManagerDoc = opsManagerSnapshot.docs[0];
      const opsManagerId = opsManagerDoc.id;

      // Create user account for the manager with generated pass key as password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        addManagerData.email,
        addManagerData.passKey + '00' // Add two zeros to meet Firebase's minimum password length
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, 'managers', userCredential.user.uid), {
        name: addManagerData.name,
        email: addManagerData.email,
        branch: addManagerData.branch,
        pin: addManagerData.managerPin,
        passKey: addManagerData.passKey,
        role: 'Manager',
        opsManagerId: opsManagerId,
        createdAt: new Date().toISOString()
      });

      // Clear the form
      setAddManagerData({
        name: '',
        email: '',
        branch: '',
        passKey: '',
        verificationPin: '',
        managerPin: ''
      });
      setGeneratedPassKey('');
      
      setAddManagerError('Manager added successfully! Pass Key: ' + addManagerData.passKey);
    } catch (error) {
      console.error('Error adding manager:', error);
      if (error.code === 'auth/weak-password') {
        setAddManagerError('Pass key must be exactly 4 digits');
      } else {
        setAddManagerError(error.message);
      }
    } finally {
      setAddManagerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center p-4 relative">
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate('/operations-manager-login')}
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

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        {/* Create Operations Manager Form */}
        <div className="bg-[#00A36C] p-8 rounded-lg shadow-xl w-full">
          <h2 className="text-2xl font-bold text-center text-black mb-6">Create Operations Manager Account</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Create PIN (6 digits)
              </label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter 6-digit PIN"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Retype PIN
              </label>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Retype 6-digit PIN"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Pass Key
              </label>
              <input
                type="password"
                name="passKey"
                value={formData.passKey}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter your pass key"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008B5C] text-white py-2 px-4 rounded hover:bg-[#006B45] focus:outline-none focus:ring-2 focus:ring-[#008B5C] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/operations-manager-login')}
              className="text-black hover:text-gray-700 transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* Add Manager Form */}
        <div className="bg-[#00A36C] p-8 rounded-lg shadow-xl w-full">
          <h2 className="text-2xl font-bold text-center text-black mb-6">Add Manager</h2>
          
          {addManagerError && (
            <div className={`px-4 py-3 rounded mb-4 ${
              addManagerError.includes('successfully') 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {addManagerError}
            </div>
          )}

          <form onSubmit={handleAddManager} className="space-y-4">
            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={addManagerData.name}
                onChange={handleAddManagerChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter manager's name"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={addManagerData.email}
                onChange={handleAddManagerChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter manager's email"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Branch
              </label>
              <select
                name="branch"
                value={addManagerData.branch}
                onChange={handleAddManagerChange}
                required
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Operations Manager PIN (6 digits)
              </label>
              <input
                type="password"
                name="verificationPin"
                value={addManagerData.verificationPin}
                onChange={handleAddManagerChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter operations manager PIN"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Manager PIN (6 digits)
              </label>
              <input
                type="password"
                name="managerPin"
                value={addManagerData.managerPin}
                onChange={handleAddManagerChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="w-full px-3 py-2 border border-[#008B5C] rounded focus:outline-none focus:ring-2 focus:ring-[#008B5C] bg-white"
                placeholder="Enter manager's 6-digit PIN"
              />
            </div>

            <div>
              <label className="block text-black text-sm font-bold mb-2">
                Pass Key
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="managerPassKey"
                  name="passKey"
                  type="text"
                  required
                  value={addManagerData.passKey}
                  readOnly
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#00A36C] focus:border-[#00A36C] sm:text-sm"
                />
                <button
                  type="button"
                  onClick={generatePassKey}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#008B5C] hover:bg-[#006B45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A36C]"
                >
                  Generate
                </button>
              </div>
              {generatedPassKey && (
                <p className="mt-2 text-sm text-black">
                  Generated Pass Key: {generatedPassKey}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={addManagerLoading || !addManagerData.passKey}
              className="w-full bg-[#008B5C] text-white py-2 px-4 rounded hover:bg-[#006B45] focus:outline-none focus:ring-2 focus:ring-[#008B5C] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {addManagerLoading ? 'Adding Manager...' : 'Add Manager'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOperationsManager; 