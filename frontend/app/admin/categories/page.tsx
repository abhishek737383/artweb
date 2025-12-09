'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  MoreVertical,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { categoryApi } from '../../lib/api/categories';
import { Category } from '../../../types/category';

// Define a type for category tree node
type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

export default function AdminCategoriesPage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryApi.getAll();
      
      // Ensure all categories have proper IDs
      const normalizedData = data.map(cat => ({
        ...cat,
        id: cat.id || cat._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
      }));
      
      setCategories(normalizedData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle category deletion
  const handleDeleteCategory = async (id: string) => {
    if (!id || id.startsWith('temp-')) {
      alert('Cannot delete unsaved category');
      return;
    }

    if (!confirm('Are you sure you want to delete this category? Products in this category will be moved to Uncategorized.')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const success = await categoryApi.delete(id);
      if (success) {
        alert('Category deleted successfully');
        loadCategories();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete category');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle category status
  const toggleCategoryStatus = async (id: string, currentStatus: boolean = true) => {
    if (!id || id.startsWith('temp-')) {
      alert('Cannot update unsaved category');
      return;
    }

    try {
      await categoryApi.update(id, { isActive: !currentStatus });
      loadCategories();
    } catch (error) {
      console.error('Status toggle error:', error);
      alert('Failed to update category status');
    }
  };

  // Toggle category expansion
  const toggleExpand = (id: string) => {
    if (!id) return;
    setExpandedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const validCategories = categories.filter(cat => cat.id && !cat.id.startsWith('temp-'));
    
    if (selectedCategories.length === validCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(validCategories.map(cat => cat.id!));
    }
  };

  // Handle select category
  const handleSelectCategory = (id: string) => {
    if (!id) return;
    setSelectedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedCategories.length === 0) {
      alert('Please select categories first');
      return;
    }

    // Filter out temporary IDs
    const validSelectedCategories = selectedCategories.filter(id => 
      id && !id.startsWith('temp-')
    );

    if (validSelectedCategories.length === 0) {
      alert('No valid categories selected');
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${validSelectedCategories.length} selected categories?`)) return;
      
      try {
        const promises = validSelectedCategories.map(id => categoryApi.delete(id));
        await Promise.all(promises);
        alert('Selected categories deleted');
        setSelectedCategories([]);
        loadCategories();
      } catch (error) {
        console.error('Bulk delete error:', error);
        alert('Failed to delete selected categories');
      }
    } else if (action === 'activate') {
      try {
        const promises = validSelectedCategories.map(id => 
          categoryApi.update(id, { isActive: true })
        );
        await Promise.all(promises);
        alert('Selected categories activated');
        setSelectedCategories([]);
        loadCategories();
      } catch (error) {
        console.error('Bulk activate error:', error);
        alert('Failed to activate selected categories');
      }
    } else if (action === 'deactivate') {
      try {
        const promises = validSelectedCategories.map(id => 
          categoryApi.update(id, { isActive: false })
        );
        await Promise.all(promises);
        alert('Selected categories deactivated');
        setSelectedCategories([]);
        loadCategories();
      } catch (error) {
        console.error('Bulk deactivate error:', error);
        alert('Failed to deactivate selected categories');
      }
    }
  };

  // Filter categories based on search and status
  const filteredCategories = categories.filter(category => {
    if (!category.id) return false;
    
    const matchesSearch = searchTerm === '' || 
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && category.isActive) ||
      (statusFilter === 'inactive' && !category.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Build category tree
  const buildCategoryTree = (categoriesList: Category[]): CategoryTreeNode[] => {
    const categoryMap = new Map<string, CategoryTreeNode>();
    const tree: CategoryTreeNode[] = [];

    // Initialize all categories with children array
    categoriesList.forEach(category => {
      if (category.id) {
        categoryMap.set(category.id, { ...category, children: [] });
      }
    });

    // Build tree structure
    categoriesList.forEach(category => {
      if (!category.id) return;
      
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  };

  // Render category tree
  const renderCategoryTree = (
    categoryTree: CategoryTreeNode[],
    level: number = 0
  ) => {
    return categoryTree.map(category => {
      const categoryId = category.id || category._id || '';
      const isTemporary = categoryId.startsWith('temp-');
      
      return (
        <div key={categoryId} className="space-y-2">
          <div 
            className={`flex items-center p-3 border rounded-lg transition-colors ${
              selectedCategories.includes(categoryId) 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            } ${isTemporary ? 'opacity-60' : ''}`}
          >
            {/* Expand/Collapse button */}
            <button
              onClick={() => toggleExpand(categoryId)}
              className="p-1 text-gray-400 hover:text-gray-600 mr-2 disabled:opacity-30"
              disabled={!category.children || category.children.length === 0}
            >
              {category.children && category.children.length > 0 ? (
                expandedCategories.includes(categoryId) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedCategories.includes(categoryId)}
              onChange={() => handleSelectCategory(categoryId)}
              disabled={isTemporary}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 disabled:opacity-30"
            />

            {/* Category icon and info */}
            <div className="flex items-center flex-1" style={{ marginLeft: `${level * 24}px` }}>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mr-3">
                {category.children && category.children.length > 0 && expandedCategories.includes(categoryId) ? (
                  <FolderOpen className="w-5 h-5" />
                ) : (
                  <Folder className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`font-medium ${category.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {category.name || 'Unnamed Category'}
                    {isTemporary && (
                      <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        Unsaved
                      </span>
                    )}
                  </span>
                  {!category.isActive && (
                    <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center mt-1 space-x-4">
                  {categoryId && !isTemporary && (
                    <span className="text-xs text-gray-500">
                      ID: {categoryId.substring(0, 8)}...
                    </span>
                  )}
                  {category.parentId && (
                    <span className="text-xs text-gray-500">
                      Parent: {categories.find(c => c.id === category.parentId)?.name || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {category.children && category.children.length > 0 && (
                <span className="text-sm text-gray-500">
                  {category.children.length} subcategories
                </span>
              )}
              
              <button
                onClick={() => toggleCategoryStatus(categoryId, category.isActive)}
                disabled={isTemporary}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30"
                title={category.isActive ? 'Deactivate' : 'Activate'}
              >
                {category.isActive ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              
              {!isTemporary && (
                <Link
                  href={`/admin/categories/edit/${categoryId}`}
                  className="p-2 text-blue-600 hover:text-blue-900 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              )}
              
              <button
                onClick={() => handleDeleteCategory(categoryId)}
                disabled={deleteLoading === categoryId || isTemporary}
                className="p-2 text-red-600 hover:text-red-900 transition-colors disabled:opacity-30"
                title={isTemporary ? 'Cannot delete unsaved category' : 'Delete'}
              >
                {deleteLoading === categoryId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render children if expanded */}
          {expandedCategories.includes(categoryId) && category.children && category.children.length > 0 && (
            <div className="ml-12">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Build category tree from filtered categories
  const categoryTree = buildCategoryTree(filteredCategories);

  // Statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const parentCategories = categories.filter(c => !c.parentId).length;
  const subcategories = categories.filter(c => c.parentId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your product categories</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
          <button
            onClick={loadCategories}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </button>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-800 font-medium">
                {selectedCategories.length} category/categories selected
              </span>
            </div>
            <div className="flex space-x-2">
              <select
                onChange={(e) => handleBulkAction(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={() => setSelectedCategories([])}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first category'
              }
            </p>
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Category
            </Link>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-center justify-between bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center">
                <button onClick={handleSelectAll} className="focus:outline-none mr-3">
                  {selectedCategories.length === filteredCategories.filter(cat => 
                    cat.id && !cat.id.startsWith('temp-')
                  ).length ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Select All
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredCategories.length} categories
                </span>
              </div>
            </div>

            {/* Categories tree */}
            <div className="p-4 space-y-2">
              {renderCategoryTree(categoryTree)}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
            </div>
            <Folder className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCategories}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Parent Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {parentCategories}
              </p>
            </div>
            <FolderOpen className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subcategories</p>
              <p className="text-2xl font-bold text-gray-900">
                {subcategories}
              </p>
            </div>
            <ChevronRight className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
}