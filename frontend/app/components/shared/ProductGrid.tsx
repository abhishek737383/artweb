'use client';

import { Product } from '../../../types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export default function ProductGrid({ 
  products, 
  title, 
  subtitle, 
  emptyMessage = "No products found",
  loading = false
}: ProductGridProps) {
  if (loading) {
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
          <ProductCard
            key={product.id || product._id || product.slug}
            product={product}
            priority={index < 8} // Prioritize first 8 images for faster initial load
          />
        ))}
      </div>
    </div>
  );
}