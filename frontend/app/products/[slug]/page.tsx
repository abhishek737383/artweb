import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  Tag, 
  Check, 
  Package,
  ChevronRight,
  Crown,
  Sparkles,
  Award
} from 'lucide-react';
import { productApi } from '../../lib/api/products';
import { Product } from '../../../types/product';
import ProductCard from '../../components/shared/ProductCard';
import ProductImageGallery from '../../components/shared/ProductImageGallery';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productApi.getBySlug(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | Art Plaza',
      description: 'Premium art supplies and stationery',
    };
  }
  
  return {
    title: `${product.name} | Premium Art Supplies | Art Plaza`,
    description: product.shortDescription || product.description?.substring(0, 160) || '',
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description?.substring(0, 160) || '',
      images: product.images?.slice(0, 1).map(img => ({ url: img.url })) || [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  // Fetch product data
  const product = await productApi.getBySlug(slug);
  
  if (!product || !product.isActive) {
    notFound();
  }

  // Fetch related products in background
  const relatedProductsPromise = productApi.getProducts({
    categoryId: product.categoryId,
    limit: 4,
    isActive: true,
  }).catch(() => ({ products: [] }));

  // Fixed: Use Boolean() to ensure it's boolean or undefined
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price 
    ? true 
    : false;
  const discountPercent = hasDiscount && product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Fetch related products
  const relatedProductsData = await relatedProductsPromise;
  const relatedProducts = relatedProductsData.products.filter(p => p._id !== product._id);

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Breadcrumb */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link 
              href="/" 
              className="hover:text-purple-600 transition-colors flex items-center animate-fadeIn flex-shrink-0"
            >
              <Crown className="w-3 h-3 mr-2" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
            <Link 
              href="/products" 
              className="hover:text-purple-600 transition-colors animate-fadeIn delay-100 flex-shrink-0"
            >
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
                <Link 
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-purple-600 transition-colors animate-fadeIn delay-200 flex-shrink-0"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate animate-fadeIn delay-300 flex-shrink-0">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
          {/* Image Gallery Component */}
          <ProductImageGallery 
            images={product.images || []}
            productName={product.name}
            discountPercent={discountPercent}
            isBestSeller={product.isBestSeller}
            isFeatured={product.isFeatured}
            hasDiscount={hasDiscount}
          />

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm shine-effect">
              {/* Category */}
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-3 md:mb-4 group animate-fadeIn"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 mr-2 sm:mr-3 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300 group-hover:scale-110">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{product.category.name}</span>
                </Link>
              )}

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 animate-fadeIn delay-100">
                {product.name}
              </h1>

              {/* Ratings & Stock */}
              <div className="flex items-center flex-wrap gap-3 md:gap-4 mb-4 md:mb-6 animate-fadeIn delay-200">
                <div className="flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600 text-sm sm:text-base">4.8 (128 reviews)</span>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs sm:text-sm ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="font-medium">
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {product.stock > 0 && product.stock <= 10 && (
                    <span className="ml-2">
                      (Only {product.stock} left)
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 md:mb-8 animate-fadeIn delay-300">
                <div className="flex items-center gap-3 md:gap-4 mb-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {hasDiscount && product.compareAtPrice && (
                    <>
                      <span className="text-lg sm:text-xl text-gray-500 line-through">
                        ₹{product.compareAtPrice.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 font-bold rounded-full text-sm">
                        Save ₹{(product.compareAtPrice - product.price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">Inclusive of all taxes</p>
              </div>

              {/* Key Features */}
              {product.shortDescription && (
                <div className="mb-6 md:mb-8 animate-fadeIn delay-400">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {product.shortDescription.split('.').filter(f => f.trim()).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm sm:text-base">{feature.trim()}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description */}
              <div className="mb-6 md:mb-8 animate-fadeIn delay-500">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-sm sm:prose-base max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-6 md:mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full text-xs sm:text-sm border border-gray-200 animate-fadeIn hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 hover:border-purple-200 transition-all duration-300 cursor-pointer"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart & Actions */}
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                {/* Quantity Selector */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200 text-lg">
                      -
                    </button>
                    <span className="px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium min-w-[48px] sm:min-w-[60px] text-center text-sm sm:text-base">
                      1
                    </span>
                    <button className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200 text-lg">
                      +
                    </button>
                  </div>

                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 sm:py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 group">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base">Add to Cart</span>
                  </button>

                  <button className="p-2.5 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:scale-95 group">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-gray-600" />
                  </button>
                </div>

                {/* Updated Buy Now Button - Green Color */}
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 sm:py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base">
                  Buy Now
                </button>
              </div>

              {/* Premium Features */}
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 group hover:from-blue-100 hover:to-cyan-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">Free Shipping</p>
                    <p className="text-xs sm:text-sm text-gray-500">Orders over ₹499 • Delivered in 3-5 days</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 group hover:from-green-100 hover:to-emerald-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">30-Day Returns</p>
                    <p className="text-xs sm:text-sm text-gray-500">Easy returns & exchanges</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 group hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">Secure Payment</p>
                    <p className="text-xs sm:text-sm text-gray-500">SSL encrypted & secure</p>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="pt-6 md:pt-8 border-t border-gray-200">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3 sm:mr-4 text-sm sm:text-base">Share:</span>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110 active:scale-95">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110 active:scale-95">
                      <span className="text-sm">📱</span>
                    </button>
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110 active:scale-95">
                      <span className="text-sm">📧</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-8 md:mt-12 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-sm shine-effect">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="animate-fadeIn">
                <h3 className="font-medium text-gray-900 mb-1">SKU</h3>
                <p className="text-gray-600 text-sm sm:text-base">{product.sku}</p>
              </div>
              <div className="animate-fadeIn delay-100">
                <h3 className="font-medium text-gray-900 mb-1">Category</h3>
                <p className="text-gray-600 text-sm sm:text-base">{product.category?.name || 'Uncategorized'}</p>
              </div>
              <div className="animate-fadeIn delay-200">
                <h3 className="font-medium text-gray-900 mb-1">Weight</h3>
                <p className="text-gray-600 text-sm sm:text-base">{product.weight ? `${product.weight}g` : 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="animate-fadeIn delay-300">
                <h3 className="font-medium text-gray-900 mb-1">Stock</h3>
                <p className="text-gray-600 text-sm sm:text-base">{product.stock} units available</p>
              </div>
              <div className="animate-fadeIn delay-400">
                <h3 className="font-medium text-gray-900 mb-1">Dimensions</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {product.dimensions 
                    ? `${product.dimensions.length || 0} × ${product.dimensions.width || 0} × ${product.dimensions.height || 0} cm`
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="animate-fadeIn delay-500">
                <h3 className="font-medium text-gray-900 mb-1">Barcode</h3>
                <p className="text-gray-600 text-sm sm:text-base">{product.barcode || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 md:mt-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Related <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Products</span>
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">You might also like</p>
              </div>
              <Link 
                href={`/categories/${product.category?.slug || 'all'}`}
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center group text-sm sm:text-base"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.slice(0, 4).map((product, index) => (
                <div key={product._id}>
                  <ProductCard
                    product={product}
                    priority={index < 4}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}