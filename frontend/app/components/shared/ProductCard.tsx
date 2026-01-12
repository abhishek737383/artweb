'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { Star, Heart, ShoppingBag, Sparkles, Award } from 'lucide-react';
import { Product } from '../../../types/product';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 33;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't trigger if clicking on buttons
    if (target.closest('button') || target.closest('a[href]')) {
      return;
    }
    
    setIsClicked(true);
    
    // Add ripple effect
    const card = cardRef.current;
    if (card) {
      const ripple = document.createElement('span');
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(147, 51, 234, 0.3);
        transform: scale(0);
        animation: ripple 600ms linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 1;
      `;

      card.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
    
    // Navigate after animation
    setTimeout(() => {
      window.location.href = `/products/${product.slug}`;
    }, 300);
  };

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
        isClicked ? 'scale-95 shadow-xl' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Image Container with Fixed Aspect Ratio */}
      <div className="relative w-full pt-[100%] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {primaryImage ? (
          <>
            {/* Skeleton */}
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
            </div>
            
            {/* Actual Image */}
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              quality={75}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
          </div>
        )}

        {/* Badges - Better mobile sizing */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] md:text-xs font-bold rounded-lg shadow-lg">
            {discountPercent}% OFF
          </span>
          {product.isBestSeller && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] md:text-xs font-bold rounded-lg shadow-lg flex items-center">
              <Award className="w-2 h-2 md:w-3 md:h-3 mr-1" />
              <span className="hidden xs:inline">Best Seller</span>
              <span className="xs:hidden">Best</span>
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] md:text-xs font-bold rounded-lg shadow-lg flex items-center">
              <Sparkles className="w-2 h-2 md:w-3 md:h-3 mr-1" />
              <span className="hidden xs:inline">Featured</span>
              <span className="xs:hidden">Feat.</span>
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishlist(!wishlist);
          }}
          className="absolute top-2 right-2 p-1.5 md:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-1 z-10"
        >
          <Heart className={`w-3 h-3 md:w-4 md:h-4 ${wishlist ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Category */}
        {product.category && (
          <Link 
            href={`/categories/${product.category.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors line-clamp-1"
          >
            {product.category.name}
          </Link>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mt-1 hover:text-purple-600 transition-colors line-clamp-2 text-sm md:text-base min-h-[40px] cursor-pointer">
          {product.name}
        </h3>

        {/* Rating - Hidden on mobile to save space */}
        <div className="hidden md:flex items-center mt-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current"
              />
            ))}
          </div>
          <span className="text-xs md:text-sm text-gray-600 ml-1">4.8</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-2 md:mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-sm md:text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs md:text-sm text-gray-500 line-through hidden sm:block">
                ₹{product.compareAtPrice?.toLocaleString()}
              </span>
            )}
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add to cart logic
            }}
            className="px-2 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Add to Cart
          </button>
        </div>

        {/* Stock Status */}
        <div className="mt-2">
          {product.stock > 10 ? (
            <span className="text-xs text-green-600">✓ In Stock</span>
          ) : product.stock > 0 ? (
            <span className="text-xs text-yellow-600">⚠ Only {product.stock} left</span>
          ) : (
            <span className="text-xs text-red-600">✗ Out of Stock</span>
          )}
        </div>
      </div>

      {/* Click Animation Overlay */}
      {isClicked && (
        <div className="absolute inset-0 bg-purple-500/10 rounded-xl"></div>
      )}

      {/* CSS for ripple animation */}
      <style jsx global>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}