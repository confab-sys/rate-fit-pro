import React from 'react';

const StaffDetailsWithScore = ({ staff, weeklyRatings }) => {
  // Calculate total average score
  const totalAverage = weeklyRatings.length > 0 ? 
    Math.round(weeklyRatings.reduce((sum, rating) => sum + (rating.averagePercentage || 0), 0) / weeklyRatings.length) : 
    0;

  return (
    <div
      className="flex flex-col sm:flex-row items-center w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-lg mb-8"
      style={{ background: 'rgba(217, 217, 217, 0.12)', padding: '1.5rem 1rem', minHeight: '160px' }}
    >
      <img
        src={staff.photo || ''}
        alt={staff.name || 'Staff'}
        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white mb-4 sm:mb-0"
      />
      <div className="sm:ml-8 flex flex-col justify-center min-w-[180px] w-full">
        <h2 className="text-white text-xl sm:text-2xl font-bold mb-1 text-center sm:text-left">{staff.name || 'N/A'}</h2>
        <p className="text-white mb-1 text-center sm:text-left">Staff ID No: {staff.staffIdNo || 'N/A'}</p>
        <p className="text-white mb-1 text-center sm:text-left">Department: {staff.department || 'N/A'}</p>
      </div>
      <div className="flex-1 flex justify-end items-center mt-4 sm:mt-0">
        <div className="bg-white bg-opacity-90 rounded-lg px-6 py-4 flex flex-col items-center justify-center shadow-md">
          <span className="text-[#0D1B2A] text-2xl sm:text-3xl font-extrabold leading-none">
            {totalAverage}%
          </span>
          <span className="text-[#0D1B2A] text-xs sm:text-sm font-semibold mt-1">Total Average</span>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailsWithScore; 