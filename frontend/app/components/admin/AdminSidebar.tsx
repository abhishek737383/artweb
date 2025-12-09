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
  Image
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navigationItems = [
    { 
      title: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/admin', 
      color: 'gray' 
    },
    { 
      title: 'Products', 
      icon: Package, 
      color: 'blue', 
      subItems: [
        { title: 'All Products', icon: List, href: '/admin/products' },
        { title: 'Add Product', icon: PlusCircle, href: '/admin/products/new' }
      ] 
    },
    { 
      title: 'Categories', 
      icon: FolderOpen, 
      color: 'orange', 
      subItems: [
        { title: 'All Categories', icon: List, href: '/admin/categories' },
        { title: 'Add Category', icon: PlusCircle, href: '/admin/categories/new' }
      ] 
    },
    { 
      title: 'Orders', 
      icon: ShoppingCart, 
      href: '/admin/orders', 
      color: 'green' 
    },
    { 
      title: 'Customers', 
      icon: Users, 
      href: '/admin/customers', 
      color: 'purple' 
    },
    { 
      title: 'Blogs', 
      icon: FileText, 
      href: '/admin/blogs', 
      color: 'indigo' 
    },
    { 
      title: 'Banners', 
      icon: Image, 
      href: '/admin/banners', 
      color: 'cyan' 
    },
    { 
      title: 'Settings', 
      icon: Settings, 
      href: '/admin/settings', 
      color: 'gray' 
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      gray: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  const getActiveColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600 text-white border-blue-600',
      green: 'bg-green-600 text-white border-green-600',
      purple: 'bg-purple-600 text-white border-purple-600',
      orange: 'bg-orange-600 text-white border-orange-600',
      red: 'bg-red-600 text-white border-red-600',
      indigo: 'bg-indigo-600 text-white border-indigo-600',
      cyan: 'bg-cyan-600 text-white border-cyan-600',
      gray: 'bg-gray-600 text-white border-gray-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="w-64 min-h-[calc(100vh-73px)] bg-white border-r border-gray-200">
      <div className="p-4">
        <div className="mb-8">
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

        <nav className="space-y-1">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            const hasSubItems = !!item.subItems?.length;

            if (hasSubItems) {
              const isSubActive = item.subItems!.some(sub => pathname === sub.href);
              return (
                <div key={index} className="mb-2">
                  <div className={`flex items-center space-x-3 px-3 py-2 mb-1 rounded-lg ${
                    isSubActive ? getActiveColorClasses(item.color) : getColorClasses(item.color)
                  }`}>
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
                    {item.subItems!.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            isSubActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

            // Only render Link if href exists
            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                    isActive ? getActiveColorClasses(item.color) : `${getColorClasses(item.color)} hover:opacity-90`
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            }

            // Fallback for items without href and no subItems
            return (
              <div
                key={index}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg ${getColorClasses(item.color)}`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              // Handle logout
              console.log('Logout clicked');
              window.location.href = '/login';
            }}
            className="flex items-center justify-center space-x-2 w-full px-3 py-3 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}