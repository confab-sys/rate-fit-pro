import React from 'react';
import { useNavigate } from 'react-router-dom';

const AddDeleteStaff = () => {
  const navigate = useNavigate();
  const addStaffButtonUrl = new URL('./assets/add-staff button.svg', import.meta.url).href;
  const deleteStaffButtonUrl = new URL('./assets/delete-staff button.svg', import.meta.url).href;

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex flex-col items-center">
      <h1 className="text-white text-2xl pt-8 text-center">Do you want to ?</h1>
      <img
        src={addStaffButtonUrl}
        alt="Add Staff"
        className="w-48 h-48 mt-8 cursor-pointer hover:scale-110 transition-transform duration-300"
        onClick={() => navigate('/add-staff-form')}
      />
      <h2 className="text-white text-2xl mt-8">or</h2>
      <img
        src={deleteStaffButtonUrl}
        alt="Delete Staff"
        className="w-48 h-48 mt-8 cursor-pointer hover:scale-110 transition-transform duration-300"
        onClick={() => navigate('/staff-directory?deleteMode=true')}
      />
    </div>
  );
};

export default AddDeleteStaff;