'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Award, 
  Zap,
  ShoppingBag,
  Package,
  Tag,
  Crown,
  Sparkles,
  Trophy,
  Clock,
  Shield,
  Truck,
  ChevronRight,
  Gift
} from 'lucide-react';
import { categoryApi } from './lib/api/categories';
import { productApi } from './lib/api/products';
import { sliderAPI, SliderImage } from './lib/api/slider';
import { Category } from '../types/category';
import { Product } from '../types/product';
import ProductCard from './components/shared/ProductCard';

export default function HomePage() {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    slider: true,
    categories: true,
    products: true
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Optimized fetch - fetch in parallel
  const fetchAllData = async () => {
    try {
      setLoading({
        slider: true,
        categories: true,
        products: true
      });
      setError(null);

      // Fetch all data in parallel
      const [sliderResult, categoriesData, featuredData, bestSellerData, newArrivalData] = await Promise.allSettled([
        sliderAPI.getSliderImages(),
        categoryApi.getAll(),
        productApi.getProducts({
          limit: 4, // Reduced from 8 to 4 for initial load
          isFeatured: true,
          isActive: true,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        productApi.getProducts({
          limit: 4, // Reduced from 8 to 4 for initial load
          isBestSeller: true,
          isActive: true,
          sortBy: 'sales',
          sortOrder: 'desc'
        }),
        productApi.getProducts({
          limit: 4, // Reduced from 8 to 4 for initial load
          isActive: true,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      ]);

      // Set slider images
      if (sliderResult.status === 'fulfilled' && sliderResult.value.success && sliderResult.value.data) {
        setSliderImages(sliderResult.value.data);
      }

      // Set categories
      if (categoriesData.status === 'fulfilled') {
        const activeCategories = categoriesData.value.filter(cat => cat.isActive);
        setCategories(activeCategories);
      }

      // Set products
      if (featuredData.status === 'fulfilled') {
        setFeaturedProducts(featuredData.value.products);
      }
      if (bestSellerData.status === 'fulfilled') {
        setBestSellerProducts(bestSellerData.value.products);
      }
      if (newArrivalData.status === 'fulfilled') {
        setNewArrivalProducts(newArrivalData.value.products);
      }

    } catch (error) {
      console.error('Error fetching home page data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading({
        slider: false,
        categories: false,
        products: false
      });
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto slide every 5 seconds
  useEffect(() => {
    if (sliderImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Get featured categories (top-level categories with no parent)
  const featuredCategories = categories
    .filter(cat => !cat.parentId)
    .slice(0, 6);

  if (loading.slider || loading.categories || loading.products) {
    return (
      <main className="min-h-screen bg-white">
        {/* Simple Loading State - Much Faster */}
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Art plazaa </h2>
            <p className="text-gray-500">Loading premium experience...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Premium Top Bar */}
      <div className="w-full bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center space-x-6 mb-2 md:mb-0">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">Free Shipping over ₹499</span>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">100% Secure Checkout</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">24/7 Support</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="text-sm">Premium Art Supplies Since 2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Slider Section - FULL BRIGHT */}
      <section className="w-full relative">
        {sliderImages.length > 0 ? (
          <div className="relative w-full aspect-[16/7] md:aspect-[21/8] lg:aspect-[24/8] overflow-hidden">
            {sliderImages.map((image, index) => (
              <div
                key={image._id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image.imageUrl}
                    alt={image.altText}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                    quality={85} // Optimized quality
                    loading={index === 0 ? "eager" : "lazy"} // Lazy load other slides
                  />
                </div>
                
                {/* Premium Content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 w-full">
                    <div className="max-w-2xl">
                      
                      {image.title && (
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 font-serif leading-tight tracking-tight drop-shadow-lg">
                          {image.title}
                        </h1>
                      )}
                      
                      {image.subtitle && (
                        <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-xl leading-relaxed font-medium drop-shadow-lg">
                          {image.subtitle}
                        </p>
                      )}
                      
                      {image.link && (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link 
                            href={image.link}
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl group min-w-[200px] border border-gray-200"
                          >
                            <ShoppingBag className="w-6 h-6 mr-3" />
                            Shop Now
                            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                          </Link>
                          <Link 
                            href="/categories"
                            className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 border-2 border-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 font-bold text-lg min-w-[200px]"
                          >
                            <Crown className="w-6 h-6 mr-3" />
                            Premium Collections
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Premium Navigation */}
            {sliderImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/80 border border-gray-300 rounded-full p-4 hover:bg-white transition-all duration-300 z-20 group shadow-xl"
                  aria-label="Previous slide"
                >
                  <ArrowRight className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform rotate-180" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/80 border border-gray-300 rounded-full p-4 hover:bg-white transition-all duration-300 z-20 group shadow-xl"
                  aria-label="Next slide"
                >
                  <ArrowRight className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}

            {/* Premium Dots */}
            {sliderImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                {sliderImages.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      index === currentSlide 
                        ? 'bg-gray-900 scale-125 shadow-lg' 
                        : 'bg-gray-400 hover:bg-gray-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[16/7] md:aspect-[21/8] lg:aspect-[24/8] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center p-8">
              <Crown className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="text-4xl font-bold mb-4 text-gray-800">Premium Art Supplies</h2>
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                Discover our exclusive collection of premium art materials
              </p>
              <Link 
                href="/products"
                className="inline-flex items-center bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all group shadow-2xl"
              >
                <ShoppingBag className="w-6 h-6 mr-3" />
                Explore Collections
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        {/* Premium Categories Section - FULL BRIGHT LIKE SLIDER */}
        <section className="mb-20 md:mb-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              <div className="ml-6 text-left">
                <div className="flex items-center">
                  <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-4"></div>
                  <span className="text-purple-600 font-semibold tracking-widest uppercase text-sm">Collections</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mt-2">
                  Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Collections</span>
                </h2>
              </div>
            </div>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Explore our curated selection of premium art supplies and stationery collections
            </p>
          </div>

          {featuredCategories.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
              {featuredCategories.map((category, index) => (
                <div key={category._id} className="group relative">
                  <Link 
                    href={`/categories/${category.slug}`}
                    className="block relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-1 border border-gray-200"
                  >
                    {/* EXTRA BIG Image Container - FULL BRIGHT */}
                    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
                      {category.image ? (
                        <Image
                          src={typeof category.image === 'string' ? category.image : category.image.url || ''}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority={index < 2}
                          quality={80} // Optimized quality
                          loading={index < 2 ? "eager" : "lazy"} // Lazy load later images
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                          <div className="text-center">
                            <div className="text-9xl font-bold text-gray-300 mb-6">
                              {category.name.charAt(0)}
                            </div>
                            <span className="text-gray-400 text-lg">Premium Collection</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Simplified Shine Effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine"></div>
                      </div>
                    </div>

                    {/* Content Overlay - NO BACKGROUND, text directly on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4 shadow-lg">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-sm font-bold bg-white/90 text-gray-900 px-4 py-1.5 rounded-full shadow-lg">
                            {category.children?.length || 0}+ Items
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-4 transition-all duration-500">
                          <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>
                      </div>
                      
                      <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900 drop-shadow-lg">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-gray-800 text-lg mb-8 leading-relaxed max-w-2xl drop-shadow-lg">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="flex items-center">
                        <span className="text-xl font-semibold mr-4 text-gray-900 drop-shadow-lg">Explore Collection</span>
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 shadow-lg">
                            <ArrowRight className="w-6 h-6 text-white transform group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute top-8 left-8">
                      <div className="relative">
                        <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-2xl shadow-2xl">
                          <div className="flex items-center">
                            <Crown className="w-4 h-4 mr-2" />
                            Premium
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Collections Coming Soon</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                We're curating amazing art supplies collections for you
              </p>
            </div>
          )}

          {/* View All Button */}
          {featuredCategories.length > 0 && (
            <div className="text-center mt-16">
              <Link 
                href="/categories"
                className="inline-flex items-center bg-gradient-to-r from-gray-900 to-black text-white px-10 py-5 rounded-2xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl group"
              >
                <Crown className="w-6 h-6 mr-4" />
                Explore All Collections
                <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-3 transition-transform duration-300" />
              </Link>
            </div>
          )}
        </section>

        {/* Featured Products - Premium Style */}
        <section className="mb-20 md:mb-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-6"></div>
                <span className="text-amber-600 font-bold tracking-widest text-sm uppercase">Featured</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Products</span>
              </h2>
              <p className="text-gray-600 text-lg mt-2">Handpicked premium selections</p>
            </div>
            <Link 
              href="/products?isFeatured=true" 
              className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-8 py-4 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
            >
              View All
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="transform hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-dashed border-amber-200">
              <Award className="w-20 h-20 text-amber-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Featured Products Coming Soon</h3>
              <p className="text-gray-600">Our premium selections are being curated</p>
            </div>
          )}
        </section>

        {/* Best Sellers - Same Style as Featured */}
        <section className="mb-20 md:mb-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-6"></div>
                <span className="text-red-600 font-bold tracking-widest text-sm uppercase">Bestsellers</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">Sellers</span>
              </h2>
              <p className="text-gray-600 text-lg mt-2">Most loved by our customers</p>
            </div>
            <Link 
              href="/products?isBestSeller=true" 
              className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-8 py-4 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
            >
              View All
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {bestSellerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bestSellerProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="transform hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl border-2 border-dashed border-red-200">
              <Trophy className="w-20 h-20 text-red-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Best Sellers Coming Soon</h3>
              <p className="text-gray-600">Discover what everyone loves</p>
            </div>
          )}
        </section>

        {/* New Arrivals - Same Style as Featured */}
        <section className="mb-20 md:mb-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-6"></div>
                <span className="text-blue-600 font-bold tracking-widest text-sm uppercase">New Arrivals</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                New <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Arrivals</span>
              </h2>
              <p className="text-gray-600 text-lg mt-2">Fresh additions to our collection</p>
            </div>
            <Link 
              href="/products?sort=newest" 
              className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-8 py-4 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
            >
              View All
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {newArrivalProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivalProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="transform hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border-2 border-dashed border-blue-200">
              <Zap className="w-20 h-20 text-blue-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">New Arrivals Coming Soon</h3>
              <p className="text-gray-600">Stay tuned for exciting new products</p>
            </div>
          )}
        </section>

        {/* Premium Features Grid */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders above ₹499</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Checkout</h3>
              <p className="text-gray-600">100% secure payment processing</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
              <p className="text-gray-600">Always here to help you</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 hover:border-yellow-300 transition-all duration-300 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Quality</h3>
              <p className="text-gray-600">Curated from top brands worldwide</p>
            </div>
          </div>
        </section>

        {/* Premium CTA */}
        <section>
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
            <div className="relative z-10 p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Create Your Masterpiece?
              </h2>
              <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of artists who trust Art plazaa  for their premium art supplies.
                Elevate your creativity with our curated collections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/products"
                  className="inline-flex items-center justify-center px-10 py-5 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl text-lg group"
                >
                  <ShoppingBag className="w-6 h-6 mr-4" />
                  Shop All Products
                  <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-3 transition-transform" />
                </Link>
                <Link 
                  href="/categories"
                  className="inline-flex items-center justify-center px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 text-lg"
                >
                  <Crown className="w-6 h-6 mr-4" />
                  Premium Collections
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add animations in global CSS */}
      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}