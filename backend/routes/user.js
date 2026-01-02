const express = require('express');
const User = require('../models/User');
const Media = require('../models/Media');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user info
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get media statistics
        const mediaStats = await Media.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            }
        ]);
        
        // Get recent uploads (last 5)
        const recentUploads = await Media.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('originalName fileType fileSize createdAt');
        
        // Calculate total stats
        const totalFiles = mediaStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalSize = mediaStats.reduce((sum, stat) => sum + stat.totalSize, 0);
        
        // Format stats by type
        const statsByType = {
            image: { count: 0, size: 0 },
            video: { count: 0, size: 0 },
            audio: { count: 0, size: 0 }
        };
        
        mediaStats.forEach(stat => {
            if (statsByType[stat._id]) {
                statsByType[stat._id] = {
                    count: stat.count,
                    size: stat.totalSize
                };
            }
        });
        
        res.json({
            success: true,
            dashboard: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    memberSince: user.createdAt,
                    lastLogin: user.lastLogin
                },
                stats: {
                    totalFiles,
                    totalSize,
                    byType: statsByType
                },
                recentUploads
            }
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard data'
        });
    }
});

// Get user activity log
router.get('/activity', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.userId;
        
        // Get recent media activities
        const activities = await Media.find({ userId })
            .sort({ createdAt: -1, updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('originalName fileType createdAt updatedAt')
            .exec();
        
        // Format activities
        const formattedActivities = activities.map(media => ({
            id: media._id,
            type: 'media_upload',
            description: `Uploaded ${media.originalName}`,
            fileType: media.fileType,
            timestamp: media.createdAt,
            metadata: {
                fileName: media.originalName,
                fileType: media.fileType
            }
        }));
        
        // Get total count
        const total = await Media.countDocuments({ userId });
        
        res.json({
            success: true,
            activities: formattedActivities,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Activity log error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching activity log'
        });
    }
});

// Get storage usage
router.get('/storage', protect, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Calculate storage usage
        const storageStats = await Media.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    avgFileSize: { $avg: '$fileSize' }
                }
            }
        ]);
        
        // Get storage by file type
        const storageByType = await Media.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    size: { $sum: '$fileSize' }
                }
            }
        ]);
        
        // Storage limits (can be configured per user)
        const storageLimit = parseInt(process.env.USER_STORAGE_LIMIT) || 1024 * 1024 * 1024; // 1GB default
        
        const stats = storageStats[0] || { totalFiles: 0, totalSize: 0, avgFileSize: 0 };
        
        res.json({
            success: true,
            storage: {
                used: stats.totalSize,
                limit: storageLimit,
                percentage: (stats.totalSize / storageLimit) * 100,
                totalFiles: stats.totalFiles,
                averageFileSize: stats.avgFileSize || 0,
                byType: storageByType.reduce((acc, item) => {
                    acc[item._id] = {
                        count: item.count,
                        size: item.size,
                        percentage: (item.size / stats.totalSize) * 100
                    };
                    return acc;
                }, {})
            }
        });
        
    } catch (error) {
        console.error('Storage stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching storage statistics'
        });
    }
});

// Delete user account
router.delete('/account', protect, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }
        
        // Verify password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }
        
        // Delete all user's media files
        const userMedia = await Media.find({ userId });
        const fs = require('fs').promises;
        
        for (const media of userMedia) {
            try {
                await fs.unlink(media.path);
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
            }
        }
        
        // Delete all media records
        await Media.deleteMany({ userId });
        
        // Delete user account
        await User.findByIdAndDelete(userId);
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
        
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting account'
        });
    }
});

module.exports = router;