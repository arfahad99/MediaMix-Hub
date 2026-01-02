import { create } from 'zustand';
import { MediaItem, FilterOptions, UploadProgress } from '@/types';
import api from '@/lib/api';

interface UploadTask {
  id: string;
  file: File;
  description: string;
  tags: string[];
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface MediaState {
  items: MediaItem[];
  filteredItems: MediaItem[];
  isLoading: boolean;
  filters: FilterOptions;
  uploadTasks: UploadTask[];
  
  // Actions
  loadMedia: () => Promise<void>;
  addMediaItem: (item: MediaItem) => void;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  removeMediaItem: (id: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  applyFilters: () => void;
  
  // Upload actions
  addUploadTask: (task: Omit<UploadTask, 'id' | 'progress' | 'status'>) => string;
  updateUploadProgress: (id: string, progress: number) => void;
  completeUpload: (id: string, mediaItem: MediaItem) => void;
  failUpload: (id: string, error: string) => void;
  removeUploadTask: (id: string) => void;
  clearCompletedUploads: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  items: [],
  filteredItems: [],
  isLoading: false,
  filters: {
    type: 'all',
    search: '',
    sortBy: 'date-desc',
  },
  uploadTasks: [],

  loadMedia: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getMedia();
      if (response.success) {
        set({ items: response.media });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMediaItem: (item: MediaItem) => {
    set((state) => ({
      items: [item, ...state.items],
    }));
    get().applyFilters();
  },

  updateMediaItem: (id: string, updates: Partial<MediaItem>) => {
    set((state) => ({
      items: state.items.map((item) =>
        item._id === id ? { ...item, ...updates } : item
      ),
    }));
    get().applyFilters();
  },

  removeMediaItem: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item._id !== id),
    }));
    get().applyFilters();
  },

  setFilters: (newFilters: Partial<FilterOptions>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  applyFilters: () => {
    const { items, filters } = get();
    let filtered = [...items];

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((item) => item.fileType === filters.type);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.originalName.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.originalName.localeCompare(b.originalName);
        case 'name-desc':
          return b.originalName.localeCompare(a.originalName);
        case 'size-desc':
          return b.fileSize - a.fileSize;
        case 'size-asc':
          return a.fileSize - b.fileSize;
        default:
          return 0;
      }
    });

    set({ filteredItems: filtered });
  },

  addUploadTask: (task: Omit<UploadTask, 'id' | 'progress' | 'status'>) => {
    const id = Date.now().toString();
    const newTask: UploadTask = {
      ...task,
      id,
      progress: 0,
      status: 'pending',
    };
    
    set((state) => ({
      uploadTasks: [...state.uploadTasks, newTask],
    }));
    
    return id;
  },

  updateUploadProgress: (id: string, progress: number) => {
    set((state) => ({
      uploadTasks: state.uploadTasks.map((task) =>
        task.id === id
          ? { ...task, progress, status: 'uploading' as const }
          : task
      ),
    }));
  },

  completeUpload: (id: string, mediaItem: MediaItem) => {
    set((state) => ({
      uploadTasks: state.uploadTasks.map((task) =>
        task.id === id
          ? { ...task, progress: 100, status: 'completed' as const }
          : task
      ),
    }));
    
    get().addMediaItem(mediaItem);
  },

  failUpload: (id: string, error: string) => {
    set((state) => ({
      uploadTasks: state.uploadTasks.map((task) =>
        task.id === id
          ? { ...task, status: 'failed' as const, error }
          : task
      ),
    }));
  },

  removeUploadTask: (id: string) => {
    set((state) => ({
      uploadTasks: state.uploadTasks.filter((task) => task.id !== id),
    }));
  },

  clearCompletedUploads: () => {
    set((state) => ({
      uploadTasks: state.uploadTasks.filter(
        (task) => task.status !== 'completed'
      ),
    }));
  },
}));