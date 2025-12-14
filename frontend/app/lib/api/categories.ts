import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../../types/category';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CategoryAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Normalize category data
  private normalizeCategory(data: any): Category {
    if (!data) return data;
    
    return {
      _id: data._id || data.id,
      id: data.id || data._id,
      name: data.name || '',
      slug: data.slug || '',
      description: data.description,
      image: data.image,
      parentId: data.parentId || null,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      __v: data.__v,
    };
  }

  // Get all categories
  async getAll(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(cat => this.normalizeCategory(cat));
      }
      
      // Handle different response formats
      if (Array.isArray(result)) {
        return result.map(cat => this.normalizeCategory(cat));
      }
      
      return [];
    } catch (error) {
      console.error('CategoryAPI.getAll error:', error);
      return [];
    }
  }

  // Get category tree
  async getTree(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/tree`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category tree: ${response.status}`);
      }
      
      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(cat => this.normalizeCategory(cat));
      }
      
      return [];
    } catch (error) {
      console.error('CategoryAPI.getTree error:', error);
      return [];
    }
  }

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeCategory(result.data);
      }
      
      return null;
    } catch (error) {
      console.error(`CategoryAPI.getById error (${id}):`, error);
      return null;
    }
  }

  // Get category by slug
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/slug/${slug}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category by slug: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return this.normalizeCategory(result.data);
      }
      
      return null;
    } catch (error) {
      console.error(`CategoryAPI.getBySlug error (${slug}):`, error);
      return null;
    }
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
        
        response = await fetch(`${this.baseUrl}/categories/${id}`, {
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
        
        response = await fetch(`${this.baseUrl}/categories/${id}`, {
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
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error(`CategoryAPI.delete error (${id}):`, error);
      return false;
    }
  }
}

export const categoryApi = new CategoryAPI();