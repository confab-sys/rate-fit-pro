import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { addUser } from "./utils/database";
import { registerBiometric } from "./utils/biometrics";

const CreateAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.from === 'admin-login' ? 'hr' : 'supervisor';
  
  const rectangleUrl = new URL('./assets/Rectangle-green.svg', import.meta.url).href;
  const passwordManIcon = new URL('./assets/icon password man.svg', import.meta.url).href;
  const passwordKeyIcon = new URL('./assets/icon password key.svg', import.meta.url).href;
  const createAccountIcon = new URL('./assets/create-account.svg', import.meta.url).href;
  const biometricIcon = new URL('./assets/biometric-supervisor.svg', import.meta.url).href;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    confirmPin: ''
  });
  const [error, setError] = useState('');

  const handlePinChange = (field, value) => {
    // Only allow numbers and max 6 digits
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBiometricRegistration = async () => {
    try {
      await registerBiometric(formData.email);
      setError('');
      // Proceed with account creation
      await handleCreateAccount(true);
    } catch (err) {
      console.error('Biometric registration failed:', err);
      // If biometric fails, ask if they want to continue without it
      if (window.confirm('Biometric registration failed. Would you like to continue without biometric authentication?')) {
        await handleCreateAccount(false);
      }
    }
  };

  const handleCreateAccount = async (biometricRegistered = false) => {
    console.log('Starting account creation process...');
    
    if (formData.pin === formData.confirmPin && formData.name && formData.email && formData.pin.length === 6) {
      try {
        console.log('Form validation passed, preparing user data...');
        
        // Create user object
        const userData = {
          name: formData.name,
          email: formData.email,
          pin: formData.pin,
          biometricRegistered
        };

        console.log('Attempting to create user in Firebase...');
        // Add to database with user type
        await addUser(userData, userType);
        console.log('User created successfully in Firebase');

        // Reset form and navigate
        setFormData({
          name: '',
          email: '',
          pin: '',
          confirmPin: ''
        });
        console.log('Navigating to login page...');
        // Navigate to appropriate login page based on user type
        navigate(userType === 'hr' ? '/admin-login' : '/supervisor-login');
      } catch (err) {
        console.error('Detailed error in account creation:', {
          message: err.message,
          code: err.code,
          stack: err.stack
        });
        
        if (err.message === 'Email already exists') {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (err.message === 'Invalid email format') {
          setError('Please enter a valid email address.');
        } else if (err.message === 'PIN is too weak') {
          setError('Please choose a stronger PIN (at least 6 digits).');
        } else {
          setError(`Failed to create account: ${err.message}`);
        }
      }
    } else {
      console.log('Form validation failed:', {
        name: !!formData.name,
        email: !!formData.email,
        pinLength: formData.pin.length,
        pinsMatch: formData.pin === formData.confirmPin
      });
      
      if (!formData.name) {
        setError('Please enter your name');
      } else if (!formData.email) {
        setError('Please enter your email');
      } else if (!formData.pin) {
        setError('Please enter a PIN');
      } else if (formData.pin.length !== 6) {
        setError('PIN must be 6 digits');
      } else if (formData.pin !== formData.confirmPin) {
        setError('PINs do not match');
      } else {
        setError('Please fill all fields correctly');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center overflow-x-hidden">
      <h1 className="text-white text-3xl sm:text-4xl font-bold mt-10 sm:mt-20 mb-0 animate-fade-in px-4 text-center">
        Create {userType === 'hr' ? 'HR' : 'Supervisor'} Account
      </h1>
      <div className="relative w-[95%] max-w-[600px] h-[70vh] mt-0 rounded-3xl overflow-hidden">
        <img 
          src={rectangleUrl}
          alt="Green Rectangle"
          className="w-full h-full object-cover animate-fade-in rounded-3xl"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="w-[85%] sm:w-80 relative">
            <img 
              src={passwordManIcon}
              alt="User Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <div className="w-[85%] sm:w-80 relative">
            <img 
              src={passwordManIcon}
              alt="Email Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <div className="w-[85%] sm:w-80 relative">
            <img 
              src={passwordKeyIcon}
              alt="PIN Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter 6-digit PIN"
              value={formData.pin}
              onChange={(e) => handlePinChange('pin', e.target.value)}
              className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors text-center tracking-widest text-xl"
            />
          </div>

          <div className="w-[85%] sm:w-80 relative">
            <img 
              src={passwordKeyIcon}
              alt="Confirm PIN Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Confirm 6-digit PIN"
              value={formData.confirmPin}
              onChange={(e) => handlePinChange('confirmPin', e.target.value)}
              className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors text-center tracking-widest text-xl"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-in">
              {error}
            </p>
          )}

          <div className="flex gap-4 items-center mt-2">
            <img 
              src={createAccountIcon}
              alt="Create Account"
              className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => handleCreateAccount(false)}
            />
            <img 
              src={biometricIcon}
              alt="Register Biometric"
              className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={handleBiometricRegistration}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
