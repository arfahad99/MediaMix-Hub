import { type ClassValue, clsx } from 'clsx';
import { ValidationResult, FileValidationError } from '@/types';

// Tailwind CSS class utility
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'unknown' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'unknown';
};

export const getFileIcon = (fileType: string): string => {
  const icons = {
    image: 'lucide:image',
    video: 'lucide:video',
    audio: 'lucide:music',
    unknown: 'lucide:file'
  };
  return icons[fileType as keyof typeof icons] || icons.unknown;
};

// Date utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateDescription = (description: string): boolean => {
  const trimmed = description.trim();
  return trimmed.length > 0 && trimmed.length <= 500;
};

export const parseTags = (tagString: string): string[] => {
  if (!tagString.trim()) return [];
  
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags
};

export const validateTags = (tags: string[]): boolean => {
  return tags.length <= 10 && tags.every(tag => tag.length > 0 && tag.length <= 50);
};

// File validation
export const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/m4a']
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const validateFileType = (mimeType: string): boolean => {
  const allSupportedTypes = Object.values(SUPPORTED_TYPES).flat();
  return allSupportedTypes.includes(mimeType);
};

export const validateFile = (file: File): string[] => {
  const errors: string[] = [];
  
  if (!file || !(file instanceof File)) {
    errors.push('Invalid file object');
    return errors;
  }
  
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File must have a valid name');
  } else if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }
  
  if (file.size === 0) {
    errors.push('File is empty (0 bytes)');
  } else if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`);
  }
  
  if (!file.type) {
    errors.push('File type could not be determined');
  } else if (!validateFileType(file.type)) {
    const supportedTypes = Object.values(SUPPORTED_TYPES).flat();
    errors.push(`Unsupported file type: ${file.type}. Supported types: ${supportedTypes.slice(0, 5).join(', ')}${supportedTypes.length > 5 ? '...' : ''}`);
  }
  
  return errors;
};

export const validateFiles = (files: File[]): { validFiles: File[]; errors: FileValidationError[] } => {
  const validFiles: File[] = [];
  const errors: FileValidationError[] = [];
  
  files.forEach((file) => {
    const fileErrors = validateFile(file);
    
    // Check for duplicates
    const duplicateIndex = validFiles.findIndex(existingFile => 
      existingFile.name === file.name && existingFile.size === file.size
    );
    if (duplicateIndex !== -1) {
      fileErrors.push('Duplicate file already selected');
    }
    
    if (fileErrors.length === 0) {
      validFiles.push(file);
    } else {
      errors.push({
        fileName: file.name,
        errors: fileErrors
      });
    }
  });
  
  return { validFiles, errors };
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local storage utilities
export const getFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setToStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

// Token utilities
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (with 5 minute buffer)
    return payload.exp < (currentTime + 300);
  } catch {
    return true; // Assume expired if we can't parse
  }
};

export const getTokenTimeRemaining = (token: string): number => {
  if (!token) return 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  } catch {
    return 0;
  }
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Random utilities
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Animation utilities
export const staggerDelay = (index: number, baseDelay: number = 100): number => {
  return index * baseDelay;
};