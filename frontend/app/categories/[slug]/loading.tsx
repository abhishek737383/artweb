export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-2"></div>
              <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded"></div>
            <div className="h-4 w-4 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded"></div>
            <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-4 w-64 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
          </div>
          <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
        </div>

        {/* Categories Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
          ))}
        </div>

        {/* CTA Button Skeleton */}
        <div className="h-12 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-xl mx-auto mb-12"></div>

        {/* Category Hierarchy Skeleton */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 md:p-8 mb-12">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* CTA Section Skeleton */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8">
          <div className="h-8 w-64 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse rounded-lg mx-auto mb-4"></div>
          <div className="h-4 w-96 max-w-full bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse rounded-lg mx-auto mb-6"></div>
          <div className="h-12 w-48 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse rounded-lg mx-auto"></div>
        </div>
      </div>
    </div>
  );
}