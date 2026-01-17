// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { sliderAPI, SliderItem } from '../../lib/api/slider';

// export default function HeroSlider() {
//   const [sliders, setSliders] = useState<SliderItem[]>([]);
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchSliders();
//   }, []);

//   useEffect(() => {
//     if (sliders.length > 1) {
//       const interval = setInterval(() => {
//         setCurrentSlide((prev) => (prev + 1) % sliders.length);
//       }, 5000); // Change slide every 5 seconds
//       return () => clearInterval(interval);
//     }
//   }, [sliders.length]);

//   const fetchSliders = async () => {
//     try {
//       const response = await sliderAPI.getActiveSliders();
//       if (response.data.success) {
//         setSliders(response.data.data);
//       }
//     } catch (error) {
//       console.error('Error fetching sliders:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const goToSlide = (index: number) => {
//     setCurrentSlide(index);
//   };

//   const goToPrevSlide = () => {
//     setCurrentSlide((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));
//   };

//   const goToNextSlide = () => {
//     setCurrentSlide((prev) => (prev === sliders.length - 1 ? 0 : prev + 1));
//   };

//   if (loading) {
//     return (
//       <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
//     );
//   }

//   if (sliders.length === 0) {
//     return (
//       <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-24 text-center rounded-lg">
//         <div className="max-w-4xl mx-auto px-4">
//           <h1 className="text-4xl md:text-5xl font-bold mb-4">
//             Welcome toArt Plazaa
//           </h1>
//           <p className="text-xl mb-8">
//             Discover premium art supplies and stationery for your creative journey
//           </p>
//           <Link
//             href="/products"
//             className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
//           >
//             Shop Now
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg">
//       {/* Slides */}
//       {sliders.map((slider, index) => (
//         <div
//           key={slider._id}
//           className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
//             index === currentSlide ? 'opacity-100' : 'opacity-0'
//           }`}
//         >
//           <div
//             className="absolute inset-0 bg-cover bg-center"
//             style={{ backgroundImage: `url(${slider.image})` }}
//           >
//             <div className="absolute inset-0 bg-black bg-opacity-40"></div>
//           </div>
          
//           <div className="relative h-full flex items-center">
//             <div className="max-w-4xl mx-auto px-4 text-white text-center md:text-left">
//               <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
//                 {slider.title}
//               </h1>
//               <p className="text-lg md:text-xl mb-8 max-w-2xl animate-fade-in-delay">
//                 {slider.description}
//               </p>
//               <Link
//                 href={slider.buttonLink}
//                 className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors inline-block animate-fade-in-delay-2"
//               >
//                 {slider.buttonText}
//               </Link>
//             </div>
//           </div>
//         </div>
//       ))}

//       {/* Navigation Arrows */}
//       {sliders.length > 1 && (
//         <>
//           <button
//             onClick={goToPrevSlide}
//             className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
//             aria-label="Previous slide"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//           <button
//             onClick={goToNextSlide}
//             className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
//             aria-label="Next slide"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//           </button>
//         </>
//       )}

//       {/* Dots Indicator */}
//       {sliders.length > 1 && (
//         <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
//           {sliders.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => goToSlide(index)}
//               className={`w-3 h-3 rounded-full transition-all ${
//                 index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
//               }`}
//               aria-label={`Go to slide ${index + 1}`}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }