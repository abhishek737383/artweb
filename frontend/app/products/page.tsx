import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { categoryApi } from '../lib/api/categories';
import { productApi } from '../lib/api/products';
import ProductGrid from '../components/shared/ProductGrid';
import Filters from '../components/shared/Filters';
import ProductGridSkeleton from '../components/shared/ProductGridSkeleton';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'All Products | Art Supplies Store',
  description: 'Browse our complete collection of art supplies, stationery, and creative materials.',
};

// Prefetch data for better performance
async function prefetchData() {
  // Prefetch categories immediately
  try {
    const categories = await categoryApi.getAll();
    return { categories };
  } catch (error) {
    console.error('Failed to prefetch categories:', error);
    return { categories: [] };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Start prefetching immediately
  const prefetchPromise = prefetchData();
  
  // Parse search params
  const params = await searchParams;
  
  const page = parseInt(params.page || '1');
  const limit = 12;
  const search = params.search || undefined;
  const categoryId = params.category || undefined;
  const sortBy = params.sort || 'createdAt';
  const sortOrder = sortBy.includes('desc') ? 'desc' : 'asc';
  const minPrice = params.minPrice ? parseInt(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;

  // Get prefetched categories
  const { categories } = await prefetchPromise;
  const activeCategories = categories.filter(cat => cat.isActive);

  // Fetch products with timeout
  let productsResult;
  try {
    // Add timeout for slow networks
    productsResult = await Promise.race([
      productApi.getProducts({
        page,
        limit,
        search,
        categoryId,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        isActive: true,
      }),
      new Promise(resolve => setTimeout(() => resolve({
        products: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 12
      }), 3000)) // 3 second timeout
    ]) as any;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    productsResult = {
      products: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 12
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Shows immediately */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop Art Supplies</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl">
            Discover premium quality art materials, stationery, and creative tools for artists of all levels.
          </p>
        </div>
      </div>

      {/* Breadcrumb - Shows immediately */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link 
              href="/" 
              className="hover:text-blue-600 transition-colors"
              prefetch={true}
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Products</span>
          </nav>
        </div>
      </div>

      {/* Main Content - Shows immediately with skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Shows immediately */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Filters categories={activeCategories} />
              
              {/* Quick Stats */}
              <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Products</span>
                    <span className="font-bold text-gray-900">{productsResult.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Stock</span>
                    <span className="font-bold text-green-600">90%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fast Shipping</span>
                    <span className="font-bold text-blue-600">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Header with Search */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Collection</h2>
                  <p className="text-gray-600">
                    Showing {productsResult.products.length} of {productsResult.total} products
                  </p>
                </div>

                <form action="/products" method="GET" className="w-full sm:w-auto">
                  <input type="hidden" name="page" value="1" />
                  {categoryId && <input type="hidden" name="category" value={categoryId} />}
                  {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
                  {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
                  {sortBy !== 'createdAt' && <input type="hidden" name="sort" value={sortBy} />}
                  
                  <div className="relative">
                    <input
                      type="search"
                      name="search"
                      defaultValue={search || ''}
                      placeholder="Search products..."
                      className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Show skeleton while loading or if products are empty */}
            {productsResult.products.length === 0 ? (
              <ProductGridSkeleton />
            ) : (
              <ProductGrid
                products={productsResult.products}
                emptyMessage="No products match your filters. Try adjusting your search or browse all categories."
              />
            )}

            {/* Pagination */}
            {productsResult.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, productsResult.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === page;
                    
                    return (
                      <Link
                        key={pageNum}
                        href={`/products?${new URLSearchParams({
                          ...(pageNum > 1 && { page: pageNum.toString() }),
                          ...(search && { search }),
                          ...(categoryId && { category: categoryId }),
                          ...(minPrice && { minPrice: minPrice.toString() }),
                          ...(maxPrice && { maxPrice: maxPrice.toString() }),
                          ...(sortBy !== 'createdAt' && { sort: sortBy }),
                        }).toString()}`}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        prefetch={pageNum === page + 1 || pageNum === page - 1}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                  
                  {productsResult.totalPages > 5 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Link
                        href={`/products?${new URLSearchParams({
                          page: productsResult.totalPages.toString(),
                          ...(search && { search }),
                          ...(categoryId && { category: categoryId }),
                          ...(minPrice && { minPrice: minPrice.toString() }),
                          ...(maxPrice && { maxPrice: maxPrice.toString() }),
                          ...(sortBy !== 'createdAt' && { sort: sortBy }),
                        }).toString()}`}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {productsResult.totalPages}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}