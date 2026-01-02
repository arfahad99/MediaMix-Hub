const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const thumbnailDir = path.join(uploadDir, 'thumbnails');

// Create directories if they don't exist
[uploadDir, thumbnailDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Define allowed file types
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
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: 1 // Only allow 1 file per upload
    },
    fileFilter: fileFilter
});

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024}MB`
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

// Single file upload middleware
const uploadSingle = (fieldName = 'media') => {
    return [
        upload.single(fieldName),
        handleUploadError
    ];
};

// Multiple files upload middleware
const uploadMultiple = (fieldName = 'media', maxCount = 5) => {
    return [
        upload.array(fieldName, maxCount),
        handleUploadError
    ];
};

// Utility function to get file type category
const getFileTypeCategory = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'unknown';
};

// Utility function to delete file
const deleteFile = async (filePath) => {
    try {
        const fullPath = path.join(uploadDir, filePath);
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            console.log(`Deleted file: ${fullPath}`);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    getFileTypeCategory,
    deleteFile,
    uploadDir,
    thumbnailDir
};