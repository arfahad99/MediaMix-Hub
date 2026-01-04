const mongoose = require('mongoose');
const crypto = require('crypto');

const sharedLinkSchema = new mongoose.Schema({
    // Link identification
    linkId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return crypto.randomBytes(16).toString('hex');
        }
    },
    shareToken: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return crypto.randomBytes(32).toString('hex');
        }
    },
    
    // Associated media and user
    mediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        required: [true, 'Media ID is required'],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    
    // Link configuration
    shareDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    expiryDate: {
        type: Date,
        default: function() {
            // Default expiry: 30 days from creation
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            return expiry;
        },
        required: true
    },
    
    // Access control
    permission: {
        type: String,
        enum: ['view', 'download', 'both'],
        default: 'view',
        required: true
    },
    requiresPassword: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        default: null,
        select: false // Don't include in queries by default
    },
    
    // Usage tracking
    accessCount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxAccessCount: {
        type: Number,
        default: null // null means unlimited
    },
    
    // Status and activity
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Analytics and tracking
    lastAccessDate: {
        type: Date,
        default: null
    },
    accessLog: [{
        accessDate: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        userAgent: String,
        action: {
            type: String,
            enum: ['view', 'download'],
            required: true
        },
        success: {
            type: Boolean,
            default: true
        }
    }],
    
    // Additional metadata
    metadata: {
        createdIP: String,
        userAgent: String,
        source: {
            type: String,
            default: 'web'
        },
        customMessage: {
            type: String,
            maxlength: [200, 'Custom message cannot exceed 200 characters'],
            default: null
        },
        allowedDomains: [{
            type: String,
            trim: true
        }],
        downloadLimit: {
            type: Number,
            default: null
        },
        downloadCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'shared_links',
    autoIndex: true,
    strict: true,
    versionKey: '__v'
});

// Virtuals
sharedLinkSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiryDate;
});

sharedLinkSchema.virtual('isAccessLimitReached').get(function() {
    return this.maxAccessCount && this.accessCount >= this.maxAccessCount;
});

sharedLinkSchema.virtual('canAccess').get(function() {
    return this.isActive && !this.isExpired && !this.isAccessLimitReached;
});

sharedLinkSchema.virtual('shareUrl').get(function() {
    return `/share/${this.shareToken}`;
});

sharedLinkSchema.virtual('fullShareUrl').get(function() {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/share/${this.shareToken}`;
});

sharedLinkSchema.virtual('daysUntilExpiry').get(function() {
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

sharedLinkSchema.virtual('accessPercentage').get(function() {
    if (!this.maxAccessCount) return 0;
    return Math.round((this.accessCount / this.maxAccessCount) * 100);
});

// Indexes optimized for Azure Cosmos DB
sharedLinkSchema.index({ shareToken: 1 }, { unique: true });
sharedLinkSchema.index({ linkId: 1 }, { unique: true });
sharedLinkSchema.index({ userId: 1, createdAt: -1 });
sharedLinkSchema.index({ mediaId: 1 });
sharedLinkSchema.index({ userId: 1, isActive: 1 });
sharedLinkSchema.index({ expiryDate: 1 });
sharedLinkSchema.index({ isActive: 1, expiryDate: 1 });
sharedLinkSchema.index({ shareDate: -1 });
sharedLinkSchema.index({ lastAccessDate: -1 });

// Compound indexes for complex queries
sharedLinkSchema.index({ userId: 1, mediaId: 1, isActive: 1 });
sharedLinkSchema.index({ userId: 1, permission: 1, isActive: 1 });

// Pre-save middleware
sharedLinkSchema.pre('save', async function(next) {
    try {
        // Hash password if provided and modified
        if (this.isModified('password') && this.password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            this.requiresPassword = true;
        }
        
        // Ensure shareToken and linkId are set
        if (!this.shareToken) {
            this.shareToken = crypto.randomBytes(32).toString('hex');
        }
        
        if (!this.linkId) {
            this.linkId = crypto.randomBytes(16).toString('hex');
        }
        
        // Validate expiry date
        if (this.expiryDate <= new Date()) {
            this.isActive = false;
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
sharedLinkSchema.methods.validatePassword = async function(candidatePassword) {
    if (!this.requiresPassword || !this.password) {
        return true;
    }
    
    try {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password validation failed');
    }
};

sharedLinkSchema.methods.recordAccess = async function(action, ipAddress, userAgent, success = true) {
    // Add to access log
    this.accessLog.push({
        accessDate: new Date(),
        ipAddress,
        userAgent,
        action,
        success
    });
    
    // Update counters and last access
    if (success) {
        this.accessCount += 1;
        this.lastAccessDate = new Date();
        
        if (action === 'download') {
            this.metadata.downloadCount = (this.metadata.downloadCount || 0) + 1;
        }
    }
    
    // Keep only last 100 access log entries
    if (this.accessLog.length > 100) {
        this.accessLog = this.accessLog.slice(-100);
    }
    
    return this.save({ validateBeforeSave: false });
};

sharedLinkSchema.methods.checkAccess = function(password = null) {
    // Check if link is active
    if (!this.isActive) {
        return { allowed: false, reason: 'Link is inactive' };
    }
    
    // Check expiry
    if (this.isExpired) {
        return { allowed: false, reason: 'Link has expired' };
    }
    
    // Check access limit
    if (this.isAccessLimitReached) {
        return { allowed: false, reason: 'Access limit reached' };
    }
    
    // Check password if required
    if (this.requiresPassword && !password) {
        return { allowed: false, reason: 'Password required' };
    }
    
    return { allowed: true };
};

sharedLinkSchema.methods.extendExpiry = async function(days) {
    const newExpiry = new Date(this.expiryDate);
    newExpiry.setDate(newExpiry.getDate() + days);
    this.expiryDate = newExpiry;
    
    // Reactivate if it was expired
    if (!this.isActive && new Date() < newExpiry) {
        this.isActive = true;
    }
    
    return this.save();
};

sharedLinkSchema.methods.deactivate = async function() {
    this.isActive = false;
    return this.save();
};

sharedLinkSchema.methods.activate = async function() {
    // Only activate if not expired
    if (!this.isExpired) {
        this.isActive = true;
        return this.save();
    }
    throw new Error('Cannot activate expired link');
};

sharedLinkSchema.methods.resetAccessCount = async function() {
    this.accessCount = 0;
    this.metadata.downloadCount = 0;
    this.accessLog = [];
    return this.save();
};

// Static methods
sharedLinkSchema.statics.findByToken = function(shareToken) {
    return this.findOne({ shareToken, isActive: true });
};

sharedLinkSchema.statics.findByUser = function(userId, options = {}) {
    const query = { userId };
    
    if (options.isActive !== undefined) {
        query.isActive = options.isActive;
    }
    
    if (options.mediaId) {
        query.mediaId = options.mediaId;
    }
    
    const mongoQuery = this.find(query).populate('mediaId', 'originalName fileType fileSize');
    
    if (options.limit) {
        mongoQuery.limit(options.limit);
    }
    
    if (options.sort) {
        mongoQuery.sort(options.sort);
    } else {
        mongoQuery.sort({ createdAt: -1 });
    }
    
    return mongoQuery;
};

sharedLinkSchema.statics.findExpired = function() {
    return this.find({
        expiryDate: { $lt: new Date() },
        isActive: true
    });
};

sharedLinkSchema.statics.cleanupExpired = async function() {
    const expiredLinks = await this.updateMany(
        { expiryDate: { $lt: new Date() } },
        { isActive: false }
    );
    
    return expiredLinks;
};

sharedLinkSchema.statics.getAnalytics = async function(userId = null, days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const matchStage = { createdAt: { $gte: dateThreshold } };
    if (userId) {
        matchStage.userId = userId;
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                totalLinks: { $sum: 1 },
                activeLinks: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalAccesses: { $sum: '$accessCount' },
                avgAccessesPerLink: { $avg: '$accessCount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

sharedLinkSchema.statics.getPopularLinks = function(userId = null, limit = 10) {
    const query = { isActive: true };
    if (userId) {
        query.userId = userId;
    }
    
    return this.find(query)
        .populate('mediaId', 'originalName fileType fileSize')
        .sort({ accessCount: -1 })
        .limit(limit);
};

sharedLinkSchema.statics.getUserStats = async function(userId) {
    return this.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: null,
                totalLinks: { $sum: 1 },
                activeLinks: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                expiredLinks: {
                    $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] }
                },
                totalAccesses: { $sum: '$accessCount' },
                totalDownloads: { $sum: '$metadata.downloadCount' },
                avgAccessesPerLink: { $avg: '$accessCount' },
                mostAccessedLink: { $max: '$accessCount' }
            }
        }
    ]);
};

// Remove sensitive data when converting to JSON
sharedLinkSchema.methods.toJSON = function() {
    const linkObject = this.toObject();
    delete linkObject.password;
    delete linkObject.__v;
    
    // Limit access log to last 10 entries for JSON output
    if (linkObject.accessLog && linkObject.accessLog.length > 10) {
        linkObject.accessLog = linkObject.accessLog.slice(-10);
    }
    
    return linkObject;
};

module.exports = mongoose.model('SharedLink', sharedLinkSchema);