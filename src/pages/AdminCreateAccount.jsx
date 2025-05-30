import { createOrganizationPosition } from '../utils/organizationStructure';
import OrganizationTree from '../components/OrganizationTree';
import { doc, getDoc } from 'firebase/firestore';

const handleBranchSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // First verify if we have the admin ID
    if (!adminId) {
      throw new Error('Admin ID not found. Please log in again.');
    }

    // Get the admin document directly using the ID
    const adminDocRef = doc(db, 'admins', adminId);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      throw new Error('Admin account not found');
    }

    const adminData = adminDoc.data();

    // Verify the pass key matches
    if (adminData.passKey !== passKey) {
      throw new Error('Invalid pass key. Please use the correct admin pass key.');
    }

    // Create new role in the flat structure
    const newRole = {
      name: branchName,
      type: branchType,
      parentId: adminId, // Set parent as the admin
      email: branchEmail,
      passKey: branchPassKey,
      createdBy: adminId
    };

    await createOrganizationPosition(newRole);

    // Clear form
    setBranchName('');
    setBranchType('');
    setBranchEmail('');
    setBranchPassKey('');
    setPassKey('');
    setShowBranchForm(false);

    // Show success message
    alert('New role created successfully!');
  } catch (error) {
    console.error('Error creating role:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

return (
  <div className="min-h-screen bg-gray-100">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Account Creation</h1>
        
        {/* Organization Tree View */}
        {adminId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <OrganizationTree rootId={adminId} />
          </div>
        )}

        {/* Rest of the existing JSX */}
      </div>
    </div>
  </div>
); 