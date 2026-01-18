// lib/api/orders.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'credit_card' | 'upi' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  orderNotes?: string;
  adminNotes?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  recentOrders: Order[];
}

class OrdersAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // ======================
  // USER METHODS (Require Auth)
  // ======================

  private getUserAuthHeaders(): HeadersInit {
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

  // Get user orders (User - Requires Auth)
  async getUserOrders(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{
    orders: Order[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.search) queryParams.append('search', filters.search);

      const url = `${this.baseUrl}/orders/user${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getUserAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view orders');
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch orders'
        };
      }
    } catch (error) {
      console.error('OrdersAPI.getUserOrders error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders'
      };
    }
  }

  // Get user order by ID (User - Requires Auth)
  async getUserOrder(orderId: string): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: this.getUserAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view order');
        } else if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch order'
        };
      }
    } catch (error) {
      console.error('OrdersAPI.getUserOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Cancel order (User - Requires Auth) - FIXED METHOD NAME
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: this.getUserAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to cancel order');
        }
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Order cancelled successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to cancel order'
        };
      }
    } catch (error) {
      console.error('OrdersAPI.cancelOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order'
      };
    }
  }

  // ======================
  // ADMIN METHODS (NO AUTH REQUIRED)
  // ======================

  private getAdminHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Get all orders (Admin - NO Auth Required)
  async getAllOrders(filters: OrderFilters = {}): Promise<{
    orders: Order[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}/admin/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin orders: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      return result.data;
    } catch (error) {
      console.error('OrdersAPI.getAllOrders error:', error);
      throw error;
    }
  }

  // Get order by ID (Admin - NO Auth Required)
  async getOrder(orderId: string): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}`, {
        headers: this.getAdminHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch order'
        };
      }
    } catch (error) {
      console.error('OrdersAPI.getOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Get order statistics (Admin - NO Auth Required)
  async getStats(): Promise<OrderStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/orders/stats`, {
        headers: this.getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch stats');
      }

      return result.data;
    } catch (error) {
      console.error('OrdersAPI.getStats error:', error);
      throw error;
    }
  }

  // Update order status (Admin - NO Auth Required)
  async updateOrderStatus(
    orderId: string, 
    status: string, 
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Status updated successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to update status'
        };
      }
    } catch (error) {
      console.error('OrdersAPI.updateOrderStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update status'
      };
    }
  }

  // Export orders (Admin - NO Auth Required)
  async exportOrders(format: 'csv' | 'json', filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob | null> {
    try {
      const queryParams = new URLSearchParams({ format });
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/admin/orders/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to export orders: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('OrdersAPI.exportOrders error:', error);
      throw error;
    }
  }

  // Utility method to check if order can be cancelled
  canCancelOrder(order: Order): boolean {
    if (order.orderStatus === 'pending' || order.orderStatus === 'confirmed') {
      const created = new Date(order.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1; // Within 24 hours
    }
    return false;
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

export const ordersApi = new OrdersAPI();