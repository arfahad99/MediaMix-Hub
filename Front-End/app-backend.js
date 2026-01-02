/**
 * MediaMix Hub - Frontend Application with Real Backend API
 * This version connects to the Node.js/MongoDB backend instead of using mock data
 */

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_TYPES: {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/m4a']
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
    currentViewId: null,
    isLoading: false,
    searchQuery: '',
    authToken: null
};

// API Client
class APIClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle authentication errors specifically
                if (response.status === 401) {
                    console.log('Authentication failed - token may be expired');
                    this.setToken(null); // Clear invalid token
                    
                    // Show user-friendly message and redirect
                    if (typeof Toast !== 'undefined') {
                        Toast.error('Your session has expired. Please log in again.');
                    } else {
                        alert('Your session has expired. Please log in again.');
                    }
                    
                    setTimeout(() => {
                        window.location.href = 'login-backend.html';
                    }, 2000);
                    
                    throw new Error('Session expired');
                }
                
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.success && data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (data.success && data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    logout() {
        this.setToken(null);
        return { success: true };
    }

    // Media endpoints
    async getMedia(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/media${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }

    async uploadMedia(formData) {
        const url = `${this.baseURL}/media/upload`;
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    }

    async updateMedia(id, updateData) {
        return this.request(`/media/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async deleteMedia(id) {
        return this.request(`/media/${id}`, {
            method: 'DELETE'
        });
    }

    async getMediaStats() {
        return this.request('/media/stats/overview');
    }
}

// Global API client instance
const apiClient = new APIClient();

// Token validation utility
const TokenValidator = {
    isTokenExpired(token) {
        if (!token) return true;
        
        try {
            // Decode JWT token (without verification, just to check expiration)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if token is expired (with 5 minute buffer)
            return payload.exp < (currentTime + 300);
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Assume expired if we can't parse
        }
    },
    
    getTokenTimeRemaining(token) {
        if (!token) return 0;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return Math.max(0, payload.exp - currentTime);
        } catch (error) {
            return 0;
        }
    }
};

// DOM Elements Cache (same as before)
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

// Toast Notification System (same as before)
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
    console.log('MediaMix Hub initializing with backend API...');
    
    try {
        // Check if user has a stored token
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found, redirecting to login');
            window.location.href = 'login-backend.html';
            return;
        }

        // Check if token is expired before making API call
        if (TokenValidator.isTokenExpired(token)) {
            console.log('Token is expired, redirecting to login');
            localStorage.removeItem('authToken');
            alert('Your session has expired. Please log in again.');
            window.location.href = 'login-backend.html';
            return;
        }

        // Log remaining time for debugging
        const timeRemaining = TokenValidator.getTokenTimeRemaining(token);
        console.log(`Token valid for ${Math.floor(timeRemaining / 3600)} hours, ${Math.floor((timeRemaining % 3600) / 60)} minutes`);

        // Set token in API client
        apiClient.setToken(token);

        // Verify token and get user profile
        try {
            const profileResponse = await apiClient.getProfile();
            if (profileResponse.success) {
                AppState.user = profileResponse.user;
            } else {
                throw new Error('Invalid token');
            }
        } catch (error) {
            console.log('Token verification failed, redirecting to login');
            localStorage.removeItem('authToken');
            window.location.href = 'login-backend.html';
            return;
        }
        
        // Initialize DOM elements
        initializeDOMElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update user UI
        updateUserUI();
        
        // Load initial data
        await loadInitialData();
        
        console.log('MediaMix Hub initialized successfully with backend API');
        
    } catch (error) {
        console.error('Initialization failed:', error);
        Toast.error('Failed to initialize application');
    }
});

/**
 * Update user UI
 */
function updateUserUI() {
    if (AppState.user) {
        DOM.userName.textContent = AppState.user.name;
        
        // Show role if available, otherwise show "User"
        const userRole = AppState.user.role || 'User';
        DOM.userRole.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        
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
 * Initialize DOM elements (same as before)
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
    // Logout - use API client
    DOM.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Use the API client to logout
        const logoutResult = apiClient.logout();
        
        if (logoutResult.success) {
            Toast.success('Logged out successfully');
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            Toast.error('Logout failed. Please try again.');
        }
    });
    
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
    DOM.uploadArea.addEventListener('click', () => DOM.fileInput.click());
    
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
 * Load initial data from backend API
 */
async function loadInitialData() {
    try {
        showLoadingState(true);
        
        // Load media files
        const mediaResponse = await apiClient.getMedia();
        if (mediaResponse.success) {
            AppState.mediaItems = mediaResponse.media.map(item => ({
                id: item._id,
                fileName: item.originalName,
                fileType: item.fileType,
                fileSize: item.fileSize,
                description: item.description,
                tags: item.tags || [],
                uploadDate: item.createdAt,
                mimeType: item.mimeType
            }));
        }
        
        // Load stats
        await updateStats();
        
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
 * Update stats from backend
 */
async function updateStats() {
    try {
        const statsResponse = await apiClient.getMediaStats();
        if (statsResponse.success) {
            const stats = statsResponse.stats;
            
            DOM.totalFiles.textContent = stats.total.totalFiles;
            DOM.totalSize.textContent = DataValidation.formatFileSize(stats.total.totalSize);
            DOM.recentUploads.textContent = stats.recentUploads;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Use local stats as fallback
        const totalFiles = AppState.mediaItems.length;
        const totalSize = AppState.mediaItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        
        // Recent uploads (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentUploads = AppState.mediaItems.filter(item => 
            new Date(item.uploadDate) > weekAgo
        ).length;
        
        DOM.totalFiles.textContent = totalFiles;
        DOM.totalSize.textContent = DataValidation.formatFileSize(totalSize);
        DOM.recentUploads.textContent = recentUploads;
    }
    
    // Gallery stats
    DOM.galleryCount.textContent = `${AppState.filteredItems.length} item${AppState.filteredItems.length !== 1 ? 's' : ''}`;
    DOM.gallerySize.textContent = `${DataValidation.formatFileSize(
        AppState.filteredItems.reduce((sum, item) => sum + (item.fileSize || 0), 0)
    )} total`;
}

/**
 * Enhanced upload handling with real backend API
 */
async function handleUpload(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (AppState.isLoading) {
        Toast.warning('Upload already in progress');
        return;
    }
    
    // Final validation before upload
    const validationResult = performFinalValidation();
    if (!validationResult.isValid) {
        showValidationErrors(validationResult.errors);
        return;
    }
    
    try {
        setLoadingState(true);
        showUploadProgress(true);
        
        const description = DOM.descriptionInput.value.trim();
        const tags = DataValidation.parseTags(DOM.tagsInput.value);
        const uploadedItems = [];
        
        // Upload files sequentially with progress tracking
        for (let i = 0; i < AppState.selectedFiles.length; i++) {
            const file = AppState.selectedFiles[i];
            
            DOM.progressText.textContent = `Uploading ${file.name} (${i + 1}/${AppState.selectedFiles.length})...`;
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);
            formData.append('tags', JSON.stringify(tags));
            
            // Upload to backend
            const uploadResponse = await apiClient.uploadMedia(formData);
            
            if (uploadResponse.success) {
                // Convert backend response to frontend format
                const mediaItem = {
                    id: uploadResponse.media._id,
                    fileName: uploadResponse.media.originalName,
                    fileType: uploadResponse.media.fileType,
                    fileSize: uploadResponse.media.fileSize,
                    description: uploadResponse.media.description,
                    tags: uploadResponse.media.tags || [],
                    uploadDate: uploadResponse.media.createdAt,
                    mimeType: uploadResponse.media.mimeType
                };
                
                uploadedItems.push(mediaItem);
            }
            
            // Update overall progress
            const overallProgress = ((i + 1) / AppState.selectedFiles.length) * 100;
            DOM.progressFill.style.width = `${overallProgress}%`;
        }
        
        // Update application state
        AppState.mediaItems.unshift(...uploadedItems);
        
        // Clear form and update UI
        clearUploadForm();
        await updateStats();
        filterAndSortMedia();
        renderGallery();
        
        // Show success message
        const message = uploadedItems.length === 1 
            ? `Successfully uploaded ${uploadedItems[0].fileName}`
            : `Successfully uploaded ${uploadedItems.length} files`;
        Toast.success(message);
        
    } catch (error) {
        console.error('Upload failed:', error);
        handleUploadError(error);
    } finally {
        setLoadingState(false);
        showUploadProgress(false);
    }
}

/**
 * Handle save edit with backend API
 */
async function handleSaveEdit() {
    if (!AppState.currentEditId) return;
    
    const description = DOM.editDescriptionInput.value.trim();
    if (!description) {
        Toast.error('Description cannot be empty');
        return;
    }
    
    try {
        const tags = DataValidation.parseTags(DOM.editTagsInput.value);
        
        const updateResponse = await apiClient.updateMedia(AppState.currentEditId, {
            description,
            tags
        });
        
        if (updateResponse.success) {
            // Update local state
            const index = AppState.mediaItems.findIndex(item => item.id === AppState.currentEditId);
            if (index !== -1) {
                AppState.mediaItems[index].description = description;
                AppState.mediaItems[index].tags = tags;
            }
            
            closeEditModal();
            filterAndSortMedia();
            renderGallery();
            
            Toast.success('Media updated successfully');
        }
    } catch (error) {
        console.error('Update failed:', error);
        Toast.error('Update failed. Please try again.');
    }
}

/**
 * Handle confirm delete with backend API
 */
async function handleConfirmDelete() {
    if (!AppState.currentDeleteId) return;
    
    try {
        const deleteResponse = await apiClient.deleteMedia(AppState.currentDeleteId);
        
        if (deleteResponse.success) {
            // Remove from local state
            AppState.mediaItems = AppState.mediaItems.filter(item => item.id !== AppState.currentDeleteId);
            
            closeDeleteModal();
            await updateStats();
            filterAndSortMedia();
            renderGallery();
            
            Toast.success('Media deleted successfully');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        Toast.error('Delete failed. Please try again.');
    }
}

// Include all the other functions from app-mock.js that don't need changes
// (file validation, UI updates, gallery rendering, etc.)

// File validation functions (same as app-mock.js)
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    DOM.uploadArea.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!DOM.uploadArea.contains(e.relatedTarget)) {
        DOM.uploadArea.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    DOM.uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
        Toast.warning('No files were dropped. Please try again.');
        return;
    }
    
    processSelectedFiles(files);
}

function processSelectedFiles(files) {
    AppState.selectedFiles = [];
    const validFiles = [];
    const errors = [];
    
    files.forEach((file, index) => {
        const fileErrors = validateSingleFile(file, index);
        
        // Check for duplicates against already processed valid files
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
    
    AppState.selectedFiles = validFiles;
    
    if (errors.length > 0) {
        showFileValidationErrors(errors);
    }
    
    if (validFiles.length > 0) {
        Toast.success(`${validFiles.length} file(s) ready for upload`);
    }
    
    updateFilePreview();
    updateUploadButtonState();
}

function validateSingleFile(file, index) {
    const errors = [];
    
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
    } else if (file.size > CONFIG.MAX_FILE_SIZE) {
        errors.push(`File size (${DataValidation.formatFileSize(file.size)}) exceeds maximum allowed size (${DataValidation.formatFileSize(CONFIG.MAX_FILE_SIZE)})`);
    }
    
    if (!file.type) {
        errors.push('File type could not be determined');
    } else if (!DataValidation.validateFileType(file.type)) {
        const supportedTypes = Object.values(CONFIG.SUPPORTED_TYPES).flat();
        errors.push(`Unsupported file type: ${file.type}. Supported types: ${supportedTypes.slice(0, 5).join(', ')}${supportedTypes.length > 5 ? '...' : ''}`);
    }
    
    return errors;
}

function showFileValidationErrors(errors) {
    errors.forEach(({ fileName, errors: fileErrors }) => {
        const errorMessage = `${fileName}: ${fileErrors.join(', ')}`;
        Toast.error(errorMessage);
    });
}

function updateFilePreview() {
    if (AppState.selectedFiles.length === 0) {
        DOM.filePreview.innerHTML = '';
        DOM.filePreview.classList.remove('has-files');
        return;
    }
    
    DOM.filePreview.classList.add('has-files');
    
    DOM.filePreview.innerHTML = AppState.selectedFiles.map((file, index) => {
        const fileType = DataValidation.getFileType(file.type);
        const icon = Utils.getFileIcon(fileType);
        const sizeFormatted = DataValidation.formatFileSize(file.size);
        
        return `
            <div class="file-preview-item" data-index="${index}">
                <div class="file-preview-header">
                    <i class="${icon} file-preview-icon"></i>
                    <div class="file-preview-info">
                        <div class="file-preview-name" title="${Utils.escapeHtml(file.name)}">
                            ${Utils.escapeHtml(file.name)}
                        </div>
                        <div class="file-preview-meta">
                            <span class="file-preview-size">${sizeFormatted}</span>
                            <span class="file-preview-type">${fileType}</span>
                        </div>
                    </div>
                </div>
                <button type="button" class="file-remove" onclick="removeFile(${index})" title="Remove file">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function removeFile(index) {
    if (index < 0 || index >= AppState.selectedFiles.length) {
        console.error('Invalid file index:', index);
        return;
    }
    
    const removedFile = AppState.selectedFiles[index];
    AppState.selectedFiles.splice(index, 1);
    
    Toast.info(`Removed ${removedFile.name} from selection`);
    
    updateFilePreview();
    updateUploadButtonState();
}

function updateCharCount() {
    const count = DOM.descriptionInput.value.length;
    const maxLength = 500;
    
    DOM.charCount.textContent = `${count}/${maxLength}`;
    
    if (count > maxLength * 0.9) {
        DOM.charCount.style.color = 'var(--error-color)';
        DOM.charCount.classList.add('warning');
    } else if (count > maxLength * 0.75) {
        DOM.charCount.style.color = 'var(--warning-color)';
        DOM.charCount.classList.add('caution');
    } else {
        DOM.charCount.style.color = 'var(--gray-500)';
        DOM.charCount.classList.remove('warning', 'caution');
    }
    
    validateDescription();
    updateUploadButtonState();
}

function validateDescription() {
    const description = DOM.descriptionInput.value.trim();
    const isValid = DataValidation.validateDescription(description);
    
    DOM.descriptionInput.classList.toggle('invalid', !isValid);
    
    return isValid;
}

function updateTagsPreview() {
    const tagString = DOM.tagsInput.value;
    const tags = DataValidation.parseTags(tagString);
    const isValid = DataValidation.validateTags(tags);
    
    DOM.tagsInput.classList.toggle('invalid', !isValid);
    
    DOM.tagsPreview.innerHTML = tags.map((tag, index) => `
        <span class="tag-item ${index >= 10 ? 'excess' : ''}">
            ${Utils.escapeHtml(tag)}
            <button type="button" class="tag-remove" onclick="removeTag('${Utils.escapeHtml(tag)}')" title="Remove tag">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
    
    if (tags.length > 10) {
        DOM.tagsPreview.innerHTML += `
            <div class="tag-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Only first 10 tags will be saved
            </div>
        `;
    }
    
    updateUploadButtonState();
}

function removeTag(tagToRemove) {
    const currentTags = DataValidation.parseTags(DOM.tagsInput.value);
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    DOM.tagsInput.value = newTags.join(', ');
    updateTagsPreview();
}

function updateUploadButtonState() {
    const hasFiles = AppState.selectedFiles.length > 0;
    const hasValidDescription = validateDescription();
    const isNotLoading = !AppState.isLoading;
    
    const canUpload = hasFiles && hasValidDescription && isNotLoading;
    
    DOM.uploadBtn.disabled = !canUpload;
    DOM.uploadBtn.classList.toggle('disabled', !canUpload);
    
    const btnText = DOM.uploadBtn.querySelector('.btn-text');
    if (btnText) {
        if (!hasFiles) {
            btnText.innerHTML = '<i class="fas fa-upload"></i> Select Files First';
        } else if (!hasValidDescription) {
            btnText.innerHTML = '<i class="fas fa-upload"></i> Add Description';
        } else if (AppState.isLoading) {
            btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        } else {
            btnText.innerHTML = `<i class="fas fa-upload"></i> Upload ${AppState.selectedFiles.length} File${AppState.selectedFiles.length !== 1 ? 's' : ''}`;
        }
    }
}

function clearUploadForm() {
    if (AppState.selectedFiles.length > 0 || DOM.descriptionInput.value.trim() || DOM.tagsInput.value.trim()) {
        if (!confirm('Are you sure you want to clear the form? All selected files and entered information will be lost.')) {
            return;
        }
    }
    
    DOM.uploadForm.reset();
    AppState.selectedFiles = [];
    
    updateFilePreview();
    updateCharCount();
    updateTagsPreview();
    updateUploadButtonState();
    hideMessages();
    
    Toast.info('Form cleared');
}

function performFinalValidation() {
    const errors = [];
    
    if (AppState.selectedFiles.length === 0) {
        errors.push('No files selected for upload');
    }
    
    AppState.selectedFiles.forEach((file, index) => {
        const fileErrors = validateSingleFile(file, index);
        if (fileErrors.length > 0) {
            errors.push(`${file.name}: ${fileErrors.join(', ')}`);
        }
    });
    
    const description = DOM.descriptionInput.value.trim();
    if (!DataValidation.validateDescription(description)) {
        errors.push('Description is required and must be between 1-500 characters');
    }
    
    const tags = DataValidation.parseTags(DOM.tagsInput.value);
    if (!DataValidation.validateTags(tags)) {
        errors.push('Invalid tags format or too many tags (max 10)');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function showValidationErrors(errors) {
    errors.forEach(error => Toast.error(error));
}

function handleUploadError(error) {
    let errorMessage = 'Upload failed. Please try again.';
    
    if (error.message) {
        if (error.message.includes('quota')) {
            errorMessage = 'Storage quota exceeded. Please delete some files and try again.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('validation')) {
            errorMessage = 'File validation failed. Please check your files and try again.';
        } else {
            errorMessage = `Upload failed: ${error.message}`;
        }
    }
    
    Toast.error(errorMessage);
}

function setLoadingState(loading) {
    AppState.isLoading = loading;
    
    DOM.uploadBtn.disabled = loading;
    DOM.uploadBtn.classList.toggle('loading', loading);
    
    DOM.fileInput.disabled = loading;
    DOM.descriptionInput.disabled = loading;
    DOM.tagsInput.disabled = loading;
    DOM.clearBtn.disabled = loading;
    
    DOM.uploadArea.classList.toggle('uploading', loading);
    
    updateUploadButtonState();
}

function showUploadProgress(show) {
    DOM.uploadProgress.classList.toggle('show', show);
    
    if (!show) {
        DOM.progressFill.style.width = '0%';
        DOM.progressText.textContent = '';
    } else {
        DOM.progressText.textContent = 'Preparing upload...';
    }
}

function hideMessages() {
    if (DOM.uploadError) DOM.uploadError.style.display = 'none';
    if (DOM.uploadSuccess) DOM.uploadSuccess.style.display = 'none';
}

function showLoadingState(show) {
    DOM.loadingState.classList.toggle('show', show);
    DOM.galleryContainer.style.display = show ? 'none' : 'grid';
}

// Gallery functions (same as app-mock.js but simplified)
function setView(view) {
    AppState.currentView = view;
    
    DOM.gridViewBtn.classList.toggle('active', view === 'grid');
    DOM.listViewBtn.classList.toggle('active', view === 'list');
    
    DOM.galleryContainer.classList.toggle('grid-view', view === 'grid');
    DOM.galleryContainer.classList.toggle('list-view', view === 'list');
    
    renderGallery();
}

function handleSearch() {
    AppState.searchQuery = DOM.searchInput.value.toLowerCase().trim();
    filterAndSortMedia();
    renderGallery();
}

function handleFilter(e) {
    if (e.target.classList.contains('filter-option')) {
        AppState.currentFilter = e.target.dataset.filter;
        
        DOM.filterMenu.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('active');
        });
        e.target.classList.add('active');
        
        filterAndSortMedia();
        renderGallery();
    }
}

function handleSort() {
    AppState.currentSort = DOM.sortSelect.value;
    filterAndSortMedia();
    renderGallery();
}

function filterAndSortMedia() {
    let filtered = [...AppState.mediaItems];
    
    if (AppState.currentFilter !== 'all') {
        filtered = filtered.filter(item => item.fileType === AppState.currentFilter);
    }
    
    if (AppState.searchQuery) {
        filtered = filtered.filter(item => 
            item.fileName.toLowerCase().includes(AppState.searchQuery) ||
            item.description.toLowerCase().includes(AppState.searchQuery) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(AppState.searchQuery)))
        );
    }
    
    filtered.sort((a, b) => {
        switch (AppState.currentSort) {
            case 'date-desc':
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            case 'date-asc':
                return new Date(a.uploadDate) - new Date(b.uploadDate);
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
    
    AppState.filteredItems = filtered;
    updateStats();
}

function renderGallery() {
    if (AppState.filteredItems.length === 0) {
        showEmptyGalleryState();
        return;
    }
    
    DOM.emptyState.classList.remove('show');
    DOM.galleryContainer.style.display = 'grid';
    
    const fragment = document.createDocumentFragment();
    
    AppState.filteredItems.forEach((item, index) => {
        const cardElement = createMediaCardElement(item, index);
        fragment.appendChild(cardElement);
    });
    
    DOM.galleryContainer.innerHTML = '';
    DOM.galleryContainer.appendChild(fragment);
    
    setupMediaCardEvents();
}

function showEmptyGalleryState() {
    DOM.emptyState.classList.add('show');
    DOM.galleryContainer.innerHTML = '';
    DOM.galleryContainer.style.display = 'none';
    
    const emptyStateContent = DOM.emptyState.querySelector('h3');
    const emptyStateDescription = DOM.emptyState.querySelector('p');
    
    if (AppState.searchQuery) {
        emptyStateContent.textContent = 'No matching files found';
        emptyStateDescription.textContent = `No files match your search for "${AppState.searchQuery}". Try different keywords or clear the search.`;
    } else if (AppState.currentFilter !== 'all') {
        const filterName = AppState.currentFilter.charAt(0).toUpperCase() + AppState.currentFilter.slice(1);
        emptyStateContent.textContent = `No ${filterName} files`;
        emptyStateDescription.textContent = `You haven't uploaded any ${filterName.toLowerCase()} files yet. Upload some ${filterName.toLowerCase()} files to see them here.`;
    } else {
        emptyStateContent.textContent = 'No media files yet';
        emptyStateDescription.textContent = 'Upload your first image, video, or audio file to get started!';
    }
}

function createMediaCardElement(item, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `media-card ${AppState.currentView}-card`;
    cardDiv.setAttribute('data-id', item.id);
    cardDiv.setAttribute('data-file-type', item.fileType);
    cardDiv.setAttribute('data-index', index);
    
    const icon = Utils.getFileIcon(item.fileType);
    const formattedDate = Utils.formatDate(item.uploadDate);
    const tags = item.tags || [];
    const truncatedDescription = truncateText(item.description, AppState.currentView === 'list' ? 150 : 100);
    
    if (AppState.currentView === 'list') {
        cardDiv.innerHTML = createListCardHTML(item, icon, formattedDate, tags, truncatedDescription);
    } else {
        cardDiv.innerHTML = createGridCardHTML(item, icon, formattedDate, tags, truncatedDescription);
    }
    
    return cardDiv;
}

function createListCardHTML(item, icon, formattedDate, tags, truncatedDescription) {
    return `
        <div class="media-header">
            <div class="media-icon">
                <i class="${icon}" aria-hidden="true"></i>
            </div>
            <div class="media-info">
                <h3 class="media-title" title="${Utils.escapeHtml(item.fileName)}">
                    ${Utils.escapeHtml(item.fileName)}
                </h3>
                <div class="media-meta">
                    <span class="media-date" title="Uploaded ${formattedDate}">
                        <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                        ${formattedDate}
                    </span>
                    <span class="media-size" title="File size: ${DataValidation.formatFileSize(item.fileSize)}">
                        <i class="fas fa-hdd" aria-hidden="true"></i>
                        ${DataValidation.formatFileSize(item.fileSize)}
                    </span>
                    <span class="media-type" title="File type: ${item.fileType}">
                        <i class="fas fa-tag" aria-hidden="true"></i>
                        ${item.fileType}
                    </span>
                </div>
            </div>
        </div>
        <div class="media-content">
            <div class="media-description" title="${Utils.escapeHtml(item.description)}">
                ${Utils.escapeHtml(truncatedDescription)}
                ${truncatedDescription !== item.description ? '<span class="text-truncated">...</span>' : ''}
            </div>
            ${tags.length > 0 ? `
                <div class="media-tags" role="list" aria-label="Tags">
                    ${tags.slice(0, 5).map(tag => `
                        <span class="media-tag" role="listitem" title="Tag: ${Utils.escapeHtml(tag)}">
                            ${Utils.escapeHtml(tag)}
                        </span>
                    `).join('')}
                    ${tags.length > 5 ? `<span class="media-tag-more">+${tags.length - 5} more</span>` : ''}
                </div>
            ` : ''}
        </div>
        <div class="media-actions" role="group" aria-label="Media actions">
            <button class="action-btn view-btn" data-id="${item.id}" title="View ${Utils.escapeHtml(item.fileName)}" aria-label="View file details">
                <i class="fas fa-eye" aria-hidden="true"></i>
                <span class="btn-text">View</span>
            </button>
            <button class="action-btn edit-btn" data-id="${item.id}" title="Edit ${Utils.escapeHtml(item.fileName)}" aria-label="Edit file description">
                <i class="fas fa-edit" aria-hidden="true"></i>
                <span class="btn-text">Edit</span>
            </button>
            <button class="action-btn delete-btn" data-id="${item.id}" title="Delete ${Utils.escapeHtml(item.fileName)}" aria-label="Delete file">
                <i class="fas fa-trash" aria-hidden="true"></i>
                <span class="btn-text">Delete</span>
            </button>
        </div>
    `;
}

function createGridCardHTML(item, icon, formattedDate, tags, truncatedDescription) {
    return `
        <div class="media-header">
            <div class="media-icon">
                <i class="${icon}" aria-hidden="true"></i>
            </div>
            <div class="media-info">
                <h3 class="media-title" title="${Utils.escapeHtml(item.fileName)}">
                    ${Utils.escapeHtml(item.fileName)}
                </h3>
                <div class="media-meta">
                    <span class="media-date" title="Uploaded ${formattedDate}">
                        ${formattedDate}
                    </span>
                    <span class="media-size" title="File size: ${DataValidation.formatFileSize(item.fileSize)}">
                        ${DataValidation.formatFileSize(item.fileSize)}
                    </span>
                </div>
            </div>
        </div>
        <div class="media-description" title="${Utils.escapeHtml(item.description)}">
            ${Utils.escapeHtml(truncatedDescription)}
            ${truncatedDescription !== item.description ? '<span class="text-truncated">...</span>' : ''}
        </div>
        ${tags.length > 0 ? `
            <div class="media-tags" role="list" aria-label="Tags">
                ${tags.slice(0, 3).map(tag => `
                    <span class="media-tag" role="listitem" title="Tag: ${Utils.escapeHtml(tag)}">
                        ${Utils.escapeHtml(tag)}
                    </span>
                `).join('')}
                ${tags.length > 3 ? `<span class="media-tag-more">+${tags.length - 3}</span>` : ''}
            </div>
        ` : ''}
        <div class="media-actions" role="group" aria-label="Media actions">
            <button class="action-btn view-btn" data-id="${item.id}" title="View ${Utils.escapeHtml(item.fileName)}" aria-label="View file details">
                <i class="fas fa-eye" aria-hidden="true"></i>
            </button>
            <button class="action-btn edit-btn" data-id="${item.id}" title="Edit ${Utils.escapeHtml(item.fileName)}" aria-label="Edit file description">
                <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${item.id}" title="Delete ${Utils.escapeHtml(item.fileName)}" aria-label="Delete file">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    `;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
        return truncated.substring(0, lastSpace);
    }
    
    return truncated;
}

function setupMediaCardEvents() {
    DOM.galleryContainer.addEventListener('click', handleGalleryClick);
    DOM.galleryContainer.addEventListener('keydown', handleGalleryKeydown);
}

function handleGalleryClick(e) {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const id = actionBtn.dataset.id;
    const action = actionBtn.classList.contains('view-btn') ? 'view' :
                  actionBtn.classList.contains('edit-btn') ? 'edit' :
                  actionBtn.classList.contains('delete-btn') ? 'delete' : null;
    
    if (!id || !action) return;
    
    actionBtn.classList.add('clicked');
    setTimeout(() => actionBtn.classList.remove('clicked'), 150);
    
    switch (action) {
        case 'view':
            openViewModal(id);
            break;
        case 'edit':
            openEditModal(id);
            break;
        case 'delete':
            openDeleteModal(id);
            break;
    }
}

function handleGalleryKeydown(e) {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        actionBtn.click();
    }
}

// Modal functions
function openViewModal(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    AppState.currentViewId = id;
    
    DOM.viewModalTitle.innerHTML = `<i class="fas fa-eye"></i> ${Utils.escapeHtml(item.fileName)}`;
    
    const icon = Utils.getFileIcon(item.fileType);
    const previewHTML = `
        <div class="file-placeholder">
            <div class="file-icon"><i class="${icon}"></i></div>
            <p><strong>${Utils.escapeHtml(item.fileName)}</strong></p>
            <p>File preview available when served from backend</p>
        </div>
    `;
    
    DOM.mediaPreview.innerHTML = previewHTML;
    
    const tags = item.tags || [];
    DOM.mediaDetails.innerHTML = `
        <h4>File Details</h4>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${Utils.escapeHtml(item.fileName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">${DataValidation.formatFileSize(item.fileSize)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Uploaded:</span>
            <span class="detail-value">${Utils.formatDate(item.uploadDate)}</span>
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

function closeViewModal() {
    DOM.viewModal.classList.remove('show');
    AppState.currentViewId = null;
}

function handleDownload() {
    if (!AppState.currentViewId) return;
    
    const item = AppState.mediaItems.find(item => item.id === AppState.currentViewId);
    if (item) {
        // In a real implementation, this would download from the backend
        Toast.info(`Download would start for: ${item.fileName} (backend integration needed)`);
    }
}

function openEditModal(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    AppState.currentEditId = id;
    
    DOM.editDescriptionInput.value = item.description;
    DOM.editTagsInput.value = (item.tags || []).join(', ');
    
    updateEditCharCount();
    updateEditTagsPreview();
    
    DOM.editModal.classList.add('show');
    DOM.editDescriptionInput.focus();
}

function closeEditModal() {
    DOM.editModal.classList.remove('show');
    AppState.currentEditId = null;
}

function updateEditCharCount() {
    const count = DOM.editDescriptionInput.value.length;
    DOM.editCharCount.textContent = `${count}/500`;
    DOM.editCharCount.style.color = count > 450 ? 'var(--error-color)' : 'var(--gray-500)';
}

function updateEditTagsPreview() {
    const tags = DataValidation.parseTags(DOM.editTagsInput.value);
    
    DOM.editTagsPreview.innerHTML = tags.map(tag => `
        <span class="tag-item">
            ${Utils.escapeHtml(tag)}
            <button type="button" class="tag-remove" onclick="removeEditTag('${Utils.escapeHtml(tag)}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function removeEditTag(tagToRemove) {
    const currentTags = DataValidation.parseTags(DOM.editTagsInput.value);
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    DOM.editTagsInput.value = newTags.join(', ');
    updateEditTagsPreview();
}

function openDeleteModal(id) {
    const item = AppState.mediaItems.find(item => item.id === id);
    if (!item) return;
    
    AppState.currentDeleteId = id;
    DOM.deleteFilename.textContent = item.fileName;
    DOM.deleteModal.classList.add('show');
}

function closeDeleteModal() {
    DOM.deleteModal.classList.remove('show');
    AppState.currentDeleteId = null;
}

function closeAllModals() {
    closeEditModal();
    closeViewModal();
    closeDeleteModal();
}

function handleKeyboard(e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
}

// Global functions for onclick handlers
window.removeFile = removeFile;
window.removeTag = removeTag;
window.removeEditTag = removeEditTag;