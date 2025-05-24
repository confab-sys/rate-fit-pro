import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import AdminSupervisor from "./AdminSupervisor";
import SupervisorLogin from "./SupervisorLogin";
import AdminLogin from "./AdminLogin";
import WelcomeSupervisor from "./WelcomeSupervisor";
import WelcomeAdmin from "./WelcomeAdmin";
import SupervisorMenu from "./SupervisorMenu";
import AdminMenu from "./AdminMenu";
import HumanResourceMenu from "./HumanResourceMenu";
import CreateAccount from "./CreateAccount";
import ForgotPassword from "./ForgotPassword";
import AddDeleteStaff from './AddDeleteStaff';
import AddStaffForm from './AddStaffForm';
import StaffDirectory from './StaffDirectory';
import DeleteStaffRecord from './DeleteStaffRecord';
import ConfirmDeleteStaff from './ConfirmDeleteStaff';
import RatingStaff1 from './RatingStaff1';
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
        <Route path="/welcome-supervisor" element={<WelcomeSupervisor />} />
        <Route path="/welcome-admin" element={<WelcomeAdmin />} />
        <Route path="/supervisor-menu" element={<SupervisorMenu />} />
        <Route path="/admin-menu" element={<AdminMenu />} />
        <Route path="/human-resource-menu" element={<HumanResourceMenu />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/staff-management" element={<AddDeleteStaff />} />
        <Route path="/add-staff-form" element={<AddStaffForm />} />
        <Route path="/staff-directory" element={<StaffDirectory />} />
        <Route path="/delete-staff-record" element={<DeleteStaffRecord />} />
        <Route path="/confirm-delete/:staffId" element={<ConfirmDeleteStaff />} />
        <Route path="/rating-staff1/:staffId" element={<RatingStaff1 />} />
        <Route path="/rate-time/:staffId" element={<RateTime />} />
        <Route path="/rate-creativity/:staffId" element={<RateCreativity />} />
        <Route path="/rate-shelf-cleanliness/:staffId" element={<RateShelfCleanliness />} />
        <Route path="/rate-stock-management/:staffId" element={<RateStockManagement />} />
        <Route path="/rate-customer-service/:staffId" element={<RateCustomerService />} />
        <Route path="/rate-discipline-cases/:staffId" element={<RateDisciplineCases />} />
        <Route path="/rate-personal-grooming/:staffId" element={<RatePersonalGrooming />} />
        <Route path="/finished-rating/:staffId" element={<FinishedRating />} />
        <Route path="/view-staff-report/:staffId" element={<ViewStaffReport />} />
        <Route path="/staff-analysis/:staffId" element={<StaffAnalysis />} />
        <Route path="/weekly-analysis/:staffId" element={<WeeklyAnalysis />} />
        <Route path="/monthly-analysis" element={<MonthlyAnalysis />} />
        <Route path="/trimester-analysis" element={<TrimesterAnalysis />} />
        <Route path="/six-month-analysis" element={<SixMonthAnalysis />} />
        <Route path="/successfully-rated" element={<SuccessfullyRated />} />
        <Route path="/performance-dashboard" element={<PerformanceDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
