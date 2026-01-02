/**
 * MediaMix Hub - Modern Frontend Application
 * Connected to Node.js Backend with Authentication
 */

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_TYPES: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/aac']
    },
    TOAST_DURATION: 5000
};

// Application State
const AppState = {
    user: null,
    mediaItems: [],
    filteredItems: [],
    currentFilter: 'all',
    currentSort: 'date-desc',
    currentView: 'grid',
    selectedFiles: [],
    currentEditId: null,
    currentDeleteId: null,
    isLoading: false,
    searchQuery: ''
};

// DOM Elements Cache
const DOM = {
    // Navigation
    userAvatar: null,
    userName: null,
    userRole: null,
    userDropdown: null,
    logoutBtn: null,
    
    // Stats
    totalFiles: null,
    totalSize: null,
    recentUploads: null,
    
    // Upload Section
    uploadForm: null,
    uploadArea: null,
    fileInput: null,
    filePreview: null,
    descriptionInput: null,
    tagsInput: null,
    tagsPreview: null,
    charCount: null,
    clearBtn: null,
    uploadBtn: null,
    uploadSpinner: null,
    uploadProgress: null,
    progressFill: null,
    progressText: null,
    uploadError: null,
    uploadSuccess: null,
    
    // Gallery Section
    galleryContainer: null,
    galleryCount: null,
    gallerySize: null,
    gridViewBtn: null,
    listViewBtn: null,
    filterBtn: null,
    filterMenu: null,
    searchInput: null,
    sortSelect: null,
    emptyState: null,
    loadingState: null,
    
    // Modals
    editModal: null,
    editDescriptionInput: null,
    editTagsInput: null,
    editTagsPreview: null,
    editCharCount: null,
    modalClose: null,
    cancelEdit: null,
    saveEdit: null,
    
    viewModal: null,
    viewModalTitle: null,
    viewModalClose: null,
    mediaPreview: null,
    mediaDetails: null,
    closeView: null,
    downloadBtn: null,
    
    deleteModal: null,
    deleteFilename: null,
    deleteModalClose: null,
    cancelDelete: null,
    confirmDelete: null,
    
    toastContainer: null
};

// Utility Functions
const Utils = {
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format date for display
     */
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today ' + d.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Get file type category
     */
    getFileType(mimeType) {
        for (const [type, mimes] of Object.entries(CONFIG.SUPPORTED_TYPES)) {
            if (mimes.includes(mimeType)) return type;
        }
        return 'unknown';
    },

    /**
     * Get file icon
     */
    getFileIcon(fileType) {
        const icons = {
            image: 'fas fa-image',
            video: 'fas fa-video',
            audio: 'fas fa-music',
            unknown: 'fas fa-file'
        };
        return icons[fileType] || icons.unknown;
    },

    /**
     * Validate file
     */
    validateFile(file) {
        const errors = [];
        
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            errors.push(`File size exceeds ${Utils.formatFileSize(CONFIG.MAX_FILE_SIZE)} limit`);
        }
        
        const fileType = Utils.getFileType(file.type);
        if (fileType === 'unknown') {
            errors.push('Unsupported file type');
        }
        
        return errors;
    },

    /**
     * Parse tags from string
     */
    parseTags(tagString) {
        return tagString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Limit to 10 tags
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// API Service
const API = {
    /**
     * Make authenticated request
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                return;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    /**
     * Get user profile
     */
    async getProfile() {
        return this.request('/auth/profile');
    },

    /**
     * Get all media
     */
    async getMedia() {
        return this.request('/media');
    },

    /**
     * Upload media
     */
    async uploadMedia(formData, onProgress) {
        const token = localStorage.getItem('authToken');
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Upload failed'));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            
            xhr.open('POST', `${CONFIG.API_BASE_URL}/media/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    },

    /**
     * Update media
     */
    async updateMedia(id, data) {
        return this.request(`/media/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Delete media
     */
    async deleteMedia(id) {
        return this.request(`/media/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Download media
     */
    async downloadMedia(id) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/media/${id}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        return response.blob();
    }
};

// Toast Notification System
const Toast = {
    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-message">${Utils.escapeHtml(message)}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        };
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', removeToast);
        
        // Auto remove after duration
        setTimeout(removeToast, duration);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MediaMix Hub initializing...');
    
    // Check authentication
    if (!await checkAuth()) {
        return;
    }
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    await loadInitialData();
    
    console.log('MediaMix Hub initialized successfully');
});

/**
 * Check authentication status
 */
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const profile = await API.getProfile();
        AppState.user = profile.user;
        updateUserUI();
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
        return false;
    }
}

/**
 * Update user UI
 */
function updateUserUI() {
    if (AppState.user) {
        DOM.userName.textContent = AppState.user.name;
        DOM.userRole.textContent = AppState.user.email;
        
        // Set avatar initials
        const initials = AppState.user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
        DOM.userAvatar.innerHTML = `<span>${initials}</span>`;
    }
}

/**
 * Initialize DOM elements
 */
function initializeDOMElements() {
    // Navigation
    DOM.userAvatar = document.getElementById('userAvatar');
    DOM.userName = document.getElementById('userName');
    DOM.userRole = document.getElementById('userRole');
    DOM.userDropdown = document.getElementById('userDropdown');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    
    // Stats
    DOM.totalFiles = document.getElementById('totalFiles');
    DOM.totalSize = document.getElementById('totalSize');
    DOM.recentUploads = document.getElementById('recentUploads');
    
    // Upload Section
    DOM.uploadForm = document.getElementById('uploadForm');
    DOM.uploadArea = document.getElementById('uploadArea');
    DOM.fileInput = document.getElementById('fileInput');
    DOM.filePreview = document.getElementById('filePreview');
    DOM.descriptionInput = document.getElementById('descriptionInput');
    DOM.tagsInput = document.getElementById('tagsInput');
    DOM.tagsPreview = document.getElementById('tagsPreview');
    DOM.charCount = document.getElementById('charCount');
    DOM.clearBtn = document.getElementById('clearBtn');
    DOM.uploadBtn = document.getElementById('uploadBtn');
    DOM.uploadSpinner = document.getElementById('uploadSpinner');
    DOM.uploadProgress = document.getElementById('uploadProgress');
    DOM.progressFill = document.getElementById('progressFill');
    DOM.progressText = document.getElementById('progressText');
    DOM.uploadError = document.getElementById('uploadError');
    DOM.uploadSuccess = document.getElementById('uploadSuccess');
    
    // Gallery Section
    DOM.galleryContainer = document.getElementById('galleryContainer');
    DOM.galleryCount = document.getElementById('galleryCount');
    DOM.gallerySize = document.getElementById('gallerySize');
    DOM.gridViewBtn = document.getElementById('gridViewBtn');
    DOM.listViewBtn = document.getElementById('listViewBtn');
    DOM.filterBtn = document.getElementById('filterBtn');
    DOM.filterMenu = document.getElementById('filterMenu');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.sortSelect = document.getElementById('sortSelect');
    DOM.emptyState = document.getElementById('emptyState');
    DOM.loadingState = document.getElementById('loadingState');
    
    // Modals
    DOM.editModal = document.getElementById('editModal');
    DOM.editDescriptionInput = document.getElementById('editDescriptionInput');
    DOM.editTagsInput = document.getElementById('editTagsInput');
    DOM.editTagsPreview = document.getElementById('editTagsPreview');
    DOM.editCharCount = document.getElementById('editCharCount');
    DOM.modalClose = document.getElementById('modalClose');
    DOM.cancelEdit = document.getElementById('cancelEdit');
    DOM.saveEdit = document.getElementById('saveEdit');
    
    DOM.viewModal = document.getElementById('viewModal');
    DOM.viewModalTitle = document.getElementById('viewModalTitle');
    DOM.viewModalClose = document.getElementById('viewModalClose');
    DOM.mediaPreview = document.getElementById('mediaPreview');
    DOM.mediaDetails = document.getElementById('mediaDetails');
    DOM.closeView = document.getElementById('closeView');
    DOM.downloadBtn = document.getElementById('downloadBtn');
    
    DOM.deleteModal = document.getElementById('deleteModal');
    DOM.deleteFilename = document.getElementById('deleteFilename');
    DOM.deleteModalClose = document.getElementById('deleteModalClose');
    DOM.cancelDelete = document.getElementById('cancelDelete');
    DOM.confirmDelete = document.getElementById('confirmDelete');
    
    DOM.toastContainer = document.getElementById('toastContainer');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Logout
    DOM.logoutBtn.addEventListener('click', handleLogout);
    
    // Upload form
    DOM.uploadForm.addEventListener('submit', handleUpload);
    DOM.fileInput.addEventListener('change', handleFileSelect);
    DOM.descriptionInput.addEventListener('input', updateCharCount);
    DOM.tagsInput.addEventListener('input', updateTagsPreview);
    DOM.clearBtn.addEventListener('click', clearUploadForm);
    
    // Drag and drop
    DOM.uploadArea.addEventListener('dragover', handleDragOver);
    DOM.uploadArea.addEventListener('dragleave', handleDragLeave);
    DOM.uploadArea.addEventListener('drop', handleDrop);
    
    // Gallery controls
    DOM.gridViewBtn.addEventListener('click', () => setView('grid'));
    DOM.listViewBtn.addEventListener('click', () => setView('list'));
    DOM.searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    DOM.sortSelect.addEventListener('change', handleSort);
    
    // Filter options
    DOM.filterMenu.addEventListener('click', handleFilter);
    
    // Modal events
    DOM.modalClose.addEventListener('click', closeEditModal);
    DOM.cancelEdit.addEventListener('click', closeEditModal);
    DOM.saveEdit.addEventListener('click', handleSaveEdit);
    DOM.editDescriptionInput.addEventListener('input', updateEditCharCount);
    DOM.editTagsInput.addEventListener('input', updateEditTagsPreview);
    
    DOM.viewModalClose.addEventListener('click', closeViewModal);
    DOM.closeView.addEventListener('click', closeViewModal);
    DOM.downloadBtn.addEventListener('click', handleDownload);
    
    DOM.deleteModalClose.addEventListener('click', closeDeleteModal);
    DOM.cancelDelete.addEventListener('click', closeDeleteModal);
    DOM.confirmDelete.addEventListener('click', handleConfirmDelete);
    
    // Close modals on overlay click
    [DOM.editModal, DOM.viewModal, DOM.deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

/**
 * Load initial data
 */
async function loadInitialData() {
    try {
        showLoadingState(true);
        const response = await API.getMedia();
        AppState.mediaItems = response.media || [];
        updateStats();
        filterAndSortMedia();
        renderGallery();
    } catch (error) {
        console.error('Failed to load media:', error);
        Toast.error('Failed to load media files');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Handle logout
 */
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
}

/**
 * Handle drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    DOM.uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
    e.preventDefault();
    DOM.uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop
 */
function handleDrop(e) {
    e.preventDefault();
    DOM.uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    processSelectedFiles(files);
}

/**
 * Process selected files
 */
function processSelectedFiles(files) {
    AppState.selectedFiles = [];
    
    files.forEach(file => {
        const errors = Utils.validateFile(file);
        if (errors.length === 0) {
            AppState.selectedFiles.push(file);
        } else {
            Toast.error(`${file.name}: ${errors.join(', ')}`);
        }
    });
    
    updateFilePreview();
}

/**
 * Update file preview
 */
function updateFilePreview() {
    if (AppState.selectedFiles.length === 0) {
        DOM.filePreview.innerHTML = '';
        return;
    }
    
    DOM.filePreview.innerHTML = AppState.selectedFiles.map((file, index) => {
        const fileType = Utils.getFileType(file.type);
        const icon = Utils.getFileIcon(fileType);
        
        return `
            <div class="file-preview-item">
                <i class="${icon} file-preview-icon"></i>
                <div class="file-preview-name">${Utils.escapeHtml(file.name)}</div>
                <button type="button" class="file-remove" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Remove file from selection
 */
function removeFile(index) {
    AppState.selectedFiles.splice(index, 1);
    updateFilePreview();
}

/**
 * Update character count
 */
function updateCharCount() {
    const count = DOM.descriptionInput.value.length;
    DOM.charCount.textContent = `${count}/500`;
    DOM.charCount.style.color = count > 450 ? 'var(--error-color)' : 'var(--gray-500)';
}

/**
 * Update tags preview
 */
function updateTagsPreview() {
    const tags = Utils.parseTags(DOM.tagsInput.value);
    
    DOM.tagsPreview.innerHTML = tags.map(tag => `
        <span class="tag-item">
            ${Utils.escapeHtml(tag)}
            <button type="button" class="tag-remove" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

/**
 * Remove tag
 */
function removeTag(tagToRemove) {
    const currentTags = Utils.parseTags(DOM.tagsInput.value);
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    DOM.tagsInput.value = newTags.join(', ');
    updateTagsPreview();
}

/**
 * Clear upload form
 */
function clearUploadForm() {
    DOM.uploadForm.reset();
    AppState.selectedFiles = [];
    updateFilePreview();
    updateCharCount();
    updateTagsPreview();
    hideMessages();
}

/**
 * Handle upload
 */
async function handleUpload(e) {
    e.preventDefault();
    
    if (AppState.isLoading) return;
    
    if (AppState.selectedFiles.length === 0) {
        Toast.error('Please select at least one file to upload');
        return;
    }
    
    const description = DOM.descriptionInput.value.trim();
    if (!description) {
        Toast.error('Please enter a description');
        return;
    }
    
    try {
        setLoadingState(true);
        showUploadProgress(true);
        
        for (let i = 0; i < AppState.selectedFiles.length; i++) {
            const file = AppState.selectedFiles[i];
            const formData = new FormData();
            
            formData.append('file', file);
            formData.append('description', description);
            
            const tags = Utils.parseTags(DOM.tagsInput.value);
            if (tags.length > 0) {
                formData.append('tags', JSON.stringify(tags));
            }
            
            DOM.progressText.textContent = `Uploading ${file.name} (${i + 1}/${AppState.selectedFiles.length})...`;
            
            const response = await API.uploadMedia(formData, (progress) => {
                DOM.progressFill.style.width = `${progress}%`;
            });
            
            AppState.mediaItems.unshift(response.media);
        }
        
        clearUploadForm();
        updateStats();
        filterAndSortMedia();
        renderGallery();
        
        Toast.success(`Successfully uploaded ${AppState.selectedFiles.length} file(s)`);
        
    } catch (error) {
        console.error('Upload failed:', error);
        Toast.error('Upload failed. Please try again.');
    } finally {
        setLoadingState(false);
        showUploadProgress(false);
    }
}

/**
 * Set loading state
 */
function setLoadingState(loading) {
    AppState.isLoading = loading;
    DOM.uploadBtn.disabled = loading;
    DOM.uploadBtn.classList.toggle('loading', loading);
}

/**
 * Show upload progress
 */
function showUploadProgress(show) {
    DOM.uploadProgress.classList.toggle('show', show);
    if (!show) {
        DOM.progressFill.style.width = '0%';
        DOM.progressText.textContent = '';
    }
}

/**
 * Show loading state
 */
function showLoadingState(show) {
    DOM.loadingState.classList.toggle('show', show);
    DOM.galleryContainer.style.display = show ? 'none' : 'grid';
}

/**
 * Update stats
 */
function updateStats() {
    const totalFiles = AppState.mediaItems.length;
    const totalSize = AppState.mediaItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    
    // Recent uploads (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUploads = AppState.mediaItems.filter(item => 
        new Date(item.createdAt) > weekAgo
    ).length;
    
    DOM.totalFiles.textContent = totalFiles;
    DOM.totalSize.textContent = Utils.formatFileSize(totalSize);
    DOM.recentUploads.textContent = recentUploads;
    
    // Gallery stats
    DOM.galleryCount.textContent = `${AppState.filteredItems.length} item${AppState.filteredItems.length !== 1 ? 's' : ''}`;
    DOM.gallerySize.textContent = `${Utils.formatFileSize(
        AppState.filteredItems.reduce((sum, item) => sum + (item.fileSize || 0), 0)
    )} total`;
}

/**
 * Set view mode
 */
function setView(view) {
    AppState.currentView = view;
    
    DOM.gridViewBtn.classList.toggle('active', view === 'grid');
    DOM.listViewBtn.classList.toggle('active', view === 'list');
    
    DOM.galleryContainer.classList.toggle('grid-view', view === 'grid');
    DOM.galleryContainer.classList.toggle('list-view', view === 'list');
    
    renderGallery();
}

/**
 * Handle search
 */
function handleSearch() {
    AppState.searchQuery = DOM.searchInput.value.toLowerCase().trim();
    filterAndSortMedia();
    renderGallery();
}

/**
 * Handle filter
 */
function handleFilter(e) {
    if (e.target.classList.contains('filter-option')) {
        AppState.currentFilter = e.target.dataset.filter;
        filterAndSortMedia();
        renderGallery();
    }
}

/**
 * Handle sort
 */
function handleSort() {
    AppState.currentSort = DOM.sortSelect.value;
    filterAndSortMedia();
    renderGallery();
}

/**
 * Filter and sort media
 */
function filterAndSortMedia() {
    let filtered = [...AppState.mediaItems];
    
    // Apply filter
    if (AppState.currentFilter !== 'all') {
        filtered = filtered.filter(item => item.fileType === AppState.currentFilter);
    }
    
    // Apply search
    if (AppState.searchQuery) {
        filtered = filtered.filter(item => 
            item.originalName.toLowerCase().includes(AppState.searchQuery) ||
            item.description.toLowerCase().includes(AppState.searchQuery) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(AppState.searchQuery)))
        );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
        switch (AppState.currentSort) {
            case 'date-desc':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'date-asc':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'name-asc':
                return a.originalName.localeCompare(b.originalName);
            case 'name-desc':
                return b.originalName.localeCompare(a.originalName);
            case 'size-desc':
                return (b.fileSize || 0) - (a.fileSize || 0);
            case 'size-asc':
                return (a.fileSize || 0) - (b.fileSize || 0);
            default:
                return 0;
        }
    });
    
    AppState.filteredItems = filtered;
    updateStats();
}

/**
 * Render gallery
 */
function renderGallery() {
    if (AppState.filteredItems.length === 0) {
        DOM.emptyState.classList.add('show');
        DOM.galleryContainer.innerHTML = '';
        return;
    }
    
    DOM.emptyState.classList.remove('show');
    
    DOM.galleryContainer.innerHTML = AppState.filteredItems.map(item => 
        createMediaCard(item)
    ).join('');
    
    setupMediaCardEvents();
}

/**
 * Create media card HTML
 */
function createMediaCard(item) {
    const icon = Utils.getFileIcon(item.fileType);
    const formattedDate = Utils.formatDate(item.createdAt);
    const tags = item.tags || [];
    
    if (AppState.currentView === 'list') {
        return `
            <div class="media-card" data-id="${item._id}">
                <div class="media-header">
                    <div class="media-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="media-info">
                        <h3>${Utils.escapeHtml(item.originalName)}</h3>
                        <div class="media-date">${formattedDate}</div>
                    </div>
                </div>
                <div class="media-content">
                    <div class="media-description">${Utils.escapeHtml(item.description)}</div>
                    <div class="media-actions">
                        <button class="action-btn view-btn" data-id="${item._id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn edit-btn" data-id="${item._id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" data-id="${item._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="media-card animate-fade-in-up" data-id="${item._id}">
            <div class="media-header">
                <div class="media-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="media-info">
                    <h3>${Utils.escapeHtml(item.originalName)}</h3>
                    <div class="media-date">${formattedDate}</div>
                </div>
            </div>
            <div class="media-description">${Utils.escapeHtml(item.description)}</div>
            ${tags.length > 0 ? `
                <div class="media-tags">
                    ${tags.map(tag => `<span class="media-tag">${Utils.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="media-actions">
                <button class="action-btn view-btn" data-id="${item._id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn edit-btn" data-id="${item._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" data-id="${item._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

/**
 * Set up media card events
 */
function setupMediaCardEvents() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.action-btn').dataset.id;
            openViewModal(id);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.action-btn').dataset.id;
            openEditModal(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.action-btn').dataset.id;
            openDeleteModal(id);
        });
    });
}

/**
 * Open view modal
 */
function openViewModal(id) {
    const item = AppState.mediaItems.find(item => item._id === id);
    if (!item) return;
    
    AppState.currentViewId = id;
    
    DOM.viewModalTitle.innerHTML = `<i class="fas fa-eye"></i> ${Utils.escapeHtml(item.originalName)}`;
    
    // Create preview
    let previewHTML = '';
    if (item.fileType === 'image') {
        previewHTML = `<img src="${CONFIG.API_BASE_URL}/media/${item._id}/file" alt="${Utils.escapeHtml(item.originalName)}" />`;
    } else if (item.fileType === 'video') {
        previewHTML = `<video controls><source src="${CONFIG.API_BASE_URL}/media/${item._id}/file" type="${item.mimeType}"></video>`;
    } else if (item.fileType === 'audio') {
        previewHTML = `<audio controls><source src="${CONFIG.API_BASE_URL}/media/${item._id}/file" type="${item.mimeType}"></audio>`;
    } else {
        const icon = Utils.getFileIcon(item.fileType);
        previewHTML = `
            <div class="file-placeholder">
                <div class="file-icon"><i class="${icon}"></i></div>
                <p><strong>${Utils.escapeHtml(item.originalName)}</strong></p>
                <p>Preview not available</p>
            </div>
        `;
    }
    
    DOM.mediaPreview.innerHTML = previewHTML;
    
    // Create details
    const tags = item.tags || [];
    DOM.mediaDetails.innerHTML = `
        <h4>File Details</h4>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${Utils.escapeHtml(item.originalName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">${Utils.formatFileSize(item.fileSize)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Uploaded:</span>
            <span class="detail-value">${Utils.formatDate(item.createdAt)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${Utils.escapeHtml(item.description)}</span>
        </div>
        ${tags.length > 0 ? `
            <div class="detail-row">
                <span class="detail-label">Tags:</span>
                <span class="detail-value">${tags.map(tag => Utils.escapeHtml(tag)).join(', ')}</span>
            </div>
        ` : ''}
    `;
    
    DOM.viewModal.classList.add('show');
}

/**
 * Close view modal
 */
function closeViewModal() {
    DOM.viewModal.classList.remove('show');
    AppState.currentViewId = null;
}

/**
 * Handle download
 */
async function handleDownload() {
    if (!AppState.currentViewId) return;
    
    try {
        const item = AppState.mediaItems.find(item => item._id === AppState.currentViewId);
        const blob = await API.downloadMedia(AppState.currentViewId);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Toast.success('Download started');
    } catch (error) {
        console.error('Download failed:', error);
        Toast.error('Download failed');
    }
}

/**
 * Open edit modal
 */
function openEditModal(id) {
    const item = AppState.mediaItems.find(item => item._id === id);
    if (!item) return;
    
    AppState.currentEditId = id;
    
    DOM.editDescriptionInput.value = item.description;
    DOM.editTagsInput.value = (item.tags || []).join(', ');
    
    updateEditCharCount();
    updateEditTagsPreview();
    
    DOM.editModal.classList.add('show');
    DOM.editDescriptionInput.focus();
}

/**
 * Close edit modal
 */
function closeEditModal() {
    DOM.editModal.classList.remove('show');
    AppState.currentEditId = null;
}

/**
 * Update edit character count
 */
function updateEditCharCount() {
    const count = DOM.editDescriptionInput.value.length;
    DOM.editCharCount.textContent = `${count}/500`;
    DOM.editCharCount.style.color = count > 450 ? 'var(--error-color)' : 'var(--gray-500)';
}

/**
 * Update edit tags preview
 */
function updateEditTagsPreview() {
    const tags = Utils.parseTags(DOM.editTagsInput.value);
    
    DOM.editTagsPreview.innerHTML = tags.map(tag => `
        <span class="tag-item">
            ${Utils.escapeHtml(tag)}
            <button type="button" class="tag-remove" onclick="removeEditTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

/**
 * Remove edit tag
 */
function removeEditTag(tagToRemove) {
    const currentTags = Utils.parseTags(DOM.editTagsInput.value);
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    DOM.editTagsInput.value = newTags.join(', ');
    updateEditTagsPreview();
}

/**
 * Handle save edit
 */
async function handleSaveEdit() {
    if (!AppState.currentEditId) return;
    
    const description = DOM.editDescriptionInput.value.trim();
    if (!description) {
        Toast.error('Description cannot be empty');
        return;
    }
    
    try {
        const tags = Utils.parseTags(DOM.editTagsInput.value);
        
        const response = await API.updateMedia(AppState.currentEditId, {
            description,
            tags
        });
        
        // Update local state
        const index = AppState.mediaItems.findIndex(item => item._id === AppState.currentEditId);
        if (index !== -1) {
            AppState.mediaItems[index] = response.media;
        }
        
        closeEditModal();
        filterAndSortMedia();
        renderGallery();
        
        Toast.success('Media updated successfully');
    } catch (error) {
        console.error('Update failed:', error);
        Toast.error('Update failed. Please try again.');
    }
}

/**
 * Open delete modal
 */
function openDeleteModal(id) {
    const item = AppState.mediaItems.find(item => item._id === id);
    if (!item) return;
    
    AppState.currentDeleteId = id;
    DOM.deleteFilename.textContent = item.originalName;
    DOM.deleteModal.classList.add('show');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    DOM.deleteModal.classList.remove('show');
    AppState.currentDeleteId = null;
}

/**
 * Handle confirm delete
 */
async function handleConfirmDelete() {
    if (!AppState.currentDeleteId) return;
    
    try {
        await API.deleteMedia(AppState.currentDeleteId);
        
        // Remove from local state
        AppState.mediaItems = AppState.mediaItems.filter(item => item._id !== AppState.currentDeleteId);
        
        closeDeleteModal();
        updateStats();
        filterAndSortMedia();
        renderGallery();
        
        Toast.success('Media deleted successfully');
    } catch (error) {
        console.error('Delete failed:', error);
        Toast.error('Delete failed. Please try again.');
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    closeEditModal();
    closeViewModal();
    closeDeleteModal();
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
}

/**
 * Hide messages
 */
function hideMessages() {
    DOM.uploadError.style.display = 'none';
    DOM.uploadSuccess.style.display = 'none';
}

// Global functions for onclick handlers
window.removeFile = removeFile;
window.removeTag = removeTag;
window.removeEditTag = removeEditTag;