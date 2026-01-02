const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic user information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
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
    password: {
        type: String,
        required: function() {
            // Password is only required if not using Auth0
            return !this.auth0Id;
        },
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    
    // Auth0 integration
    auth0Id: {
        type: String,
        sparse: true, // Allow multiple null values but unique non-null values
        index: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'auth0'],
        default: 'local'
    },
    profilePicture: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // User profile
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    
    // Storage and media tracking
    mediaCount: {
        type: Number,
        default: 0
    },
    storageUsed: {
        type: Number,
        default: 0 // in bytes
    },
    storageLimit: {
        type: Number,
        default: 1073741824 // 1GB in bytes
    },
    
    // User preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            uploads: {
                type: Boolean,
                default: true
            }
        },
        language: {
            type: String,
            default: 'en'
        },
        defaultView: {
            type: String,
            enum: ['grid', 'list'],
            default: 'grid'
        }
    },
    
    // Azure Cosmos DB optimizations
    userId: {
        type: String,
        default: function() {
            return this._id.toString();
        }
    },
    
    // Metadata for tracking and analytics
    metadata: {
        createdIP: String,
        lastLoginIP: String,
        userAgent: String,
        source: {
            type: String,
            default: 'web'
        },
        loginCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Azure Cosmos DB optimizations
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

// Indexes optimized for Azure Cosmos DB
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ auth0Id: 1 }, { sparse: true, unique: true });
userSchema.index({ userId: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ 'metadata.source': 1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    try {
        // Set userId if not already set
        if (!this.userId) {
            this.userId = this._id.toString();
        }
        
        // Only hash the password if it has been modified (or is new) and not using Auth0
        if (this.isModified('password') && this.password && this.authProvider !== 'auth0') {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
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

userSchema.statics.getActiveUsers = function() {
    return this.find({ isActive: true });
};

userSchema.statics.getStorageStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                    $sum: {
                        $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                    }
                },
                totalStorageUsed: { $sum: '$storageUsed' },
                averageStorageUsed: { $avg: '$storageUsed' },
                totalMediaCount: { $sum: '$mediaCount' }
            }
        }
    ]);
};

userSchema.statics.getUsersByStorageUsage = function(threshold = 0.8) {
    return this.aggregate([
        {
            $addFields: {
                storagePercentage: {
                    $divide: ['$storageUsed', '$storageLimit']
                }
            }
        },
        {
            $match: {
                storagePercentage: { $gte: threshold }
            }
        },
        {
            $sort: { storagePercentage: -1 }
        }
    ]);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);