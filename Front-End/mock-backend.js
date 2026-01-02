/**
 * MediaMix Hub - Mock Backend API
 * Simulates real API behavior using localStorage with fallback to in-memory storage
 */

// Storage Configuration
const STORAGE_CONFIG = {
    PRIMARY_KEY: 'mediamix_hub_data',
    BACKUP_KEY: 'mediamix_hub_backup',
    VERSION: '1.0.0'
};

// Mock Backend API Class
class MockBackendAPI {
    constructor() {
        this.storage = new StorageManager();
        this.isInitialized = false;
        this.init();
    }
    
    /**
     * Initialize the mock backend
     */
    async init() {
        try {
            await this.storage.init();
            this.isInitialized = true;
            console.log('MockBackendAPI initialized successfully');
        } catch (error) {
            console.error('MockBackendAPI initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Simulate network delay for realistic API behavior
     */
    async simulateNetworkDelay(min = 100, max = 500) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * Create new media item
     * @param {Object} mediaData - Media data without ID
     * @returns {Promise<MediaItem>} Created media item
     */
    async createMedia(mediaData) {
        await this.simulateNetworkDelay();
        
        try {
            // Validate input data
            if (!mediaData.fileName || !mediaData.description) {
                throw new Error('fileName and description are required');
            }
            
            // Create MediaItem instance (this will validate the data)
            const mediaItem = new MediaItem(mediaData);
            
            // Store the media item
            const stored = await this.storage.addMediaItem(mediaItem);
            
            console.log('Media created:', stored.id);
            return stored;
            
        } catch (error) {
            console.error('Create media failed:', error);
            throw new Error(`Failed to create media: ${error.message}`);
        }
    }
    
    /**
     * Get all media items
     * @returns {Promise<MediaItem[]>} Array of media items
     */
    async getMedia() {
        await this.simulateNetworkDelay();
        
        try {
            const mediaItems = await this.storage.getAllMediaItems();
            console.log(`Retrieved ${mediaItems.length} media items`);
            return mediaItems;
            
        } catch (error) {
            console.error('Get media failed:', error);
            throw new Error(`Failed to retrieve media: ${error.message}`);
        }
    }
    
    /**
     * Get single media item by ID
     * @param {string} id - Media item ID
     * @returns {Promise<MediaItem>} Media item
     */
    async getMediaById(id) {
        await this.simulateNetworkDelay();
        
        try {
            const mediaItem = await this.storage.getMediaItemById(id);
            if (!mediaItem) {
                throw new Error('Media item not found');
            }
            
            console.log('Media retrieved:', id);
            return mediaItem;
            
        } catch (error) {
            console.error('Get media by ID failed:', error);
            throw new Error(`Failed to retrieve media: ${error.message}`);
        }
    }
    
    /**
     * Update media item
     * @param {string} id - Media item ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<MediaItem>} Updated media item
     */
    async updateMedia(id, updates) {
        await this.simulateNetworkDelay();
        
        try {
            // Get existing item
            const existingItem = await this.storage.getMediaItemById(id);
            if (!existingItem) {
                throw new Error('Media item not found');
            }
            
            // Merge updates with existing data
            const updatedData = { ...existingItem.toJSON(), ...updates };
            
            // Create new MediaItem instance (this will validate)
            const updatedItem = new MediaItem(updatedData);
            
            // Update in storage
            const stored = await this.storage.updateMediaItem(id, updatedItem);
            
            console.log('Media updated:', id);
            return stored;
            
        } catch (error) {
            console.error('Update media failed:', error);
            throw new Error(`Failed to update media: ${error.message}`);
        }
    }
    
    /**
     * Delete media item
     * @param {string} id - Media item ID
     * @returns {Promise<void>}
     */
    async deleteMedia(id) {
        await this.simulateNetworkDelay();
        
        try {
            const success = await this.storage.deleteMediaItem(id);
            if (!success) {
                throw new Error('Media item not found');
            }
            
            console.log('Media deleted:', id);
            
        } catch (error) {
            console.error('Delete media failed:', error);
            throw new Error(`Failed to delete media: ${error.message}`);
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
        await this.simulateNetworkDelay(50, 100);
        
        try {
            return await this.storage.getStats();
        } catch (error) {
            console.error('Get storage stats failed:', error);
            throw new Error(`Failed to get storage stats: ${error.message}`);
        }
    }
    
    /**
     * Clear all data (for testing/reset)
     * @returns {Promise<void>}
     */
    async clearAllData() {
        await this.simulateNetworkDelay(50, 100);
        
        try {
            await this.storage.clearAll();
            console.log('All data cleared');
        } catch (error) {
            console.error('Clear data failed:', error);
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    }
}

// Storage Manager Class
class StorageManager {
    constructor() {
        this.useLocalStorage = this.checkLocalStorageAvailability();
        this.inMemoryStorage = {
            mediaItems: [],
            lastUpdated: new Date().toISOString(),
            version: STORAGE_CONFIG.VERSION
        };
        
        console.log(`Storage mode: ${this.useLocalStorage ? 'localStorage' : 'in-memory'}`);
    }
    
    /**
     * Check if localStorage is available
     */
    checkLocalStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage not available, falling back to in-memory storage');
            return false;
        }
    }
    
    /**
     * Initialize storage
     */
    async init() {
        if (this.useLocalStorage) {
            await this.loadFromLocalStorage();
        }
        
        // Create backup on initialization
        await this.createBackup();
    }
    
    /**
     * Load data from localStorage
     */
    async loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(STORAGE_CONFIG.PRIMARY_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                
                // Validate data structure
                if (this.validateStorageData(parsed)) {
                    this.inMemoryStorage = parsed;
                    console.log(`Loaded ${parsed.mediaItems.length} items from localStorage`);
                } else {
                    console.warn('Invalid storage data, starting fresh');
                    await this.saveToLocalStorage();
                }
            } else {
                // No existing data, save initial structure
                await this.saveToLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            // Try to restore from backup
            await this.restoreFromBackup();
        }
    }
    
    /**
     * Save data to localStorage
     */
    async saveToLocalStorage() {
        if (!this.useLocalStorage) return;
        
        try {
            this.inMemoryStorage.lastUpdated = new Date().toISOString();
            const data = JSON.stringify(this.inMemoryStorage);
            localStorage.setItem(STORAGE_CONFIG.PRIMARY_KEY, data);
            
            // Also update backup periodically
            const now = Date.now();
            const lastBackup = localStorage.getItem(STORAGE_CONFIG.BACKUP_KEY + '_timestamp');
            if (!lastBackup || (now - parseInt(lastBackup)) > 5 * 60 * 1000) { // 5 minutes
                await this.createBackup();
            }
            
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            
            // If quota exceeded, try to clean up old data
            if (error.name === 'QuotaExceededError') {
                await this.handleStorageQuotaExceeded();
            }
        }
    }
    
    /**
     * Validate storage data structure
     */
    validateStorageData(data) {
        return data && 
               Array.isArray(data.mediaItems) && 
               typeof data.lastUpdated === 'string' && 
               typeof data.version === 'string';
    }
    
    /**
     * Create backup
     */
    async createBackup() {
        if (!this.useLocalStorage) return;
        
        try {
            const backupData = JSON.stringify(this.inMemoryStorage);
            localStorage.setItem(STORAGE_CONFIG.BACKUP_KEY, backupData);
            localStorage.setItem(STORAGE_CONFIG.BACKUP_KEY + '_timestamp', Date.now().toString());
        } catch (error) {
            console.warn('Failed to create backup:', error);
        }
    }
    
    /**
     * Restore from backup
     */
    async restoreFromBackup() {
        if (!this.useLocalStorage) return;
        
        try {
            const backupData = localStorage.getItem(STORAGE_CONFIG.BACKUP_KEY);
            if (backupData) {
                const parsed = JSON.parse(backupData);
                if (this.validateStorageData(parsed)) {
                    this.inMemoryStorage = parsed;
                    await this.saveToLocalStorage();
                    console.log('Restored from backup successfully');
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
        }
        
        // If backup restore fails, start fresh
        this.inMemoryStorage = {
            mediaItems: [],
            lastUpdated: new Date().toISOString(),
            version: STORAGE_CONFIG.VERSION
        };
        await this.saveToLocalStorage();
    }
    
    /**
     * Handle storage quota exceeded
     */
    async handleStorageQuotaExceeded() {
        console.warn('Storage quota exceeded, attempting cleanup...');
        
        // Remove oldest items if we have too many
        if (this.inMemoryStorage.mediaItems.length > 100) {
            // Sort by upload date and keep only the 50 most recent
            this.inMemoryStorage.mediaItems.sort((a, b) => 
                new Date(b.uploadDate) - new Date(a.uploadDate)
            );
            this.inMemoryStorage.mediaItems = this.inMemoryStorage.mediaItems.slice(0, 50);
            
            try {
                await this.saveToLocalStorage();
                console.log('Storage cleanup successful');
            } catch (error) {
                console.error('Storage cleanup failed, switching to in-memory mode');
                this.useLocalStorage = false;
            }
        }
    }
    
    /**
     * Add media item
     */
    async addMediaItem(mediaItem) {
        this.inMemoryStorage.mediaItems.unshift(mediaItem.toJSON());
        await this.saveToLocalStorage();
        return mediaItem;
    }
    
    /**
     * Get all media items
     */
    async getAllMediaItems() {
        return this.inMemoryStorage.mediaItems.map(item => new MediaItem(item));
    }
    
    /**
     * Get media item by ID
     */
    async getMediaItemById(id) {
        const item = this.inMemoryStorage.mediaItems.find(item => item.id === id);
        return item ? new MediaItem(item) : null;
    }
    
    /**
     * Update media item
     */
    async updateMediaItem(id, updatedItem) {
        const index = this.inMemoryStorage.mediaItems.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Media item not found');
        }
        
        this.inMemoryStorage.mediaItems[index] = updatedItem.toJSON();
        await this.saveToLocalStorage();
        return updatedItem;
    }
    
    /**
     * Delete media item
     */
    async deleteMediaItem(id) {
        const index = this.inMemoryStorage.mediaItems.findIndex(item => item.id === id);
        if (index === -1) {
            return false;
        }
        
        this.inMemoryStorage.mediaItems.splice(index, 1);
        await this.saveToLocalStorage();
        return true;
    }
    
    /**
     * Get storage statistics
     */
    async getStats() {
        const items = this.inMemoryStorage.mediaItems;
        const totalSize = items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        
        // Calculate storage usage
        let storageUsed = 0;
        if (this.useLocalStorage) {
            try {
                const data = localStorage.getItem(STORAGE_CONFIG.PRIMARY_KEY);
                storageUsed = data ? new Blob([data]).size : 0;
            } catch (error) {
                storageUsed = 0;
            }
        }
        
        return {
            totalItems: items.length,
            totalFileSize: totalSize,
            storageUsed: storageUsed,
            storageMode: this.useLocalStorage ? 'localStorage' : 'in-memory',
            lastUpdated: this.inMemoryStorage.lastUpdated,
            version: this.inMemoryStorage.version
        };
    }
    
    /**
     * Clear all data
     */
    async clearAll() {
        this.inMemoryStorage = {
            mediaItems: [],
            lastUpdated: new Date().toISOString(),
            version: STORAGE_CONFIG.VERSION
        };
        
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem(STORAGE_CONFIG.PRIMARY_KEY);
                localStorage.removeItem(STORAGE_CONFIG.BACKUP_KEY);
                localStorage.removeItem(STORAGE_CONFIG.BACKUP_KEY + '_timestamp');
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
            }
        }
    }
}

// Error Classes for better error handling
class MockAPIError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'MockAPIError';
        this.code = code;
    }
}

class StorageError extends Error {
    constructor(message, code = 'STORAGE_ERROR') {
        super(message);
        this.name = 'StorageError';
        this.code = code;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockBackendAPI, StorageManager, MockAPIError, StorageError };
} else {
    // Browser environment - attach to window
    window.MockBackendAPI = MockBackendAPI;
    window.StorageManager = StorageManager;
    window.MockAPIError = MockAPIError;
    window.StorageError = StorageError;
}