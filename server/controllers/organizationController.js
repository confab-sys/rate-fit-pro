const Organization = require('../models/Organization');

// Create a new organization
exports.createOrganization = async (req, res) => {
  try {
    const { name, type, parentId, branchName, email } = req.body;

    // Validate parent organization if parentId is provided
    if (parentId) {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) {
        return res.status(404).json({ message: 'Parent organization not found' });
      }
    }

    const organization = new Organization({
      name,
      type,
      parentId,
      branchName,
      email
    });

    await organization.save();
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get organization by ID
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all organizations
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get organization hierarchy tree
exports.getHierarchyTree = async (req, res) => {
  try {
    const tree = await Organization.getHierarchyTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get children of an organization
exports.getChildren = async (req, res) => {
  try {
    const children = await Organization.getChildren(req.params.id);
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update organization
exports.updateOrganization = async (req, res) => {
  try {
    const { name, type, parentId, branchName, email } = req.body;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Validate parent organization if parentId is being updated
    if (parentId && parentId !== organization.parentId.toString()) {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) {
        return res.status(404).json({ message: 'Parent organization not found' });
      }
    }

    organization.name = name || organization.name;
    organization.type = type || organization.type;
    organization.parentId = parentId || organization.parentId;
    organization.branchName = branchName || organization.branchName;
    organization.email = email || organization.email;

    await organization.save();
    res.json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete organization
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if organization has children
    const children = await Organization.getChildren(req.params.id);
    if (children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete organization with children. Please delete or reassign children first.' 
      });
    }

    await organization.remove();
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 