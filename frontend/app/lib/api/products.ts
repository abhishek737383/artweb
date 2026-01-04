// productApi.ts
import { Product, CreateProductDto, UpdateProductDto, ProductImage } from '../../../types/product';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

type GetProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
};

class ProductAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Normalize product data from API
  private normalizeProduct(data: any): Product {
    if (!data) {
      return {
        id: '',
        _id: '',
        name: '',
        slug: '',
        description: '',
        price: 0,
        sku: '',
        stock: 0,
        tags: [],
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        images: [],
        createdAt: '',
        updatedAt: ''
      } as Product;
    }

    // Normalize images: ensure each image has url, publicId, altText, isPrimary
    const images = Array.isArray(data.images) ? data.images.map((img: any, idx: number) => {
      if (!img) return null;
      if (typeof img === 'string') {
        return {
          url: img,
          publicId: undefined,
          altText: data.name || `Image ${idx + 1}`,
          isPrimary: idx === 0
        } as ProductImage;
      }
      return {
        url: img.url,
        publicId: img.publicId,
        altText: img.altText ?? data.name ?? `Image ${idx + 1}`,
        isPrimary: !!img.isPrimary,
        order: typeof img.order === 'number' ? img.order : idx,
        format: img.format,
        width: img.width,
        height: img.height
      } as ProductImage;
    }).filter(Boolean) : [];

    return {
      _id: data._id ? String(data._id) : (data.id ? String(data.id) : ''),
      id: data.id ? String(data.id) : (data._id ? String(data._id) : ''),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      price: data.price !== undefined ? Number(data.price) : 0,
      compareAtPrice: data.compareAtPrice !== undefined ? Number(data.compareAtPrice) : undefined,
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      sku: data.sku || '',
      barcode: data.barcode || undefined,
      stock: data.stock !== undefined ? Number(data.stock) : 0,
      weight: data.weight,
      dimensions: data.dimensions,
      categoryId: data.categoryId ? String(data.categoryId) : (data.category?.id ? String(data.category.id) : null),
      category: data.category ? {
        ...data.category,
        id: data.category.id ? String(data.category.id) : (data.category._id ? String(data.category._id) : '')
      } : null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      isActive: data.isActive !== false,
      isFeatured: !!data.isFeatured,
      isBestSeller: !!data.isBestSeller,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      images,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Product;
  }

  // Get products with filters
  async getProducts(params: GetProductsParams = {}): Promise<{
    products: Product[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const url = `${this.baseUrl}/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      // Normalize response format
      let products: Product[] = [];
      let total = 0;
      let totalPages = 1;

      if (result.success && result.data) {
        if (Array.isArray(result.data.products)) {
          products = result.data.products.map((p: any) => this.normalizeProduct(p));
          total = result.data.total || products.length;
          totalPages = result.data.totalPages || 1;
        } else if (Array.isArray(result.data)) {
          products = result.data.map((p: any) => this.normalizeProduct(p));
          total = products.length;
        }
      }

      return {
        products,
        total,
        totalPages: totalPages || 1,
        page: params.page || 1,
        limit: params.limit || 12,
      };
    } catch (error) {
      console.error('ProductAPI.getProducts error:', error);
      return {
        products: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 12,
      };
    }
  }

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    try {
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid product ID:', id);
        return null;
      }
      
      const response = await fetch(`${this.baseUrl}/products/${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeProduct(result.data);
      }
      
      if (result.data && !result.success) {
        return this.normalizeProduct(result.data);
      }
      
      return null;
    } catch (error) {
      console.error(`ProductAPI.getById error (${id}):`, error);
      return null;
    }
  }

  // Get product by slug
  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/products/slug/${encodeURIComponent(slug)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product by slug: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeProduct(result.data);
      }
      
      if (result.data && !result.success) {
        return this.normalizeProduct(result.data);
      }
      
      return null;
    } catch (error) {
      console.error(`ProductAPI.getBySlug error (${slug}):`, error);
      return null;
    }
  }

  // Create product
  async create(payload: CreateProductDto): Promise<Product | null> {
    try {
      // Clean the payload (same as before)
      const cleanPayload: any = {
        name: payload.name,
        description: payload.description || '',
        shortDescription: payload.shortDescription || undefined,
        price: Number(payload.price) || 0,
        compareAtPrice: payload.compareAtPrice ? Number(payload.compareAtPrice) : undefined,
        costPrice: payload.costPrice ? Number(payload.costPrice) : undefined,
        sku: payload.sku || '',
        barcode: payload.barcode || undefined,
        stock: Number(payload.stock) || 0,
        weight: payload.weight ? Number(payload.weight) : undefined,
        categoryId: payload.categoryId || undefined,
        tags: payload.tags || [],
        isActive: payload.isActive !== false,
        isFeatured: payload.isFeatured || false,
        isBestSeller: payload.isBestSeller || false,
        metaTitle: payload.metaTitle || undefined,
        metaDescription: payload.metaDescription || undefined,
        images: payload.images || [],
      };
      
      // Remove undefined values
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key] === undefined) {
          delete cleanPayload[key];
        }
      });
      
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeProduct(result.data);
      }
      
      throw new Error(result.message || 'Failed to create product');
    } catch (error: any) {
      console.error('ProductAPI.create error:', error);
      throw error;
    }
  }

  // Update product
  async update(id: string, payload: UpdateProductDto): Promise<Product | null> {
    try {
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Invalid product ID');
      }
      
      // Clean the payload
      const cleanPayload: any = { ...payload };
      
      // Convert number fields
      if (payload.price !== undefined) cleanPayload.price = Number(payload.price);
      if (payload.compareAtPrice !== undefined) cleanPayload.compareAtPrice = payload.compareAtPrice ? Number(payload.compareAtPrice) : undefined;
      if (payload.costPrice !== undefined) cleanPayload.costPrice = payload.costPrice ? Number(payload.costPrice) : undefined;
      if (payload.stock !== undefined) cleanPayload.stock = Number(payload.stock);
      if (payload.weight !== undefined) cleanPayload.weight = payload.weight ? Number(payload.weight) : undefined;
      
      // Remove undefined values
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key] === undefined) {
          delete cleanPayload[key];
        }
      });
      
      const response = await fetch(`${this.baseUrl}/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeProduct(result.data);
      }
      
      throw new Error(result.message || 'Failed to update product');
    } catch (error: any) {
      console.error(`ProductAPI.update error (${id}):`, error);
      throw error;
    }
  }

  // Delete product
  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error(`ProductAPI.delete error (${id}):`, error);
      return false;
    }
  }

  // Upload images
  async uploadImages(files: File[]): Promise<ProductImage[]> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files to upload');
      }
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${this.baseUrl}/products/upload-images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload images: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        return result.data.map((img: any, index: number) => ({
          url: img.url,
          altText: img.altText || `Product Image ${index + 1}`,
          publicId: img.publicId || `img-${Date.now()}-${index}`,
          isPrimary: img.isPrimary || index === 0,
          order: typeof img.order === 'number' ? img.order : index,
          format: img.format,
          width: img.width,
          height: img.height
        } as ProductImage));
      }
      
      throw new Error(result.message || 'Failed to upload images');
    } catch (error: any) {
      console.error('ProductAPI.uploadImages error:', error);
      throw error;
    }
  }
}

export const productApi = new ProductAPI();
