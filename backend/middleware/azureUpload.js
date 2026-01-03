const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Check if Azure Blob Storage is configured
const isAzureConfigured = !!process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME || 'media-uploads';

let blobServiceClient;
if (isAzureConfigured) {
    blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    console.log('🔵 Azure Blob Storage configured for file uploads');
} else {
    console.log('📁 Using local file storage for uploads');
}

// Ensure local upload directories exist (fallback)
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const thumbnailDir = path.join(uploadDir, 'thumbnails');

[uploadDir, thumbnailDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure multer for memory storage when using Azure
const storage = isAzureConfigured 
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const name = path.basename(file.originalname, ext);
            const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
            
            cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
        }
    });

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': true,
        'image/jpg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'video/mp4': true,
        'video/webm': true,
        'video/ogg': true,
        'video/avi': true,
        'video/mov': true,
        'audio/mp3': true,
        'audio/mpeg': true,
        'audio/wav': true,
        'audio/ogg': true,
        'audio/aac': true,
        'audio/flac': true
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Please upload images, videos, or audio files only.`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB for Azure
        files: 1
    },
    fileFilter: fileFilter
});

// Azure Blob Storage upload function
const uploadToAzure = async (file, userId) => {
    try {
        if (!blobServiceClient) {
            throw new Error('Azure Blob Storage not configured');
        }

        // Create container if it doesn't exist
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({
            access: 'blob' // Public read access for media files
        });

        // Generate unique blob name
        const ext = path.extname(file.originalname);
        const blobName = `${userId || 'anonymous'}/${Date.now()}-${uuidv4()}${ext}`;
        
        // Get block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Upload file buffer
        const uploadResponse = await blockBlobClient.upload(
            file.buffer, 
            file.buffer.length,
            {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype
                },
                metadata: {
                    originalName: file.originalname,
                    uploadedBy: userId || 'anonymous',
                    uploadDate: new Date().toISOString()
                }
            }
        );

        console.log(`✅ File uploaded to Azure: ${blobName}`);
        
        return {
            success: true,
            url: blockBlobClient.url,
            blobName: blobName,
            container: containerName,
            etag: uploadResponse.etag,
            lastModified: uploadResponse.lastModified
        };
    } catch (error) {
        console.error('❌ Azure upload failed:', error);
        throw error;
    }
};

// Enhanced upload middleware that handles both local and Azure storage
const uploadSingleEnhanced = (fieldName = 'media') => {
    return [
        upload.single(fieldName),
        async (req, res, next) => {
            try {
                if (!req.file) {
                    return next();
                }

                if (isAzureConfigured) {
                    // Upload to Azure Blob Storage
                    const userId = req.user?.id || req.body?.userId;
                    const azureResult = await uploadToAzure(req.file, userId);
                    
                    // Enhance req.file with Azure information
                    req.file.azureUrl = azureResult.url;
                    req.file.blobName = azureResult.blobName;
                    req.file.container = azureResult.container;
                    req.file.storage = 'azure';
                    req.file.publicUrl = azureResult.url;
                } else {
                    // Local storage - construct public URL
                    req.file.storage = 'local';
                    req.file.publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
                }

                // Add common metadata
                req.file.uploadedAt = new Date().toISOString();
                req.file.fileCategory = getFileTypeCategory(req.file.mimetype);
                
                next();
            } catch (error) {
                console.error('Upload processing error:', error);
                res.status(500).json({
                    success: false,
                    message: 'File upload failed',
                    error: error.message
                });
            }
        },
        handleUploadError
    ];
};

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 52428800) / 1024 / 1024}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file allowed per upload.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field. Please use "media" field name.'
            });
        }
    }
    
    if (err.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next(err);
};

// Utility function to get file type category
const getFileTypeCategory = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'unknown';
};

// Utility function to delete file (works with both local and Azure)
const deleteFile = async (fileInfo) => {
    try {
        if (fileInfo.storage === 'azure' && fileInfo.blobName) {
            // Delete from Azure Blob Storage
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(fileInfo.blobName);
            await blockBlobClient.delete();
            console.log(`✅ Deleted Azure blob: ${fileInfo.blobName}`);
        } else if (fileInfo.filename) {
            // Delete local file
            const fullPath = path.join(uploadDir, fileInfo.filename);
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
                console.log(`✅ Deleted local file: ${fullPath}`);
            }
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error);
    }
};

// Function to get file URL (works with both local and Azure)
const getFileUrl = (fileInfo, req) => {
    if (fileInfo.storage === 'azure' && fileInfo.azureUrl) {
        return fileInfo.azureUrl;
    } else if (fileInfo.filename) {
        return `${req.protocol}://${req.get('host')}/uploads/${fileInfo.filename}`;
    }
    return null;
};

// Initialize Azure container on startup
const initializeAzureStorage = async () => {
    if (isAzureConfigured) {
        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);
            await containerClient.createIfNotExists({
                access: 'blob'
            });
            console.log(`✅ Azure container '${containerName}' ready`);
        } catch (error) {
            console.error('❌ Failed to initialize Azure storage:', error);
        }
    }
};

module.exports = {
    uploadSingle: uploadSingleEnhanced,
    uploadMultiple: (fieldName = 'media', maxCount = 5) => [
        upload.array(fieldName, maxCount),
        handleUploadError
    ],
    getFileTypeCategory,
    deleteFile,
    getFileUrl,
    initializeAzureStorage,
    uploadDir,
    thumbnailDir,
    isAzureConfigured
};