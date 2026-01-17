'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../components/contexts/AuthContext'; // Add this import
import { 
  CreditCard, 
  Truck, 
  Shield, 
  Lock, 
  CheckCircle,
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  ChevronRight,
  Crown,
  AlertCircle,
  Banknote,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { checkoutApi } from '../../lib/api/checkout';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  saveAddress: boolean;
  paymentMethod: 'credit_card' | 'upi' | 'cod';
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  upiId: string;
  orderNotes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading, loginRequired: authLoginRequired } = useAuth(); // Get auth context
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    saveAddress: true,
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
    orderNotes: ''
  });

  // Check authentication and load user data
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User is not logged in, redirect to login
        const returnUrl = encodeURIComponent('/user/checkout');
        router.push(`/login?redirect=${returnUrl}`);
      } else {
        // User is logged in, populate form with user data
        setFormData(prev => ({
          ...prev,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phone || ''
        }));
      }
    }
  }, [user, authLoading, router]);

  // If authentication is still loading, show loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated after loading, show nothing (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Validate form step
  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'Please enter your first name';
      if (!formData.lastName.trim()) errors.lastName = 'Please enter your last name';
      if (!formData.email.trim()) {
        errors.email = 'Please enter your email address';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        errors.phone = 'Please enter your phone number';
      } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!formData.address.trim()) errors.address = 'Please enter your street address';
      if (!formData.city.trim()) errors.city = 'Please enter your city';
      if (!formData.state.trim()) errors.state = 'Please enter your state';
      if (!formData.zipCode.trim()) {
        errors.zipCode = 'Please enter your ZIP code';
      } else if (!/^[0-9]{6}$/.test(formData.zipCode)) {
        errors.zipCode = 'Please enter a valid 6-digit ZIP code';
      }
    }

    if (step === 2 && formData.paymentMethod === 'credit_card') {
      if (!formData.cardNumber.trim()) {
        errors.cardNumber = 'Please enter card number';
      } else if (!/^[0-9]{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        errors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!formData.cardName.trim()) errors.cardName = 'Please enter name on card';
      if (!formData.cardExpiry.trim()) {
        errors.cardExpiry = 'Please enter expiry date';
      } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formData.cardExpiry)) {
        errors.cardExpiry = 'Please enter in MM/YY format';
      }
      if (!formData.cardCvv.trim()) {
        errors.cardCvv = 'Please enter CVV';
      } else if (!/^[0-9]{3,4}$/.test(formData.cardCvv)) {
        errors.cardCvv = 'Please enter a valid CVV';
      }
    }

    if (step === 2 && formData.paymentMethod === 'upi') {
      if (!formData.upiId.trim()) {
        errors.upiId = 'Please enter UPI ID';
      } else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId)) {
        errors.upiId = 'Please enter a valid UPI ID (e.g., username@upi)';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      alert('Please fix the errors before placing order');
      return;
    }

    setLoading(true);
    
    try {
      const orderData = {
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India'
        },
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentMethod === 'credit_card' ? {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardName: formData.cardName,
          cardExpiry: formData.cardExpiry,
          cardCvv: formData.cardCvv
        } : formData.paymentMethod === 'upi' ? {
          upiId: formData.upiId
        } : {},
        orderNotes: formData.orderNotes,
        saveAddress: formData.saveAddress
      };

      const response = await checkoutApi.createOrder(orderData);
      
      if (response.success && response.data?.order) {
        setOrderId(response.data.order._id);
        setOrderPlaced(true);
        clearCart();
      } else {
        throw new Error(response.error || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Format phone number
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      const formatted = digits.length <= 10 ? digits : digits.slice(0, 10);
      setFormData({
        ...formData,
        [name]: formatted
      });
      return;
    }
    
    // Format card number
    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '');
      const formatted = digits.length <= 16 ? digits.replace(/(\d{4})/g, '$1 ').trim() : digits.slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
      setFormData({
        ...formData,
        [name]: formatted
      });
      return;
    }
    
    // Format card expiry
    if (name === 'cardExpiry') {
      const digits = value.replace(/\D/g, '');
      let formatted = digits;
      if (digits.length >= 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
      }
      setFormData({
        ...formData,
        [name]: formatted
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleSubmit(new Event('submit') as any);
      }
    } else {
      // Scroll to first error
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        document.getElementById(firstError)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some products to your cart before checkout</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
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
              <Link href="/user/cart" className="hover:text-purple-600 transition-colors">
                Cart
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <span className="text-gray-900 font-medium">Order Confirmed</span>
            </nav>
          </div>
        </div>

        {/* Success Page */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6 text-lg">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
              <p className="text-gray-800 font-medium mb-2">Order Details</p>
              <p className="text-gray-600 mb-1">
                Order ID: <span className="font-bold">{orderId || `ORD-${Date.now().toString().slice(-8)}`}</span>
              </p>
              <p className="text-gray-600 mb-1">
                Payment: <span className="font-bold">{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                   formData.paymentMethod === 'upi' ? 'UPI' : 'Card'}</span>
              </p>
              <p className="text-gray-600">
                Estimated Delivery: <span className="font-bold">3-5 business days</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Continue Shopping
              </Link>
              <Link
                href="/user/orders"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                View Orders
              </Link>
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
            <Link href="/user/cart" className="hover:text-purple-600 transition-colors">
              Cart
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {['Delivery', 'Payment', 'Review'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`flex flex-col items-center ${index + 1 <= step ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index + 1 <= step 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-200'
                  }`}>
                    {index + 1 <= step ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-20 h-1 mx-4 ${index + 1 < step ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{user.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Welcome, {user.name || 'Customer'}!</p>
              <p className="text-sm text-gray-600">Complete your order with secure checkout</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Shipping Address */}
              {step === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-purple-600" />
                    Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="firstName"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your first name"
                        />
                      </div>
                      {formErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your last name"
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your email address"
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            formErrors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter 10-digit phone number"
                          maxLength={10}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter street address, house number"
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment/Suite (Optional)
                      </label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Apt, suite, building (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          formErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter city name"
                      />
                      {formErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="state"
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          formErrors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter state"
                      />
                      {formErrors.state && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          formErrors.zipCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter 6-digit PIN code"
                        maxLength={6}
                      />
                      {formErrors.zipCode && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="saveAddress"
                      checked={formData.saveAddress}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Save this address for future orders</span>
                  </label>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="w-6 h-6 mr-2 text-purple-600" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border-2 border-purple-500 rounded-xl cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleChange}
                        className="w-5 h-5 text-purple-600"
                      />
                      <div className="ml-4">
                        <span className="font-bold text-gray-900">Credit/Debit Card</span>
                        <p className="text-sm text-gray-600 mt-1">Pay with your card securely</p>
                      </div>
                    </label>
                    
                    {formData.paymentMethod === 'credit_card' && (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Card Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="cardNumber"
                              type="text"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter 16-digit card number"
                              maxLength={19}
                            />
                            {formErrors.cardNumber && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="cardExpiry"
                                type="text"
                                name="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                  formErrors.cardExpiry ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                              {formErrors.cardExpiry && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.cardExpiry}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVV <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="cardCvv"
                                type="text"
                                name="cardCvv"
                                value={formData.cardCvv}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                  formErrors.cardCvv ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="123"
                                maxLength={4}
                              />
                              {formErrors.cardCvv && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.cardCvv}</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name on Card <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="cardName"
                              type="text"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                formErrors.cardName ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter name as on card"
                            />
                            {formErrors.cardName && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.cardName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <label className="flex items-center p-4 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={formData.paymentMethod === 'upi'}
                        onChange={handleChange}
                        className="w-5 h-5 text-purple-600"
                      />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="font-bold text-gray-900">UPI</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Pay via UPI apps (GPay, PhonePe, Paytm)</p>
                      </div>
                    </label>
                    
                    {formData.paymentMethod === 'upi' && (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            UPI ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="upiId"
                            type="text"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                              formErrors.upiId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="username@upi"
                          />
                          {formErrors.upiId && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.upiId}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">e.g., 9876543210@oksbi, username@ybl</p>
                        </div>
                      </div>
                    )}
                    
                    <label className="flex items-center p-4 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="w-5 h-5 text-purple-600"
                      />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <Banknote className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-bold text-gray-900">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Pay when you receive your order</p>
                      </div>
                    </label>
                  </div>

                  {/* Order Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Special instructions, delivery preferences, gift wrapping requests, etc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {step === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 mr-2 text-purple-600" />
                    Review Your Order
                  </h2>
                  
                  {/* Order Summary */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.product.images?.[0] && (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Price: ₹{item.product.price.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Details */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-3">Shipping Details</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Address:</span> {formData.address}, {formData.apartment && `${formData.apartment}, `}{formData.city}, {formData.state} - {formData.zipCode}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Contact:</span> {formData.phone} | {formData.email}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-3">Payment Details</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-medium">Method:</span> {formData.paymentMethod === 'credit_card' ? 'Credit/Debit Card' : 
                                                                     formData.paymentMethod === 'upi' ? 'UPI' : 
                                                                     'Cash on Delivery'}
                      </p>
                      {formData.orderNotes && (
                        <p className="text-gray-700">
                          <span className="font-medium">Order Notes:</span> {formData.orderNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={step === 1 || loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : step === 3 ? (
                    'Place Order & Pay'
                  ) : (
                    'Continue'
                  )}
                  {step !== 3 && <ChevronRight className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-8 flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <Lock className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-green-800 text-sm">
                Your payment information is encrypted and secure. We never store your card details.
              </span>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cart.length} items)</span>
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
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{(totalPrice * 1.18).toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Items Preview */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Items in Cart</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="w-4 h-4 mr-3 text-blue-600" />
                    <span>Free shipping on orders over ₹499</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="w-4 h-4 mr-3 text-green-600" />
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-3 text-purple-600" />
                    <span>Delivery in 3-5 business days</span>
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