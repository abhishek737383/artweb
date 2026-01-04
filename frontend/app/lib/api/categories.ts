// categoryApi.ts
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../../types/category';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// In-memory cache
let categoriesCache: {
  data: Category[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

let categoryCache = new Map<string, { data: Category | null; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

class CategoryAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Normalize category data
  private normalizeCategory(data: any): Category {
    if (!data) return data;

    // Normalize image: could be string (old) or object { url, publicId, altText }
    let image: any = null;
    if (typeof data.image === 'string') {
      image = { url: data.image, publicId: undefined, altText: data.name || '' };
    } else if (data.image && typeof data.image === 'object') {
      image = {
        url: data.image.url,
        publicId: data.image.publicId,
        altText: data.image.altText ?? data.name ?? ''
      };
    } else {
      image = null;
    }

    const parentId = data.parentId ?? data.parentId === '' ? null : data.parentId;

    return {
      _id: data._id ? String(data._id) : (data.id ? String(data.id) : ''),
      id: data.id ? String(data.id) : (data._id ? String(data._id) : ''),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      image,
      parentId: parentId ? String(parentId) : null,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      __v: data.__v,
    } as Category;
  }

  // Get all categories WITH CACHING
  async getAll(): Promise<Category[]> {
    // Check cache
    if (categoriesCache.data && Date.now() - categoriesCache.timestamp < CACHE_DURATION) {
      return categoriesCache.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const result: ApiResponse<any[]> = await response.json();
      
      let categories: Category[] = [];
      
      if (result.success && Array.isArray(result.data)) {
        categories = result.data.map(cat => this.normalizeCategory(cat));
      } else if (Array.isArray(result)) {
        categories = (result as any[]).map(cat => this.normalizeCategory(cat));
      }
      
      // Update cache
      categoriesCache = {
        data: categories,
        timestamp: Date.now()
      };
      
      return categories;
    } catch (error) {
      console.error('CategoryAPI.getAll error:', error);
      return categoriesCache.data || [];
    }
  }

  // Get category by slug WITH CACHING
  async getBySlug(slug: string): Promise<Category | null> {
    // Check cache first
    const cached = categoryCache.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories/slug/${encodeURIComponent(slug)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category by slug: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      let category: Category | null = null;
      
      if (result.success && result.data) {
        category = this.normalizeCategory(result.data);
        
        // Update cache
        categoryCache.set(slug, {
          data: category,
          timestamp: Date.now()
        });
      }
      
      return category;
    } catch (error) {
      console.error(`CategoryAPI.getBySlug error (${slug}):`, error);
      return null;
    }
  }

  // Get category by ID WITH CACHING
  async getById(id: string): Promise<Category | null> {
    // Check cache first
    const cached = categoryCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      let category: Category | null = null;
      
      if (result.success && result.data) {
        category = this.normalizeCategory(result.data);
        
        // Update cache
        categoryCache.set(id, {
          data: category,
          timestamp: Date.now()
        });
      }
      
      return category;
    } catch (error) {
      console.error(`CategoryAPI.getById error (${id}):`, error);
      return null;
    }
  }

  // Clear cache (call this after create/update/delete operations)
  clearCache(): void {
    categoriesCache = { data: null, timestamp: 0 };
    categoryCache.clear();
  }

  // Create category
  async create(data: CreateCategoryDto & { imageFile?: File }): Promise<Category | null> {
    try {
      let response;
      
      // If there's an image file, use FormData
      if (data.imageFile) {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.parentId) formData.append('parentId', data.parentId);
        formData.append('isActive', String(data.isActive ?? true));
        formData.append('image', data.imageFile);
        
        response = await fetch(`${this.baseUrl}/categories`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Otherwise use JSON
        const payload: any = {
          name: data.name,
          description: data.description || '',
          isActive: data.isActive ?? true,
        };
        
        // Only include parentId if it's a valid value
        if (data.parentId && data.parentId.trim() !== '') {
          payload.parentId = data.parentId;
        }
        
        response = await fetch(`${this.baseUrl}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      // Clear cache after create
      this.clearCache();
      
      if (result.success && result.data) {
        return this.normalizeCategory(result.data);
      }
      
      return null;
    } catch (error) {
      console.error('CategoryAPI.create error:', error);
      throw error;
    }
  }

  // Update category
  async update(id: string, data: UpdateCategoryDto & { imageFile?: File }): Promise<Category | null> {
    try {
      let response;
      
      // If there's an image file, use FormData
      if (data.imageFile) {
        const formData = new FormData();
        if (data.name !== undefined) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.parentId !== undefined) {
          formData.append('parentId', data.parentId === null ? '' : data.parentId);
        }
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        formData.append('image', data.imageFile);
        
        response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Otherwise use JSON
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.description !== undefined) payload.description = data.description;
        if (data.parentId !== undefined) {
          payload.parentId = data.parentId === null ? '' : data.parentId;
        }
        if (data.isActive !== undefined) payload.isActive = data.isActive;
        
        response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      // Clear cache after update
      this.clearCache();
      
      if (result.success && result.data) {
        return this.normalizeCategory(result.data);
      }
      
      return null;
    } catch (error) {
      console.error(`CategoryAPI.update error (${id}):`, error);
      throw error;
    }
  }

  // Delete category
  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      // Clear cache after delete
      this.clearCache();
      
      return result?.success === true;
    } catch (error) {
      console.error(`CategoryAPI.delete error (${id}):`, error);
      return false;
    }
  }
}

export const categoryApi = new CategoryAPI();
