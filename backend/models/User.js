const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Core user identification - matching your schema
    userId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return this._id.toString();
        }
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [100, 'Display name cannot exceed 100 characters']
    },
    passwordHash: {
        type: String,
        required: function() {
            return !this.auth0Id;
        },
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    registrationDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Profile and preferences
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },
    
    // Authentication and security
    auth0Id: {
        type: String,
        sparse: true,
        index: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'auth0', 'google', 'github'],
        default: 'local'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    
    // Storage and media tracking
    mediaCount: {
        type: Number,
        default: 0,
        min: 0
    },
    storageUsed: {
        type: Number,
        default: 0,
        min: 0
    },
    storageLimit: {
        type: Number,
        default: 1073741824 // 1GB in bytes
    },
    
    // User preferences and settings
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: { type: Boolean, default: true },
            uploads: { type: Boolean, default: true },
            shares: { type: Boolean, default: true }
        },
        privacy: {
            profilePublic: { type: Boolean, default: false },
            showActivity: { type: Boolean, default: true }
        }
    },
    
    // Profile information
    profile: {
        avatar: String,
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        website: String,
        location: String,
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    
    // Analytics and tracking metadata
    metadata: {
        createdIP: String,
        lastLoginIP: String,
        userAgent: String,
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        },
        loginCount: {
            type: Number,
            default: 0
        },
        referrer: String,
        deviceInfo: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'users',
    autoIndex: true,
    strict: true,
    versionKey: '__v'
});

// Virtuals
userSchema.virtual('storageUsedMB').get(function() {
    return (this.storageUsed / (1024 * 1024)).toFixed(2);
});

userSchema.virtual('storageUsagePercentage').get(function() {
    return ((this.storageUsed / this.storageLimit) * 100).toFixed(1);
});

userSchema.virtual('isStorageFull').get(function() {
    return this.storageUsed >= this.storageLimit;
});

userSchema.virtual('accountAge').get(function() {
    return Math.floor((new Date() - this.registrationDate) / (1000 * 60 * 60 * 24));
});

userSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Indexes optimized for Azure Cosmos DB
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ auth0Id: 1 }, { sparse: true, unique: true });
userSchema.index({ registrationDate: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ authProvider: 1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    try {
        // Set userId if not already set
        if (!this.userId) {
            this.userId = this._id.toString();
        }
        
        // Hash password if modified and not using external auth
        if (this.isModified('passwordHash') && this.passwordHash && this.authProvider === 'local') {
            const salt = await bcrypt.genSalt(12);
            this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods.updateLastLogin = async function(ip, userAgent) {
    this.lastLogin = new Date();
    this.metadata.lastLoginIP = ip;
    this.metadata.userAgent = userAgent;
    this.metadata.loginCount = (this.metadata.loginCount || 0) + 1;
    return this.save({ validateBeforeSave: false });
};

userSchema.methods.updateStorageUsage = async function(sizeChange) {
    this.storageUsed = Math.max(0, this.storageUsed + sizeChange);
    return this.save();
};

userSchema.methods.checkStorageLimit = function(additionalSize = 0) {
    return (this.storageUsed + additionalSize) <= this.storageLimit;
};

userSchema.methods.incrementMediaCount = async function() {
    this.mediaCount += 1;
    return this.save();
};

userSchema.methods.decrementMediaCount = async function() {
    this.mediaCount = Math.max(0, this.mediaCount - 1);
    return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

userSchema.statics.findByIdentifier = function(identifier) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const isEmail = emailRegex.test(identifier);
    
    if (isEmail) {
        return this.findOne({ email: identifier.toLowerCase() });
    } else {
        return this.findOne({ username: identifier.toLowerCase() });
    }
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.passwordHash;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);