import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { storeRating } from './utils/ratingUtils';
import StaffDetailsWithScore from './components/StaffDetailsWithScore';

// Import score icons
const fiveCreativityScoreUrl = new URL('./assets/5-creative score.svg', import.meta.url).href;
const fourCreativityScoreUrl = new URL('./assets/4-creative score.svg', import.meta.url).href;
const threeCreativityScoreUrl = new URL('./assets/3-creative score.svg', import.meta.url).href;
const twoCreativityScoreUrl = new URL('./assets/2-creative score.svg', import.meta.url).href;
const oneCreativityScoreUrl = new URL('./assets/1-creative score.svg', import.meta.url).href;
const forwardRoundArrowUrl = new URL('./assets/forward-round-arrow.svg', import.meta.url).href;
const backwardRoundArrowUrl = new URL('./assets/backward-round-arrow.svg', import.meta.url).href;

const RateCreativity = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [weeklyRatings, setWeeklyRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScore, setSelectedScore] = useState(null);
  const [saving, setSaving] = useState(false);

  // Score configurations with points and percentages (hidden from UI)
  const scoreConfig = {
    5: { points: 5, percentage: 100 },
    4: { points: 4, percentage: 80 },
    3: { points: 3, percentage: 60 },
    2: { points: 2, percentage: 40 },
    1: { points: 1, percentage: 20 }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff details
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (!staffDoc.exists()) {
          throw new Error('Staff not found');
        }
        setStaff(staffDoc.data());

        // Fetch weekly ratings
        const monthlyQuery = query(
          collection(db, 'staff', staffId, 'monthlyRatings')
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const weeklyData = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.week - b.week);

        setWeeklyRatings(weeklyData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchData();
    }
  }, [staffId]);

  const handleScoreClick = (score) => {
    setSelectedScore(score);

    // Ensure the score is valid and has a corresponding config
    if (!scoreConfig[score]) {
      console.error('Invalid score selected:', score);
      alert('Invalid score selected.');
      return;
    }

    // Store rating in sessionStorage
    storeRating('creativity', scoreConfig[score].points, scoreConfig[score].percentage);
  };

  const handleBackwardClick = () => {
    navigate(`/rate-time/${staffId}`);
  };

  const handleForwardClick = () => {
    if (selectedScore === null) {
      alert('Please select a score before proceeding.');
      return;
    }
    navigate(`/rate-shelf-cleanliness/${staffId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-white text-center mt-10">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
        <div className="text-red-500 text-center mt-10">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0D1B2A] p-6">
      <div className="flex flex-col items-center pt-8">
        <h1 className="text-white text-3xl font-bold mb-8">Rate Creativity</h1>
        
        {staff && (
          <StaffDetailsWithScore staff={staff} weeklyRatings={weeklyRatings} />
        )}

        {/* Add CREATIVITY text below the rectangle */}
        <div className="flex justify-center w-full mb-4">
          <span className="text-white text-lg sm:text-xl font-bold">🧠 CREATIVITY</span>
        </div>

        {/* White line below the text */}
        <div className="w-full h-px bg-white mb-8"></div>

        {/* Score icons */}
        <div className="w-full max-w-lg sm:max-w-3xl mx-auto space-y-4">
          <div 
            className={`w-full cursor-pointer transition-all duration-200 ${
              selectedScore === 5 
                ? 'scale-105 ring-4 ring-blue-500 rounded-lg bg-blue-500 bg-opacity-20' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleScoreClick(5)}
          >
            <img src={fiveCreativityScoreUrl} alt="5 Creativity Score" className="w-full h-auto" />
          </div>
          <div 
            className={`w-full cursor-pointer transition-all duration-200 ${
              selectedScore === 4 
                ? 'scale-105 ring-4 ring-blue-500 rounded-lg bg-blue-500 bg-opacity-20' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleScoreClick(4)}
          >
            <img src={fourCreativityScoreUrl} alt="4 Creativity Score" className="w-full h-auto" />
          </div>
          <div 
            className={`w-full cursor-pointer transition-all duration-200 ${
              selectedScore === 3 
                ? 'scale-105 ring-4 ring-blue-500 rounded-lg bg-blue-500 bg-opacity-20' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleScoreClick(3)}
          >
            <img src={threeCreativityScoreUrl} alt="3 Creativity Score" className="w-full h-auto" />
          </div>
          <div 
            className={`w-full cursor-pointer transition-all duration-200 ${
              selectedScore === 2 
                ? 'scale-105 ring-4 ring-blue-500 rounded-lg bg-blue-500 bg-opacity-20' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleScoreClick(2)}
          >
            <img src={twoCreativityScoreUrl} alt="2 Creativity Score" className="w-full h-auto" />
          </div>
          <div 
            className={`w-full cursor-pointer transition-all duration-200 ${
              selectedScore === 1 
                ? 'scale-105 ring-4 ring-blue-500 rounded-lg bg-blue-500 bg-opacity-20' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleScoreClick(1)}
          >
            <img src={oneCreativityScoreUrl} alt="1 Creativity Score" className="w-full h-auto" />
          </div>
        </div>

        {/* Text at the bottom of the page */}
        <div className="flex justify-center w-full max-w-lg sm:max-w-3xl mx-auto mt-8 text-white text-center text-sm sm:text-base">
          Creativity is the ability to adapt; without it, systems become stagnant and fail.
        </div>

        {/* Navigation icons */}
        <div className="flex justify-center items-center gap-8 w-full mb-8">
          <img 
            src={backwardRoundArrowUrl} 
            alt="Previous" 
            className="w-12 h-12 sm:w-16 sm:h-16 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={handleBackwardClick}
          />
          <img 
            src={forwardRoundArrowUrl} 
            alt="Next" 
            className="w-12 h-12 sm:w-16 sm:h-16 cursor-pointer hover:scale-110 transition-transform duration-300"
            onClick={handleForwardClick}
          />
        </div>
      </div>
    </div>
  );
};

export default RateCreativity; 