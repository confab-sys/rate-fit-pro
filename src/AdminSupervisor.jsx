import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminSupervisor = () => {
  const navigate = useNavigate();
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowText(false);
      setTimeout(() => setShowText(true), 100); // Brief pause before showing again
    }, 5000); // Reset every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
    window.close(); // This will attempt to close the window
    // If window.close() doesn't work (due to browser security), we'll show an alert
    if (!window.closed) {
      alert("Please close this window manually to exit the application.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center">
      <div className="overflow-hidden mt-20 mb-10">
        {showText && (
          <h1 className="text-white text-3xl font-bold whitespace-nowrap animate-typewriter">
            Hello, are you an?
          </h1>
        )}
      </div>
      <img 
        src={new URL('./assets/admin-icon.svg', import.meta.url).href}
        alt="Admin Icon"
        className="w-60 h-auto animate-fade-in cursor-pointer hover:scale-105 transition-transform duration-300"
        onClick={() => navigate('/admin-login')}
      />
      <h2 className="text-white text-2xl font-bold mt-8 mb-8 animate-fade-in">
        or
      </h2>
      <img 
        src={new URL('./assets/supervisor-icon.svg', import.meta.url).href}
        alt="Supervisor Icon"
        className="w-60 h-auto animate-fade-in cursor-pointer hover:scale-105 transition-transform duration-300"
        onClick={() => navigate('/supervisor-login')}
      />
      
      {/* Exit Button */}
      <button
        onClick={handleExit}
        className="mt-12 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold shadow-xl transition duration-300 animate-fade-in"
      >
        Exit Application
      </button>
    </div>
  );
};

export default AdminSupervisor;
