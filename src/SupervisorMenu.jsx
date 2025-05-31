import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SupervisorMenu = () => {
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
    const name = sessionStorage.getItem('supervisorName');
    if (!name) {
      navigate('/supervisor-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('supervisorName');
    navigate('/blank');
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-8">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-16">Supervisor Menu</h1>
        
        <div className="grid grid-cols-3 gap-8 sm:gap-16 max-w-4xl mx-auto mt-8">
          <img 
            src={staffDirectoryUrl}
            alt="Staff Directory"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/supervisor-staff-directory')}
          />
          
          <img 
            src={performanceDashboardUrl}
            alt="Performance Dashboard"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/performance-dashboard', { state: { fromSupervisorMenu: true } })}
          />
          
          <img 
            src={insightTrendsUrl}
            alt="Insight Trends"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/insight-trends', { state: { fromSupervisorMenu: true } })}
          />

          <img 
            src={addRemoveStaffUrl}
            alt="Add/Remove Staff"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/staff-management', { state: { fromSupervisorMenu: true } })}
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
            onClick={() => navigate('/supervisor-staff-directory', { state: { rateMode: true } })}
          />

          <img 
            src={reportsUrl}
            alt="Reports"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/supervisor-staff-directory')}
          />

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

export default SupervisorMenu;
