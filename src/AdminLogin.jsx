import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getUser } from "./utils/database";
import { verifyBiometric } from "./utils/biometrics";

const AdminLogin = () => {
  const navigate = useNavigate();
  
  // Asset URLs
  const rectangleUrl = new URL('./assets/Rectangle-green.svg', import.meta.url).href;
  const passwordManIcon = new URL('./assets/icon password man.svg', import.meta.url).href;
  const passwordKeyIcon = new URL('./assets/icon password key.svg', import.meta.url).href;
  const unlockIcon = new URL('./assets/unlock password icon.svg', import.meta.url).href;
  const biometricIcon = new URL('./assets/biometric-supervisor.svg', import.meta.url).href;
  
  // State
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPin(value.slice(0, 6));
    console.log('PIN input changed:', value.slice(0, 6));
  };

  const handleBiometricAuth = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }

    try {
      // First check if the user exists and has biometric enabled
      const user = await getUser(email);
      if (!user) {
        setError('User not found');
        return;
      }

      if (!user.biometricRegistered) {
        setError('Biometric authentication not set up for this account');
        return;
      }

      // Attempt biometric verification
      const assertion = await verifyBiometric(email);
      if (!assertion) {
        throw new Error('Biometric verification failed');
      }

      // If verification succeeds, log the user in
      const userData = await loginUser(email, user.pin); // Use stored PIN for Firebase auth
      if (userData) {
        console.log('Biometric login successful for:', userData.name);
        sessionStorage.setItem('adminName', userData.name);
        navigate('/human-resource-menu');
      } else {
        throw new Error('Login failed after biometric verification');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      if (error.message.includes('not supported')) {
        setError('Biometric authentication is not supported on this device');
      } else if (error.message.includes('not set up')) {
        setError('Biometric authentication not set up for this account');
      } else {
        setError('Biometric authentication failed. Please use your PIN.');
      }
    }
  };

  const handleUnlock = async () => {
    console.log('Login attempt - Email:', email, 'PIN length:', pin.length);
    
    if (!email || !pin) {
      setError('Please enter both email and PIN');
      return;
    }
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    try {
      const user = await loginUser(email, pin);
      if (user) {
        console.log('Login successful for:', user.name);
        sessionStorage.setItem('adminName', user.name);
        navigate('/human-resource-menu');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('User not found');
      } else if (err.code === 'auth/wrong-password') {
        setError('Invalid PIN');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center overflow-x-hidden">
      <h1 className="text-white text-3xl sm:text-4xl font-bold mt-10 sm:mt-20 mb-0 animate-fade-in px-4 text-center">
        Human Resource Login
      </h1>
      <div className="relative w-[95%] max-w-[600px] h-[70vh] mt-0 rounded-3xl overflow-hidden">
        <img 
          src={rectangleUrl}
          alt="Green Rectangle"
          className="w-full h-full object-cover animate-fade-in rounded-3xl"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6">
          <div className="w-[85%] sm:w-80 relative">
            <img 
              src={passwordManIcon}
              alt="User Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
          
          <div className="w-[85%] sm:w-80">
            <div className="relative">
              <img 
                src={passwordKeyIcon}
                alt="Password Icon"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={handlePinChange}
                className="w-full px-4 py-2 sm:py-3 pl-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors text-center tracking-widest text-xl"
              />
            </div>
          </div>
          
          {error && (
            <p className="text-red-400 text-sm animate-fade-in">
              {error}
            </p>
          )}

          <div className="flex gap-4 items-center mt-2">
            <img 
              src={unlockIcon}
              alt="Unlock"
              className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={handleUnlock}
            />
            <img 
              src={biometricIcon}
              alt="Use Biometric"
              className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={handleBiometricAuth}
            />
          </div>
          
          <button 
            className="text-white/70 text-sm hover:text-white transition-colors underline underline-offset-2 mt-4"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>
          
          <button 
            className="text-emerald-400/90 text-sm hover:text-emerald-400 transition-colors underline underline-offset-2"
            onClick={() => navigate('/create-account')}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 