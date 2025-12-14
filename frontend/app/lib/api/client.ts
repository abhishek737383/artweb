// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// type FetchOptions = {
//   headers?: Record<string, string>;
//   method?: string;
//   body?: any;
//   noJson?: boolean;
//   cache?: RequestCache;
// };

// async function request<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
//   try {
//     const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
//     const headers = opts.headers || {};
    
//     // Only set Content-Type to JSON if body exists and is not FormData
//     if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
//       headers['Content-Type'] = 'application/json';
//     }

//     const init: RequestInit = {
//       method: opts.method || 'GET',
//       headers,
//       body: opts.body,
//       credentials: 'include',
//       cache: opts.cache || 'default',
//     };

//     // If body is FormData, let browser set headers
//     if (opts.body instanceof FormData) {
//       delete (init.headers as any)['Content-Type'];
//     }

//     const res = await fetch(url, init);
    
//     // Handle non-JSON responses
//     const contentType = res.headers.get('content-type');
//     if (!contentType || !contentType.includes('application/json')) {
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//       }
//       return {} as T;
//     }

//     const data = await res.json();

//     if (!res.ok) {
//       const error = new Error(data.message || data.error || 'API request failed');
//       (error as any).status = res.status;
//       (error as any).data = data;
//       throw error;
//     }

//     return data as T;
//   } catch (error) {
//     console.error('API Request Error:', error);
//     throw error;
//   }
// }

// // Helper functions
// export const apiGet = <T = any>(path: string, options?: Omit<FetchOptions, 'method' | 'body'>) => 
//   request<T>(path, { method: 'GET', ...options });

// export const apiPost = <T = any>(path: string, body?: any) => 
//   request<T>(path, { 
//     method: 'POST', 
//     body: body ? JSON.stringify(body) : undefined 
//   });

// export const apiPut = <T = any>(path: string, body?: any) => 
//   request<T>(path, { 
//     method: 'PUT', 
//     body: body ? JSON.stringify(body) : undefined 
//   });

// export const apiDelete = <T = any>(path: string) => 
//   request<T>(path, { method: 'DELETE' });

// export const apiPostForm = <T = any>(path: string, formData: FormData) => 
//   request<T>(path, { method: 'POST', body: formData });

// export const apiPutForm = <T = any>(path: string, formData: FormData) => 
//   request<T>(path, { method: 'PUT', body: formData });

// export default { apiGet, apiPost, apiPut, apiDelete, apiPostForm, apiPutForm, API_BASE };