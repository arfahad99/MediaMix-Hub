// User types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// Media types
export interface MediaItem {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio';
  fileSize: number;
  description: string;
  tags: string[];
  uploadDate: string;
  mimeType: string;
  url?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface MediaResponse {
  success: boolean;
  media: MediaItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface MediaStatsResponse {
  success: boolean;
  stats: {
    total: {
      totalFiles: number;
      totalSize: number;
    };
    recentUploads: number;
    byType: {
      image: number;
      video: number;
      audio: number;
    };
  };
}

// Form types
export interface LoginFormData {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface UploadFormData {
  files: File[];
  description: string;
  tags: string;
}

export interface EditMediaFormData {
  description: string;
  tags: string;
}

// UI State types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'edit' | 'view' | 'delete';
  data?: any;
}

// Filter and sort types
export type FilterType = 'all' | 'image' | 'video' | 'audio';
export type SortType = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
export type ViewType = 'grid' | 'list';

// Configuration types
export interface AppConfig {
  API_BASE_URL: string;
  MAX_FILE_SIZE: number;
  SUPPORTED_TYPES: {
    image: string[];
    video: string[];
    audio: string[];
  };
  TOAST_DURATION: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileValidationError {
  fileName: string;
  errors: string[];
}

// Component prop types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface MediaCardProps {
  item: MediaItem;
  view: ViewType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
}

// Store types (for Zustand)
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export interface MediaStore {
  items: MediaItem[];
  filteredItems: MediaItem[];
  currentFilter: FilterType;
  currentSort: SortType;
  currentView: ViewType;
  searchQuery: string;
  isLoading: boolean;
  stats: MediaStatsResponse['stats'] | null;
  
  // Actions
  loadMedia: () => Promise<void>;
  uploadMedia: (formData: FormData) => Promise<void>;
  updateMedia: (id: string, data: EditMediaFormData) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  loadStats: () => Promise<void>;
  
  // Filters and sorting
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setView: (view: ViewType) => void;
  setSearchQuery: (query: string) => void;
  filterAndSort: () => void;
}

export interface UIStore {
  toasts: ToastMessage[];
  modals: {
    edit: ModalState;
    view: ModalState;
    delete: ModalState;
  };
  
  // Toast actions
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Modal actions
  openModal: (type: 'edit' | 'view' | 'delete', data?: any) => void;
  closeModal: (type: 'edit' | 'view' | 'delete') => void;
  closeAllModals: () => void;
}