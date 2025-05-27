import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeepResearch = () => {
  const navigate = useNavigate();

  // Import icons from assets folder
  const staffDeclineUrl = new URL('./assets/staff decline icon.svg', import.meta.url).href;
  const metricAnalysisUrl = new URL('./assets/metric analysis icon.svg', import.meta.url).href;
  const departmentAnalysisUrl = new URL('./assets/department analysis icon.svg', import.meta.url).href;
  const staffPromotionUrl = new URL('./assets/staff promotion icon.svg', import.meta.url).href;
  const chatAnalysisUrl = new URL('./assets/chat analysis icon.svg', import.meta.url).href;
  const mainAnalysisUrl = new URL('./assets/main analysis menu.svg', import.meta.url).href;

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-3xl font-bold">Deep Research</h1>
          <div className="flex gap-4">
            {sessionStorage.getItem('adminName') && (
              <button 
                onClick={() => navigate('/human-resource-menu')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return Menu
              </button>
            )}
            {sessionStorage.getItem('supervisorName') && !sessionStorage.getItem('adminName') && (
              <button 
                onClick={() => navigate('/supervisor-menu')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Main Menu
              </button>
            )}
          </div>
        </div>

        {/* Grid of icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {/* Staff Decline */}
          <div 
            onClick={() => navigate('/staff-decline-analysis')}
            className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer"
          >
            <img 
              src={staffDeclineUrl}
              alt="Staff Decline"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>

          {/* Metric Analysis */}
          <div className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer">
            <img 
              src={metricAnalysisUrl}
              alt="Metric Analysis"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>

          {/* Department Analysis */}
          <div className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer">
            <img 
              src={departmentAnalysisUrl}
              alt="Department Analysis"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>

          {/* Staff Promotion */}
          <div className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer">
            <img 
              src={staffPromotionUrl}
              alt="Staff Promotion"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>

          {/* Chat Analysis */}
          <div className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer">
            <img 
              src={chatAnalysisUrl}
              alt="Chat Analysis"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>

          {/* Main Analysis Menu */}
          <div className="flex items-center justify-center p-4 bg-[#1B263B] rounded-lg hover:bg-[#2A3B55] transition-colors cursor-pointer">
            <img 
              src={mainAnalysisUrl}
              alt="Main Analysis Menu"
              className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearch; 