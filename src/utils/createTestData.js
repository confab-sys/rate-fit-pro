import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const createTestStaffData = async () => {
  try {
    // Create a staff member
    const staffRef = collection(db, 'staff');
    const staffDoc = await addDoc(staffRef, {
      name: 'John Doe',
      department: 'Sales',
      dateJoined: new Date('2023-01-01')
    });

    console.log('Created staff document with ID:', staffDoc.id);

    // Create weekly ratings for the staff member
    const weeklyRatingsRef = collection(db, 'staff', staffDoc.id, 'weeklyRatings');
    
    // Create ratings for the last 12 weeks
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Go back i weeks

      const rating = {
        date: date,
        score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        time: Math.floor(Math.random() * 20) + 80,
        creativity: Math.floor(Math.random() * 20) + 80,
        shelf_cleanliness: Math.floor(Math.random() * 20) + 80,
        stock_management: Math.floor(Math.random() * 20) + 80,
        customer_service: Math.floor(Math.random() * 20) + 80,
        discipline_cases: Math.floor(Math.random() * 20) + 80,
        personal_grooming: Math.floor(Math.random() * 20) + 80
      };

      await addDoc(weeklyRatingsRef, rating);
      console.log(`Created weekly rating for week ${i + 1}`);
    }

    console.log('Test data created successfully');
    return true;
  } catch (error) {
    console.error('Error creating test data:', error);
    return false;
  }
}; 