import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WelcomeSupervisor = () => {
  const navigate = useNavigate();
  const [supervisorName, setSupervisorName] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const name = sessionStorage.getItem('supervisorName');
    if (!name) {
      navigate('/supervisor-login');
      return;
    }
    setSupervisorName(name);
  }, [navigate]);

  useEffect(() => {
    if (!supervisorName) return;    const text = `Welcome back, ${supervisorName}! 👋`;
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
  }, [supervisorName]);  const rectangleUrl = new URL('./assets/Rectangle-green.svg', import.meta.url).href;
  const beginRatingUrl = new URL('./assets/begin-rating.svg', import.meta.url).href;
  const logOutUrl = new URL('./assets/log-out.svg', import.meta.url).href;

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">      <div className="w-[95%] max-w-[600px] mx-auto pt-8 sm:pt-16 px-4">
        <div className="w-full h-[70vh] relative rounded-3xl overflow-hidden animate-fade-in">
          <img 
            src={rectangleUrl}
            alt="Green Rectangle"
            className="w-full h-full object-cover rounded-3xl"          />          
          <div className="absolute inset-x-0 top-0 flex justify-center pt-10">
            <h1 
              className={`text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center break-words ${
                animationComplete ? 'animate-none' : 'border-r-4 border-white'
              }`}
              style={{
                minWidth: '1ch',
                whiteSpace: 'pre-wrap'
              }}
            >
              {displayedText}
            </h1>
          </div>
          
          <div className="absolute inset-x-0 top-[35%] flex justify-center">
            <p className="text-white text-lg sm:text-xl md:text-2xl text-center animate-fade-in opacity-0" 
               style={{ 
                 animationDelay: '5s',
                 animationFillMode: 'forwards' 
               }}>
              Let's begin the staff rating performance
            </p>
          </div>
            <div className="absolute inset-x-0 bottom-[35%] flex justify-center">
            <p className="text-white text-base sm:text-lg md:text-xl text-center animate-fade-in opacity-0 italic" 
               style={{ 
                 animationDelay: '6s',
                 animationFillMode: 'forwards' 
               }}>
              The quality of your feedback defines the culture!
            </p>
          </div>
          
          <div className="absolute inset-x-0 bottom-[10%] flex justify-center">
            <img
              src={beginRatingUrl}
              alt="Begin Rating"
              className="w-24 h-24 sm:w-32 sm:h-32 animate-fade-in opacity-0 cursor-pointer hover:scale-110 transition-transform duration-300"
              style={{ 
                animationDelay: '7s',
                animationFillMode: 'forwards' 
              }}
              onClick={() => navigate('/supervisor-menu')}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-[2%] flex justify-center">
            <img 
              src={logOutUrl}
              alt="Log Out"
              className="w-16 h-16 sm:w-20 sm:h-20 animate-fade-in opacity-0 cursor-pointer"              style={{ 
                animationDelay: '8s',
                animationFillMode: 'forwards' 
              }}
              onClick={() => {
                sessionStorage.removeItem('supervisorName');
                navigate('/');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSupervisor;
