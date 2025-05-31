import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const FinishedRating = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const handleConfirmRating = () => {
    navigate('/successfully-rated');
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] flex items-center justify-center">
      <div className="text-center">
        <button
          onClick={handleConfirmRating}
          className="bg-green-500 hover:bg-green-600 text-white text-lg font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Confirm Rating Staff
        </button>
      </div>
    </div>
  );
};

export default FinishedRating;