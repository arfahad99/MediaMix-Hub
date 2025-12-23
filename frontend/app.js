/**
 * MediaMix Hub - Main Application Module
 * A frontend-first media management application with mock backend
 */

// Application State
const AppState = {
    mediaItems: [],
    currentEditId: null,
    isLoading: false
};

// DOM Elements - Cached for performance
const DOM = {
    // Upload Section
    uploadForm: null,
    fileInput: null,
    descriptionInput: null,
    uploadBtn: null,
    uploadSpinner: null,
    uploadError: null,
    uploadSuccess: null,
    fileInfo: null,
    charCount: null,
    
    // Gallery Section
    galleryContainer: null,
    galleryStats: null,
    emptyState: null,
    
    // Edit Modal
    editModal: null,
    editDescriptionInput: null,
    editCharCount: null,
    modalClose: null,
    cancelEdit: null,
    saveEdit: null
};

// Utility Functions
const Utils = {
    /**
     * Generate a unique ID for media items
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get file type category from MIME type
     * @param {string} mimeType - File MIME type
     * @returns {string} File category (image, video, audio)
     */
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'unknown';
    },

    /**
     * Get appropriate icon for file type
     * @param {string} fileType - File type category
     * @returns {string} Emoji icon
     */
    getFileIcon(fileType) {
        const icons = {
            image: '🖼️',
            video: '🎥',
            audio: '🎵',
            unknown: '📄'
        };
        return icons[fileType] || icons.unknown;
    },

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validate file type
     * @param {File} file - File to validate
     * @returns {boolean} True if valid file type
     */
    isValidFileType(file) {
        const validTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'
        ];
        return validTypes.includes(file.type);
    },

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type ('error' or 'success')
     * @param {number} duration - Display duration in ms
     */
    showMessage(message, type = 'error', duration = 5000) {
        const element = type === 'error' ? DOM.uploadError : DOM.uploadSuccess;
        element.textContent = message;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },

    /**
     * Set loading state for upload button
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        AppState.isLoading = loading;
        DOM.uploadBtn.disabled = loading;
        DOM.uploadBtn.classList.toggle('loading', loading);
    }
};

// Mock Backend API - Placeholder for future Azure integration
class MockBackendAPI {
    constructor() {
        this.storageKey = 'mediamix_hub_data';
        this.backupKey = 'mediamix_hub_backup';
    }

    /**
     * Initialize storage and load existing data
     */
    async init() {
        try {
            const data = this.loadFromStorage();
            AppState.mediaItems = data.mediaItems || [];
            console.log('Mock backend initialized with', AppState.mediaItems.length, 'items');
        } catch (error) {
            console.error('Failed to initialize mock backend:', error);
            AppState.mediaItems = [];
        }
    }

    /**
     * Load data from localStorage with fallback
     * @returns {Object} Stored data object
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { mediaItems: [], version: '1.0' };
        } catch (error) {
            console.warn('Primary storage failed, trying backup:', error);
            try {
                const backup = localStorage.getItem(this.backupKey);
                return backup ? JSON.parse(backup) : { mediaItems: [], version: '1.0' };
            } catch (backupError) {
                console.error('Backup storage also failed:', backupError);
                return { mediaItems: [], version: '1.0' };
            }
        }
    }

    /**
     * Save data to localStorage with backup
     * @param {Object} data - Data to save
     */
    saveToStorage(data) {
        try {
            const dataString = JSON.stringify(data);
            localStorage.setItem(this.storageKey, dataString);
            localStorage.setItem(this.backupKey, dataString);
        } catch (error) {
            console.error('Failed to save to storage:', error);
            throw new Error('Storage quota exceeded or unavailable');
        }
    }

    /**
     * Create a new media item
     * @param {Object} mediaData - Media item data
     * @returns {Promise<Object>} Created media item
     */
    async createMedia(mediaData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mediaItem = {
            id: Utils.generateId(),
            fileName: mediaData.fileName,
            description: mediaData.description,
            uploadDate: new Date().toISOString(),
            fileType: mediaData.fileType,
            fileSize: mediaData.fileSize
        };

        AppState.mediaItems.push(mediaItem);
        this.saveToStorage({
            mediaItems: AppState.mediaItems,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        });

        return mediaItem;
    }

    /**
     * Get all media items
     * @returns {Promise<Array>} Array of media items
     */
    async getMedia() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return [...AppState.mediaItems];
    }

    /**
     * Update a media item
     * @param {string} id - Media item ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated media item
     */
    async updateMedia(id, updates) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const index = AppState.mediaItems.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Media item not found');
        }

        AppState.mediaItems[index] = { ...AppState.mediaItems[index], ...updates };
        this.saveToStorage({
            mediaItems: AppState.mediaItems,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        });

        return AppState.mediaItems[index];
    }

    /**
     * Delete a media item
     * @param {string} id - Media item ID
     * @returns {Promise<void>}
     */
    async deleteMedia(id) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const index = AppState.mediaItems.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Media item not found');
        }

        AppState.mediaItems.splice(index, 1);
        this.saveToStorage({
            mediaItems: AppState.mediaItems,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        });
    }
}

// Initialize mock backend
const mockAPI = new MockBackendAPI();

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MediaMix Hub initializing...');
    
    // Cache DOM elements
    initializeDOMElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize mock backend
    await mockAPI.init();
    
    // Initial render
    await renderGallery();
    
    console.log('MediaMix Hub initialized successfully');
});

/**
 * Cache all DOM elements for performance
 */
function initializeDOMElements() {
    // Upload Section
    DOM.uploadForm = document.getElementById('uploadForm');
    DOM.fileInput = document.getElementById('fileInput');
    DOM.descriptionInput = document.getElementById('descriptionInput');
    DOM.uploadBtn = document.getElementById('uploadBtn');
    DOM.uploadSpinner = document.getElementById('uploadSpinner');
    DOM.uploadError = document.getElementById('uploadError');
    DOM.uploadSuccess = document.getElementById('uploadSuccess');
    DOM.fileInfo = document.getElementById('fileInfo');
    DOM.charCount = document.getElementById('charCount');
    
    // Gallery Section
    DOM.galleryContainer = document.getElementById('galleryContainer');
    DOM.galleryStats = document.getElementById('galleryStats');
    DOM.emptyState = document.getElementById('emptyState');
    
    // Edit Modal
    DOM.editModal = document.getElementById('editModal');
    DOM.editDescriptionInput = document.getElementById('editDescriptionInput');
    DOM.editCharCount = document.getElementById('editCharCount');
    DOM.modalClose = document.getElementById('modalClose');
    DOM.cancelEdit = document.getElementById('cancelEdit');
    DOM.saveEdit = document.getElementById('saveEdit');
    
    // View Modal
    DOM.viewModal = document.getElementById('viewModal');
    DOM.viewModalTitle = document.getElementById('viewModalTitle');
    DOM.viewModalClose = document.getElementById('viewModalClose');
    DOM.mediaPreview = document.getElementById('mediaPreview');
    DOM.mediaDetails = document.getElementById('mediaDetails');
    DOM.closeView = document.getElementById('closeView');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Upload form events
    DOM.uploadForm.addEventListener('submit', handleUpload);
    DOM.fileInput.addEventListener('change', handleFileSelect);
    DOM.descriptionInput.addEventListener('input', updateCharCount);
    
    // Edit modal events
    DOM.modalClose.addEventListener('click', closeEditModal);
    DOM.cancelEdit.addEventListener('click', closeEditModal);
    DOM.saveEdit.addEventListener('click', handleSaveEdit);
    DOM.editDescriptionInput.addEventListener('input', updateEditCharCount);
    
    // View modal events
    DOM.viewModalClose.addEventListener('click', closeViewModal);
    DOM.closeView.addEventListener('click', closeViewModal);
    
    // Close modals on overlay click
    DOM.editModal.addEventListener('click', (e) => {
        if (e.target === DOM.editModal) {
            closeEditModal();
        }
    });
    
    DOM.viewModal.addEventListener('click', (e) => {
        if (e.target === DOM.viewModal) {
            closeViewModal();
        }
    });
    
    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.editModal.classList.contains('show')) {
                closeEditModal();
            }
            if (DOM.viewModal.classList.contains('show')) {
                closeViewModal();
            }
        }
    });
}

/**
 * Handle file selection
 * @param {Event} event - File input change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        DOM.fileInfo.textContent = '';
        return;
    }
    
    if (!Utils.isValidFileType(file)) {
        DOM.fileInfo.innerHTML = `<span style="color: #dc3545;">❌ Invalid file type. Please select an image, video, or audio file.</span>`;
        return;
    }
    
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const fileType = Utils.getFileType(file.type);
    const icon = Utils.getFileIcon(fileType);
    
    DOM.fileInfo.innerHTML = `
        <span style="color: #28a745;">
            ${icon} ${file.name} (${fileSize} MB) - ${fileType}
        </span>
    `;
}

/**
 * Update character count for description input
 */
function updateCharCount() {
    const count = DOM.descriptionInput.value.length;
    DOM.charCount.textContent = `${count}/500`;
    DOM.charCount.style.color = count > 450 ? '#dc3545' : '#6c757d';
}

/**
 * Update character count for edit modal
 */
function updateEditCharCount() {
    const count = DOM.editDescriptionInput.value.length;
    DOM.editCharCount.textContent = `${count}/500`;
    DOM.editCharCount.style.color = count > 450 ? '#dc3545' : '#6c757d';
}

/**
 * Handle upload form submission
 * @param {Event} event - Form submit event
 */
async function handleUpload(event) {
    event.preventDefault();
    
    if (AppState.isLoading) return;
    
    const file = DOM.fileInput.files[0];
    const description = DOM.descriptionInput.value.trim();
    
    // Validation
    if (!file) {
        Utils.showMessage('Please select a file to upload.');
        return;
    }
    
    if (!Utils.isValidFileType(file)) {
        Utils.showMessage('Invalid file type. Please select an image, video, or audio file.');
        return;
    }
    
    if (!description) {
        Utils.showMessage('Please enter a description for your media.');
        return;
    }
    
    if (description.length > 500) {
        Utils.showMessage('Description must be 500 characters or less.');
        return;
    }
    
    try {
        Utils.setLoadingState(true);
        
        const mediaData = {
            fileName: file.name,
            description: description,
            fileType: Utils.getFileType(file.type),
            fileSize: file.size
        };
        
        const newItem = await mockAPI.createMedia(mediaData);
        
        // Clear form
        DOM.uploadForm.reset();
        DOM.fileInfo.textContent = '';
        updateCharCount();
        
        // Refresh gallery
        await renderGallery();
        
        Utils.showMessage(`Successfully uploaded ${newItem.fileName}!`, 'success');
        
    } catch (error) {
        console.error('Upload failed:', error);
        Utils.showMessage('Upload failed. Please try again.');
    } finally {
        Utils.setLoadingState(false);
    }
}

/**
 * Render the media gallery
 */
async function renderGallery() {
    try {
        const mediaItems = await mockAPI.getMedia();
        
        // Update stats
        DOM.galleryStats.textContent = `${mediaItems.length} item${mediaItems.length !== 1 ? 's' : ''}`;
        
        // Show/hide empty state
        if (mediaItems.length === 0) {
            DOM.emptyState.classList.add('show');
            DOM.galleryContainer.innerHTML = '';
            return;
        }
        
        DOM.emptyState.classList.remove('show');
        
        // Render media cards
        DOM.galleryContainer.innerHTML = mediaItems.map(item => createMediaCard(item)).join('');
        
        // Add event listeners to action buttons
        setupMediaCardEvents();
        
    } catch (error) {
        console.error('Failed to render gallery:', error);
        Utils.showMessage('Failed to load media gallery.');
    }
}

/**
 * Create HTML for a media card
 * @param {Object} item - Media item
 * @returns {string} HTML string
 */
function createMediaCard(item) {
    const icon = Utils.getFileIcon(item.fileType);
    const formattedDate = Utils.formatDate(item.uploadDate);
    
    return `
        <div class="media-card" data-id="${item.id}">
            <div class="media-header">
                <div class="media-icon">${icon}</div>
                <div class="media-info">
                    <h3>${escapeHtml(item.fileName)}</h3>
                    <div class="media-date">${formattedDate}</div>
                </div>
            </div>
            <div class="media-description">${escapeHtml(item.description)}</div>
            <div class="media-actions">
                <button class="action-btn view-btn" data-id="${item.id}">View</button>
                <button class="action-btn edit-btn" data-id="${item.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${item.id}">Delete</button>
            </div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Set up event listeners for media card buttons
 */
function setupMediaCardEvents() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            openViewModal(id);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            handleDelete(id);
        });
    });
}

/**
 * Open view modal for a media item
 * @param {string} id - Media item ID
 */
function openViewModal(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    // Set modal title
    DOM.viewModalTitle.textContent = `View: ${item.fileName}`;
    
    // Create media preview based on file type
    let previewHTML = '';
    const icon = Utils.getFileIcon(item.fileType);
    
    if (item.fileType === 'image') {
        // For images, we'll show a placeholder since we don't have actual file data
        previewHTML = `
            <div class="file-placeholder">
                <div class="file-icon">${icon}</div>
                <p><strong>${item.fileName}</strong></p>
                <p>Image preview would appear here</p>
                <small>Note: This is a demo - actual images would be displayed when integrated with real file storage</small>
            </div>
        `;
    } else if (item.fileType === 'video') {
        previewHTML = `
            <div class="file-placeholder">
                <div class="file-icon">${icon}</div>
                <p><strong>${item.fileName}</strong></p>
                <p>Video player would appear here</p>
                <small>Note: This is a demo - actual videos would be playable when integrated with real file storage</small>
            </div>
        `;
    } else if (item.fileType === 'audio') {
        previewHTML = `
            <div class="file-placeholder">
                <div class="file-icon">${icon}</div>
                <p><strong>${item.fileName}</strong></p>
                <p>Audio player would appear here</p>
                <small>Note: This is a demo - actual audio would be playable when integrated with real file storage</small>
            </div>
        `;
    } else {
        previewHTML = `
            <div class="file-placeholder">
                <div class="file-icon">${icon}</div>
                <p><strong>${item.fileName}</strong></p>
                <p>File preview not available</p>
            </div>
        `;
    }
    
    DOM.mediaPreview.innerHTML = previewHTML;
    
    // Create media details
    const detailsHTML = `
        <h4>File Details</h4>
        <div class="detail-row">
            <span class="detail-label">File Name:</span>
            <span class="detail-value">${escapeHtml(item.fileName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">File Type:</span>
            <span class="detail-value">${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">File Size:</span>
            <span class="detail-value">${item.fileSize ? Utils.formatFileSize(item.fileSize) : 'Unknown'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Upload Date:</span>
            <span class="detail-value">${Utils.formatDate(item.uploadDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${escapeHtml(item.description)}</span>
        </div>
    `;
    
    DOM.mediaDetails.innerHTML = detailsHTML;
    
    // Show modal
    DOM.viewModal.classList.add('show');
}

/**
 * Close view modal
 */
function closeViewModal() {
    DOM.viewModal.classList.remove('show');
    DOM.mediaPreview.innerHTML = '';
    DOM.mediaDetails.innerHTML = '';
}

/**
 * Open edit modal for a media item
 * @param {string} id - Media item ID
 */
function openEditModal(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    AppState.currentEditId = id;
    DOM.editDescriptionInput.value = item.description;
    updateEditCharCount();
    DOM.editModal.classList.add('show');
    DOM.editDescriptionInput.focus();
}

/**
 * Close edit modal
 */
function closeEditModal() {
    AppState.currentEditId = null;
    DOM.editModal.classList.remove('show');
    DOM.editDescriptionInput.value = '';
}

/**
 * Handle save edit
 */
async function handleSaveEdit() {
    if (!AppState.currentEditId) return;
    
    const newDescription = DOM.editDescriptionInput.value.trim();
    
    if (!newDescription) {
        Utils.showMessage('Description cannot be empty.');
        return;
    }
    
    if (newDescription.length > 500) {
        Utils.showMessage('Description must be 500 characters or less.');
        return;
    }
    
    try {
        await mockAPI.updateMedia(AppState.currentEditId, { description: newDescription });
        closeEditModal();
        await renderGallery();
        Utils.showMessage('Description updated successfully!', 'success');
    } catch (error) {
        console.error('Failed to update description:', error);
        Utils.showMessage('Failed to update description. Please try again.');
    }
}

/**
 * Handle delete media item
 * @param {string} id - Media item ID
 */
async function handleDelete(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    if (!confirm(`Are you sure you want to delete "${item.fileName}"?`)) {
        return;
    }
    
    try {
        await mockAPI.deleteMedia(id);
        await renderGallery();
        Utils.showMessage('Media item deleted successfully!', 'success');
    } catch (error) {
        console.error('Failed to delete media item:', error);
        Utils.showMessage('Failed to delete media item. Please try again.');
    }
}