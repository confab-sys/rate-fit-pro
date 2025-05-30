const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

// Create a new organization
router.post('/', organizationController.createOrganization);

// Get all organizations
router.get('/', organizationController.getAllOrganizations);

// Get organization hierarchy tree
router.get('/tree', organizationController.getHierarchyTree);

// Get organization by ID
router.get('/:id', organizationController.getOrganization);

// Get children of an organization
router.get('/:id/children', organizationController.getChildren);

// Update organization
router.put('/:id', organizationController.updateOrganization);

// Delete organization
router.delete('/:id', organizationController.deleteOrganization);

module.exports = router; 