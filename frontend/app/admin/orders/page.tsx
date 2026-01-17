'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Download, 
  Filter, 
  Search, 
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Clock
} from 'lucide-react';
import { ordersApi } from '../../lib/api/orders';

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  createdAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    city: string;
    state: string;
  };
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  ordersByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  recentOrders: Order[];
}

interface Filters {
  page: number;
  limit: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  sortBy: 'createdAt' | 'total' | 'orderNumber';
  sortOrder: 'asc' | 'desc';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ordersApi.getAllOrders(filters);
      
      setOrders(result.orders);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setError(error.message || 'Failed to load orders. Please make sure you are logged in.');
      setLoading(false);
    }
  }, [filters]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await ordersApi.getStats();
      setStats(statsData);
      setStatsLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [loadOrders, loadStats]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'limit' ? 1 : prev.page
    }));
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle order selection
  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) 
        ? prev.filter(order => order !== id) 
        : [...prev, id]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingStatus(orderId);
      const response = await ordersApi.updateOrderStatus(orderId, status);
      
      if (response.success) {
        setShowStatusMenu(null);
        await loadOrders();
        await loadStats();
      } else {
        alert(response.error || 'Failed to update status');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Export data
  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true);
      const blob = await ordersApi.exportOrders(format, filters);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.${format}`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Package className="w-3 h-3" />;
      case 'shipped': return <Truck className="w-3 h-3" />;
      case 'delivered': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <Package className="w-3 h-3" />;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
    { value: 'processing', label: 'Processing', color: 'text-purple-600' },
    { value: 'shipped', label: 'Shipped', color: 'text-indigo-600' },
    { value: 'delivered', label: 'Delivered', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage and track customer orders</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadOrders();
                loadStats();
              }}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => handleExportData('csv')}
                disabled={exportLoading}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium flex items-center text-sm disabled:opacity-50"
              >
                {exportLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Orders */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalOrders?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">All time</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `₹${stats?.totalRevenue?.toLocaleString() || 0}`}
                </p>
                <p className="text-xs text-green-600 mt-1">All time</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `₹${stats?.avgOrderValue?.toLocaleString() || 0}`}
                </p>
                <p className="text-xs text-blue-600 mt-1">Per order</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.pendingOrders || 0}
                </p>
                <p className="text-xs text-amber-600 mt-1">Needs attention</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
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
                  placeholder="Search by order number, customer name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full lg:w-80"
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

            {/* Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {selectedOrders.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedOrders.length} selected
                </span>
              )}

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

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
                <option value="total-desc">Highest Amount</option>
                <option value="total-asc">Lowest Amount</option>
                <option value="orderNumber-asc">Order # A-Z</option>
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
                value={filters.startDate}
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
                value={filters.endDate}
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

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="text-gray-600">Loading orders...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 20,
                    search: '',
                    status: '',
                    startDate: '',
                    endDate: '',
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
                          checked={selectedOrders.length === orders.length && orders.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Order #</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Customer</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Date</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Items</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Amount</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Payment</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleOrderSelection(order._id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </td>
                        
                        {/* Order Number */}
                        <td className="py-2 px-3">
                          <div className="font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                        </td>
                        
                        {/* Customer */}
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {order.user?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {order.user?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        
                        {/* Date */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700 text-sm">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </td>
                        
                        {/* Items */}
                        <td className="py-2 px-3">
                          <span className="font-medium text-gray-900 text-sm">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        
                        {/* Amount */}
                        <td className="py-2 px-3">
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{order.total.toLocaleString()}
                          </span>
                        </td>
                        
                        {/* Payment */}
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="py-2 px-3">
                          <div className="relative">
                            <button
                              onClick={() => setShowStatusMenu(showStatusMenu === order._id ? null : order._id)}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}
                            >
                              {getStatusIcon(order.orderStatus)}
                              {order.orderStatus}
                              <ChevronRight className={`w-3 h-3 transition-transform ${showStatusMenu === order._id ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {showStatusMenu === order._id && (
                              <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                {statusOptions.map(option => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleUpdateStatus(order._id, option.value)}
                                    disabled={updatingStatus === order._id || order.orderStatus === option.value}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${option.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    <span>{option.label}</span>
                                    {updatingStatus === order._id && option.value === order.orderStatus ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : order.orderStatus === option.value && (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {/* Removed the problematic user link - will be added back when we have proper admin users page */}
                            {/*
                            <Link
                              href={`/admin/users/${order.userId}`}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="View Customer"
                            >
                              <Users className="w-4 h-4" />
                            </Link>
                            */}
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
                    Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems} orders
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

        {/* Recent Orders & Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Recent Orders</h3>
              <div className="space-y-3">
                {stats.recentOrders?.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-600">
                        {order.user?.name || 'Customer'} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">₹{order.total.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Orders by Status</h3>
              <div className="space-y-3">
                {stats.ordersByStatus?.map((stat) => (
                  <div key={stat.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stat.status === 'pending' ? 'bg-yellow-500' :
                        stat.status === 'confirmed' ? 'bg-blue-500' :
                        stat.status === 'processing' ? 'bg-purple-500' :
                        stat.status === 'shipped' ? 'bg-indigo-500' :
                        stat.status === 'delivered' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium text-gray-900 capitalize">{stat.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{stat.count}</span>
                      <span className="text-sm text-gray-600">({stat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}