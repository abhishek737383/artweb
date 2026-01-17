'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Save,
  Loader2,
  AlertCircle,
  Tag,
  Check,
  Eye
} from 'lucide-react';
import { productApi } from '../../../../lib/api/products';
import { categoryApi } from '../../../../lib/api/categories';
import { Category } from '../../../../../types/category';
import { Product, ProductImage } from '../../../../../types/product';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadData();
    } else {
      console.error('No product ID provided');
      alert('Invalid product ID');
      router.push('/admin/products');
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, productData] = await Promise.all([
        categoryApi.getAll(),
        productApi.getById(id)
      ]);

      if (!productData) {
        alert('Product not found');
        router.push('/admin/products');
        return;
      }

      setCategories(categoriesData);
      setProduct(productData);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Failed to load product data');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Validate files
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    setImagesToUpload(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (index: number) => {
    setImagesToUpload(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    if (!product) return;
    
    const newImages = [...(product.images || [])];
    newImages.splice(index, 1);
    setProduct({ ...product, images: newImages });
  };

  const setPrimaryImage = (index: number) => {
    if (!product) return;
    
    const newImages = [...(product.images || [])].map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setProduct({ ...product, images: newImages });
  };

  const addTag = () => {
    if (!product) return;
    
    const tag = newTag.trim();
    if (tag && !product.tags?.includes(tag)) {
      setProduct({
        ...product,
        tags: [...(product.tags || []), tag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!product) return;
    
    setProduct({
      ...product,
      tags: product.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const validateForm = (): boolean => {
    if (!product) return false;
    
    const newErrors: Record<string, string> = {};

    if (!product.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (product.price === undefined || product.price === null || isNaN(product.price) || product.price < 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!product.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (product.compareAtPrice !== undefined && product.compareAtPrice !== null && product.compareAtPrice < 0) {
      newErrors.compareAtPrice = 'Compare price must be positive';
    }

    if (product.compareAtPrice && product.price && product.compareAtPrice <= product.price) {
      newErrors.compareAtPrice = 'Compare price must be higher than regular price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to handle number inputs
  const handleNumberChange = (field: keyof Product, value: string) => {
    if (!product) return;
    
    // If value is empty string, set to undefined
    if (value === '') {
      setProduct({ ...product, [field]: undefined });
    } else {
      // Parse the number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setProduct({ ...product, [field]: numValue });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !id) {
      alert('Product data or ID is missing');
      return;
    }
    
    if (!validateForm()) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        alert(`Please fix: ${firstError}`);
      }
      return;
    }

    setSaving(true);

    try {
      // Upload new images if any
      let uploadedImgs: ProductImage[] = [];
      if (imagesToUpload.length > 0) {
        setUploadingImages(true);
        try {
          const uploaded = await productApi.uploadImages(imagesToUpload);
          uploadedImgs = uploaded.map((img, index) => ({
            ...img,
            isPrimary: index === 0 && (!product.images || product.images.length === 0)
          }));
          console.log('Uploaded images:', uploadedImgs);
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload images. Please try again.');
          setUploadingImages(false);
          setSaving(false);
          return;
        }
        setUploadingImages(false);
      }

      // Merge images - existing + new
      const existingImages = product.images || [];
      const allImages = [...existingImages, ...uploadedImgs];
      
      // Ensure at least one image is marked as primary
      if (allImages.length > 0) {
        const hasPrimary = allImages.some(img => img.isPrimary);
        if (!hasPrimary) {
          allImages[0].isPrimary = true;
        }
      }

      // Prepare update payload - ensure proper types
      const updatePayload: any = {
        name: product.name?.trim() || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: Number(product.price) || 0,
        sku: product.sku?.trim() || '',
        barcode: product.barcode || '',
        stock: Number(product.stock) || 0,
        categoryId: product.categoryId || undefined,
        tags: product.tags || [],
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        isBestSeller: product.isBestSeller || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        images: allImages,
      };

      // Only include these if they have values
      if (product.compareAtPrice !== undefined && product.compareAtPrice !== null && product.compareAtPrice > 0) {
        updatePayload.compareAtPrice = Number(product.compareAtPrice);
      } else {
        updatePayload.compareAtPrice = undefined;
      }

      if (product.costPrice !== undefined && product.costPrice !== null && product.costPrice > 0) {
        updatePayload.costPrice = Number(product.costPrice);
      }

      if (product.weight !== undefined && product.weight !== null && product.weight > 0) {
        updatePayload.weight = Number(product.weight);
      }

      console.log('Sending update payload:', updatePayload);
      
      const updatedProduct = await productApi.update(id, updatePayload);
      
      if (updatedProduct) {
        alert('Product updated successfully');
        router.push('/admin/products');
      } else {
        throw new Error('Failed to update product');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(err instanceof Error ? err.message : 'Failed to update product. Please try again.');
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">The product you're trying to edit doesn't exist.</p>
          <Link
            href="/admin/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin/products" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">Update product details</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            product.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            product.isFeatured 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.isFeatured ? 'Featured' : 'Not Featured'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={product.name || ''}
                  onChange={(e) => {
                    setProduct({...product, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: ''});
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={product.categoryId || ''}
                  onChange={(e) => setProduct({...product, categoryId: e.target.value || undefined})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleNumberChange('price', value);
                    if (errors.price) setErrors({...errors, price: ''});
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={product.stock || 0}
                  onChange={(e) => setProduct({...product, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  value={product.sku || ''}
                  onChange={(e) => {
                    setProduct({...product, sku: e.target.value});
                    if (errors.sku) setErrors({...errors, sku: ''});
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter SKU"
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.sku}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.compareAtPrice ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleNumberChange('compareAtPrice', value);
                    if (errors.compareAtPrice) setErrors({...errors, compareAtPrice: ''});
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Original price before discount"
                />
                {errors.compareAtPrice && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.compareAtPrice}
                  </p>
                )}
                {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                  <p className="mt-1 text-sm text-green-600">
                    Discount: {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.costPrice ?? ''}
                    onChange={(e) => handleNumberChange('costPrice', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your cost"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={product.weight ?? ''}
                    onChange={(e) => handleNumberChange('weight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product weight"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={product.description || ''}
              onChange={(e) => setProduct({...product, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="Enter detailed product description"
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Features
            </label>
            <textarea
              value={product.shortDescription || ''}
              onChange={(e) => setProduct({...product, shortDescription: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief product description for cards"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Product Tags</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new tag (press Enter to add)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm"
                  >
                    <Tag className="w-3 h-3 mr-1.5" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Product Images</h2>
          
          {/* Existing Images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Existing Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {product.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img.url} 
                      alt={img.altText || `Product image ${idx + 1}`} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {img.isPrimary ? (
                        <button
                          type="button"
                          className="bg-green-500 text-white p-1 rounded-full"
                          title="Primary image"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                          title="Set as primary"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {img.isPrimary && (
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                id="add-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <label htmlFor="add-images" className="cursor-pointer block">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload images or drag and drop</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                {imagesToUpload.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    {imagesToUpload.length} new file(s) selected
                  </p>
                )}
              </label>
            </div>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">New Images to Upload</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={preview} 
                        alt={`New image ${i + 1}`} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO & Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">SEO & Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={product.metaTitle || ''}
                  onChange={(e) => setProduct({...product, metaTitle: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO title for search engines"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={product.metaDescription || ''}
                  onChange={(e) => setProduct({...product, metaDescription: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="SEO description for search engines"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Active Status</h3>
                  <p className="text-sm text-gray-500">Show product in store</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={(e) => setProduct({...product, isActive: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Featured Product</h3>
                  <p className="text-sm text-gray-500">Show in featured section</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.isFeatured}
                    onChange={(e) => setProduct({...product, isFeatured: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Best Seller</h3>
                  <p className="text-sm text-gray-500">Mark as best seller</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.isBestSeller}
                    onChange={(e) => setProduct({...product, isBestSeller: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors"></div>
                  <div className="absolute left-[2px] top-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link
            href="/admin/products"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reload
            </button>
            
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {uploadingImages ? 'Uploading Images...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Product
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}