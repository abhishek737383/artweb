export default function CategoryLoading() {
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
        {/* Subcategories Skeleton */}
        <div className="mb-12 md:mb-16">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-2"></div>
              <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
              <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
            </div>
          </div>

          {/* Mobile Skeleton */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 pl-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-48 h-64 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"
                ></div>
              ))}
            </div>
          </div>

          {/* Desktop Skeleton */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}