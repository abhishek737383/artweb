interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
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

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
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
  ordersByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

class OrdersAPI {
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

  // Create new order (checkout)
  async createOrder(orderData: any): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create order: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OrdersAPI.createOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  // Get user orders
  async getUserOrders(params?: GetOrdersParams): Promise<{
    orders: Order[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseUrl}/orders/user${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view your orders');
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return {
          orders: result.data.orders || [],
          total: result.data.total || 0,
          totalPages: result.data.totalPages || 1,
          page: params?.page || 1,
          limit: params?.limit || 10
        };
      }

      throw new Error(result.error || 'Failed to load orders');
    } catch (error) {
      console.error('OrdersAPI.getUserOrders error:', error);
      return {
        orders: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 10
      };
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view order details');
        }
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OrdersAPI.getOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OrdersAPI.cancelOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order'
      };
    }
  }

  // ADMIN: Get all orders
  async getAllOrders(params?: GetOrdersParams): Promise<{
    orders: Order[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseUrl}/admin/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Admin access required');
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return {
          orders: result.data.orders || [],
          total: result.data.total || 0,
          totalPages: result.data.totalPages || 1,
          page: params?.page || 1,
          limit: params?.limit || 20
        };
      }

      throw new Error(result.error || 'Failed to load orders');
    } catch (error) {
      console.error('OrdersAPI.getAllOrders error:', error);
      return {
        orders: [],
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 20
      };
    }
  }

  // ADMIN: Get order statistics
  async getStats(): Promise<OrderStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/orders/stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('OrdersAPI.getStats error:', error);
      return null;
    }
  }

  // ADMIN: Update order status
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OrdersAPI.updateOrderStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      };
    }
  }

  // ADMIN: Export orders
  async exportOrders(format: 'csv' | 'json' = 'csv', params?: GetOrdersParams): Promise<Blob | null> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      queryParams.append('format', format);

      const url = `${this.baseUrl}/admin/orders/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export orders: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('OrdersAPI.exportOrders error:', error);
      return null;
    }
  }
}

export const ordersApi = new OrdersAPI();