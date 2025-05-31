import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CategoryAveragesModal from './CategoryAveragesModal';
import RatingCharts from './RatingCharts';
import { useNavigate } from 'react-router-dom';

const PerformanceDashboard = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryAveragesData, setCategoryAveragesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for supervisor/admin session
  useEffect(() => {
    const supervisorName = sessionStorage.getItem('supervisorName');
    const adminName = sessionStorage.getItem('adminName');
    
    if (!supervisorName && !adminName) {
      navigate('/supervisor-login');
    }
  }, [navigate]);

  // Fetch staff list when component mounts
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const staffRef = collection(db, 'staff');
        const staffSnapshot = await getDocs(staffRef);
        const staff = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStaffList(staff);
      } catch (err) {
        console.error('Error fetching staff list:', err);
        setError('Failed to load staff list');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  const handleStaffClick = async (staff) => {
    try {
      setLoading(true);
      setSelectedStaff(staff);
      
      // Fetch the staff's ratings data
      const ratingsRef = collection(db, 'staff', staff.id, 'weekly_ratings');
      const ratingsSnapshot = await getDocs(ratingsRef);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data());

      if (ratings.length === 0) {
        setError('No ratings data available for this staff member');
        return;
      }

      // Calculate category averages
      const categories = ['time', 'creativity', 'shelf_cleanliness', 'stock_management', 
                         'customer_service', 'discipline_cases', 'personal_grooming'];
      
      const categoryAverages = {
        labels: categories.map(cat => cat.replace(/_/g, ' ').toUpperCase()),
        datasets: [{
          label: 'Average Across All Weeks',
          data: categories.map(category => {
            const categoryRatings = ratings
              .map(rating => rating[category]?.percentage || 0)
              .filter(percentage => percentage > 0);
            
            const sum = categoryRatings.reduce((total, percentage) => total + percentage, 0);
            return categoryRatings.length > 0 ? Math.round(sum / categoryRatings.length) : 0;
          }),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)'
          ],
          borderWidth: 1
        }]
      };

      setCategoryAveragesData(categoryAverages);
      setIsModalOpen(true);
      setError(null);
    } catch (error) {
      console.error('Error fetching staff ratings:', error);
      setError('Failed to load staff ratings');
    } finally {
      setLoading(false);
    }
  };

  // Separate StaffCard component
  const StaffCard = ({ staff, ratings, isSelected, onSelect }) => {
    const [showModal, setShowModal] = useState(false);

    const handleGraphClick = (e) => {
      e.stopPropagation(); // Prevent the card click event
      setShowModal(true);
    };

    return (
      <>
        <div
          onClick={() => onSelect(staff)}
          className={`bg-[#1B263B] rounded-lg p-6 hover:bg-[#2C3E50] transition-colors ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xl font-bold">
                  {staff.name.charAt(0)}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{staff.name}</h2>
                <p className="text-gray-300 text-sm">Performance Overview</p>
              </div>
            </div>
            <button
              onClick={handleGraphClick}
              className="p-2 hover:bg-[#2C3E50] rounded-full transition-colors"
              title="View detailed charts"
            >
              📊
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="h-[300px]">
              <RatingCharts 
                aggregatedRatings={{ averageScores: {} }}
                weeklyRatings={ratings}
                currentDate={new Date()}
                staffName={staff.name}
              />
            </div>
          </div>

          {isSelected && (
            <div className="mt-4 text-center">
              <span className="text-blue-400 text-sm">Selected</span>
            </div>
          )}
        </div>

        {/* Modal for detailed charts */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1B263B] rounded-lg p-6 w-[95%] max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1B263B] py-2">
                <h3 className="text-xl font-semibold text-white">
                  {staff.name}'s Detailed Performance Analysis
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Category Averages</h4>
                  <div className="h-[400px]">
                    <RatingCharts 
                      aggregatedRatings={{ averageScores: {} }}
                      weeklyRatings={ratings}
                      currentDate={new Date()}
                      staffName={staff.name}
                    />
                  </div>
                </div>
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Weekly Progress</h4>
                  <div className="h-[400px]">
                    <RatingCharts 
                      aggregatedRatings={{ averageScores: {} }}
                      weeklyRatings={ratings}
                      currentDate={new Date()}
                      staffName={staff.name}
                    />
                  </div>
                </div>
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Category Distribution</h4>
                  <div className="h-[400px]">
                    <RatingCharts 
                      aggregatedRatings={{ averageScores: {} }}
                      weeklyRatings={ratings}
                      currentDate={new Date()}
                      staffName={staff.name}
                    />
                  </div>
                </div>
                <div className="bg-[#0D1B2A] p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Net Growth/Decline</h4>
                  <div className="h-[400px]">
                    <RatingCharts 
                      aggregatedRatings={{ averageScores: {} }}
                      weeklyRatings={ratings}
                      currentDate={new Date()}
                      staffName={staff.name}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (loading && staffList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading staff list...</div>
      </div>
    );
  }

  if (error && staffList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] p-6 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Performance Dashboard</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            ratings={staff.weekly_ratings}
            isSelected={selectedStaff === staff}
            onSelect={(staff) => {
              handleStaffClick(staff);
              setSelectedStaff(staff);
            }}
          />
        ))}
      </div>

      <CategoryAveragesModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
        staffName={selectedStaff?.name}
        categoryAveragesData={categoryAveragesData}
      />
    </div>
  );
};

export default PerformanceDashboard; 