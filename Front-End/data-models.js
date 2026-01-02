/**
 * MediaMix Hub - Data Models and Validation
 * Frontend-first approach with mock backend functionality
 */

// MediaItem Data Model
class MediaItem {
    constructor(data) {
        this.id = data.id || Utils.generateId();
        this.fileName = data.fileName || '';
        this.description = data.description || '';
        this.uploadDate = data.uploadDate || new Date().toISOString();
        this.fileType = data.fileType || 'unknown';
        this.fileSize = data.fileSize || 0;
        this.thumbnailUrl = data.thumbnailUrl || null;
        this.tags = data.tags || [];
        this.mimeType = data.mimeType || '';
        
        // Validate the data
        this.validate();
    }
    
    /**
     * Validate MediaItem data
     */
    validate() {
        const errors = [];
        
        if (!this.fileName || typeof this.fileName !== 'string') {
            errors.push('fileName is required and must be a string');
        }
        
        if (!this.description || typeof this.description !== 'string') {
            errors.push('description is required and must be a string');
        }
        
        if (this.description.length > 500) {
            errors.push('description must be 500 characters or less');
        }
        
        if (!this.uploadDate || !this.isValidDate(this.uploadDate)) {
            errors.push('uploadDate must be a valid ISO 8601 date string');
        }
        
        if (!['image', 'video', 'audio'].includes(this.fileType)) {
            errors.push('fileType must be image, video, or audio');
        }
        
        if (typeof this.fileSize !== 'number' || this.fileSize < 0) {
            errors.push('fileSize must be a non-negative number');
        }
        
        if (!Array.isArray(this.tags)) {
            errors.push('tags must be an array');
        }
        
        if (errors.length > 0) {
            throw new Error(`MediaItem validation failed: ${errors.join(', ')}`);
        }
    }
    
    /**
     * Check if date string is valid ISO 8601
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString === date.toISOString();
    }
    
    /**
     * Convert to plain object for storage
     */
    toJSON() {
        return {
            id: this.id,
            fileName: this.fileName,
            description: this.description,
            uploadDate: this.uploadDate,
            fileType: this.fileType,
            fileSize: this.fileSize,
            thumbnailUrl: this.thumbnailUrl,
            tags: this.tags,
            mimeType: this.mimeType
        };
    }
    
    /**
     * Create MediaItem from File object
     */
    static fromFile(file, description, tags = []) {
        return new MediaItem({
            fileName: file.name,
            description: description,
            fileType: DataValidation.getFileType(file.type),
            fileSize: file.size,
            mimeType: file.type,
            tags: tags
        });
    }
}

// Data Validation Utilities
class DataValidation {
    /**
     * Supported file types configuration
     */
    static SUPPORTED_TYPES = {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/m4a']
    };
    
    /**
     * Maximum file size (50MB)
     */
    static MAX_FILE_SIZE = 50 * 1024 * 1024;
    
    /**
     * Maximum description length
     */
    static MAX_DESCRIPTION_LENGTH = 500;
    
    /**
     * Validate file type
     */
    static validateFileType(mimeType) {
        const fileType = this.getFileType(mimeType);
        return fileType !== 'unknown';
    }
    
    /**
     * Get file type category from MIME type
     */
    static getFileType(mimeType) {
        for (const [type, mimes] of Object.entries(this.SUPPORTED_TYPES)) {
            if (mimes.includes(mimeType.toLowerCase())) {
                return type;
            }
        }
        return 'unknown';
    }
    
    /**
     * Validate file size
     */
    static validateFileSize(size) {
        return typeof size === 'number' && size > 0 && size <= this.MAX_FILE_SIZE;
    }
    
    /**
     * Validate description
     */
    static validateDescription(description) {
        return typeof description === 'string' && 
               description.trim().length > 0 && 
               description.length <= this.MAX_DESCRIPTION_LENGTH;
    }
    
    /**
     * Validate tags array
     */
    static validateTags(tags) {
        if (!Array.isArray(tags)) return false;
        
        return tags.every(tag => 
            typeof tag === 'string' && 
            tag.trim().length > 0 && 
            tag.length <= 50
        ) && tags.length <= 10;
    }
    
    /**
     * Validate complete file for upload
     */
    static validateFile(file) {
        const errors = [];
        
        if (!file || !(file instanceof File)) {
            errors.push('Invalid file object');
            return errors;
        }
        
        if (!this.validateFileType(file.type)) {
            const supportedTypes = Object.values(this.SUPPORTED_TYPES).flat();
            errors.push(`Unsupported file type. Supported types: ${supportedTypes.join(', ')}`);
        }
        
        if (!this.validateFileSize(file.size)) {
            errors.push(`File size must be between 1 byte and ${this.formatFileSize(this.MAX_FILE_SIZE)}`);
        }
        
        if (!file.name || file.name.trim().length === 0) {
            errors.push('File must have a valid name');
        }
        
        return errors;
    }
    
    /**
     * Format file size for display
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Parse and validate tags from string input
     */
    static parseTags(tagString) {
        if (!tagString || typeof tagString !== 'string') {
            return [];
        }
        
        return tagString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag.length <= 50)
            .slice(0, 10); // Limit to 10 tags
    }
}

// Utility Functions
class Utils {
    /**
     * Generate unique ID using timestamp and random string
     */
    static generateId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return `${timestamp}-${randomStr}`;
    }
    
    /**
     * Format date for display
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today ' + date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    /**
     * Get file icon class based on file type
     */
    static getFileIcon(fileType) {
        const icons = {
            image: 'fas fa-image',
            video: 'fas fa-video',
            audio: 'fas fa-music',
            unknown: 'fas fa-file'
        };
        return icons[fileType] || icons.unknown;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Debounce function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Check if two objects are equal (shallow comparison)
     */
    static isEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) {
            return false;
        }
        
        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }
        
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MediaItem, DataValidation, Utils };
} else {
    // Browser environment - attach to window
    window.MediaItem = MediaItem;
    window.DataValidation = DataValidation;
    window.Utils = Utils;
}