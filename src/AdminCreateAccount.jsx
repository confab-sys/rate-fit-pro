import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

const AdminCreateAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    confirmPin: '',
    passKey: ''
  });

  const [branchFormData, setBranchFormData] = useState({
    role: '',
    passKey: ''
  });

  const [newBranchData, setNewBranchData] = useState({
    branchName: '',
    passKey: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPassKey, setGeneratedPassKey] = useState('');

  const generatePassKey = () => {
    const passKey = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPassKey(passKey);
    setFormData(prev => ({
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

  const handleBranchFormChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewBranchChange = (e) => {
    const { name, value } = e.target;
    setNewBranchData(prev => ({
      ...prev,
      [name]: value
    }));
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
      setError('PIN must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      // Combine PIN and passKey to create a strong password
      const combinedPassword = `${formData.pin}${formData.passKey}`;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        combinedPassword
      );

      await setDoc(doc(db, 'admins', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        pin: formData.pin,
        passKey: formData.passKey,
        role: 'admin',
        createdAt: new Date().toISOString()
      });

      navigate('/blank');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please ensure your PIN and Pass Key are valid.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, verify the pass key against admin's record
      const adminQuery = query(collection(db, 'admins'), where('passKey', '==', branchFormData.passKey));
      const adminSnapshot = await getDocs(adminQuery);

      if (adminSnapshot.empty) {
        setError('Invalid pass key. Please use the correct admin pass key.');
        setLoading(false);
        return;
      }

      // Get the admin's ID
      const adminDoc = adminSnapshot.docs[0];
      const adminId = adminDoc.id;

      // Create a new role document under the admin
      const roleData = {
        name: branchFormData.role,
        type: 'role',
        parentId: adminId,
        passKey: branchFormData.passKey,
        createdAt: new Date().toISOString(),
        createdBy: adminId
      };

      // Add the role to the organizations collection
      const roleRef = await addDoc(collection(db, 'organizations'), roleData);

      // Reset form after successful submission
      setBranchFormData({
        role: '',
        passKey: ''
      });
      
      setError('Role added successfully!');
    } catch (err) {
      console.error('Error adding role:', err);
      setError(err.message || 'Failed to add role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBranchSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, verify the pass key against admin's record
      const adminQuery = query(collection(db, 'admins'), where('passKey', '==', newBranchData.passKey));
      const adminSnapshot = await getDocs(adminQuery);

      if (adminSnapshot.empty) {
        setError('Invalid pass key. Please use the correct admin pass key.');
        setLoading(false);
        return;
      }

      // Check if branch name already exists
      const branchQuery = query(
        collection(db, 'branches'),
        where('branchName', '==', newBranchData.branchName)
      );
      
      const branchSnapshot = await getDocs(branchQuery);
      if (!branchSnapshot.empty) {
        setError('A branch with this name already exists. Please use a different name.');
        setLoading(false);
        return;
      }

      // Get the admin's ID
      const adminDoc = adminSnapshot.docs[0];
      const adminId = adminDoc.id;

      // Create the branch document
      const branchData = {
        branchName: newBranchData.branchName,
        passKey: newBranchData.passKey,
        adminId: adminId,
        createdAt: new Date().toISOString(),
        createdBy: adminId
      };

      // Add to Firestore using the correct collection reference
      const branchesCollection = collection(db, 'branches');
      await addDoc(branchesCollection, branchData);
      
      // Reset form after successful submission
      setNewBranchData({
        branchName: '',
        passKey: ''
      });
      
      setError('Branch added successfully!');
    } catch (err) {
      console.error('Error adding branch:', err);
      setError(err.message || 'Failed to add branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/new-admin-login')}
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
          Create Admin Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Set up your admin account to manage your business
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
                Create PIN (6 digits)
              </label>
              <div className="mt-1">
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  maxLength="6"
                  required
                  value={formData.pin}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-200">
                Confirm PIN
              </label>
              <div className="mt-1">
                <input
                  id="confirmPin"
                  name="confirmPin"
                  type="password"
                  maxLength="6"
                  required
                  value={formData.confirmPin}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passKey" className="block text-sm font-medium text-gray-200">
                Pass Key
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="passKey"
                  name="passKey"
                  type="text"
                  required
                  value={formData.passKey}
                  readOnly
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
                <button
                  type="button"
                  onClick={generatePassKey}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2ECC71] hover:bg-[#27AE60] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
                >
                  Generate
                </button>
              </div>
              {generatedPassKey && (
                <p className="mt-2 text-sm text-gray-200">
                  Generated Pass Key: {generatedPassKey}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !formData.passKey}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2ECC71] hover:bg-[#27AE60] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Branch Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#2ECC71]/20 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h3 className="text-center text-xl font-bold text-white mb-6">Add New Role</h3>
          <form className="space-y-6" onSubmit={handleBranchSubmit}>
            <div>
              <label htmlFor="branchRole" className="block text-sm font-medium text-gray-200">
                Role
              </label>
              <div className="mt-1">
                <input
                  id="branchRole"
                  name="role"
                  type="text"
                  required
                  value={branchFormData.role}
                  onChange={handleBranchFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                  placeholder="Enter new role name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="branchPassKey" className="block text-sm font-medium text-gray-200">
                Pass Key
              </label>
              <div className="mt-1">
                <input
                  id="branchPassKey"
                  name="passKey"
                  type="password"
                  required
                  value={branchFormData.passKey}
                  onChange={handleBranchFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2ECC71] hover:bg-[#27AE60] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
              >
                {loading ? 'Adding Role...' : 'Add Role'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Branch Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#2ECC71]/20 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h3 className="text-center text-xl font-bold text-white mb-6">Add New Branch</h3>
          <form className="space-y-6" onSubmit={handleNewBranchSubmit}>
            <div>
              <label htmlFor="branchName" className="block text-sm font-medium text-gray-200">
                Branch Name
              </label>
              <div className="mt-1">
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  required
                  value={newBranchData.branchName}
                  onChange={handleNewBranchChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                  placeholder="Enter branch name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newBranchPassKey" className="block text-sm font-medium text-gray-200">
                Pass Key
              </label>
              <div className="mt-1">
                <input
                  id="newBranchPassKey"
                  name="passKey"
                  type="password"
                  required
                  value={newBranchData.passKey}
                  onChange={handleNewBranchChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-[#2ECC71] focus:border-[#2ECC71] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2ECC71] hover:bg-[#27AE60] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ECC71]"
              >
                {loading ? 'Adding Branch...' : 'Add Branch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateAccount; 