const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    // Core media identification - matching your schema
    mediaId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return this._id.toString();
        }
    },
    
    // User association - Foreign Key
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    
    // File information
    fileName: {
        type: String,
        required: [true, 'File name is required'],
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters']
    },
    filePath: {
        type: String,
        required: [true, 'File path is required']
    },
    mimeType: {
        type: String,
        required: [true, 'MIME type is required']
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required'],
        min: [0, 'File size cannot be negative']
    },
    uploadDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Content metadata
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    
    // Media-specific properties
    fileType: {
        type: String,
        required: [true, 'File type is required'],
        enum: ['image', 'video', 'audio', 'document', 'other'],
        lowercase: true
    },
    thumbnailPath: {
        type: String,
        default: null
    },
    
    // Media dimensions and properties
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
    
    // Access and visibility
    isPublic: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error', 'deleted'],
        default: 'ready'
    },
    
    // Analytics and engagement
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: 0
    },
    shareCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Processing and optimization
    processedVersions: [{
        type: {
            type: String,
            enum: ['thumbnail', 'compressed', 'watermarked', 'resized']
        },
        path: String,
        size: Number,
        dimensions: {
            width: Number,
            height: Number
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Azure Blob Storage specific
    azureInfo: {
        containerName: String,
        blobName: String,
        url: String,
        etag: String,
        lastModified: Date
    },
    
    // Additional metadata for analytics and processing
    metadata: {
        uploadIP: String,
        userAgent: String,
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        },
        processingTime: {
            type: Number,
            default: 0
        },
        checksum: String,
        exifData: mongoose.Schema.Types.Mixed,
        codec: String,
        bitrate: Number,
        colorProfile: String,
        compression: String,
        originalFileName: String,
        uploadSession: String
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
    collection: 'media_items',
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
    if (this.azureInfo && this.azureInfo.url) {
        return this.azureInfo.url;
    }
    return `/api/media/${this.mediaId}/file`;
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
    return Math.floor((new Date() - this.uploadDate) / (1000 * 60 * 60 * 24));
});

mediaSchema.virtual('engagementScore').get(function() {
    // Simple engagement score based on views, downloads, and shares
    return (this.viewCount * 1) + (this.downloadCount * 2) + (this.shareCount * 3);
});

// Indexes optimized for Azure Cosmos DB
mediaSchema.index({ mediaId: 1 }, { unique: true });
mediaSchema.index({ userId: 1, uploadDate: -1 });
mediaSchema.index({ userId: 1, fileType: 1 });
mediaSchema.index({ userId: 1, tags: 1 });
mediaSchema.index({ uploadDate: -1 });
mediaSchema.index({ fileType: 1, uploadDate: -1 });
mediaSchema.index({ status: 1 });
mediaSchema.index({ isPublic: 1, uploadDate: -1 });
mediaSchema.index({ deletedAt: 1 });
mediaSchema.index({ viewCount: -1 });
mediaSchema.index({ downloadCount: -1 });

// Text index for search functionality
mediaSchema.index({
    fileName: 'text',
    description: 'text',
    tags: 'text'
}, {
    weights: {
        fileName: 10,
        description: 5,
        tags: 3
    }
});

// Compound indexes for complex queries
mediaSchema.index({ userId: 1, fileType: 1, uploadDate: -1 });
mediaSchema.index({ userId: 1, isPublic: 1, status: 1 });
mediaSchema.index({ userId: 1, status: 1, uploadDate: -1 });

// Pre-save middleware
mediaSchema.pre('save', function(next) {
    // Set mediaId if not already set
    if (!this.mediaId) {
        this.mediaId = this._id.toString();
    }
    
    // Ensure tags are unique and clean
    if (this.tags && this.tags.length > 0) {
        this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim().length > 0))];
    }
    
    // Set original file name in metadata if not set
    if (!this.metadata.originalFileName && this.fileName) {
        this.metadata.originalFileName = this.fileName;
    }
    
    next();
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

mediaSchema.methods.incrementShareCount = async function() {
    this.shareCount += 1;
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

mediaSchema.methods.addProcessedVersion = async function(type, path, size, dimensions = null) {
    this.processedVersions.push({
        type,
        path,
        size,
        dimensions,
        createdAt: new Date()
    });
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
    
    if (options.isPublic !== undefined) {
        query.isPublic = options.isPublic;
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
        mongoQuery.sort({ uploadDate: -1 });
    }
    
    return mongoQuery;
};

mediaSchema.statics.findByMediaId = function(mediaId) {
    return this.findOne({ mediaId, deletedAt: null });
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
        .sort({ score: { $meta: 'textScore' }, uploadDate: -1 })
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
                minSize: { $min: '$fileSize' },
                totalViews: { $sum: '$viewCount' },
                totalDownloads: { $sum: '$downloadCount' }
            }
        }
    ]);
};

mediaSchema.statics.getPopularFiles = function(userId = null, limit = 10) {
    const query = { deletedAt: null, status: 'ready' };
    if (userId) {
        query.userId = userId;
    }
    
    return this.find(query)
        .sort({ viewCount: -1, downloadCount: -1, shareCount: -1 })
        .limit(limit);
};

mediaSchema.statics.getRecentUploads = function(userId, days = 7, limit = 10) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    return this.find({
        userId,
        uploadDate: { $gte: dateThreshold },
        deletedAt: null
    })
    .sort({ uploadDate: -1 })
    .limit(limit);
};

// Remove sensitive data when converting to JSON
mediaSchema.methods.toJSON = function() {
    const mediaObject = this.toObject();
    delete mediaObject.__v;
    return mediaObject;
};

module.exports = mongoose.model('Media', mediaSchema);