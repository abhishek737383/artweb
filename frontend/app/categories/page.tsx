import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Crown,
  Sparkles,
  Package,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { categoryApi } from '../lib/api/categories';
import CategoryCard from '../components/shared/CategoryCard';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Premium Collections | Art Plaza',
  description: 'Browse our premium collections of art supplies, stationery, and creative materials',
};

export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-static'; // Force static generation for faster loading

// Async component for categories grid
async function CategoriesGrid() {
  // Fetch categories
  const categories = await categoryApi.getAll();
  const activeCategories = categories.filter(cat => cat.isActive);
  const parentCategories = activeCategories.filter(cat => !cat.parentId);

  if (parentCategories.length === 0) {
    return (
      <div className="text-center py-12 md:py-16">
        <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
          </div>
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Collections Coming Soon</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We're curating amazing art supplies collections for you
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {parentCategories.map((category, index) => (
          <CategoryCard key={category._id} category={category} index={index} />
        ))}
      </div>

      {/* View All CTA */}
      <div className="mt-12 text-center">
        <Link 
          href="/products"
          className="inline-flex items-center bg-gradient-to-r from-gray-900 to-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 font-medium shadow-lg hover:shadow-xl group"
        >
          View All Products
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </>
  );
}

// Async component for category hierarchy
async function CategoryHierarchy() {
  const categories = await categoryApi.getAll();
  const activeCategories = categories.filter(cat => cat.isActive);
  const parentCategories = activeCategories.filter(cat => !cat.parentId);

  if (parentCategories.length === 0) return null;

  return (
    <section className="mb-12 md:mb-16">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              Browse by Category
            </h2>
            <p className="text-gray-600 text-sm">
              Explore our organized collection hierarchy
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {parentCategories.map((parent) => {
            const children = activeCategories.filter(cat => cat.parentId === parent._id);
            return (
              <div key={parent._id} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 mr-3">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">{parent.name}</h3>
                  </div>
                  <Link 
                    href={`/categories/${parent.slug}`}
                    className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors group"
                  >
                    View Collection
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <Link
                        key={child._id}
                        href={`/categories/${child.slug}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-all duration-300 text-sm"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default async function CategoriesPage() {
  // Fetch categories in parallel with the page render
  const categoriesPromise = categoryApi.getAll();

  return (
    <main className="min-h-screen bg-white">
      {/* 1. HERO SECTION - Shows immediately */}
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
                Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Collections</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                Discover our complete collection of premium art supplies and stationery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BREADCRUMB - Shows immediately */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600 transition-colors flex items-center">
              <Crown className="w-3 h-3 mr-1" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">Collections</span>
          </nav>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* All Collections with Suspense */}
        <section className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  All Collections
                </h2>
              </div>
              <p className="text-gray-600 text-sm md:text-base">
                Browse our complete range of premium art supply categories
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <Suspense fallback={<span className="h-4 w-16 bg-gray-200 rounded animate-pulse"></span>}>
                {/* Category count will load with categories */}
                <CategoryCount categoriesPromise={categoriesPromise} />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
              ))}
            </div>
          }>
            <CategoriesGrid />
          </Suspense>
        </section>

        {/* Category Hierarchy with Suspense */}
        <Suspense fallback={
          <div className="mb-12 md:mb-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 md:p-8">
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <CategoryHierarchy />
        </Suspense>

        {/* Premium CTA - Static, no suspense needed */}
        <section>
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Need More Inspiration?
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Helper component to show category count
async function CategoryCount({ categoriesPromise }: { categoriesPromise: Promise<any[]> }) {
  const categories = await categoriesPromise;
  const activeCategories = categories.filter(cat => cat.isActive);
  const parentCategories = activeCategories.filter(cat => !cat.parentId);
  
  return <>{parentCategories.length} premium collections</>;
}