// app/admin/wishlists/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Users, 
  TrendingUp, 
  Package, 
  BarChart3, 
  Download, 
  Filter, 
  Search, 
  ChevronRight,
  ChevronLeft,
  Eye,
  Trash2,
  User,
  Calendar,
  X,
  RefreshCw,
  Crown,
  AlertCircle
} from 'lucide-react';
import { WishlistItem, WishlistStats } from '../../../types/admin';
import { wishlistApi } from '../../lib/api/admin/wishlist';

type Filters = {
  page: number;
  limit: number;
  search: string;
  userId?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'productName' | 'userName';
  sortOrder: 'asc' | 'desc';
};

export default function AdminWishlistsPage() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState<WishlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load wishlists
  const loadWishlists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await wishlistApi.getWishlists(filters);
      
      setWishlists(result.wishlists);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading wishlists:', error);
      setError(error.message || 'Failed to load wishlists. Please make sure you are logged in as an admin.');
      setLoading(false);
    }
  }, [filters]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await wishlistApi.getStats();
      setStats(statsData);
      setStatsLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWishlists();
    loadStats();
  }, [loadWishlists, loadStats]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'limit' ? 1 : prev.page // Reset to page 1 when changing limit
    }));
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadWishlists();
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === wishlists.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlists.map(item => item._id));
    }
  };

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (!selectedItems.length || !confirm(`Delete ${selectedItems.length} selected items?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const success = await wishlistApi.bulkDelete(selectedItems);
      
      if (success) {
        setSelectedItems([]);
        await loadWishlists();
        await loadStats();
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      setError('Failed to delete items. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Delete single item
  const handleDeleteItem = async (id: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from wishlists?`)) {
      return;
    }

    try {
      const success = await wishlistApi.delete(id);
      if (success) {
        await loadWishlists();
        await loadStats();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  // Export data
  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true);
      const blob = await wishlistApi.exportData(format, filters);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wishlists-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wishlist Management</h1>
            <p className="text-gray-600 mt-1">Manage and analyze customer wishlists</p>
          </div>
          
          <div className="flex items-center gap-3">
            
            <button
              onClick={() => {
                loadWishlists();
                loadStats();
              }}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Wishlists */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Wishlists</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalWishlists?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">All time</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">With wishlists</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Most Wishlisted */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Product</p>
                <p className="text-base font-bold text-gray-900 truncate">
                  {statsLoading ? '...' : 
                    stats?.mostWishlistedProducts?.[0]?.productName || 'N/A'
                  }
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {statsLoading ? '...' : 
                    stats?.mostWishlistedProducts?.[0]?.count || 0
                  } saves
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : 
                    stats?.dailyWishlistCount?.find(d => d.date === getTodayDate())?.count || 0
                  }
                </p>
                <p className="text-xs text-gray-600 mt-1">New wishlists today</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user, product..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full lg:w-64"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </form>

            {/* Bulk Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {selectedItems.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedItems.length} selected
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {bulkActionLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete Selected
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="productName-asc">Product A-Z</option>
                <option value="productName-desc">Product Z-A</option>
                <option value="userName-asc">User A-Z</option>
                <option value="userName-desc">User Z-A</option>
              </select>

              {/* Limit */}
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm"
              >
                <Filter className="w-3 h-3 inline mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="text-gray-600">Loading wishlists...</span>
              </div>
            </div>
          ) : wishlists.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No wishlists found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 20,
                    search: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                }}
                className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === wishlists.length && wishlists.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Product</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">User</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Date Added</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Price</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-200">
                    {wishlists.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={() => toggleItemSelection(item._id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </td>
                        
                        {/* Product */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.product?.images?.[0]?.url ? (
                                <Image
                                  src={item.product.images[0].url}
                                  alt={item.product.name || 'Product image'}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <Link 
                                href={`/products/${item.product?.slug || '#'}`}
                                className="font-medium text-gray-900 hover:text-purple-600 transition-colors line-clamp-1 text-sm"
                              >
                                {item.product?.name || 'Unknown Product'}
                              </Link>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {item.product?.category?.name || 'Uncategorized'}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        {/* User */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {item.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.user?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Date */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700 text-sm">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </td>
                        
                        {/* Price */}
                        <td className="py-2 px-3">
                          <span className="font-medium text-gray-900 text-sm">
                            ₹{item.product?.price?.toLocaleString() || '0'}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="py-2 px-3">
                          {item.product?.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            {item.product?.slug && (
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Product"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                            
                            <Link
                              href={`/admin/users/${item.userId}`}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="View User"
                            >
                              <User className="w-4 h-4" />
                            </Link>
                            
                            <button
                              onClick={() => handleDeleteItem(item._id, item.product?.name || 'this item')}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove from Wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems} wishlists
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded font-medium text-sm ${
                            filters.page === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === totalPages}
                      className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Analytics Section */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Wishlisted Products */}
            {stats.mostWishlistedProducts && stats.mostWishlistedProducts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Most Wishlisted Products</h3>
                <div className="space-y-3">
                  {stats.mostWishlistedProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1 text-sm">
                            {product.productName || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {product.count || 0} saves • {product.percentage || 0}%
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/products/${product.productId}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Users */}
            {stats.topUsers && stats.topUsers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Top Users by Wishlists</h3>
                <div className="space-y-3">
                  {stats.topUsers.slice(0, 5).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{user.userName || 'Unknown User'}</p>
                          <p className="text-xs text-gray-600">
                            {user.wishlistCount || 0} items • {user.userEmail || 'No email'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/users/${user.userId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}