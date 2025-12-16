'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Crown,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Grid,
  List,
  ChevronDown,
  X,
  Search
} from 'lucide-react';
import { productApi } from '../lib/api/products';
import { Product } from '../../types/product';
import ProductCard from '../components/shared/ProductCard';

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl mb-4"></div>
    <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
    <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-3"></div>
    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-1/2"></div>
  </div>
);

const ListViewSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
    <div className="w-full h-48 md:w-40 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg flex-shrink-0"></div>
    <div className="flex-1">
      <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-3 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-1/2 mb-4"></div>
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-24"></div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
      </div>
    </div>
  </div>
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sortBy: 'createdAt',
    search: ''
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load
  const loadProducts = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const result = await productApi.getProducts({
        page: pageNum,
        limit: 12,
        isActive: true,
        sortBy: filters.sortBy,
        sortOrder: filters.sortBy === 'price-desc' ? 'desc' : 'asc'
      });
      
      if (reset) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      
      setHasMore(pageNum < result.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  }, [filters.sortBy]);

  // Initial load
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadProducts(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadProducts]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];
    
    if (filters.category) {
      // Filter by category
    }
    
    if (filters.priceRange) {
      // Filter by price
    }
    
    if (filters.search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, filters]);

  return (
    <main className="min-h-screen bg-white pt-16 md:pt-24"> {/* Added padding for fixed header */}
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b border-gray-200 -mt-16 md:-mt-24"> {/* Negative margin to offset header padding */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20 pt-24 md:pt-32"> {/* Increased top padding */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left side: Title with Premium badge */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center">
                    <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></div>
                    <span className="text-purple-600 font-bold text-sm uppercase tracking-wider">Premium</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                    All <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Products</span>
                  </h1>
                </div>
                <p className="text-gray-600 text-sm md:text-base mt-1 hidden md:block">
                  Discover our complete collection of premium art supplies and stationery
                </p>
              </div>
            </div>

            {/* Search Bar for Desktop */}
            <div className="relative w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-64 lg:w-80 text-sm md:text-base"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {filters.search && (
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-300">
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 hidden md:block">View:</span>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600' : 'hover:bg-gray-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600' : 'hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm w-full md:w-auto"
            >
              <option value="createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>

            {/* Mobile Search - Hidden on desktop */}
            <div className="relative md:hidden">
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-32 text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.category || filters.priceRange) && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-sm">Active filters:</span>
            {filters.search && (
              <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-xs flex items-center gap-1">
                Search: {filters.search}
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button 
              onClick={() => setFilters({ category: '', priceRange: '', sortBy: 'createdAt', search: '' })}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              Clear all
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Products Grid - Updated for 2 columns on mobile */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'flex flex-col'} gap-3 sm:gap-4 md:gap-6`}>
          {viewMode === 'grid' ? (
            // Grid View - 2 columns on mobile, 2 on sm, 3 on md, 4 on lg
            loading && products.length === 0 ? (
              [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
              filteredProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  priority={index < 4} // Prioritize first 4 images
                />
              ))
            )
          ) : (
            // List View
            loading && products.length === 0 ? (
              [...Array(4)].map((_, i) => <ListViewSkeleton key={i} />)
            ) : (
              filteredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 hover:shadow-lg transition-all duration-300">
                  {/* Image Container with fixed dimensions */}
                  <div className="w-full md:w-40 h-48 md:h-40 relative flex-shrink-0 overflow-hidden rounded-lg">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 160px"
                        quality={75}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="text-gray-400 text-center">
                          <div className="text-4xl">🎨</div>
                          <div className="text-xs mt-2">No Image</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription || product.description}</p>
                        <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
                          {product.category && (
                            <span className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded">
                              {product.category.name}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end">
                        <div className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                          ₹{product.price.toLocaleString()}
                        </div>
                        <button className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm font-medium w-full md:w-auto">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Load More Indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="text-center py-8">
            {loading ? (
              <div className="inline-flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin"></div>
                <span className="text-gray-600">Loading more products...</span>
              </div>
            ) : (
              <div className="h-20"></div> // Invisible element for intersection observer
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12 md:py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6 text-sm md:text-base">Try adjusting your search or filters</p>
            <button 
              onClick={() => setFilters({ category: '', priceRange: '', sortBy: 'createdAt', search: '' })}
              className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm md:text-base"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}