'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Package, 
  Crown,
  Sparkles
} from 'lucide-react';
import { Category } from '../../../types/category';
import { useState, useEffect } from 'react';

interface CategoryCardProps {
  category: Category;
  variant?: 'grid' | 'featured' | 'list';
  index?: number;
}

export default function CategoryCard({ category, variant = 'grid', index = 0 }: CategoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  
  const imageUrl = typeof category.image === 'string' 
    ? category.image 
    : category.image?.url;

  // Staggered animation based on index
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, index * 50); // 50ms delay between each card
    
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Link 
      href={`/categories/${category.slug}`} 
      className={`group block relative overflow-hidden rounded-lg md:rounded-xl shadow-md md:shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } transition-all duration-500`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <>
            {/* Skeleton */}
            <div 
              className={`absolute inset-0 transition-opacity duration-300 ${
                imageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
            </div>
            
            <Image
              src={imageUrl}
              alt={typeof category.image !== 'string' && category.image?.altText 
                ? category.image.altText 
                : category.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 4} // Load first 4 images eagerly
              quality={75}
              loading={index < 4 ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-300 mb-1 md:mb-2">
                {category.name.charAt(0)}
              </div>
              <span className="text-xs text-gray-400">Collection</span>
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 p-3 md:p-4 lg:p-6 flex flex-col justify-end">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <h3 className="text-sm md:text-base lg:text-lg font-bold text-white group-hover:text-purple-200 transition-colors">
              {category.name}
            </h3>
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </div>
          
          {category.description && (
            <p className="text-xs md:text-sm text-gray-200 line-clamp-2 hidden md:block">
              {category.description}
            </p>
          )}
          
          {category.children && category.children.length > 0 && (
            <div className="mt-1 md:mt-2 flex items-center text-xs text-white/80">
              <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span>{category.children.length}+ Subcategories</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}