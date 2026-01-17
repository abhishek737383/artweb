'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import {
  Search,
  User,
  ShoppingCart,
  Heart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  Home,
  Tag,
  Info,
  Mail,
  PenTool
} from 'lucide-react';
import { Inter, Playfair_Display } from 'next/font/google';

// Import professional fonts
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter'
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair'
});

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Categories', href: '/categories', icon: Tag },  // Moved before Products
    { name: 'Products', href: '/products', icon: Package },  // Moved after Categories
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${inter.variable} ${playfair.variable} font-sans ${
        isScrolled 
          ? 'bg-white/98 backdrop-blur-sm shadow-md border-b border-gray-100' 
          : 'bg-white border-b border-gray-100'
      }`}>
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Top Row: Logo, Search, User Details */}
          <div className="w-full px-10 xl:px-16 2xl:px-20">
            <div className="flex items-center justify-between h-20 2xl:h-24">
              {/* Logo and Brand Name */}
              <div className="flex items-center flex-shrink-0">
                <Link 
                  href="/" 
                  className="flex items-center space-x-5 group transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative">
                    <div className="w-18 h-18 2xl:w-23 2xl:h-19 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-amber-100 group-hover:border-amber-200 transition-all duration-300">
                      <img 
                        src="/logo1.jpg" 
                        alt="Art Plazaa  - Premium Stationery"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600">
                                <svg class="w-10 h-10 2xl:w-12 2xl:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-3xl 2xl:text-4xl font-bold text-gray-900 tracking-tight font-playfair">
                     Art Plazaa
                    </span>
                    <span className="text-xs text-amber-600 font-medium tracking-[0.3em] uppercase">
                      Premium Stationery
                    </span>
                  </div>
                </Link>
              </div>

              {/* Center: Professional Search Box */}
              <div className="flex-1 max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-10 2xl:mx-16">
                <form onSubmit={handleSearch} className="relative">
                  <div className={`relative transition-all duration-300 ${isSearchFocused ? 'shadow-xl scale-[1.01]' : 'shadow-lg'}`}>
                    <input
                      type="text"
                      placeholder="Find premium pens, notebooks, art supplies, and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="w-full px-8 py-3.5 pl-16 bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-3 focus:ring-amber-400/30 focus:border-amber-400 text-gray-800 placeholder-gray-500 transition-all duration-300 text-base"
                    />
                    <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center">
                      <Search className="w-5 h-5 text-amber-500" />
                      <div className="ml-4 w-px h-6 bg-gradient-to-b from-gray-300/50 to-transparent" />
                    </div>
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-7 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold hover:scale-105 active:scale-95"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: User Details with Professional Icons */}
              <div className="flex items-center space-x-4 2xl:space-x-6">
                {/* Wishlist */}
                <Link 
                  href="/user/wishlist" 
                  className="relative group"
                >
                  <div className="p-2.5 rounded-xl hover:bg-rose-50/50 transition-all duration-300 group hover:shadow-md">
                    <Heart className="w-5 h-5 2xl:w-6 2xl:h-6 text-gray-600 group-hover:text-rose-500 group-hover:scale-110 transition-all duration-300" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-all duration-300">
                        {wishlist.length > 9 ? '9+' : wishlist.length}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Cart */}
                <Link 
                  href="/user/cart" 
                  className="relative group"
                >
                  <div className="p-2.5 rounded-xl hover:bg-amber-50/50 transition-all duration-300 group hover:shadow-md">
                    <ShoppingCart className="w-5 h-5 2xl:w-6 2xl:h-6 text-gray-600 group-hover:text-amber-600 group-hover:scale-110 transition-all duration-300" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-all duration-300">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Professional User Account */}
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-300 group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 2xl:w-11 2xl:h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all duration-300">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        <span className="text-xs text-gray-500 font-medium">Premium Member</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isUserMenuOpen ? 'rotate-180 text-amber-600' : 'text-gray-500 group-hover:text-amber-600'}`} />
                    </button>

                    {/* Professional User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-4 z-50 animate-in slide-in-from-top-5 duration-300">
                        <div className="px-5 py-4 border-b border-gray-200/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-t-2xl">
                          <div className="font-bold text-gray-900 text-lg">{user.name}</div>
                          <div className="text-sm text-gray-600 truncate">{user.email}</div>
                          <div className="text-xs text-amber-600 font-semibold mt-2 bg-white/80 px-3 py-1.5 rounded-full inline-flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                            Premium Member
                          </div>
                        </div>
                        
                        <div className="py-3 space-y-1">
                          <Link
                            href="/user/profile"
                            className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl mx-2 transition-all duration-300 group"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
                              <User className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="ml-3">
                              <span className="font-semibold text-sm">My Profile</span>
                              <div className="text-xs text-gray-500">Personal information</div>
                            </div>
                          </Link>
                          <Link
                            href="/user/orders"
                            className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl mx-2 transition-all duration-300 group"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
                              <Package className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="ml-3">
                              <span className="font-semibold text-sm">My Orders</span>
                              <div className="text-xs text-gray-500">Track & manage orders</div>
                            </div>
                          </Link>
                          <Link
                            href="/user/wishlist"
                            className="flex items-center px-5 py-3.5 text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl mx-2 transition-all duration-300 group"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors duration-300">
                              <Heart className="w-4 h-4 text-rose-600" />
                            </div>
                            <div className="ml-3">
                              <span className="font-semibold text-sm">Wishlist</span>
                              <div className="text-xs text-gray-500">Saved items ({wishlist.length})</div>
                            </div>
                          </Link>
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="flex items-center px-5 py-3.5 text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl mx-2 transition-all duration-300 group"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
                                <Settings className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="ml-3">
                                <span className="font-semibold text-sm">Admin Panel</span>
                                <div className="text-xs text-amber-600">Store management</div>
                              </div>
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-5 py-3.5 text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 rounded-xl mx-2 transition-all duration-300 group mt-3"
                          >
                            <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors duration-300">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div className="ml-3">
                              <span className="font-semibold text-sm">Sign out</span>
                              <div className="text-xs text-rose-500">Logout from account</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link 
                      href="/login" 
                      className="px-5 py-2.5 text-gray-700 hover:text-amber-700 font-medium rounded-xl hover:bg-gray-50/50 transition-all duration-300 border border-gray-300 hover:border-amber-300 hover:shadow-md"
                    >
                      Sign in
                    </Link>
                    <Link 
                      href="/register" 
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Professional Navigation Tabs - Categories before Products */}
          <div className="border-t border-gray-100 bg-gradient-to-r from-amber-50/30 via-white to-amber-50/30">
            <div className="w-full px-10 xl:px-16 2xl:px-20">
              <nav className="flex items-center justify-center space-x-12 xl:space-x-16 py-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative py-3 px-1 transition-all duration-300 font-medium ${
                      pathname === item.href
                        ? 'text-amber-700'
                        : 'text-gray-700 hover:text-amber-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <item.icon className={`w-4 h-4 transition-colors duration-300 ${
                        pathname === item.href ? 'text-amber-600' : 'text-gray-500 group-hover:text-amber-500'
                      }`} />
                      <span className="text-base tracking-wide">{item.name}</span>
                    </div>
                    
                    {/* Professional Active indicator */}
                    {pathname === item.href && (
                      <>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-t-full" />
                        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rotate-45" />
                      </>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top Row: Logo, Name, Icons, Menu */}
          <div className="w-full px-4">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo and Brand Name */}
              <div className="flex items-center flex-shrink-0">
                <Link 
                  href="/" 
                  className="flex items-center space-x-3 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {/* Mobile Logo */}
                  <div className="w-19 h-15 rounded-xl overflow-hidden bg-white shadow-lg border border-amber-100">
                    <img 
                      src="/logo.jpg" 
                      alt="Art Plazaa "
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600">
                              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                  
                  {/* Mobile Brand Name */}
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-900 font-playfair">Art Plazaa  </span>
                    <span className="text-xs text-amber-600 font-medium tracking-wider">Premium</span>
                  </div>
                </Link>
              </div>

              {/* Right: Icons and Menu */}
              <div className="flex items-center space-x-2">
                {/* Wishlist */}
                <Link 
                  href="/user/wishlist" 
                  className="relative p-2"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                      {wishlist.length > 9 ? '9+' : wishlist.length}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link 
                  href="/user/cart" 
                  className="relative p-2"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* Mobile Menu Button */}
                <button
                  ref={mobileMenuButtonRef}
                  className="p-2.5 text-gray-600 hover:text-amber-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Search Box (Always Visible) */}
          <div className="border-t border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50 py-3 px-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search premium stationery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-800 placeholder-gray-500 shadow-sm transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-amber-500" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors duration-200 font-medium text-sm shadow-sm"
              >
                Go
              </button>
            </form>
          </div>

          {/* Mobile Navigation Menu - Categories before Products */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 top-[136px]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div 
                className="absolute top-0 left-0 right-0 bg-white shadow-xl max-h-[calc(100vh-136px)] overflow-y-auto"
                ref={mobileMenuRef}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-4">
                  {/* User Info */}
                  {user ? (
                    <div className="px-4 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-base truncate">{user.name}</div>
                          <div className="text-xs text-gray-600 truncate">{user.email}</div>
                          <div className="text-xs text-amber-600 font-semibold mt-1 bg-amber-50 px-2 py-1 rounded-full inline-block">
                            Premium Member
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="text-gray-700 text-sm mb-3 font-medium">Welcome to Art Plazaa </div>
                        <div className="flex space-x-2">
                          <Link
                            href="/login"
                            className="flex-1 text-center bg-gray-800 text-white px-3 py-2.5 rounded-lg font-semibold hover:bg-gray-900 transition-colors duration-300 text-sm shadow-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            className="flex-1 text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2.5 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 text-sm shadow-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Register
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Navigation Links - Compact with Categories before Products */}
                  <div className="space-y-0.5 px-3 mb-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className={`p-2 rounded-md ${
                          pathname === item.href 
                            ? 'bg-gradient-to-br from-amber-100 to-amber-200' 
                            : 'bg-gray-100'
                        }`}>
                          <item.icon className={`w-4 h-4 ${pathname === item.href ? 'text-amber-600' : 'text-gray-600'}`} />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Additional Mobile User Actions - Compact */}
                  {user && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                        Account
                      </div>
                      
                      <div className="space-y-0.5 px-3 mb-3">
                        <Link
                          href="/user/profile"
                          className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-sm">My Profile</span>
                        </Link>
                        
                        <Link
                          href="/user/orders"
                          className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Package className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-sm">My Orders</span>
                        </Link>
                        
                        <Link
                          href="/user/wishlist"
                          className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="relative">
                            <Heart className="w-4 h-4 text-rose-600" />
                          </div>
                          <span className="font-medium text-sm">Wishlist ({wishlist.length})</span>
                        </Link>
                        
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center space-x-3 px-3 py-2.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-sm">Admin Panel</span>
                          </Link>
                        )}
                      </div>
                      
                      <div className="px-3 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium text-sm">Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="px-4 mt-6 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 text-center">
                      <p className="mb-1">Art Plazaa  Premium Stationery</p>
                      <p>© {new Date().getFullYear()} All rights reserved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-[136px] lg:h-[112px] 2xl:h-[120px]" />
    </>
  ); 
}