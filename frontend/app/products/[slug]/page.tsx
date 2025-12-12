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
  ChevronRight
} from 'lucide-react';
import { productApi } from '../../lib/api/products';
import ProductGrid from '../../components/shared/ProductGrid';
import { Product } from '../../../types/product';

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
      title: 'Product Not Found | Premium Art Supplies',
    };
  }
  
  return {
    title: `${product.name} | Premium Art Supplies`,
    description: product.shortDescription || product.description?.substring(0, 150) || '',
    openGraph: {
      images: product.images?.slice(0, 1).map(img => ({ url: img.url })) || [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  // Parallel fetch product and related products
  const [product, relatedProductsData] = await Promise.all([
    productApi.getBySlug(slug),
    productApi.getProducts({
      limit: 4,
      isActive: true,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }).catch(() => ({ products: [] })) // Fallback if related products fail
  ]);
  
  if (!product || !product.isActive) {
    notFound();
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  // Filter out current product from related products
  const relatedProducts = relatedProductsData.products.filter(p => p._id !== product._id).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Simplified Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600 flex-wrap gap-2">
            <Link href="/" className="hover:text-purple-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-purple-600 transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link 
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-purple-600 transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Product Details - Optimized Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Optimized Image Gallery */}
          <div>
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                {/* Main Image - Optimized */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-4">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.altText || product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-300" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {hasDiscount && (
                      <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="px-3 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-full shadow-lg">
                        Best Seller
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail Images - Lazy Load */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg border border-gray-300 hover:border-purple-500 cursor-pointer transition-colors"
                      >
                        <Image
                          src={image.url}
                          alt={image.altText || `${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                          loading={index === 0 ? "eager" : "lazy"}
                          quality={65}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optimized Product Info */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {/* Category */}
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 text-sm font-medium"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {product.category.name}
                </Link>
              )}

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Rating & Stock */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 text-amber-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">4.8 • 128 reviews</span>
                </div>
                <div className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
              </div>

              {/* Price - Optimized */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.compareAtPrice?.toLocaleString()}
                      </span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 font-bold rounded-full text-sm">
                        Save ₹{(product.compareAtPrice! - product.price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-sm">Inclusive of all taxes</p>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                  <div className="space-y-2">
                    {product.shortDescription.split('•').filter(f => f.trim()).map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description.substring(0, 300)}
                    {product.description.length > 300 && '...'}
                  </p>
                </div>
              )}

              {/* Add to Cart - Optimized */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-xl">
                    <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
                      -
                    </button>
                    <span className="px-6 py-3 text-gray-900 font-medium min-w-[60px] text-center">
                      1
                    </span>
                    <button className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
                      +
                    </button>
                  </div>

                  <button 
                    disabled={product.stock === 0}
                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center transition-all ${
                      product.stock > 0 
                        ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mr-3" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>

                  <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <button 
                  disabled={product.stock === 0}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    product.stock > 0 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                </button>
              </div>

              {/* Fast Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 border border-gray-200 rounded-xl">
                  <Truck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-gray-500">Over ₹499</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl">
                  <RotateCcw className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">30-Day Returns</p>
                  <p className="text-xs text-gray-500">Easy Returns</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl">
                  <Shield className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Secure</p>
                  <p className="text-xs text-gray-500">SSL Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications - Collapsible */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Product Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">SKU</p>
              <p className="font-medium">{product.sku}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <p className="font-medium">{product.category?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Stock</p>
              <p className="font-medium">{product.stock} units</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Weight</p>
              <p className="font-medium">{product.weight || '—'}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Dimensions</p>
              <p className="font-medium">
                {product.dimensions 
                  ? `${product.dimensions.length || 0}×${product.dimensions.width || 0}×${product.dimensions.height || 0}cm`
                  : '—'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Related Products - Simplified */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <Link 
                href="/products" 
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <ProductGrid products={relatedProducts.slice(0, 4)} />
          </div>
        )}
      </div>
    </div>
  );
}