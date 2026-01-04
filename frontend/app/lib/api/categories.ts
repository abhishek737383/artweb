// categoryApi.ts
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

  // Normalize category data (always returns Category|null)
  private normalizeCategory(data: any): Category | null {
    if (!data) return null;

    // Normalize image: could be string (old) or object { url, publicId, altText }
    let image: any = null;
    if (typeof data.image === 'string') {
      image = { url: data.image, publicId: undefined, altText: data.name || '' };
    } else if (data.image && typeof data.image === 'object') {
      image = {
        url: data.image.url ?? null,
        publicId: data.image.publicId ?? undefined,
        altText: data.image.altText ?? data.name ?? ''
      };
    } else {
      image = null;
    }

    // Normalize parentId: explicit checks so we only return string or null
    const rawParent = data.parentId;
    const parentId = (rawParent === undefined || rawParent === null || rawParent === '') ? null : String(rawParent);

    return {
      _id: data._id ? String(data._id) : (data.id ? String(data.id) : ''),
      id: data.id ? String(data.id) : (data._id ? String(data._id) : ''),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      image,
      parentId,
      isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
      __v: data.__v ?? undefined,
    } as Category;
  }

  // Get all categories — NO CACHING (real-time)
  async getAll(): Promise<Category[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const resultBody = await response.json();

      let rawList: any[] = [];

      // Accept either standard { success, data } or a raw array
      if (resultBody && typeof resultBody === 'object' && Array.isArray(resultBody.data)) {
        rawList = resultBody.data;
      } else if (Array.isArray(resultBody)) {
        rawList = resultBody;
      } else {
        // unexpected shape; try to find an array inside
        rawList = Array.isArray((resultBody as any).data) ? (resultBody as any).data : [];
      }

      const categories: Category[] = rawList.map(cat => this.normalizeCategory(cat)).filter(Boolean) as Category[];
      return categories;
    } catch (error) {
      console.error('CategoryAPI.getAll error:', error);
      return [];
    }
  }

  // Get category by slug — NO CACHING
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/slug/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch category by slug: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();

      if (result && result.success && result.data) {
        return this.normalizeCategory(result.data);
      }

      return null;
    } catch (error) {
      console.error(`CategoryAPI.getBySlug error (${slug}):`, error);
      return null;
    }
  }

  // Get category by ID — NO CACHING
  async getById(id: string): Promise<Category | null> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();

      if (result && result.success && result.data) {
        return this.normalizeCategory(result.data);
      }

      return null;
    } catch (error) {
      console.error(`CategoryAPI.getById error (${id}):`, error);
      return null;
    }
  }

  // Clear cache — kept as a no-op for API compatibility
  clearCache(): void {
    // intentionally no-op (caching removed for real-time updates)
  }

  // Create category
  async create(data: CreateCategoryDto & { imageFile?: File }): Promise<Category | null> {
    try {
      let response: Response;

      // If there's an image file, use FormData
      if (data.imageFile) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description ?? '');
        // always append parentId even if null/empty (server interprets empty string as remove)
        formData.append('parentId', data.parentId ?? '');
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
          // explicitly include parentId ('' => server will treat as remove)
          parentId: data.parentId ?? ''
        };

        response = await fetch(`${this.baseUrl}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to create category: ${response.status} ${text}`);
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
      let response: Response;

      // If there's an image file, use FormData
      if (data.imageFile) {
        const formData = new FormData();
        if (data.name !== undefined) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description ?? '');
        // include parentId when provided (null => empty string to remove)
        if (data.parentId !== undefined) {
          formData.append('parentId', data.parentId === null ? '' : String(data.parentId));
        }
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        // imageFile overrides image removal
        formData.append('image', data.imageFile);

        // If explicit image removal was requested (image === null) but no file present:
        if (data.image !== undefined && data.image === null) {
          // send empty string to signal removal in form-data branch
          formData.append('image', '');
        } else if (data.image !== undefined && typeof data.image === 'string') {
          // if image provided as string (unlikely here), forward it
          formData.append('image', data.image);
        }

        response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Otherwise use JSON
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.description !== undefined) payload.description = data.description ?? '';
        if (data.parentId !== undefined) {
          // send '' when removing parent, otherwise the id string
          payload.parentId = data.parentId === null ? '' : String(data.parentId);
        }
        if (data.isActive !== undefined) payload.isActive = data.isActive;
        // Forward explicit image intent (null => remove)
        if (data.image !== undefined) payload.image = data.image;

        response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to update category: ${response.status} ${text}`);
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
      const response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to delete category: ${response.status} ${text}`);
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
