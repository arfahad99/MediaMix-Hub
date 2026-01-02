export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
}

export interface MediaItem {
  _id: string;
  userId: string;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  fileSize: number;
  fileType: 'image' | 'video' | 'audio' | 'unknown';
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface MediaResponse {
  success: boolean;
  media: MediaItem[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  byType: {
    image: { count: number; size: number };
    video: { count: number; size: number };
    audio: { count: number; size: number };
  };
  recentUploads: number;
}

export interface FilterOptions {
  type: 'all' | 'image' | 'video' | 'audio';
  search: string;
  sortBy: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
}

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// React Native specific types
export interface RNMediaItem extends Omit<MediaItem, '_id'> {
  id: string;
  localUri?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface RNUploadTask {
  id: string;
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
  description: string;
  tags: string[];
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface PickedAsset {
  uri: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
}