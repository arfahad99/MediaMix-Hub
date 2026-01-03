import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  MediaResponse, 
  MediaStatsResponse, 
  ApiResponse,
  LoginFormData,
  RegisterFormData,
  EditMediaFormData
} from '@/types';

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get token from Zustand auth store first
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state && parsed.state.token) {
          return parsed.state.token;
        }
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
    
    // Fallback to direct localStorage access
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Set in both locations for compatibility
    localStorage.setItem('authToken', token);
    
    // Update Zustand auth store if it exists
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state) {
          parsed.state.token = token;
          parsed.state.isAuthenticated = true;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Error updating auth storage:', error);
    }
  }

  private clearToken(): void {
    if (typeof window === 'undefined') return;
    
    // Clear from both locations
    localStorage.removeItem('authToken');
    
    // Clear from Zustand auth store if it exists
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed.state) {
          parsed.state.token = null;
          parsed.state.isAuthenticated = false;
          parsed.state.user = null;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  }

  // Auth endpoints
  async login(data: LoginFormData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', {
        identifier: data.identifier,
        password: data.password
      });
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(data: RegisterFormData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async getProfile(): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.client.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  logout(): void {
    this.clearToken();
  }

  // Media endpoints
  async getMedia(params: Record<string, any> = {}): Promise<MediaResponse> {
    try {
      const response: AxiosResponse<MediaResponse> = await this.client.get('/media', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load media');
    }
  }

  async uploadMedia(formData: FormData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Upload failed');
    }
  }

  async updateMedia(id: string, data: EditMediaFormData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.put(`/media/${id}`, {
        description: data.description,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  }

  async deleteMedia(id: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.delete(`/media/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Delete failed');
    }
  }

  async getMediaStats(): Promise<MediaStatsResponse> {
    try {
      const response: AxiosResponse<MediaStatsResponse> = await this.client.get('/media/stats/overview');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load stats');
    }
  }

  // Utility methods
  getMediaUrl(id: string): string {
    return `${this.baseURL}/media/${id}/file`;
  }

  async getMediaBlob(id: string): Promise<string> {
    try {
      const response = await this.client.get(`/media/${id}/file`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load media file');
    }
  }

  getDownloadUrl(id: string): string {
    return `${this.baseURL}/media/${id}/download`;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Create singleton instance
export const apiClient = new APIClient();
export default apiClient;