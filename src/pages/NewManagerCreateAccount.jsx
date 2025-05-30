import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './NewManagerCreateAccount.css';

const NewManagerCreateAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    confirmPin: '',
    passKey: '',
    branch: ''
  });

  const [supervisorData, setSupervisorData] = useState({
    name: '',
    email: '',
    role: 'supervisor',
    branch: '',
    passKey: '',
    managerName: '',
    managerPassKey: '',
    pin: '',
    confirmPin: ''
  });

  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState('');

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
        setError('Error loading branches. Please try again.');
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchManagers = async () => {
      if (supervisorData.branch) {
        try {
          const managersQuery = query(
            collection(db, 'managers'),
            where('branch', '==', supervisorData.branch)
          );
          const managersSnapshot = await getDocs(managersQuery);
          const managersList = managersSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            passKey: doc.data().passKey
          }));
          setManagers(managersList);
          
          // If there's a manager for this branch, set it as the manager name and pass key
          if (managersList.length > 0) {
            setSupervisorData(prev => ({
              ...prev,
              managerName: managersList[0].name,
              managerPassKey: managersList[0].passKey
            }));
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
          setError('Error loading managers. Please try again.');
        }
      }
    };

    fetchManagers();
  }, [supervisorData.branch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSupervisorChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin' || name === 'confirmPin') {
      // Only allow numbers and max 6 digits
      if (value.length <= 6 && /^\d*$/.test(value)) {
        setSupervisorData(prevState => ({
          ...prevState,
          [name]: value
        }));
      }
    } else {
      setSupervisorData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add account creation logic here
    console.log('Create account attempt:', formData);
  };

  const handleSupervisorSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verify PINs match
    if (supervisorData.pin !== supervisorData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Verify PIN length
    if (supervisorData.pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    // Verify that the entered pass key matches the manager's pass key
    if (supervisorData.passKey !== supervisorData.managerPassKey) {
      setError('Invalid pass key. Please enter the correct manager pass key.');
      return;
    }

    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'supervisors'),
        where('email', '==', supervisorData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setError('This email is already registered. Please use a different email.');
        return;
      }

      // Create the supervisor document
      const supervisorDoc = {
        name: supervisorData.name,
        email: supervisorData.email,
        role: supervisorData.role,
        branch: supervisorData.branch,
        managerName: supervisorData.managerName,
        pin: supervisorData.pin,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Add to Firestore
      await addDoc(collection(db, 'supervisors'), supervisorDoc);

      // Reset form
      setSupervisorData({
        name: '',
        email: '',
        role: 'supervisor',
        branch: '',
        passKey: '',
        managerName: '',
        managerPassKey: '',
        pin: '',
        confirmPin: ''
      });

      // Show success message
      setError('Supervisor added successfully!');
    } catch (error) {
      console.error('Error adding supervisor:', error);
      setError('Failed to add supervisor. Please try again.');
    }
  };

  return (
    <div className="manager-create-account-container">
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate('/new-manager-login')}
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

      <div className="forms-wrapper">
        <div className="create-account-form-container">
          <h2>Create Manager Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
              />
            </div>

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
              <label htmlFor="branch">Branch</label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                placeholder="Enter branch"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pin">Create PIN (6 digits)</label>
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

            <div className="form-group">
              <label htmlFor="confirmPin">Re-type PIN</label>
              <input
                type="password"
                id="confirmPin"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                maxLength="6"
                pattern="[0-9]{6}"
                required
                placeholder="Re-enter 6-digit PIN"
              />
            </div>

            <div className="form-group">
              <label htmlFor="passKey">Pass Key</label>
              <input
                type="password"
                id="passKey"
                name="passKey"
                value={formData.passKey}
                onChange={handleChange}
                required
                placeholder="Enter pass key"
              />
            </div>

            <button type="submit" className="create-account-button">
              Create Account
            </button>
          </form>
        </div>

        <div className="add-supervisor-form-container">
          <h2>Add Supervisor</h2>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <form onSubmit={handleSupervisorSubmit}>
            <div className="form-group">
              <label htmlFor="supervisorName">Name</label>
              <input
                type="text"
                id="supervisorName"
                name="name"
                value={supervisorData.name}
                onChange={handleSupervisorChange}
                required
                placeholder="Enter supervisor name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supervisorEmail">Email</label>
              <input
                type="email"
                id="supervisorEmail"
                name="email"
                value={supervisorData.email}
                onChange={handleSupervisorChange}
                required
                placeholder="Enter supervisor email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                id="role"
                name="role"
                value={supervisorData.role}
                onChange={handleSupervisorChange}
                required
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <select
                id="branch"
                name="branch"
                value={supervisorData.branch}
                onChange={handleSupervisorChange}
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

            <div className="form-group">
              <label htmlFor="managerName">Manager Name</label>
              <input
                type="text"
                id="managerName"
                name="managerName"
                value={supervisorData.managerName}
                readOnly
                className="bg-gray-100"
                placeholder="Manager name will appear here"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supervisorPin">Create PIN (6 digits)</label>
              <input
                type="password"
                id="supervisorPin"
                name="pin"
                value={supervisorData.pin}
                onChange={handleSupervisorChange}
                maxLength="6"
                pattern="[0-9]{6}"
                required
                placeholder="Enter 6-digit PIN"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supervisorConfirmPin">Confirm PIN</label>
              <input
                type="password"
                id="supervisorConfirmPin"
                name="confirmPin"
                value={supervisorData.confirmPin}
                onChange={handleSupervisorChange}
                maxLength="6"
                pattern="[0-9]{6}"
                required
                placeholder="Re-enter 6-digit PIN"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supervisorPassKey">Manager's Pass Key</label>
              <input
                type="password"
                id="supervisorPassKey"
                name="passKey"
                value={supervisorData.passKey}
                onChange={handleSupervisorChange}
                required
                placeholder="Enter manager's pass key"
              />
              <small className="text-gray-500">
                Enter the pass key of the manager for the selected branch
              </small>
            </div>

            <button type="submit" className="add-supervisor-button">
              Add Supervisor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewManagerCreateAccount; 