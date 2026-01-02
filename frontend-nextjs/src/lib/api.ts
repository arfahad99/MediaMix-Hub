import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, MediaResponse, MediaItem, User, UploadProgress } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
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
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    
    if (response.data.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
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

  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
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
    file: File,
    description: string,
    tags: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; media: MediaItem; message: string }> {
    const formData = new FormData();
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

  async downloadMedia(id: string): Promise<Blob> {
    const response = await this.client.get(`/media/${id}/download`, {
      responseType: 'blob',
    });
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

  async getActivity(page = 1, limit = 20): Promise<{
    success: boolean;
    activities: Array<{
      id: string;
      type: string;
      description: string;
      fileType: string;
      timestamp: string;
      metadata: any;
    }>;
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    const response = await this.client.get('/user/activity', {
      params: { page, limit },
    });
    return response.data;
  }

  async getStorageStats(): Promise<{
    success: boolean;
    storage: {
      used: number;
      limit: number;
      percentage: number;
      totalFiles: number;
      averageFileSize: number;
      byType: Record<string, { count: number; size: number; percentage: number }>;
    };
  }> {
    const response = await this.client.get('/user/storage');
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
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

  getFileIcon(fileType: string): string {
    const icons = {
      image: 'PhotoIcon',
      video: 'VideoCameraIcon',
      audio: 'MusicalNoteIcon',
      unknown: 'DocumentIcon',
    };
    return icons[fileType as keyof typeof icons] || icons.unknown;
  }
}

export const api = new ApiClient();
export default api;