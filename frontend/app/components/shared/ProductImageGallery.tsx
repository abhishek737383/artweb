'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  ZoomIn, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Award,
  Sparkles,
  Package,
  Maximize2,
  Minus,
  Plus
} from 'lucide-react';

interface ProductImageGalleryProps {
  images: Array<{
    url: string;
    altText?: string;
  }>;
  productName: string;
  hasDiscount?: boolean;
  discountPercent?: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export default function ProductImageGallery({
  images,
  productName,
  hasDiscount = false,
  discountPercent = 0,
  isBestSeller = false,
  isFeatured = false
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  const modalImageRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedImageIndex];
  const displayedImages = images.length > 0 ? images : [{
    url: '/placeholder-image.jpg',
    altText: `${productName} - No image available`
  }];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
          setIsZoomed(false);
          setZoomLevel(1);
        }
        if (e.key === 'ArrowLeft') {
          handlePrevImage();
        }
        if (e.key === 'ArrowRight') {
          handleNextImage();
        }
        if (e.key === '+' || e.key === '=') {
          setZoomLevel(prev => Math.min(prev + 0.5, 3));
        }
        if (e.key === '-' || e.key === '_') {
          setZoomLevel(prev => Math.max(prev - 0.5, 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      handleNextImage();
    }
    if (touchEnd - touchStart > 50) {
      handlePrevImage();
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? displayedImages.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === displayedImages.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  // Handle mouse movement for zoom
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || !mainImageRef.current) return;
    
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  // Handle modal mouse movement for zoom
  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || !modalImageRef.current) return;
    
    const { left, top, width, height } = modalImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    if (!isZoomed) setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    setZoomLevel(newZoom);
    if (newZoom === 1) setIsZoomed(false);
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  };

  const openModal = (index?: number) => {
    if (index !== undefined) {
      setSelectedImageIndex(index);
    }
    setIsModalOpen(true);
  };

  // Responsive badge container - Always show full text
  const BadgeContainer = () => (
    <div className="absolute top-2 left-2 flex flex-wrap gap-1 sm:gap-2 z-10 max-w-[80%]">
      {hasDiscount && (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs sm:text-sm font-bold rounded-lg md:rounded-full shadow-lg animate-slideIn whitespace-nowrap">
          {discountPercent}% OFF
        </span>
      )}
      {isBestSeller && (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-lg md:rounded-full shadow-lg animate-slideIn delay-100 whitespace-nowrap">
          <div className="flex items-center">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">Best Seller</span>
          </div>
        </span>
      )}
      {isFeatured && (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm font-bold rounded-lg md:rounded-full shadow-lg animate-slideIn delay-200 whitespace-nowrap">
          <div className="flex items-center">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">Featured</span>
          </div>
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className="sticky top-4 md:top-8">
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8 shadow-sm shine-effect">
          {/* Main Image */}
          <div 
            ref={mainImageRef}
            className="relative aspect-square overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 cursor-zoom-in group"
            onClick={() => openModal()}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isZoomed && setIsZoomed(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation Arrows */}
            {displayedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 z-20 ${
                    isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 z-20 ${
                    isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {displayedImages.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full z-10">
                {selectedImageIndex + 1} / {displayedImages.length}
              </div>
            )}

            {/* Badges */}
            <BadgeContainer />

            {/* Main Image with Zoom */}
            {selectedImage ? (
              <div className={`relative w-full h-full transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              >
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.altText || productName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  quality={85}
                  loading="eager"
                />
                
                {/* Zoom overlay indicator */}
                {isZoomed && (
                  <div 
                    className="absolute inset-0 bg-transparent"
                    style={{
                      background: `radial-gradient(circle at ${zoomPosition.x}% ${zoomPosition.y}%, transparent 150px, rgba(0,0,0,0.1) 150px)`
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 sm:w-24 sm:h-24 text-gray-400" />
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 md:gap-2 z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="p-1.5 md:p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
                disabled={zoomLevel <= 1}
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleZoom();
                }}
                className="p-1.5 md:p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
              >
                {isZoomed ? (
                  <Minus className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                ) : (
                  <ZoomIn className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="p-1.5 md:p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
                disabled={zoomLevel >= 3}
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
              </button>
            </div>

            {/* Zoom Level Indicator */}
            {isZoomed && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {displayedImages.length > 1 && (
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm md:text-base text-gray-600">
                  {selectedImageIndex + 1} / {displayedImages.length}
                </span>
                <button 
                  onClick={() => openModal()}
                  className="text-sm md:text-base text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
                  View All
                </button>
              </div>
              <div className="flex overflow-x-auto gap-2 md:gap-3 pb-2 scrollbar-hide">
                {displayedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                      index === selectedImageIndex 
                        ? 'border-purple-500 scale-105 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || `${productName} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      quality={65}
                    />
                    {index === selectedImageIndex && (
                      <div className="absolute inset-0 bg-purple-500/10"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4"
          onClick={() => {
            setIsModalOpen(false);
            setIsZoomed(false);
            setZoomLevel(1);
          }}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
              setIsZoomed(false);
              setZoomLevel(1);
            }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Modal Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              disabled={zoomLevel <= 1}
            >
              <Minus className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              {isZoomed ? (
                <Minus className="w-5 h-5 text-white" />
              ) : (
                <ZoomIn className="w-5 h-5 text-white" />
              )}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              disabled={zoomLevel >= 3}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
            <div className="px-3 py-1 bg-white/10 text-white text-sm rounded-lg">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          {/* Image Counter in Modal */}
          {displayedImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-sm rounded-full z-50">
              {selectedImageIndex + 1} / {displayedImages.length}
            </div>
          )}

          {/* Navigation Arrows in Modal */}
          {displayedImages.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </>
          )}

          {/* Modal Image with Zoom */}
          <div 
            ref={modalImageRef}
            className="relative w-full h-full max-w-6xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleModalMouseMove}
          >
            <div 
              className="relative w-full h-full transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            >
              <Image
                src={selectedImage.url}
                alt={selectedImage.altText || productName}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
                priority
              />
              
              {/* Zoom overlay indicator in modal */}
              {isZoomed && (
                <div 
                  className="absolute inset-0 bg-transparent pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at ${zoomPosition.x}% ${zoomPosition.y}%, transparent 200px, rgba(0,0,0,0.2) 200px)`
                  }}
                />
              )}
            </div>
          </div>

          {/* Thumbnail Strip at Bottom */}
          {displayedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 overflow-x-auto max-w-[90vw] px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg z-50">
              {displayedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                    setZoomLevel(1);
                  }}
                  className={`relative flex-shrink-0 w-12 h-12 overflow-hidden rounded-lg border transition-all duration-300 ${
                    index === selectedImageIndex 
                      ? 'border-white border-2 scale-110' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    quality={60}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSS for ripple animation */}
      <style jsx global>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}