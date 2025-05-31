import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NewHrMenu = () => {
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
  const categoryManagerUrl = new URL('./assets/category manager.svg', import.meta.url).href;
  const branchAnalysisUrl = new URL('./assets/branch analysis.svg', import.meta.url).href;
  const branchPerformanceUrl = new URL('./assets/branch perfomance.svg', import.meta.url).href;
  const branchCategoryAnalysisUrl = new URL('./assets/Branch category analysis.svg', import.meta.url).href;

  useEffect(() => {
    const name = sessionStorage.getItem('adminName');
    if (!name) {
      navigate('/new-hr-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminName');
    navigate('/blank');
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-8">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-16">New HR Menu</h1>
        
        <div className="grid grid-cols-3 gap-8 sm:gap-16 max-w-4xl mx-auto mt-8">
          <img 
            src={staffDirectoryUrl}
            alt="Staff Directory"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-staff-directory', { state: { fromHrMenu: true } })}
          />
          
          <img 
            src={performanceDashboardUrl}
            alt="Performance Dashboard"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-performance-dashboard', { state: { fromNewHrMenu: true } })}
          />
          
          <img 
            src={insightTrendsUrl}
            alt="Insight Trends"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-insight-trends', { state: { fromNewHrMenu: true } })}
          />

          <img 
            src={addRemoveStaffUrl}
            alt="Add/Remove Staff"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-add-delete-staff', { state: { fromNewHrMenu: true } })}
          />

          <img 
            src={alertFromHrUrl}
            alt="HR Alerts"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/staff-performance-notifications')}
          />

          <img 
            src={reportsUrl}
            alt="Reports"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-staff-directory', { state: { fromNewHrMenu: true } })}
          />

          <img 
            src={categoryManagerUrl}
            alt="Category Manager"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-managers-directory')}
          />

          <img 
            src={branchAnalysisUrl}
            alt="Branch Analysis"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-branch-analysis')}
          />

          <img 
            src={branchPerformanceUrl}
            alt="Branch Performance"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-branch-performance')}
          />

          <img 
            src={branchCategoryAnalysisUrl}
            alt="Branch Category Analysis"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-category-branch-reports')}
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

export default NewHrMenu; 