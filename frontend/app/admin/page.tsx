// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Tag,
  FolderOpen,
  BarChart3,
  Settings,
  Sliders,
  TrendingUp,
  DollarSign,
  UserPlus,
  Image as ImageIcon,
  Eye,
  Clock,
  Star,
  Heart,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ordersApi } from '../lib/api/orders';
import { productApi } from '../lib/api/products';
import { categoryApi } from '../lib/api/categories';
import { sliderAPI } from '../lib/api/slider';
import { authAPI } from '../lib/api/auth';

// Define interfaces
interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  activeSliderImages: number;
  pendingOrders: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  avgOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  time: string;
  icon: any;
  color: string;
  link?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: Array<{ url: string } | string>;
  category?: { name: string } | string;
  sales?: number;
  views?: number;
  rating?: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

// REMOVE the duplicate OrderStats interface and use the one from ordersApi
// Or create a local version that matches what we need
interface DailyRevenueItem {
  date: string;
  revenue: number;
  orders: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

export default function AdminDashboard() {
  const [activeFilter, setActiveFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    activeSliderImages: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    avgOrderValue: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]); // Use any[] to avoid type conflicts
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatsLoading(true);

      // Fetch all data in parallel
      const [
        ordersStats,
        productsData,
        categoriesData,
        sliderData,
        usersData,
        recentOrdersData
      ] = await Promise.allSettled([
        ordersApi.getStats(),
        productApi.getProducts({ page: 1, limit: 1 }),
        categoryApi.getAll(),
        sliderAPI.getSliderImages(),
        authAPI.getUsers(),
        ordersApi.getAllOrders({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      // Process orders stats - use any type to avoid type conflicts
      let totalOrders = 0;
      let totalRevenue = 0;
      let pendingOrders = 0;
      let avgOrderValue = 0;
      let todayOrders = 0;
      let todayRevenue = 0;

      if (ordersStats.status === 'fulfilled') {
        const statsData = ordersStats.value as any; // Use any to avoid type issues
        totalOrders = statsData.totalOrders || 0;
        totalRevenue = statsData.totalRevenue || 0;
        pendingOrders = statsData.pendingOrders || 0;
        avgOrderValue = statsData.avgOrderValue || 0;
        
        // Calculate today's stats - handle optional dailyRevenue
        const today = new Date().toISOString().split('T')[0];
        const dailyRevenue = statsData.dailyRevenue as DailyRevenueItem[] || [];
        const todayData = dailyRevenue.find((item: DailyRevenueItem) => item.date === today);
        todayOrders = todayData?.orders || 0;
        todayRevenue = todayData?.revenue || 0;
      }

      // Process products
      let totalProducts = 0;
      if (productsData.status === 'fulfilled') {
        const products = productsData.value as any;
        totalProducts = products.total || products.count || 0;
      }

      // Process categories
      let totalCategories = 0;
      if (categoriesData.status === 'fulfilled') {
        const categories = categoriesData.value as any[];
        totalCategories = categories.length || 0;
      }

      // Process slider
      let activeSliderImages = 0;
      if (sliderData.status === 'fulfilled') {
        const slider = sliderData.value as any;
        const sliderImages = slider.data || [];
        activeSliderImages = sliderImages.filter((img: any) => img.isActive).length || 0;
      }

      // Process users
      let totalUsers = 0;
      let activeUsers = 0;
      if (usersData.status === 'fulfilled') {
        const usersResponse = usersData.value as any;
        const users = usersResponse.data?.data || usersResponse.users || [];
        totalUsers = users.length;
        activeUsers = users.filter((user: User) => user.isActive !== false).length;
      }

      // Process recent orders
      const recentOrdersList: Order[] = [];
      if (recentOrdersData.status === 'fulfilled') {
        const orders = recentOrdersData.value as any;
        recentOrdersList.push(...(orders.orders || []));
      }

      // Update stats
      setStats({
        totalProducts,
        totalCategories,
        activeSliderImages,
        pendingOrders,
        totalOrders,
        totalRevenue,
        totalUsers,
        activeUsers,
        avgOrderValue,
        todayOrders,
        todayRevenue
      });

      // Generate recent activities
      generateRecentActivities(
        recentOrdersList,
        totalProducts,
        totalCategories,
        activeSliderImages
      );

      // Fetch popular products
      await fetchPopularProducts();

      setRecentOrders(recentOrdersList);
      setStatsLoading(false);
      setLoading(false);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Fetch popular products
  const fetchPopularProducts = async () => {
    try {
      // Get best sellers or featured products
      const params = {
        page: 1,
        limit: 3,
        sortBy: 'sales' as const, // Fix: Use const assertion
        sortOrder: 'desc' as const, // Fix: Use const assertion
        isBestSeller: true
      };

      const response = await productApi.getProducts(params);
      setPopularProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching popular products:', error);
    }
  };

  // Generate recent activities
  const generateRecentActivities = (
    orders: Order[],
    productsCount: number,
    categoriesCount: number,
    sliderCount: number
  ) => {
    const activities: RecentActivity[] = [];

    // Add recent orders
    orders.slice(0, 3).forEach(order => {
      activities.push({
        id: order._id,
        action: 'New Order',
        description: `Order #${order.orderNumber}`,
        time: getTimeAgo(order.createdAt),
        icon: ShoppingCart,
        color: 'green',
        link: `/admin/orders/${order._id}`
      });
    });

    // Add product activity
    if (productsCount > 0) {
      activities.push({
        id: 'products',
        action: 'Products Updated',
        description: `${productsCount} products available`,
        time: 'Recently',
        icon: Package,
        color: 'blue'
      });
    }

    // Add category activity
    if (categoriesCount > 0) {
      activities.push({
        id: 'categories',
        action: 'Categories Active',
        description: `${categoriesCount} categories`,
        time: 'Recently',
        icon: FolderOpen,
        color: 'orange'
      });
    }

    // Add slider activity
    if (sliderCount > 0) {
      activities.push({
        id: 'slider',
        action: 'Slider Active',
        description: `${sliderCount} active slides`,
        time: 'Recently',
        icon: Sliders,
        color: 'cyan'
      });
    }

    // Sort by time (most recent first) and take first 4
    setRecentActivities(activities.slice(0, 4));
  };

  // Helper function to format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get color classes for icons
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      cyan: 'from-cyan-500 to-cyan-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  // Get background color classes
  const getBgColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colors[color] || colors.blue;
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    } else if (value < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Stats data for display
  const statsCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: 'blue',
      change: 'All products in store',
      trend: 0
    },
    {
      title: 'Active Categories',
      value: stats.totalCategories.toLocaleString(),
      icon: FolderOpen,
      color: 'orange',
      change: 'Product categories',
      trend: 0
    },
    {
      title: 'Slider Images',
      value: stats.activeSliderImages.toString(),
      icon: ImageIcon,
      color: 'cyan',
      change: 'Active on homepage',
      trend: 0
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: ShoppingCart,
      color: 'green',
      change: 'Awaiting processing',
      trend: 0
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'purple',
      change: 'All time sales',
      trend: 0
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'indigo',
      change: `${stats.activeUsers} active`,
      trend: 0
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Welcome back! Here's what's happening with your Art Plazaa store.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={statsLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center"
            >
              {statsLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </button>
            
            <div className="flex space-x-2">
              {['today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(stat.color)}`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                {stat.trend !== 0 && (
                  <div className={`inline-flex items-center ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getTrendIcon(stat.trend)}
                    <span className="text-sm font-medium ml-1">
                      {Math.abs(stat.trend)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className={`text-xs ${stat.color === 'green' ? 'text-green-600' : 'text-blue-600'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className={`p-2 rounded-lg ${getBgColor(activity.color)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{activity.action}</p>
                        <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">{activity.time}</p>
                        {activity.link && (
                          <Link
                            href={activity.link}
                            className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Stats */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Today's Orders</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats.todayOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Revenue</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(stats.todayRevenue)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium">{stats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Orders</span>
                  <span className="font-medium text-yellow-600">{stats.pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg Order Value</span>
                  <span className="font-medium">{formatCurrency(stats.avgOrderValue)}</span>
                </div>
              </div>

              <Link
                href="/admin/orders"
                className="block w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium text-center"
              >
                Manage Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">
                      {order.user?.name || 'Customer'} • {getTimeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Products</h2>
          
          {popularProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {popularProducts.map((product, index) => {
                // Safely get image URL
                const imageUrl = product.images?.[0] 
                  ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).url)
                  : null;
                
                // Safely get category name
                const categoryName = product.category
                  ? (typeof product.category === 'string' ? product.category : (product.category as any).name)
                  : 'Uncategorized';

                return (
                  <div 
                    key={product._id || `product-${index}`}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name || 'Product'}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400 absolute inset-0 m-auto" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900 truncate">{product.name || 'Unnamed Product'}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {categoryName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{product.rating || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(product.price || 0)}
                          </span>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{product.views || 0} views</span>
                            <span>{product.sales || 0} sales</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slider Quick Action */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Sliders className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="font-bold text-gray-900">Homepage Slider</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {stats.activeSliderImages} active slides • Manage your homepage banners
          </p>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/slider"
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Manage Slider
            </Link>
            <Link
              href="/admin/slider?add=true"
              className="px-4 py-2 bg-white text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors font-medium"
            >
              Add New
            </Link>
          </div>
        </div>

        {/* Products Quick Action */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Products</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {stats.totalProducts} products • {stats.totalCategories} categories
          </p>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Manage Products
            </Link>
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Add Product
            </Link>
          </div>
        </div>

        {/* Orders Quick Action */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Orders</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {stats.pendingOrders} pending • {stats.totalOrders} total orders
          </p>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Manage Orders
            </Link>
            <Link
              href="/admin/orders?status=pending"
              className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors font-medium"
            >
              View Pending
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}