import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminMenu = () => {
  const navigate = useNavigate();
  
  // Import SVG assets
  const staffDirectoryUrl = new URL('./assets/staff-directory.svg', import.meta.url).href;
  const performanceDashboardUrl = new URL('./assets/perfomance-dashboard.svg', import.meta.url).href;
  const insightTrendsUrl = new URL('./assets/insight-trends.svg', import.meta.url).href;
  const addRemoveStaffUrl = new URL('./assets/add-remove staff.svg', import.meta.url).href;
  const alertFromHrUrl = new URL('./assets/alert-from-hr.svg', import.meta.url).href;
  const reportsUrl = new URL('./assets/reprts-supervisor.svg', import.meta.url).href;
  const logOutSquareUrl = new URL('./assets/log-out-square icon.svg', import.meta.url).href;
  const rateStaffSquareUrl = new URL('./assets/rate-staff-square-icon.svg', import.meta.url).href;

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

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-8">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-16">Admin Menu</h1>
        
        <div className="grid grid-cols-3 gap-8 sm:gap-16 max-w-4xl mx-auto mt-8">
          <img 
            src={staffDirectoryUrl}
            alt="Staff Directory"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/staff-directory')}
          />
          
          <div className="flex flex-col items-center">
            <button
              onClick={() => navigate('/staff-directory')}
              className="w-16 h-16 bg-[#1B263B] rounded-full flex items-center justify-center mb-2 hover:bg-[#2C3E50] transition-colors"
            >
              <img src={performanceDashboardUrl} alt="Performance Dashboard" className="w-8 h-8" />
            </button>
            <span className="text-white text-sm">Performance Dashboard</span>
          </div>
          
          <img 
            src={insightTrendsUrl}
            alt="Insight Trends"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/insight-trends')}
          />

          <img 
            src={addRemoveStaffUrl}
            alt="Add/Remove Staff"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/staff-management')}
          />

          <img 
            src={alertFromHrUrl}
            alt="HR Alerts"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-alerts')}
          />

          <img 
            src={rateStaffSquareUrl}
            alt="Rate Staff"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/staff-directory?rateMode=true')}
          />

          <div className="flex flex-col items-center">
            <button
              onClick={() => navigate('/reports')}
              className="w-16 h-16 bg-[#1B263B] rounded-full flex items-center justify-center mb-2 hover:bg-[#2C3E50] transition-colors"
            >
              <img src={reportsUrl} alt="Reports" className="w-8 h-8" />
            </button>
            <span className="text-white text-sm">Reports</span>
          </div>

          <img 
            src={logOutSquareUrl}
            alt="Logout"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminMenu; 