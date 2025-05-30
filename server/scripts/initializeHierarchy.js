const mongoose = require('mongoose');
const Organization = require('../models/Organization');
require('dotenv').config();

const initializeHierarchy = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staff-rating', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing organizations
    await Organization.deleteMany({});
    console.log('Cleared existing organizations');

    // Create Admin
    const admin = await Organization.create({
      name: 'System Administrator',
      type: 'admin',
      email: 'admin@company.com'
    });
    console.log('Created Admin');

    // Create HR
    const hr = await Organization.create({
      name: 'HR Department',
      type: 'hr',
      parentId: admin._id,
      email: 'hr@company.com'
    });
    console.log('Created HR');

    // Create Operations Manager
    const opsManager = await Organization.create({
      name: 'Operations Manager',
      type: 'operations_manager',
      parentId: hr._id,
      email: 'ops@company.com'
    });
    console.log('Created Operations Manager');

    // Create Manager
    const manager = await Organization.create({
      name: 'Store Manager',
      type: 'manager',
      parentId: opsManager._id,
      email: 'manager@company.com'
    });
    console.log('Created Manager');

    // Create Supervisor
    const supervisor = await Organization.create({
      name: 'Store Supervisor',
      type: 'supervisor',
      parentId: manager._id,
      email: 'supervisor@company.com'
    });
    console.log('Created Supervisor');

    // Create Branch
    const branch = await Organization.create({
      name: 'Main Branch',
      type: 'branch',
      parentId: supervisor._id,
      branchName: 'Main Street Branch',
      email: 'mainbranch@company.com'
    });
    console.log('Created Branch');

    // Create Staff
    const staff = await Organization.create({
      name: 'John Doe',
      type: 'staff',
      parentId: branch._id,
      email: 'john@company.com'
    });
    console.log('Created Staff');

    console.log('Hierarchy initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing hierarchy:', error);
    process.exit(1);
  }
};

initializeHierarchy(); 