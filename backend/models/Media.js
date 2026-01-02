const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    // File information
    originalName: {
        type: String,
        required: [true, 'Original file name is required'],
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters']
    },
    filename: {
        type: String,
        required: [true, 'File name is required'],
        trim: true
    },
    path: {
        type: String,
        required: [true, 'File path is required']
    },
    
    // File metadata
    mimeType: {
        type: String,
        required: [true, 'MIME type is required']
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required'],
        min: [0, 'File size cannot be negative']
    },
    fileType: {
        type: String,
        required: [true, 'File type is required'],
        enum: ['image', 'video', 'audio', 'unknown'],
        lowercase: true
    },
    
    // Content information
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    
    // User association - optimized for Azure Cosmos DB partitioning
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true // Partition key for Azure Cosmos DB
    },
    
    // Media-specific metadata
    dimensions: {
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        }
    },
    duration: {
        type: Number, // For video/audio files in seconds
        default: null
    },
    thumbnailPath: {
        type: String,
        default: null
    },
    
    // Access and visibility
    isPublic: {
        type: Boolean,
        default: false
    },
    
    // Analytics and tracking
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    
    // Processing status
    status: {
        type: String,
        enum: ['processing', 'ready', 'error', 'deleted'],
        default: 'ready'
    },
    
    // Additional metadata for Azure Cosmos DB optimization
    metadata: {
        uploadIP: String,
        userAgent: String,
        source: {
            type: String,
            default: 'web'
        },
        processingTime: Number, // Time taken to process file
        checksum: String, // File checksum for integrity
        exifData: mongoose.Schema.Types.Mixed, // For images
        codec: String, // For video/audio files
        bitrate: Number, // For video/audio files
        colorProfile: String, // For images
        compression: String
    },
    
    // Soft delete support
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Azure Cosmos DB optimizations
    collection: 'media',
    autoIndex: true,
    strict: true,
    versionKey: '__v'
});

// Virtuals
mediaSchema.virtual('fileSizeFormatted').get(function() {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

mediaSchema.virtual('fileUrl').get(function() {
    if (this.path) {
        return `/api/media/${this._id}/file`;
    }
    return null;
});

mediaSchema.virtual('thumbnailUrl').get(function() {
    if (this.thumbnailPath) {
        return `/uploads/thumbnails/${this.thumbnailPath}`;
    }
    return null;
});

mediaSchema.virtual('isDeleted').get(function() {
    return this.deletedAt !== null;
});

mediaSchema.virtual('ageInDays').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes optimized for Azure Cosmos DB
mediaSchema.index({ userId: 1, createdAt: -1 }); // Primary query pattern
mediaSchema.index({ userId: 1, fileType: 1 }); // Filter by type
mediaSchema.index({ userId: 1, tags: 1 }); // Tag-based queries
mediaSchema.index({ createdAt: -1 }); // Recent files
mediaSchema.index({ fileType: 1, createdAt: -1 }); // Type + date
mediaSchema.index({ status: 1 }); // Processing status
mediaSchema.index({ isPublic: 1, createdAt: -1 }); // Public files
mediaSchema.index({ deletedAt: 1 }); // Soft delete queries

// Text index for search functionality
mediaSchema.index({
    originalName: 'text',
    description: 'text',
    tags: 'text'
}, {
    weights: {
        originalName: 10,
        description: 5,
        tags: 3
    }
});

// Compound indexes for complex queries
mediaSchema.index({ userId: 1, fileType: 1, createdAt: -1 });
mediaSchema.index({ userId: 1, isPublic: 1, status: 1 });

// Pre-save middleware
mediaSchema.pre('save', function(next) {
    // Ensure tags are unique and clean
    if (this.tags && this.tags.length > 0) {
        this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim().length > 0))];
    }
    
    // Set processing time if not set
    if (this.isNew && !this.metadata.processingTime) {
        this.metadata.processingTime = 0;
    }
    
    next();
});

// Pre-remove middleware for cleanup
mediaSchema.pre('remove', async function(next) {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Remove main file
        if (this.path) {
            try {
                await fs.unlink(this.path);
            } catch (error) {
                console.log(`File not found or already deleted: ${this.path}`);
            }
        }
        
        // Remove thumbnail if exists
        if (this.thumbnailPath) {
            const thumbnailFullPath = path.join(process.env.UPLOAD_PATH || './uploads', 'thumbnails', this.thumbnailPath);
            try {
                await fs.unlink(thumbnailFullPath);
            } catch (error) {
                console.log(`Thumbnail not found or already deleted: ${thumbnailFullPath}`);
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
mediaSchema.methods.incrementViewCount = async function() {
    this.viewCount += 1;
    return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.incrementDownloadCount = async function() {
    this.downloadCount += 1;
    return this.save({ validateBeforeSave: false });
};

mediaSchema.methods.softDelete = async function(deletedBy = null) {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.status = 'deleted';
    return this.save();
};

mediaSchema.methods.restore = async function() {
    this.deletedAt = null;
    this.deletedBy = null;
    this.status = 'ready';
    return this.save();
};

mediaSchema.methods.addTag = async function(tag) {
    if (tag && tag.trim() && !this.tags.includes(tag.toLowerCase().trim())) {
        this.tags.push(tag.toLowerCase().trim());
        return this.save();
    }
    return this;
};

mediaSchema.methods.removeTag = async function(tag) {
    this.tags = this.tags.filter(t => t !== tag.toLowerCase().trim());
    return this.save();
};

// Static methods
mediaSchema.statics.findByUser = function(userId, options = {}) {
    const query = { userId, deletedAt: null };
    
    if (options.fileType) {
        query.fileType = options.fileType;
    }
    
    if (options.status) {
        query.status = options.status;
    }
    
    const mongoQuery = this.find(query);
    
    if (options.limit) {
        mongoQuery.limit(options.limit);
    }
    
    if (options.skip) {
        mongoQuery.skip(options.skip);
    }
    
    if (options.sort) {
        mongoQuery.sort(options.sort);
    } else {
        mongoQuery.sort({ createdAt: -1 });
    }
    
    return mongoQuery;
};

mediaSchema.statics.searchByUser = function(userId, searchTerm, options = {}) {
    const query = {
        userId,
        deletedAt: null,
        $text: { $search: searchTerm }
    };
    
    if (options.fileType) {
        query.fileType = options.fileType;
    }
    
    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(options.limit || 50);
};

mediaSchema.statics.getStorageStats = async function(userId = null) {
    const matchStage = { deletedAt: null };
    if (userId) {
        matchStage.userId = userId;
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: userId ? '$fileType' : null,
                totalFiles: { $sum: 1 },
                totalSize: { $sum: '$fileSize' },
                avgSize: { $avg: '$fileSize' },
                maxSize: { $max: '$fileSize' },
                minSize: { $min: '$fileSize' }
            }
        }
    ]);
};

mediaSchema.statics.getRecentUploads = function(userId, days = 7, limit = 10) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    return this.find({
        userId,
        createdAt: { $gte: dateThreshold },
        deletedAt: null
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

mediaSchema.statics.getPopularFiles = function(userId = null, limit = 10) {
    const query = { deletedAt: null };
    if (userId) {
        query.userId = userId;
    }
    
    return this.find(query)
        .sort({ viewCount: -1, downloadCount: -1 })
        .limit(limit);
};

mediaSchema.statics.cleanupDeleted = async function(daysOld = 30) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysOld);
    
    const deletedFiles = await this.find({
        deletedAt: { $lte: threshold }
    });
    
    // Clean up files from filesystem
    const fs = require('fs').promises;
    for (const file of deletedFiles) {
        try {
            if (file.path) {
                await fs.unlink(file.path);
            }
            if (file.thumbnailPath) {
                await fs.unlink(file.thumbnailPath);
            }
        } catch (error) {
            console.log(`Error cleaning up file: ${error.message}`);
        }
    }
    
    // Remove from database
    return this.deleteMany({
        deletedAt: { $lte: threshold }
    });
};

module.exports = mongoose.model('Media', mediaSchema);