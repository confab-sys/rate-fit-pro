import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NewAdminMenu = () => {
  const navigate = useNavigate();
  
  // Import SVG assets
  const staffDirectoryUrl = new URL('./assets/staff-directory.svg', import.meta.url).href;
  const performanceDashboardUrl = new URL('./assets/perfomance-dashboard.svg', import.meta.url).href;
  const insightTrendsUrl = new URL('./assets/insight-trends.svg', import.meta.url).href;
  const alertFromHrUrl = new URL('./assets/alert-from-hr.svg', import.meta.url).href;
  const logOutSquareUrl = new URL('./assets/log-out-square icon.svg', import.meta.url).href;
  const categoryManagerUrl = new URL('./assets/category manager.svg', import.meta.url).href;
  const branchAnalysisUrl = new URL('./assets/branch analysis.svg', import.meta.url).href;
  const branchPerformanceUrl = new URL('./assets/branch perfomance.svg', import.meta.url).href;
  const branchCategoryAnalysisUrl = new URL('./assets/Branch category analysis.svg', import.meta.url).href;

  useEffect(() => {
    const name = sessionStorage.getItem('adminName');
    if (!name) {
      navigate('/new-admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminName');
    navigate('/blank');
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] overflow-x-hidden">
      <div className="p-8">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-16">New Admin Menu</h1>
        
        <div className="grid grid-cols-3 gap-8 sm:gap-16 max-w-4xl mx-auto mt-8">
          <img 
            src={staffDirectoryUrl}
            alt="Staff Directory"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/admin-staff-directory')}
          />
          
          <img 
            src={insightTrendsUrl}
            alt="Insight Trends"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/admin-insight-trends', { state: { fromNewAdminMenu: true } })}
          />

          <img 
            src={alertFromHrUrl}
            alt="HR Alerts"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/hr-alerts')}
          />

          <img 
            src={categoryManagerUrl}
            alt="Category Manager"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/managers-directory')}
          />

          <img 
            src={branchAnalysisUrl}
            alt="Branch Analysis"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/branch-analysis')}
          />

          <img 
            src={branchPerformanceUrl}
            alt="Branch Performance"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/admin-branch-performance', { state: { fromNewAdminMenu: true } })}
          />

          <img 
            src={branchCategoryAnalysisUrl}
            alt="Branch Category Analysis"
            className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={() => navigate('/branch-category-analysis')}
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

export default NewAdminMenu; 