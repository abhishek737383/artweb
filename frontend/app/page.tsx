'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Crown,
  Sparkles,
  Trophy,
  Shield,
  Truck,
  ShoppingBag,
  Package,
  Zap,
  Award
} from 'lucide-react';
import { categoryApi } from './lib/api/categories';
import { productApi } from './lib/api/products';
import { sliderAPI, SliderImage } from './lib/api/slider';
import { Category } from '../types/category';
import { Product } from '../types/product';
import ProductCard from './components/shared/ProductCard';

// Skeleton Components
const SliderSkeleton = () => (
  <div className="relative w-full aspect-[16/6] md:aspect-[21/8] lg:aspect-[24/8] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
  </div>
);

const CategoryCardSkeleton = () => (
  <div className="group relative overflow-hidden rounded-2xl shadow-lg border border-gray-200">
    <div className="relative h-64 md:h-80 lg:h-96 w-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <div className="h-8 w-3/4 bg-white/80 rounded-lg animate-pulse mb-3"></div>
      <div className="h-4 w-1/2 bg-white/80 rounded-lg animate-pulse"></div>
    </div>
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl mb-4"></div>
    <div className="h-4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
    <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-3"></div>
    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-1/2"></div>
  </div>
);

const TopBar = () => (
  <div className="w-full bg-gradient-to-r from-gray-900 to-black text-white">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-2">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">Free Shipping over ₹499</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-medium">100% Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">24/7</span>
            <span>Premium Support</span>
          </div>
        </div>
        <div className="text-sm font-medium">
          Premium Art Supplies Since 2024
        </div>
      </div>
    </div>
  </div>
);

// Premium Slider Component with Fade Animation
const PremiumSlider = ({ 
  images, 
  current, 
  onNext, 
  onPrev, 
  onGoTo,
  isLoading 
}: { 
  images: SliderImage[];
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (index: number) => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <SliderSkeleton />;
  }

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-[16/6] md:aspect-[21/8] lg:aspect-[24/8] bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center max-w-2xl">
            <Crown className="w-10 h-16 md:w-20 md:h-25 mx-auto mb-10 text-gray-400" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Premium Art Supplies
            </h2>
            <p className="text-gray-600 text-lg md:text-xl mb-8">
              Discover our exclusive collection of premium art materials
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl group"
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                Explore Collections
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full aspect-[16/6] md:aspect-[21/8] lg:aspect-[24/8]">
        {images.map((image, index) => (
          <div
            key={image._id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === current 
                ? 'opacity-100 z-10' 
                : 'opacity-0 z-0'
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
                quality={75}
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-transparent"></div>
            </div>
            
            {/* Premium Content Overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full">
                <div className="max-w-xl md:max-w-2xl">
                  {image.title && (
                    <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl animate-fadeIn">
                      {image.title}
                    </h1>
                  )}
                  
                  {image.subtitle && (
                    <p className="text-lg md:text-xl lg:text-2xl text-gray-100 mb-6 md:mb-8 max-w-lg leading-relaxed drop-shadow-lg animate-fadeIn delay-100">
                      {image.subtitle}
                    </p>
                  )}
                  
                  {image.link && (
                    <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn delay-200">
                      <Link 
                        href={image.link}
                        className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-base md:text-lg shadow-2xl hover:shadow-3xl group min-w-[180px] border border-gray-200"
                      >
                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                        Shop Now
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 group-hover:translate-x-2 transition-transform" />
                      </Link>
                      <Link 
                        href="/categories"
                        className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-bold text-base md:text-lg min-w-[180px]"
                      >
                        <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                        Collections
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Premium Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full p-3 md:p-4 hover:bg-white transition-all duration-300 z-20 group shadow-xl"
              aria-label="Previous slide"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800 group-hover:scale-110 transition-transform rotate-180" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full p-3 md:p-4 hover:bg-white transition-all duration-300 z-20 group shadow-xl"
              aria-label="Next slide"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800 group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}

        {/* Premium Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onGoTo(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-500 ${
                  index === current 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default function HomePage() {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  
  // Track loading states separately
  const [isSliderLoaded, setIsSliderLoaded] = useState(false);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  // Fetch data progressively
  const fetchInitialData = useCallback(async () => {
    try {
      // Step 1: Fetch slider images first
      try {
        const sliderResult = await sliderAPI.getSliderImages();
        if (sliderResult.success && sliderResult.data) {
          setSliderImages(sliderResult.data);
        }
      } catch (error) {
        console.error('Failed to load slider:', error);
      }
      setIsSliderLoaded(true);

      // Step 2: Fetch categories
      try {
        const categoriesData = await categoryApi.getAll();
        setCategories(categoriesData.filter(cat => cat.isActive));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
      setIsCategoriesLoaded(true);

      // Step 3: Fetch products in parallel
      try {
        const [featured, bestSeller, newArrival] = await Promise.all([
          productApi.getProducts({ limit: 8, isFeatured: true, isActive: true }),
          productApi.getProducts({ limit: 8, isBestSeller: true, isActive: true }),
          productApi.getProducts({ limit: 8, isActive: true, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);
        
        // Set products directly from the API response
        setFeaturedProducts(featured.products);
        setBestSellerProducts(bestSeller.products);
        setNewArrivalProducts(newArrival.products);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
      setIsProductsLoaded(true);

    } catch (error) {
      console.error('Unexpected error:', error);
      // Still mark as loaded to show content
      setIsSliderLoaded(true);
      setIsCategoriesLoaded(true);
      setIsProductsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle slider auto-rotation
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (sliderImages.length <= 1 || !isSliderLoaded) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [sliderImages.length, isSliderLoaded]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % sliderImages.length);
  }, [sliderImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  }, [sliderImages.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const featuredCategories = categories
    .filter(cat => !cat.parentId)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-white">
      {/* IMPORTANT: Add margin-top equal to your header height */}
      <div className="mt-16 lg:mt-24">
        <TopBar />
        
        {/* Premium Slider Section with Fade Animation */}
        <PremiumSlider
          images={sliderImages}
          current={currentSlide}
          onNext={nextSlide}
          onPrev={prevSlide}
          onGoTo={goToSlide}
          isLoading={!isSliderLoaded}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
          {/* Premium Categories Section */}
          <section className="mb-12 md:mb-16 lg:mb-20">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center justify-center mb-4 md:mb-6">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                    <Crown className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
                </div>
                <div className="ml-4 md:ml-6 text-left">
                  <div className="flex items-center mb-1">
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></div>
                    <span className="text-purple-600 font-bold text-xs md:text-sm uppercase tracking-wider">Collections</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                    Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Collections</span>
                  </h2>
                </div>
              </div>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                Explore our curated selection of premium art supplies and stationery collections
              </p>
            </div>

            {!isCategoriesLoaded ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {[...Array(2)].map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredCategories.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {featuredCategories.map((category, index) => (
                  <div key={category._id} className="group relative">
                    <Link 
                      href={`/categories/${category.slug}`}
                      className="block relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-200"
                    >
                      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
                        {category.image ? (
                          <Image
                            src={typeof category.image === 'string' ? category.image : category.image.url || ''}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority={index < 2}
                            quality={75}
                            loading={index < 2 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                            <div className="text-center">
                              <div className="text-6xl md:text-8xl font-bold text-gray-300 mb-4">
                                {category.name.charAt(0)}
                              </div>
                              <span className="text-gray-400">Premium Collection</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 text-white drop-shadow-lg">
                              {category.name}
                            </h3>
                            
                            {category.description && (
                              <p className="text-gray-100 text-sm md:text-base mb-4 max-w-2xl drop-shadow-lg line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex-shrink-0" />
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm md:text-base font-semibold mr-3 text-white drop-shadow-lg">Explore Collection</span>
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 shadow-lg">
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white transform group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>

                      {/* Premium Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-lg shadow-xl">
                          <div className="flex items-center">
                            <Crown className="w-3 h-3 mr-1.5" />
                            Premium
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Premium Collections Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We're curating amazing art supplies collections for you
                </p>
              </div>
            )}
          </section>

          {/* Featured Products */}
          <section className="mb-12 md:mb-16 lg:mb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-3"></div>
                  <span className="text-amber-600 font-bold text-xs md:text-sm uppercase tracking-wider">Featured</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Products</span>
                </h2>
                <p className="text-gray-600 mt-1">Handpicked premium selections</p>
              </div>
              {isProductsLoaded && featuredProducts.length > 0 && (
                <Link 
                  href="/products?isFeatured=true" 
                  className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-5 md:px-6 py-3 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
                >
                  View All
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {!isProductsLoaded ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.slice(0, 4).map((product) => (
                  <div key={product._id} className="transform hover:-translate-y-1 transition-transform duration-300">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200">
                <Award className="w-12 h-12 md:w-16 md:h-16 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Featured Products Coming Soon</h3>
                <p className="text-gray-600">Our premium selections are being curated</p>
              </div>
            )}
          </section>

          {/* Best Sellers */}
          <section className="mb-12 md:mb-16 lg:mb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3"></div>
                  <span className="text-red-600 font-bold text-xs md:text-sm uppercase tracking-wider">Bestsellers</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">Sellers</span>
                </h2>
                <p className="text-gray-600 mt-1">Most loved by our customers</p>
              </div>
              {isProductsLoaded && bestSellerProducts.length > 0 && (
                <Link 
                  href="/products?isBestSeller=true" 
                  className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-5 md:px-6 py-3 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
                >
                  View All
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {!isProductsLoaded ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : bestSellerProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {bestSellerProducts.slice(0, 4).map((product) => (
                  <div key={product._id} className="transform hover:-translate-y-1 transition-transform duration-300">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-dashed border-red-200">
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Best Sellers Coming Soon</h3>
                <p className="text-gray-600">Discover what everyone loves</p>
              </div>
            )}
          </section>

          {/* New Arrivals */}
          <section className="mb-12 md:mb-16 lg:mb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                  <span className="text-blue-600 font-bold text-xs md:text-sm uppercase tracking-wider">New Arrivals</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  New <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Arrivals</span>
                </h2>
                <p className="text-gray-600 mt-1">Fresh additions to our collection</p>
              </div>
              {isProductsLoaded && newArrivalProducts.length > 0 && (
                <Link 
                  href="/products?sort=newest" 
                  className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 px-5 md:px-6 py-3 rounded-xl font-semibold text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl group border border-gray-200"
                >
                  View All
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {!isProductsLoaded ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : newArrivalProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {newArrivalProducts.slice(0, 4).map((product) => (
                  <div key={product._id} className="transform hover:-translate-y-1 transition-transform duration-300">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-dashed border-blue-200">
                <Zap className="w-12 h-12 md:w-16 md:h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">New Arrivals Coming Soon</h3>
                <p className="text-gray-600">Stay tuned for exciting new products</p>
              </div>
            )}
          </section>

          {/* Premium Features */}
          {(isCategoriesLoaded || isProductsLoaded) && (
            <section className="mb-12 md:mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Free Shipping</h3>
                  <p className="text-gray-600 text-sm">Free delivery on orders above ₹499</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Checkout</h3>
                  <p className="text-gray-600 text-sm">100% secure payment processing</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                    <span className="text-white text-lg font-bold">24/7</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Support</h3>
                  <p className="text-gray-600 text-sm">Always here to help you</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 transition-all duration-300 hover:shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mb-4">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Quality</h3>
                  <p className="text-gray-600 text-sm">Curated from top brands worldwide</p>
                </div>
              </div>
            </section>
          )}

          {/* Premium CTA */}
          {(isCategoriesLoaded || isProductsLoaded) && (
            <section>
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
                <div className="relative z-10 p-8 md:p-12 text-center">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
                    Ready to Create Your Masterpiece?
                  </h2>
                  <p className="text-gray-300 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of artists who trust Art Plaza for their premium art supplies.
                    Elevate your creativity with our curated collections.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/products"
                      className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl text-base md:text-lg group"
                    >
                      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                      Shop All Products
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <Link 
                      href="/categories"
                      className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 text-base md:text-lg"
                    >
                      <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                      Premium Collections
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </main>
  );
}