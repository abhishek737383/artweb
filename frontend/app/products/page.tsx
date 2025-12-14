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
  title: 'All Products | Art Supplies Store',
  description: 'Browse our complete collection of art supplies, stationery, and creative materials.',
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  
  const page = parseInt(params.page || '1');
  const limit = 12;
  const search = params.search || undefined;
  const categoryId = params.category || undefined;
  const sortBy = params.sort || 'createdAt';
  const sortOrder = sortBy.includes('desc') ? 'desc' : 'asc';
  const minPrice = params.minPrice ? parseInt(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;

  // Optimized: Fetch data in parallel with error handling
  const [categories, productsData] = await Promise.allSettled([
    categoryApi.getAll(),
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
  ]);

  const activeCategories = categories.status === 'fulfilled' ? categories.value.filter(cat => cat.isActive) : [];
  const productsResult = productsData.status === 'fulfilled' ? productsData.value : { products: [], total: 0, totalPages: 1 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop Art Supplies</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl">
            Discover premium quality art materials, stationery, and creative tools for artists of all levels.
          </p>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Products</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Filters categories={activeCategories} />
          </div>

          <div className="lg:col-span-3">
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

            <ProductGrid
              products={productsResult.products}
              emptyMessage="No products match your filters. Try adjusting your search or browse all categories."
            />

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