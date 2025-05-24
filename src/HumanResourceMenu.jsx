import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HumanResourceMenu = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const name = sessionStorage.getItem('adminName');
    if (!name) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminName');
    navigate('/admin-login');
  };

  // Import SVG assets
  const staffDirectoryUrl = new URL('./assets/hr-staff directory.svg', import.meta.url).href;
  const performanceDashboardUrl = new URL('./assets/hr-performance dashboard.svg', import.meta.url).href;
  const addRemoveStaffUrl = new URL('./assets/hr-add-remove staff.svg', import.meta.url).href;
  const trendAnalysisUrl = new URL('./assets/hr-trend analysis.svg', import.meta.url).href;
  const reportsIconUrl = new URL('./assets/hr-reports icon.svg', import.meta.url).href;
  const deepResearchUrl = new URL('./assets/hr-deep research.svg', import.meta.url).href;
  const alertsUrl = new URL('./assets/hr-alerts.svg', import.meta.url).href;
  const logoutUrl = new URL('./assets/hr-log out icon.svg', import.meta.url).href;
  const rateStaffUrl = new URL('./assets/rate-staff-icon.svg', import.meta.url).href;

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-8">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-16">Human Resource Menu</h1>
        
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4 md:gap-8 max-w-6xl mx-auto">
          {/* Staff Directory */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/staff-directory')}
          >
            <img 
              src={staffDirectoryUrl}
              alt="Staff Directory"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Performance Dashboard */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/performance-dashboard')}
          >
            <img 
              src={performanceDashboardUrl}
              alt="Performance Dashboard"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Add/Remove Staff */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/staff-management')}
          >
            <img 
              src={addRemoveStaffUrl}
              alt="Add/Remove Staff"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Trend Analysis */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/trend-analysis')}
          >
            <img 
              src={trendAnalysisUrl}
              alt="Trend Analysis"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Reports */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/reports')}
          >
            <img 
              src={reportsIconUrl}
              alt="Reports"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Deep Research */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/deep-research')}
          >
            <img 
              src={deepResearchUrl}
              alt="Deep Research"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Rate Staff */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/staff-directory?rateMode=true')}
          >
            <img 
              src={rateStaffUrl}
              alt="Rate Staff"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* HR Alerts */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/hr-alerts')}
          >
            <img 
              src={alertsUrl}
              alt="HR Alerts"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>

          {/* Logout */}
          <div 
            className="flex justify-center items-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={handleLogout}
          >
            <img 
              src={logoutUrl}
              alt="Logout"
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanResourceMenu; 