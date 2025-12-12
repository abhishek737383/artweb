import { Metadata } from 'next';
import Link from 'next/link';
import { categoryApi } from '../lib/api/categories';
import { productApi } from '../lib/api/products';
import ProductGrid from '../components/shared/ProductGrid';
import Filters from '../components/shared/Filters';

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
  title: 'All Products | Premium Art Supplies',
  description: 'Browse complete collection of premium art supplies, stationery, and creative materials.',
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse params efficiently
  const params = await searchParams;
  
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 12;
  const search = params.search?.trim() || undefined;
  const categoryId = params.category || undefined;
  const sortBy = params.sort || 'createdAt';
  const sortOrder = sortBy.includes('desc') ? 'desc' : 'asc';
  const minPrice = params.minPrice ? parseInt(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;

  // Fetch only what's needed, cache aggressively
  const [categories, productsData] = await Promise.all([
    categoryApi.getAll().then(cats => cats.filter(cat => cat.isActive)),
    productApi.getProducts({
      page,
      limit,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy: sortBy.replace('-desc', ''),
      sortOrder,
      isActive: true,
    }),
  ]);

  // Optimize pagination calculation
  const totalPages = Math.ceil(productsData.total / limit);
  const currentPage = Math.min(page, totalPages);
  const visiblePages = generateVisiblePages(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-white">
      {/* Simplified Hero */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Premium Collections</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Discover curated art materials and creative tools for every artist
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Optimized */}
          <div className="lg:col-span-1">
            <Filters categories={categories} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Our Collection</h2>
                  <p className="text-gray-600">
                    {productsData.products.length} of {productsData.total} premium products
                  </p>
                </div>

                {/* Optimized Search */}
                <form action="/products" method="GET" className="w-full sm:w-auto">
                  <input type="hidden" name="page" value="1" />
                  {categoryId && <input type="hidden" name="category" value={categoryId} />}
                  
                  <div className="relative">
                    <input
                      type="search"
                      name="search"
                      defaultValue={search || ''}
                      placeholder="Search premium products..."
                      className="w-full sm:w-64 px-4 py-3 pl-11 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      autoComplete="off"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={productsData.products}
              emptyMessage="No products match your selection. Try different filters."
            />

            {/* Optimized Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <div className="flex items-center justify-center space-x-2">
                  {/* Previous Button */}
                  {currentPage > 1 && (
                    <Link
                      href={generatePageUrl(currentPage - 1, { search, categoryId, sortBy, minPrice, maxPrice })}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      prefetch={false}
                    >
                      ← Previous
                    </Link>
                  )}

                  {/* Page Numbers */}
                  {visiblePages.map((pageNum) => (
                    pageNum === '...' ? (
                      <span key="ellipsis" className="px-3 py-2 text-gray-500">•••</span>
                    ) : (
                      <Link
                        key={pageNum}
                        href={generatePageUrl(pageNum as number, { search, categoryId, sortBy, minPrice, maxPrice })}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          pageNum === currentPage
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                        prefetch={pageNum === currentPage + 1}
                      >
                        {pageNum}
                      </Link>
                    )
                  ))}

                  {/* Next Button */}
                  {currentPage < totalPages && (
                    <Link
                      href={generatePageUrl(currentPage + 1, { search, categoryId, sortBy, minPrice, maxPrice })}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      prefetch={false}
                    >
                      Next →
                    </Link>
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

// Helper functions
function generateVisiblePages(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }

  return pages;
}

function generatePageUrl(page: number, filters: any): string {
  const params = new URLSearchParams();
  
  if (page > 1) params.set('page', page.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId) params.set('category', filters.categoryId);
  if (filters.sortBy !== 'createdAt') params.set('sort', filters.sortBy);
  if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
  
  return `/products?${params.toString()}`;
}