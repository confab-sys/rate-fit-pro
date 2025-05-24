import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WelcomeAdmin = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const name = sessionStorage.getItem('adminName');
    if (!name) {
      navigate('/admin-login');
      return;
    }
    setAdminName(name);
  }, [navigate]);

  useEffect(() => {
    if (!adminName) return;
    const text = `Welcome back, ${adminName}! 👋`;
    const duration = 5000; // 5 seconds
    const intervalPerChar = duration / text.length;

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setAnimationComplete(true);
      }
    }, intervalPerChar);

    return () => clearInterval(intervalId);
  }, [adminName]);

  const rectangleUrl = new URL('./assets/Rectangle-green.svg', import.meta.url).href;
  const beginRatingUrl = new URL('./assets/begin-rating.svg', import.meta.url).href;
  const logOutUrl = new URL('./assets/log-out.svg', import.meta.url).href;

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center">
      <div className="relative w-[95%] max-w-[600px] h-[70vh] mt-20 rounded-3xl overflow-hidden">
        <img 
          src={rectangleUrl}
          alt="Green Rectangle"
          className="w-full h-full object-cover animate-fade-in rounded-3xl"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-8 text-center px-4">
            {displayedText}
          </h1>
          {animationComplete && (
            <div className="flex flex-col items-center gap-8">
              <img 
                src={beginRatingUrl}
                alt="Begin Rating"
                className="w-48 h-48 cursor-pointer hover:scale-110 transition-transform duration-300"
                onClick={() => navigate('/admin-menu')}
              />
              <img 
                src={logOutUrl}
                alt="Log Out"
                className="w-48 h-48 cursor-pointer hover:scale-110 transition-transform duration-300"
                onClick={() => {
                  sessionStorage.removeItem('adminName');
                  navigate('/admin-login');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeAdmin; 