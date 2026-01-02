import { create } from 'zustand';
import { MediaStore, MediaItem, FilterType, SortType, ViewType, EditMediaFormData } from '@/types';
import { apiClient } from '@/lib/api';

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  filteredItems: [],
  currentFilter: 'all',
  currentSort: 'date-desc',
  currentView: 'grid',
  searchQuery: '',
  isLoading: false,
  stats: null,

  loadMedia: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.getMedia();
      
      if (response.success && response.media) {
        const items: MediaItem[] = response.media.map(item => ({
          id: item._id || item.id,
          fileName: item.originalName || item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          description: item.description,
          tags: item.tags || [],
          uploadDate: item.createdAt || item.uploadDate,
          mimeType: item.mimeType,
          url: apiClient.getMediaUrl(item._id || item.id)
        }));
        
        set({ items, isLoading: false });
        get().filterAndSort();
      }
    } catch (error) {
      console.error('Failed to load media:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  uploadMedia: async (formData: FormData) => {
    try {
      const response = await apiClient.uploadMedia(formData);
      
      if (response.success) {
        // Reload media after successful upload
        await get().loadMedia();
        await get().loadStats();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  },

  updateMedia: async (id: string, data: EditMediaFormData) => {
    try {
      const response = await apiClient.updateMedia(id, data);
      
      if (response.success) {
        // Update local state
        const { items } = get();
        const updatedItems = items.map(item => 
          item.id === id 
            ? { 
                ...item, 
                description: data.description,
                tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
              }
            : item
        );
        
        set({ items: updatedItems });
        get().filterAndSort();
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  },

  deleteMedia: async (id: string) => {
    try {
      const response = await apiClient.deleteMedia(id);
      
      if (response.success) {
        // Remove from local state
        const { items } = get();
        const updatedItems = items.filter(item => item.id !== id);
        
        set({ items: updatedItems });
        get().filterAndSort();
        await get().loadStats();
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  },

  loadStats: async () => {
    try {
      const response = await apiClient.getMediaStats();
      
      if (response.success && response.stats) {
        set({ stats: response.stats });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Use local stats as fallback
      const { items } = get();
      const totalFiles = items.length;
      const totalSize = items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
      
      // Recent uploads (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentUploads = items.filter(item => 
        new Date(item.uploadDate) > weekAgo
      ).length;
      
      const byType = items.reduce((acc, item) => {
        acc[item.fileType] = (acc[item.fileType] || 0) + 1;
        return acc;
      }, { image: 0, video: 0, audio: 0 } as Record<string, number>);
      
      set({
        stats: {
          total: { totalFiles, totalSize },
          recentUploads,
          byType
        }
      });
    }
  },

  setFilter: (filter: FilterType) => {
    set({ currentFilter: filter });
    get().filterAndSort();
  },

  setSort: (sort: SortType) => {
    set({ currentSort: sort });
    get().filterAndSort();
  },

  setView: (view: ViewType) => {
    set({ currentView: view });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().filterAndSort();
  },

  filterAndSort: () => {
    const { items, currentFilter, currentSort, searchQuery } = get();
    let filtered = [...items];
    
    // Apply filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => item.fileType === currentFilter);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.fileName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (currentSort) {
        case 'date-desc':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'date-asc':
          return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        case 'name-asc':
          return a.fileName.localeCompare(b.fileName);
        case 'name-desc':
          return b.fileName.localeCompare(a.fileName);
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'size-asc':
          return (a.fileSize || 0) - (b.fileSize || 0);
        default:
          return 0;
      }
    });
    
    set({ filteredItems: filtered });
  }
}));