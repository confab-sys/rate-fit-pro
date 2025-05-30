import React, { useState, useEffect } from 'react';
import { getOrganizationTree } from '../utils/organizationStructure';
import { FaChevronDown, FaChevronRight, FaUser, FaBuilding, FaUsers } from 'react-icons/fa';

const OrganizationTree = ({ rootId }) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    loadOrganizationTree();
  }, [rootId]);

  const loadOrganizationTree = async () => {
    try {
      setLoading(true);
      const data = await getOrganizationTree(rootId);
      setTree(data);
      // Expand root node by default
      setExpandedNodes(new Set([rootId]));
    } catch (error) {
      console.error('Error loading organization tree:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'admin':
        return <FaUser className="text-red-500" />;
      case 'hr':
        return <FaUsers className="text-blue-500" />;
      case 'operations':
        return <FaBuilding className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  const renderNode = (node) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div className="flex items-center py-2 hover:bg-gray-50">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-2" />}
          {getIcon(node.type)}
          <div className="ml-2">
            <div className="font-medium">{node.name}</div>
            <div className="text-sm text-gray-500">{node.type}</div>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-gray-200">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading organization structure...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!tree) {
    return <div className="p-4">No organization data available</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Organization Structure</h2>
      {renderNode(tree)}
    </div>
  );
};

export default OrganizationTree; 