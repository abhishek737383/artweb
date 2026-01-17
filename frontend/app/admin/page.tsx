'use client';

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
  Image,
  Eye,
  Clock,
  Star
} from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const [activeFilter, setActiveFilter] = useState('today');

  const stats = [
    {
      title: 'Total Products',
      value: '125',
      icon: Package,
      color: 'blue',
      change: '+12 added'
    },
    {
      title: 'Active Categories',
      value: '15',
      icon: FolderOpen,
      color: 'orange',
      change: '+2 new'
    },
    {
      title: 'Slider Images',
      value: '8',
      icon: Image,
      color: 'cyan',
      change: 'Active'
    },
    {
      title: 'Pending Orders',
      value: '42',
      icon: ShoppingCart,
      color: 'green',
      change: '+5 new'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New product added',
      description: 'Premium Watercolor Set',
      time: '10 minutes ago',
      icon: Package,
      color: 'blue'
    },
    {
      id: 2,
      action: 'Category updated',
      description: 'Sketchbooks & Drawing',
      time: '1 hour ago',
      icon: FolderOpen,
      color: 'orange'
    },
    {
      id: 3,
      action: 'Slider image updated',
      description: 'Homepage banner',
      time: '2 hours ago',
      icon: Sliders,
      color: 'cyan'
    },
    {
      id: 4,
      action: 'New customer registered',
      description: 'John Doe',
      time: '3 hours ago',
      icon: UserPlus,
      color: 'green'
    }
  ];

  const popularProducts = [
    {
      id: 1,
      name: 'Premium Watercolor Set',
      category: 'Painting',
      views: '1.2K',
      sales: '45',
      rating: '4.8'
    },
    {
      id: 2,
      name: 'Artist Sketchbook',
      category: 'Drawing',
      views: '980',
      sales: '38',
      rating: '4.7'
    },
    {
      id: 3,
      name: 'Calligraphy Pen Set',
      category: 'Calligraphy',
      views: '850',
      sales: '32',
      rating: '4.9'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      cyan: 'from-cyan-500 to-cyan-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with yourArt Plazaa store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </p>
                  <p className={`text-sm ${stat.color === 'green' ? 'text-green-600' : 'text-blue-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(stat.color)}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <div className="flex space-x-2">
                {['today', 'week', 'month'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-colors ${
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

            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div 
                    key={activity.id}
                    className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getBgColor(activity.color)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Popular Products */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Products</h2>
            
            <div className="space-y-4">
              {popularProducts.map((product) => (
                <div 
                  key={product.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{product.views} views</span>
                    </div>
                    <div className="text-green-600 font-medium">
                      {product.sales} sales
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slider Quick Preview */}
      <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Homepage Slider Status
            </h3>
            <p className="text-gray-600">
              8 active slides running • Last updated 2 hours ago
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/admin/slider"
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Manage Slider
            </a>
            <a
              href="/admin/slider?add=true"
              className="px-4 py-2 bg-white text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors font-medium"
            >
              Add New
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}