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

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  // Fetch related products
  const relatedProductsData = await relatedProductsPromise;
  const relatedProducts = relatedProductsData.products.filter(p => p._id !== product._id);

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Breadcrumb */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link 
              href="/" 
              className="hover:text-purple-600 transition-colors flex items-center animate-fadeIn"
            >
              <Crown className="w-3 h-3 mr-2" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link 
              href="/products" 
              className="hover:text-purple-600 transition-colors animate-fadeIn delay-100"
            >
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link 
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-purple-600 transition-colors animate-fadeIn delay-200"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium truncate animate-fadeIn delay-300">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="sticky top-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 shadow-sm shine-effect">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.altText || product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    quality={75}
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Premium Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg animate-slideIn">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {product.isBestSeller && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg animate-slideIn delay-100">
                      <div className="flex items-center">
                        <Award className="w-3 h-3 mr-1" />
                        Best Seller
                      </div>
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg animate-slideIn delay-200">
                      <div className="flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured
                      </div>
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="mt-6 grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {product.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-purple-500 cursor-pointer transition-all duration-300 group"
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 25vw, 12.5vw"
                        loading={index < 2 ? "eager" : "lazy"}
                        quality={65}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm shine-effect">
              {/* Category */}
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 group animate-fadeIn"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 mr-3 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{product.category.name}</span>
                </Link>
              )}

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fadeIn delay-100">
                {product.name}
              </h1>

              {/* Ratings & Stock */}
              <div className="flex items-center flex-wrap gap-4 mb-6 animate-fadeIn delay-200">
                <div className="flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">4.8 (128 reviews)</span>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="font-medium">
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {product.stock > 0 && product.stock <= 10 && (
                    <span className="ml-2 text-sm">
                      (Only {product.stock} left)
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-8 animate-fadeIn delay-300">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.compareAtPrice?.toLocaleString()}
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 font-bold rounded-full">
                        Save ₹{(product.compareAtPrice! - product.price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-sm">Inclusive of all taxes</p>
              </div>

              {/* Key Features */}
              {product.shortDescription && (
                <div className="mb-8 animate-fadeIn delay-400">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {product.shortDescription.split('.').filter(f => f.trim()).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature.trim()}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description */}
              <div className="mb-8 animate-fadeIn delay-500">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full text-sm border border-gray-200 animate-fadeIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart & Actions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
                      -
                    </button>
                    <span className="px-4 py-3 text-gray-900 font-medium min-w-[60px] text-center">
                      1
                    </span>
                    <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
                      +
                    </button>
                  </div>

                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium flex items-center justify-center shadow-lg hover:shadow-xl group">
                    <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Add to Cart
                  </button>

                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group">
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                <button className="w-full bg-gradient-to-r from-gray-900 to-black text-white py-3 rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-300 font-medium shadow-lg hover:shadow-xl">
                  Buy Now
                </button>
              </div>

              {/* Premium Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 group hover:from-blue-100 hover:to-cyan-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3 group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm">Orders over ₹499 • Delivered in 3-5 days</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 group hover:from-green-100 hover:to-emerald-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3 group-hover:scale-110 transition-transform">
                    <RotateCcw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">30-Day Returns</p>
                    <p className="text-sm">Easy returns & exchanges</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-600 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 group hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-sm">SSL encrypted & secure</p>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="pt-8 border-t border-gray-200">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-4">Share:</span>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110">
                      <span className="text-sm">📱</span>
                    </button>
                    <button className="p-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:scale-110">
                      <span className="text-sm">📧</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm shine-effect">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="animate-fadeIn">
                <h3 className="font-medium text-gray-900 mb-1">SKU</h3>
                <p className="text-gray-600">{product.sku}</p>
              </div>
              <div className="animate-fadeIn delay-100">
                <h3 className="font-medium text-gray-900 mb-1">Category</h3>
                <p className="text-gray-600">{product.category?.name || 'Uncategorized'}</p>
              </div>
              <div className="animate-fadeIn delay-200">
                <h3 className="font-medium text-gray-900 mb-1">Weight</h3>
                <p className="text-gray-600">{product.weight ? `${product.weight}g` : 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="animate-fadeIn delay-300">
                <h3 className="font-medium text-gray-900 mb-1">Stock</h3>
                <p className="text-gray-600">{product.stock} units available</p>
              </div>
              <div className="animate-fadeIn delay-400">
                <h3 className="font-medium text-gray-900 mb-1">Dimensions</h3>
                <p className="text-gray-600">
                  {product.dimensions 
                    ? `${product.dimensions.length || 0} × ${product.dimensions.width || 0} × ${product.dimensions.height || 0} cm`
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="animate-fadeIn delay-500">
                <h3 className="font-medium text-gray-900 mb-1">Barcode</h3>
                <p className="text-gray-600">{product.barcode || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Related <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Products</span>
                </h2>
                <p className="text-gray-600 mt-1">You might also like</p>
              </div>
              <Link 
                href={`/categories/${product.category?.slug || 'all'}`}
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center group"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.slice(0, 4).map((product, index) => (
                <div 
                  key={product._id} 
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-500 transform hover:-translate-y-1 shine-effect"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 relative overflow-hidden group">
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        loading="lazy"
                        quality={75}
                      />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 hover:text-purple-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    <button className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}