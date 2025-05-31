import React from 'react';

const SuccessfullyRated = () => {
  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
      <div className="flex flex-col space-y-4">
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-colors"
        >
          View Staff Report
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg transition-colors"
        >
          Rate Another Staff
        </button>
      </div>
    </div>
  );
};

export default SuccessfullyRated;