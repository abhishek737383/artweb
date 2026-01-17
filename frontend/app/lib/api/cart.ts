import { Product } from '../../../types/product';

interface CartItem {
  product: Product;
  quantity: number;
  _id?: string;
  addedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CartAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Helper function to ensure string values
  private ensureString(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    return '';
  }

  // Helper function to ensure number values
  private ensureNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private normalizeCartItem(data: any): CartItem {
    const productId = this.ensureString(data.product?._id || data.productId || '');
    const productData = data.product || {};
    
    // Ensure product has proper slug
    let productSlug = this.ensureString(productData.slug);
    if (!productSlug) {
      productSlug = productId; // Use ID as fallback
    }
    
    return {
      _id: this.ensureString(data._id),
      product: {
        _id: productId,
        id: productId, // Map _id to id for Product type
        name: this.ensureString(productData.name) || 'Unknown Product',
        slug: productSlug,
        sku: this.ensureString(productData.sku),
        description: this.ensureString(productData.description),
        price: this.ensureNumber(productData.price),
        compareAtPrice: this.ensureNumber(productData.compareAtPrice),
        images: Array.isArray(productData.images) 
          ? productData.images.map((img: any) => {
              if (typeof img === 'string') {
                return {
                  url: img,
                  altText: this.ensureString(productData.name) || '',
                  isPrimary: false,
                  publicId: ''
                };
              }
              return {
                url: this.ensureString(img.url),
                altText: this.ensureString(img.altText) || this.ensureString(productData.name) || '',
                isPrimary: Boolean(img.isPrimary),
                publicId: this.ensureString(img.publicId)
              };
            }).filter((img: any) => img.url) // Remove images without URL
          : [],
        category: productData.category || null,
        stock: this.ensureNumber(productData.stock),
        isActive: productData.isActive !== false,
        isFeatured: Boolean(productData.isFeatured),
        isBestSeller: Boolean(productData.isBestSeller),
        tags: Array.isArray(productData.tags) 
          ? productData.tags.map((tag: any) => this.ensureString(tag)).filter(Boolean)
          : [],
        createdAt: this.ensureString(productData.createdAt),
        updatedAt: this.ensureString(productData.updatedAt),
      },
      quantity: this.ensureNumber(data.quantity) || 1,
      addedAt: this.ensureString(data.createdAt) || new Date().toISOString()
    };
  }

  // Get user cart
  async getCart(): Promise<CartItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cart`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to access your cart');
        }
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data?.items) {
        return result.data.items
          .map((item: any) => this.normalizeCartItem(item))
          .filter((item: CartItem) => item.product && item.product._id);
      }
      
      return [];
    } catch (error) {
      console.error('CartAPI.getCart error:', error);
      return [];
    }
  }

  // Add item to cart
  async addItem(productId: string, quantity: number = 1): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/cart`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to add items to cart');
        }
        throw new Error(`Failed to add item to cart: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error('CartAPI.addItem error:', error);
      return false;
    }
  }

  // Update item quantity
  async updateItem(productId: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to update cart');
        }
        throw new Error(`Failed to update cart item: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error('CartAPI.updateItem error:', error);
      return false;
    }
  }

  // Remove item from cart
  async removeItem(productId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to remove items from cart');
        }
        throw new Error(`Failed to remove cart item: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error('CartAPI.removeItem error:', error);
      return false;
    }
  }

  // Clear cart
  async clearCart(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/cart`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to clear cart');
        }
        throw new Error(`Failed to clear cart: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error('CartAPI.clearCart error:', error);
      return false;
    }
  }
}

export const cartApi = new CartAPI();