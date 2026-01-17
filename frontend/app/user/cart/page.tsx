'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Package,
  ShoppingCart,
  Heart,
  ChevronRight,
  Crown,
  LogIn,
  AlertCircle,
  Shield,
  Lock
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../components/contexts/AuthContext';

export default function CartPage() {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    totalItems, 
    totalPrice,
    isAuthenticated,
    loginRequired
  } = useCart();
  
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [movingToWishlist, setMovingToWishlist] = useState<string | null>(null);

  // REMOVED THE syncCartWithBackend useEffect - CartContext now handles loading automatically

  const handleCheckout = () => {
    if (!isAuthenticated) {
      loginRequired();
      return;
    }
    
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    setLoading(true);
    window.location.href = '/user/checkout';
  };

  const handleMoveToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      loginRequired();
      return;
    }
    
    const product = cart.find(item => item.product && item.product._id === productId)?.product;
    if (!product) return;
    
    try {
      setMovingToWishlist(productId);
      await addToWishlist(product);
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to move to wishlist:', error);
    } finally {
      setMovingToWishlist(null);
    }
  };

  const getCartItemId = (item: any, index: number) => {
    return item?._id || item?.product?._id || item?.product?.slug || `item-${index}`;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <button
            onClick={loginRequired}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24">
        {/* Breadcrumb */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-purple-600 transition-colors flex items-center">
                <Crown className="w-3 h-3 mr-2" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <Link href="/products" className="hover:text-purple-600 transition-colors">
                Products
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <span className="text-gray-900 font-medium">Shopping Cart</span>
            </nav>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any products to your cart yet. Start shopping to discover amazing art supplies!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={loginRequired}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to View Saved Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600 transition-colors flex items-center">
              <Crown className="w-3 h-3 mr-2" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link href="/products" className="hover:text-purple-600 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">
              Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </span>
          </nav>
        </div>
      </div>

      {/* Login Notice for Guests */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                <p className="text-amber-800 text-sm">
                  You're shopping as a guest. 
                  <button 
                    onClick={loginRequired}
                    className="ml-2 font-medium underline hover:text-amber-900"
                  >
                    Login to save your cart
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
              
              {cart.map((item, index) => {
                const productId = getCartItemId(item, index);
                const product = item?.product;
                
                if (!product) return null;
                
                return (
                  <div 
                    key={productId}
                    className={`flex items-start gap-4 p-6 ${index !== cart.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    {/* Product Image */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name || 'Product'}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-gray-400 absolute inset-0 m-auto" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      {product.slug || product._id ? (
                        <Link 
                          href={`/products/${product.slug || product._id}`}
                          className="block"
                        >
                          <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors mb-1">
                            {product.name || 'Unknown Product'}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {product.name || 'Unknown Product'}
                        </h3>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {product.category?.name || ''}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {product.stock > 0 ? (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            ✓ In Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            ✗ Out of Stock
                          </span>
                        )}
                        
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          ₹{(product.price || 0).toLocaleString()} each
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(productId, Math.max(1, (item.quantity || 0) - 1))}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                              disabled={(item.quantity || 0) <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 min-w-[40px] text-center font-medium">
                              {item.quantity || 0}
                            </span>
                            <button
                              onClick={() => updateQuantity(productId, (item.quantity || 0) + 1)}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Total Price */}
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              ₹{((product.price || 0) * (item.quantity || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveToWishlist(productId)}
                            disabled={movingToWishlist === productId}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Move to Wishlist"
                          >
                            {movingToWishlist === productId ? (
                              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Heart className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => removeFromCart(productId)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Tips */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Shopping Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Free Shipping</p>
                    <p className="text-xs text-gray-600">On orders over ₹499</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Easy Returns</p>
                    <p className="text-xs text-gray-600">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Secure Payment</p>
                    <p className="text-xs text-gray-600">SSL encrypted checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-medium">₹{(totalPrice * 0.18).toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{(totalPrice * 1.18).toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg mb-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : !isAuthenticated ? (
                  'Login to Checkout'
                ) : (
                  <>
                    Proceed to Checkout
                    <Package className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <button
                  onClick={loginRequired}
                  className="w-full border border-purple-600 text-purple-600 py-3 rounded-xl hover:bg-purple-50 transition-all duration-300 font-medium flex items-center justify-center mb-4"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to Save Cart
                </button>
              )}

              <Link
                href="/products"
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>

              {/* Security & Benefits */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Free shipping on orders over ₹499</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Secure payment & SSL encryption</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>30-day return policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}