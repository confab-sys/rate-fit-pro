import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Create a new organization position
export const createOrganizationPosition = async (data) => {
  try {
    // Verify parent exists if parentId is provided
    if (data.parentId) {
      const parentDoc = await getDoc(doc(db, 'organizations', data.parentId));
      if (!parentDoc.exists()) {
        throw new Error('Parent organization not found');
      }
    }

    const newPosition = {
      name: data.name,
      type: data.type,
      parentId: data.parentId || null,
      email: data.email,
      passKey: data.passKey,
      createdAt: serverTimestamp(),
      createdBy: data.createdBy,
      status: 'active'
    };

    const docRef = await addDoc(collection(db, 'organizations'), newPosition);
    return { id: docRef.id, ...newPosition };
  } catch (error) {
    console.error('Error creating organization position:', error);
    throw error;
  }
};

// Get organization hierarchy
export const getOrganizationHierarchy = async (organizationId) => {
  try {
    const hierarchy = [];
    let currentId = organizationId;

    while (currentId) {
      const docRef = doc(db, 'organizations', currentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) break;

      const data = docSnap.data();
      hierarchy.unshift({
        id: currentId,
        ...data
      });

      currentId = data.parentId;
    }

    return hierarchy;
  } catch (error) {
    console.error('Error getting organization hierarchy:', error);
    throw error;
  }
};

// Get all children of an organization
export const getChildren = async (parentId) => {
  try {
    const q = query(
      collection(db, 'organizations'),
      where('parentId', '==', parentId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting children:', error);
    throw error;
  }
};

// Get all positions of a specific type
export const getPositionsByType = async (type) => {
  try {
    const q = query(
      collection(db, 'organizations'),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting positions by type:', error);
    throw error;
  }
};

// Update organization position
export const updateOrganizationPosition = async (id, data) => {
  try {
    const docRef = doc(db, 'organizations', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  } catch (error) {
    console.error('Error updating organization position:', error);
    throw error;
  }
};

// Delete organization position
export const deleteOrganizationPosition = async (id) => {
  try {
    // Check if position has children
    const children = await getChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete position with existing children');
    }

    await deleteDoc(doc(db, 'organizations', id));
    return true;
  } catch (error) {
    console.error('Error deleting organization position:', error);
    throw error;
  }
};

// Get full organization tree
export const getOrganizationTree = async (rootId) => {
  try {
    const buildTree = async (parentId) => {
      const children = await getChildren(parentId);
      const tree = [];

      for (const child of children) {
        const node = {
          id: child.id,
          ...child,
          children: await buildTree(child.id)
        };
        tree.push(node);
      }

      return tree;
    };

    const rootDoc = await getDoc(doc(db, 'organizations', rootId));
    if (!rootDoc.exists()) {
      throw new Error('Root organization not found');
    }

    return {
      id: rootId,
      ...rootDoc.data(),
      children: await buildTree(rootId)
    };
  } catch (error) {
    console.error('Error getting organization tree:', error);
    throw error;
  }
}; 