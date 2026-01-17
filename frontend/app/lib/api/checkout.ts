interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface OrderData {
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'credit_card' | 'upi' | 'cod';
  paymentDetails: any;
  orderNotes: string;
  saveAddress: boolean;
}

class CheckoutAPI {
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

  // Create order
  async createOrder(orderData: OrderData): Promise<ApiResponse<any>> {
    try {
      console.log('Creating order with data:', {
        ...orderData,
        paymentDetails: orderData.paymentMethod === 'cod' ? {cod: true} : orderData.paymentDetails
      });

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      let result: ApiResponse<any>;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return {
          success: false,
          error: 'Server returned invalid response'
        };
      }

      if (!response.ok) {
        console.error('Order creation failed:', result);
        return {
          success: false,
          error: result.message || `Failed to create order: ${response.status}`
        };
      }

      console.log('Order created successfully:', result);
      return result;
    } catch (error) {
      console.error('CheckoutAPI.createOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view order');
        }
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result;
    } catch (error) {
      console.error('CheckoutAPI.getOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Get user orders
  async getUserOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const url = `${this.baseUrl}/orders/user${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view orders');
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result;
    } catch (error) {
      console.error('CheckoutAPI.getUserOrders error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders'
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
        if (response.status === 401) {
          throw new Error('Please login to cancel order');
        }
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result;
    } catch (error) {
      console.error('CheckoutAPI.cancelOrder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order'
      };
    }
  }
}

export const checkoutApi = new CheckoutAPI();