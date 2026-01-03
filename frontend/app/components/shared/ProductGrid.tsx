'use client';

import { Product } from '../../../types/product';
import ProductCard from './ProductCard';
import { useState, useEffect } from 'react';

interface ProductGridProps {
  products?: Product[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  loading?: boolean;
  variant?: 'default' | 'horizontal-mobile' | 'category-page';
}

export default function ProductGrid({ 
  products = [],
  title, 
  subtitle, 
  emptyMessage = "No products found",
  loading = false,
  variant = 'default'
}: ProductGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Progressive loading effect
  useEffect(() => {
    if (!loading && products.length > 0) {
      setVisibleProducts([]);
      setLoadedCount(0);
      
      // Load products one by one
      const loadProducts = async () => {
        for (let i = 0; i < products.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between each
          setLoadedCount(prev => prev + 1);
          setVisibleProducts(prev => [...prev, products[i]]);
        }
      };
      
      loadProducts();
    }
  }, [products, loading]);

  if (loading) {
    // Loading skeleton for category page (horizontal on mobile)
    if (variant === 'category-page' || variant === 'horizontal-mobile') {
      return (
        <>
          {/* Mobile Skeleton - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 pl-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex-shrink-0 w-48">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-3"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop Skeleton - Grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
              ))}
            </div>
          </div>
        </>
      );
    }
    
    // Default loading skeleton
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-3"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Category page layout - Horizontal on mobile, Grid on desktop
  if (variant === 'category-page' || variant === 'horizontal-mobile') {
    return (
      <>
        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 pl-4">
            {products.map((product, index) => (
              <div 
                key={product.id || product._id || product.slug} 
                className={`flex-shrink-0 w-48 transition-all duration-500 ${
                  visibleProducts.includes(product) 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-4'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {/* Product Image */}
                  <div className="relative h-40 w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 overflow-hidden">
                    {product.images?.[0] && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100"></div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                    {product.name}
                  </h3>
                  <p className="text-sm font-bold text-gray-900 mb-3">
                    ₹{product.price.toLocaleString()}
                  </p>
                  
                  <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop: Grid with progressive loading */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <div
                key={product.id || product._id || product.slug}
                className={`transition-all duration-500 ${
                  visibleProducts.includes(product)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  priority={index < 4}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Default grid layout with progressive loading
  return (
    <div>
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, index) => (
          <div
            key={product.id || product._id || product.slug}
            className={`transition-all duration-500 ${
              visibleProducts.includes(product)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <ProductCard
              product={product}
              priority={index < 8}
            />
          </div>
        ))}
      </div>
    </div>
  );
}