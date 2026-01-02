import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, MediaResponse, MediaItem, User, UploadProgress } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use your actual backend URL here
    this.baseURL = __DEV__ 
      ? 'http://localhost:5000/api' // Development
      : 'https://your-production-api.com/api'; // Production
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
          // You might want to navigate to login screen here
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  }

  async getProfile(): Promise<{ success: boolean; user: User }> {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(name: string, email: string): Promise<{ success: boolean; user: User }> {
    const response = await this.client.put('/auth/profile', { name, email });
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Media methods
  async getMedia(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<MediaResponse> {
    const response = await this.client.get('/media', { params });
    return response.data;
  }

  async getMediaById(id: string): Promise<{ success: boolean; media: MediaItem }> {
    const response = await this.client.get(`/media/${id}`);
    return response.data;
  }

  async uploadMedia(
    fileUri: string,
    fileName: string,
    fileType: string,
    description: string,
    tags: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; media: MediaItem; message: string }> {
    const formData = new FormData();
    
    // Create file object for React Native
    const file = {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any;
    
    formData.append('file', file);
    formData.append('description', description);
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    const response = await this.client.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async updateMedia(
    id: string,
    description: string,
    tags: string[]
  ): Promise<{ success: boolean; media: MediaItem; message: string }> {
    const response = await this.client.put(`/media/${id}`, {
      description,
      tags,
    });
    return response.data;
  }

  async deleteMedia(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/media/${id}`);
    return response.data;
  }

  getMediaUrl(id: string): string {
    return `${this.baseURL}/media/${id}/file`;
  }

  // Dashboard methods
  async getDashboard(): Promise<{
    success: boolean;
    dashboard: {
      user: User;
      stats: {
        totalFiles: number;
        totalSize: number;
        byType: {
          image: { count: number; size: number };
          video: { count: number; size: number };
          audio: { count: number; size: number };
        };
      };
      recentUploads: MediaItem[];
    };
  }> {
    const response = await this.client.get('/user/dashboard');
    return response.data;
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'unknown' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
  }
}

export const api = new ApiClient();
export default api;