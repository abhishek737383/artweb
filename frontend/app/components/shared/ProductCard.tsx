'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Star, Heart, ShoppingBag, Zap } from 'lucide-react';
import { Product } from '../../../types/product';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  isNew?: boolean; // Add optional isNew prop
}

export default function ProductCard({ product, priority = false, isNew = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const secondaryImage = product.images?.[1];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  // Calculate if product is new based on createdAt date (less than 30 days old)
  const isProductNew = isNew || (product.createdAt && 
    (new Date().getTime() - new Date(product.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
  );

  return (
    <div 
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={`/products/${product.slug}`}
        className="block"
        prefetch={false}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Image with hover effect */}
          {primaryImage && (
            <>
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText || product.name}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                quality={75}
                loading={priority ? "eager" : "lazy"}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.altText || `${product.name} - Alternative view`}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={75}
                  loading="lazy"
                />
              )}
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                -{discountPercent}%
              </span>
            )}
            {product.isBestSeller && (
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                🔥 Best Seller
              </span>
            )}
            {isProductNew && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                NEW
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* Quick view overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
              <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-sm font-medium">
                Quick View
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Category */}
        {product.category && (
          <Link 
            href={`/categories/${product.category.slug}`}
            className="text-xs font-medium text-gray-500 hover:text-purple-600 transition-colors block mb-1"
            prefetch={false}
          >
            {product.category.name}
          </Link>
        )}

        {/* Product name */}
        <Link href={`/products/${product.slug}`} prefetch={false}>
          <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors line-clamp-1 mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 text-amber-400 fill-current"
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">4.8</span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-sm text-gray-500">128 sold</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ₹{product.compareAtPrice?.toLocaleString()}
              </span>
            )}
          </div>

          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              product.stock > 0
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={product.stock === 0}
          >
            <ShoppingBag className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Stock status */}
        <div className="mt-3">
          {product.stock > 10 ? (
            <div className="flex items-center text-green-600 text-sm">
              <Zap className="w-3 h-3 mr-1" />
              In Stock • Fast Delivery
            </div>
          ) : product.stock > 0 ? (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Only {product.stock} left
            </span>
          ) : (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}