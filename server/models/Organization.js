const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['admin', 'hr', 'operations_manager', 'manager', 'supervisor', 'branch', 'staff']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  branchName: {
    type: String,
    required: function() {
      return this.type === 'branch';
    }
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for efficient querying
organizationSchema.index({ parentId: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ email: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt timestamp
organizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for getting the full hierarchy path
organizationSchema.virtual('hierarchyPath').get(async function() {
  const path = [this];
  let current = this;
  
  while (current.parentId) {
    current = await this.constructor.findById(current.parentId);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }
  
  return path;
});

// Static method to get all children of an organization
organizationSchema.statics.getChildren = async function(parentId) {
  return this.find({ parentId });
};

// Static method to get the full hierarchy tree
organizationSchema.statics.getHierarchyTree = async function() {
  const buildTree = async (parentId = null) => {
    const nodes = await this.find({ parentId });
    const tree = [];
    
    for (const node of nodes) {
      const children = await buildTree(node._id);
      tree.push({
        ...node.toObject(),
        children
      });
    }
    
    return tree;
  };
  
  return buildTree();
};

module.exports = mongoose.model('Organization', organizationSchema); 