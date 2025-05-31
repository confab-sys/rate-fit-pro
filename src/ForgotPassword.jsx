import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "./utils/database";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const rectangleUrl = new URL('./assets/Rectangle-green.svg', import.meta.url).href;
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent. Please check your inbox.');
      setError('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      console.error('Error resetting password:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center overflow-x-hidden">
      <h1 className="text-white text-3xl sm:text-4xl font-bold mt-10 sm:mt-20 mb-0 animate-fade-in px-4 text-center">
        Reset PIN
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
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors text-center"
            />
            <button
              onClick={handleResetPassword}
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors"
            >
              Send Reset Link
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-in">
              {error}
            </p>
          )}

          {success && (
            <p className="text-emerald-400 text-sm animate-fade-in">
              {success}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
