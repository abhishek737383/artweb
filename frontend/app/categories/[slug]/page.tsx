import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ChevronRight, 
  Crown,
  Sparkles,
  Search,
  X,
  ArrowRight,
  Package
} from 'lucide-react';
import { categoryApi } from '../../lib/api/categories';
import { productApi } from '../../lib/api/products';
import CategoryCard from '../../components/shared/CategoryCard';
import ProductGrid from '../../components/shared/ProductGrid';
import SortSelect from '../../components/shared/SortSelect';
import { Suspense } from 'react';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    search?: string;
  }>;
}

// Static generation for faster loading
export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = false;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await categoryApi.getBySlug(slug);
  
  return {
    title: `${category?.name || 'Premium Collection'} | Art Plaza`,
    description: category?.description || `Explore premium ${category?.name || 'art supplies'} collection`,
  };
}

// Helper function to get image URL safely
function getImageUrl(image: any): string {
  if (!image) return '';
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (typeof image === 'object') {
    return image.url || image.src || '';
  }
  
  return '';
}

// Helper function to get image alt text
function getImageAlt(image: any, defaultAlt: string): string {
  if (!image || typeof image !== 'object') return defaultAlt;
  
  return image.altText || image.alt || defaultAlt;
}

// Products Content Component
async function ProductsContent({ 
  categoryId,
  categoryName,
  page,
  sortBy,
  searchQuery,
  slug
}: { 
  categoryId: string;
  categoryName: string;
  page: number;
  sortBy: string;
  searchQuery: string;
  slug: string;
}) {
  // Fetch products
  const productsData = await productApi.getProducts({
    page,
    limit: 12,
    categoryId,
    isActive: true,
    sortBy: sortBy === 'price-desc' ? 'price' : sortBy,
    sortOrder: sortBy.includes('desc') ? 'desc' : 'asc',
    search: searchQuery,
  }).catch(() => ({ products: [], total: 0, totalPages: 0 }));

  if (productsData.products.length === 0) {
    return (
      <div className="text-center py-12 md:py-16">
        <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
          </div>
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
          {searchQuery ? 'No Products Found' : 'No Products Available'}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {searchQuery 
            ? `No products matching "${searchQuery}" in ${categoryName}`
            : `No products available in ${categoryName} yet.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {searchQuery && (
            <Link
              href={`/categories/${slug}`}
              className="px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Clear Search
            </Link>
          )}
          <Link
            href="/products"
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Grid with 2 columns */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-4">
          {productsData.products.map((product) => {
            const firstImage = product.images?.[0];
            const imageUrl = getImageUrl(firstImage);
            const imageAlt = getImageAlt(firstImage, product.name);
            
            return (
              <div key={product._id} className="w-full">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full">
                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={imageAlt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100"></div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm min-h-[40px]">
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
            );
          })}
        </div>
      </div>
      
      {/* Desktop: Grid */}
      <div className="hidden md:block">
        <ProductGrid 
          products={productsData.products} 
          loading={false}
        />
      </div>
      
      {/* Pagination */}
      {productsData.totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/categories/${slug}?${new URLSearchParams({
                  page: (page - 1).toString(),
                  ...(sortBy !== 'createdAt' && { sort: sortBy }),
                  ...(searchQuery && { search: searchQuery }),
                }).toString()}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
              >
                ← Previous
              </Link>
            )}
            
            {Array.from({ length: Math.min(5, productsData.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === page;
              
              return (
                <Link
                  key={pageNum}
                  href={`/categories/${slug}?${new URLSearchParams({
                    ...(pageNum > 1 && { page: pageNum.toString() }),
                    ...(sortBy !== 'createdAt' && { sort: sortBy }),
                    ...(searchQuery && { search: searchQuery }),
                  }).toString()}`}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            
            {page < productsData.totalPages && (
              <Link
                href={`/categories/${slug}?${new URLSearchParams({
                  page: (page + 1).toString(),
                  ...(sortBy !== 'createdAt' && { sort: sortBy }),
                  ...(searchQuery && { search: searchQuery }),
                }).toString()}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Fetch category data (cached)
  const category = await categoryApi.getBySlug(slug);
  
  if (!category || !category.isActive) {
    notFound();
  }

  const page = parseInt(resolvedSearchParams.page || '1');
  const sortBy = resolvedSearchParams.sort || 'createdAt';
  const searchQuery = resolvedSearchParams.search || '';

  // Fetch all categories for breadcrumb and subcategories
  const categories = await categoryApi.getAll();
  
  // Get parent category
  const parentCategory = category.parentId 
    ? categories.find(cat => cat._id === category.parentId)
    : null;

  // Get subcategories
  const subcategories = categories.filter(cat => 
    cat.isActive && cat.parentId === category._id
  );

  // Get related categories
  const relatedCategories = category.parentId 
    ? categories.filter(cat => 
        cat.isActive && cat.parentId === category.parentId && cat._id !== category._id
      )
    : [];

  // Calculate product count (we'll get this from products data)
  const productsData = await productApi.getProducts({
    page: 1,
    limit: 1,
    categoryId: category._id,
    isActive: true,
  }).catch(() => ({ total: 0 }));

  return (
    <main className="min-h-screen bg-white">
      {/* 1. HEADER - Shows immediately */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                <Crown className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {category.name} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Collection</span>
              </h1>
              {category.description && (
                <p className="text-gray-600 text-sm md:text-base mt-1 max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BREADCRUMB - Shows immediately */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <nav className="flex items-center text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-purple-600 transition-colors flex items-center whitespace-nowrap">
              <Crown className="w-3 h-3 mr-1" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
            <Link href="/categories" className="hover:text-purple-600 transition-colors whitespace-nowrap">
              Collections
            </Link>
            {parentCategory && (
              <>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
                <Link 
                  href={`/categories/${parentCategory.slug}`}
                  className="hover:text-purple-600 transition-colors whitespace-nowrap"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">
              {category.name}
            </span>
          </nav>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Subcategories - Load immediately */}
        {subcategories.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Subcategories
                </h2>
                <p className="text-gray-600 text-sm">
                  Explore related collections
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {subcategories.length} subcategories
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {subcategories.map((subcategory, index) => (
                <CategoryCard 
                  key={subcategory._id} 
                  category={subcategory} 
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* 4. PRODUCTS SECTION */}
        <section className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                Products in {category.name}
              </h2>
              <p className="text-gray-600 text-sm">
                Showing {productsData.total} premium products
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <form action={`/categories/${slug}`} method="GET" className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-48 md:w-64 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searchQuery && (
                  <Link 
                    href={`/categories/${slug}`}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </Link>
                )}
              </form>

              {/* Sort */}
              <SortSelect 
                currentSort={sortBy}
                categorySlug={slug}
              />
            </div>
          </div>

          {/* PRODUCTS DISPLAY */}
          <ProductsContent 
            categoryId={category._id}
            categoryName={category.name}
            page={page}
            sortBy={sortBy}
            searchQuery={searchQuery}
            slug={slug}
          />
        </section>

        {/* 5. RELATED CATEGORIES */}
        {relatedCategories.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Related Collections
                </h2>
                <p className="text-gray-600 text-sm">
                  Explore other collections in the same category
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedCategories.map((sibling, index) => (
                <CategoryCard 
                  key={sibling._id} 
                  category={sibling} 
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* 6. PREMIUM CTA */}
        <section>
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Need More Options?
            </h2>
            <p className="text-gray-300 text-sm md:text-base mb-6 max-w-2xl mx-auto">
              Explore our complete collection of premium art supplies and stationery
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 group"
              >
                Shop All Products
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/categories"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                All Collections
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}