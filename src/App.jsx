import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import AdminSupervisor from "./AdminSupervisor";
import SupervisorLogin from "./SupervisorLogin";
import AdminLogin from "./AdminLogin";
import WelcomeSupervisor from "./WelcomeSupervisor";
import WelcomeAdmin from "./WelcomeAdmin";
import SupervisorMenu from "./SupervisorMenu";
import AdminMenu from "./AdminMenu";
import NewAdminMenu from "./NewAdminMenu";
import NewHrMenu from "./NewHrMenu";
import OperationsMainMenu from "./OperationsMainMenu";
import HumanResourceMenu from "./HumanResourceMenu";
import CreateAccount from "./CreateAccount";
import AdminCreateAccount from "./AdminCreateAccount";
import ForgotPassword from "./ForgotPassword";
import AddDeleteStaff from './AddDeleteStaff';
import HRAddDeleteStaff from './HRAddDeleteStaff';
import AddStaffForm from './AddStaffForm';
import HrAddStaffForm from './HrAddStaffForm';
import StaffDirectory from './StaffDirectory';
import HrStaffDirectory from './HrStaffDirectory';
import DeleteStaffRecord from './DeleteStaffRecord';
import ConfirmDeleteStaff from './ConfirmDeleteStaff';
import RateTime from './RateTime';
import RateCreativity from './RateCreativity';
import RateShelfCleanliness from './RateShelfCleanliness';
import RateStockManagement from './RateStockManagement';
import RateCustomerService from './RateCustomerService';
import RateDisciplineCases from './RateDisciplineCases';
import RatePersonalGrooming from './RatePersonalGrooming';
import FinishedRating from './FinishedRating';
import ViewStaffReport from './ViewStaffReport';
import StaffAnalysis from './StaffAnalysis';
import WeeklyAnalysis from './WeeklyAnalysis';
import MonthlyAnalysis from './MonthlyAnalysis';
import TrimesterAnalysis from './TrimesterAnalysis';
import SixMonthAnalysis from './SixMonthAnalysis';
import SuccessfullyRated from './SuccessfullyRated';
import PerformanceDashboard from './PerformanceDashboard';
import AdminPerformanceDashboard from './AdminPerformanceDashboard';
import HRPerformanceDashboard from './HRPerformanceDashboard';
import AdminBranchPerformance from './AdminBranchPerformance';
import Reports from './Reports';
import InsightTrends from './InsightTrends';
import AdminInsightTrends from './AdminInsightTrends';
import HRInsightTrends from './HRInsightTrends';
import NewAdminLogin from './NewAdminLogin';
import NewHrLogin from './NewHrLogin';
import NewSupervisorLogin from './NewSupervisorLogin';
import HrCreateAccount from './HrCreateAccount';
import NewManagerLogin from './pages/NewManagerLogin';
import NewManagerCreateAccount from './pages/NewManagerCreateAccount';
import OperationsManagerLogin from './pages/OperationsManagerLogin';
import CreateOperationsManager from './pages/CreateOperationsManager';
import AdminStaffDirectory from './AdminStaffDirectory';
import ManagersStaffDirectory from './ManagersStaffDirectory';
import BranchAnalysis from './BranchAnalysis';
import AdminStaffReports from './AdminStaffReports';
import HrViewReport from './HrViewReport';
import HrWeeklyAnalysis from './HrWeeklyAnalysis';
import HrManagersDirectory from './HrManagersDirectory';
import HrBranchAnalysis from './HrBranchAnalysis';
import HrBranchPerformance from './HrBranchPerformance';
import SupervisorStaffDirectory from './SupervisorStaffDirectory';
import SupervisorPerformanceDashboard from './SupervisorPerformanceDashboard';
import SupervisorInsightTrends from './SupervisorInsightTrends';
import ManagerMenu from "./ManagerMenu";
import ManagerViewStaffs from "./ManagerViewStaffs";
import ManagerPerformanceDashboard from "./ManagerPerformanceDashboard";
import ManagerInsightTrends from "./ManagerInsightTrends";
import ManagerViewStaffReport from "./ManagerViewStaffReport";
import ManagerViewWeeklyAnalysis from "./ManagerViewWeeklyAnalysis";

const HomePage = () => {
  const navigate = useNavigate();
  const logoUrl = new URL('./assets/logo-main.svg', import.meta.url).href;
  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center justify-center text-white p-4">
      <img src={logoUrl} alt="Main Logo" className="w-60 h-auto mb-10" />
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-xl transition duration-300"
        onClick={() => navigate('/blank')}
      >
        Proceed
      </button>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blank" element={<AdminSupervisor />} />
        <Route path="/supervisor-login" element={<SupervisorLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/new-admin-login" element={<NewAdminLogin />} />
        <Route path="/new-admin-menu" element={<NewAdminMenu />} />
        <Route path="/new-hr-login" element={<NewHrLogin />} />
        <Route path="/new-hr-menu" element={<NewHrMenu />} />
        <Route path="/operations-manager-login" element={<OperationsManagerLogin />} />
        <Route path="/operations-main-menu" element={<OperationsMainMenu />} />
        <Route path="/new-supervisor-login" element={<NewSupervisorLogin />} />
        <Route path="/new-manager-login" element={<NewManagerLogin />} />
        <Route path="/manager-menu" element={<ManagerMenu />} />
        <Route path="/manager-view-staffs" element={<ManagerViewStaffs />} />
        <Route path="/new-manager-create-account" element={<NewManagerCreateAccount />} />
        <Route path="/hr-create-account" element={<HrCreateAccount />} />
        <Route path="/admin-create-account" element={<AdminCreateAccount />} />
        <Route path="/create-operations-manager" element={<CreateOperationsManager />} />
        <Route path="/welcome-supervisor" element={<WelcomeSupervisor />} />
        <Route path="/welcome-admin" element={<WelcomeAdmin />} />
        <Route path="/supervisor-menu" element={<SupervisorMenu />} />
        <Route path="/admin-menu" element={<AdminMenu />} />
        <Route path="/human-resource-menu" element={<HumanResourceMenu />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/staff-management" element={<AddDeleteStaff />} />
        <Route path="/hr-add-delete-staff" element={<HRAddDeleteStaff />} />
        <Route path="/add-staff-form" element={<AddStaffForm />} />
        <Route path="/hr-add-staff-form" element={<HrAddStaffForm />} />
        <Route path="/staff-directory" element={<StaffDirectory />} />
        <Route path="/hr-staff-directory" element={<HrStaffDirectory />} />
        <Route path="/delete-staff-record" element={<DeleteStaffRecord />} />
        <Route path="/confirm-delete/:staffId" element={<ConfirmDeleteStaff />} />
        <Route path="/rate-time/:staffId" element={<RateTime />} />
        <Route path="/rate-creativity/:staffId" element={<RateCreativity />} />
        <Route path="/rate-shelf-cleanliness/:staffId" element={<RateShelfCleanliness />} />
        <Route path="/rate-stock-management/:staffId" element={<RateStockManagement />} />
        <Route path="/rate-customer-service/:staffId" element={<RateCustomerService />} />
        <Route path="/rate-discipline-cases/:staffId" element={<RateDisciplineCases />} />
        <Route path="/rate-personal-grooming/:staffId" element={<RatePersonalGrooming />} />
        <Route path="/finished-rating/:staffId" element={<FinishedRating />} />
        <Route path="/view-staff-report/:staffId" element={<ViewStaffReport />} />
        <Route path="/hr-view-report/:staffId" element={<HrViewReport />} />
        <Route path="/staff-analysis/:staffId" element={<StaffAnalysis />} />
        <Route path="/weekly-analysis/:staffId" element={<WeeklyAnalysis />} />
        <Route path="/hr-weekly-analysis/:staffId" element={<HrWeeklyAnalysis />} />
        <Route path="/monthly-analysis" element={<MonthlyAnalysis />} />
        <Route path="/trimester-analysis" element={<TrimesterAnalysis />} />
        <Route path="/six-month-analysis" element={<SixMonthAnalysis />} />
        <Route path="/successfully-rated" element={<SuccessfullyRated />} />
        <Route path="/performance-dashboard" element={<SupervisorPerformanceDashboard />} />
        <Route path="/admin-performance-dashboard" element={<AdminPerformanceDashboard />} />
        <Route path="/hr-performance-dashboard" element={<HRPerformanceDashboard />} />
        <Route path="/admin-branch-performance" element={<AdminBranchPerformance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin-staff-reports" element={<AdminStaffReports />} />
        <Route path="/insight-trends" element={<SupervisorInsightTrends />} />
        <Route path="/admin-insight-trends" element={<AdminInsightTrends />} />
        <Route path="/hr-insight-trends" element={<HRInsightTrends />} />
        <Route path="/admin-staff-directory" element={<AdminStaffDirectory />} />
        <Route path="/managers-directory" element={<ManagersStaffDirectory />} />
        <Route path="/hr-managers-directory" element={<HrManagersDirectory />} />
        <Route path="/branch-analysis" element={<BranchAnalysis />} />
        <Route path="/hr-branch-analysis" element={<HrBranchAnalysis />} />
        <Route path="/hr-branch-performance" element={<HrBranchPerformance />} />
        <Route path="/supervisor-staff-directory" element={<SupervisorStaffDirectory />} />
        <Route path="/manager-performance-dashboard" element={<ManagerPerformanceDashboard />} />
        <Route path="/manager-insight-trends" element={<ManagerInsightTrends />} />
        <Route path="/manager-view-staff-report/:staffId" element={<ManagerViewStaffReport />} />
        <Route path="/manager-view-weekly-analysis/:staffId" element={<ManagerViewWeeklyAnalysis />} />
      </Routes>
    </Router>
  );
};

export default App;
