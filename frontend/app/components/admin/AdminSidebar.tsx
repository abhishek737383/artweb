'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FolderOpen,
  Settings,
  LogOut,
  PlusCircle,
  List,
  LayoutDashboard,
  FileText,
  CreditCard,
  Sliders,
  User
} from 'lucide-react';
import { useAdminAuth } from '../../../hooks/useAdminAuth';

// Define types for better type safety
interface NavItem {
  title: string;
  icon: any;
  color: string;
  href?: string;
  subItems?: SubItem[];
}

interface SubItem {
  title: string;
  icon: any;
  href: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  // Updated navigation items with requested changes
  const navigationItems: NavItem[] = [
    { 
      title: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/admin', 
      color: 'blue' 
    },
    { 
      title: 'Users', 
      icon: User, 
      href: '/admin/users', 
      color: 'purple' 
    },
    { 
      title: 'Sliders', 
      icon: Sliders, 
      color: 'orange', 
      href: '/admin/slider' // Changed from subItems to single page
    },
    { 
      title: 'Categories', 
      icon: FolderOpen, 
      color: 'green', 
      subItems: [
        { title: 'All Categories', icon: List, href: '/admin/categories' },
        { title: 'Add Category', icon: PlusCircle, href: '/admin/categories/new' }
      ] 
    },
    { 
      title: 'Products', 
      icon: Package, 
      color: 'indigo', 
      subItems: [
        { title: 'All Products', icon: List, href: '/admin/products' },
        { title: 'Add Product', icon: PlusCircle, href: '/admin/products/new' }
      ] 
    },
    { 
      title: 'Orders', 
      icon: ShoppingCart, 
      href: '/admin/orders', 
      color: 'red' 
    },
    { 
      title: 'Payments', 
      icon: CreditCard, 
      href: '/admin/payments', 
      color: 'emerald' 
    },
    { 
      title: 'Blogs', 
      icon: FileText, 
      color: 'violet', 
      subItems: [
        { title: 'All Blogs', icon: List, href: '/admin/blogs' },
        { title: 'Add Blog', icon: PlusCircle, href: '/admin/blogs/new' }
      ] 
    },
    { 
      title: 'Settings', 
      icon: Settings, 
      href: '/admin/settings', 
      color: 'gray' 
    }
  ];

  const getColorClasses = (color: string, isActive: boolean = false) => {
    if (isActive) {
      const activeColors: Record<string, string> = {
        blue: 'bg-blue-600 text-white border-blue-600',
        green: 'bg-green-600 text-white border-green-600',
        purple: 'bg-purple-600 text-white border-purple-600',
        orange: 'bg-orange-600 text-white border-orange-600',
        red: 'bg-red-600 text-white border-red-600',
        indigo: 'bg-indigo-600 text-white border-indigo-600',
        cyan: 'bg-cyan-600 text-white border-cyan-600',
        emerald: 'bg-emerald-600 text-white border-emerald-600',
        violet: 'bg-violet-600 text-white border-violet-600',
        pink: 'bg-pink-600 text-white border-pink-600',
        gray: 'bg-gray-600 text-white border-gray-600'
      };
      return activeColors[color] || activeColors.gray;
    }

    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
      green: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
      purple: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
      orange: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
      red: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      violet: 'text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100',
      pink: 'text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100',
      gray: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  const checkActivePath = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href;
    }
    if (item.subItems) {
      return item.subItems.some(subItem => pathname === subItem.href);
    }
    return false;
  };

  return (
    <div className="w-64 min-h-[calc(100vh-73px)] bg-white border-r border-gray-200 flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">Admin User</p>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            const hasSubItems = !!item.subItems?.length;
            const isActive = checkActivePath(item);

            // Items with submenus (dropdown)
            if (hasSubItems) {
              const isSubActive = item.subItems!.some(sub => pathname === sub.href);
              
              return (
                <div key={index} className="mb-2">
                  <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isSubActive ? getColorClasses(item.color, true) : getColorClasses(item.color)
                  }`}>
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  
                  {/* Submenu Items */}
                  <div className="ml-4 pl-3 border-l border-gray-200 mt-2 space-y-1">
                    {item.subItems!.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = pathname === subItem.href;
                      
                      return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            isSubActive 
                              ? 'bg-gray-100 text-gray-900 font-medium border-l-2 border-blue-500' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Single items without submenu
            if (item.href) {
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive ? getColorClasses(item.color, true) : getColorClasses(item.color)
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            }

            return null;
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className="flex items-center justify-center space-x-2 w-full px-3 py-2.5 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}