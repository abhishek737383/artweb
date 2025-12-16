export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Skeleton Hero */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-16 w-64 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mx-auto mb-6"></div>
            <div className="h-4 w-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Skeleton Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-3"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}