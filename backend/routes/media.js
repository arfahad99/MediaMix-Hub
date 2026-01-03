const express = require('express');
const Media = require('../models/Media');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Get all media for authenticated user
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 50, type, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build query
        const query = { userId: req.user.userId };
        
        // Filter by type
        if (type && ['image', 'video', 'audio'].includes(type)) {
            query.fileType = type;
        }
        
        // Search functionality
        if (search) {
            query.$or = [
                { originalName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query with pagination
        const media = await Media.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        // Get total count for pagination
        const total = await Media.countDocuments(query);
        
        res.json({
            success: true,
            media,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching media'
        });
    }
});

// Get single media item
router.get('/:id', protect, async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        res.json({
            success: true,
            media
        });
        
    } catch (error) {
        console.error('Get single media error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching media'
        });
    }
});

// Upload media
router.post('/upload', protect, ...uploadSingle('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const { description, tags } = req.body;
        
        // Validation
        if (!description || description.trim().length === 0) {
            // Clean up uploaded file
            await fs.unlink(req.file.path).catch(console.error);
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }
        
        // Parse tags
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }
        
        // Determine file type
        let fileType = 'unknown';
        if (req.file.mimetype.startsWith('image/')) fileType = 'image';
        else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
        else if (req.file.mimetype.startsWith('audio/')) fileType = 'audio';
        
        // Create media record
        const media = new Media({
            userId: req.user.userId,
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            fileType,
            description: description.trim(),
            tags: parsedTags.slice(0, 10) // Limit to 10 tags
        });
        
        await media.save();
        
        res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            media
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error during upload'
        });
    }
});

// Update media
router.put('/:id', protect, async (req, res) => {
    try {
        const { description, tags } = req.body;
        
        // Validation
        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }
        
        // Parse tags
        let parsedTags = [];
        if (tags) {
            parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        
        // Find and update media
        const media = await Media.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId
            },
            {
                description: description.trim(),
                tags: parsedTags.slice(0, 10), // Limit to 10 tags
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Media updated successfully',
            media
        });
        
    } catch (error) {
        console.error('Update media error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating media'
        });
    }
});

// Delete media
router.delete('/:id', protect, async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Delete file from filesystem
        try {
            await fs.unlink(media.path);
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue with database deletion even if file deletion fails
        }
        
        // Delete from database
        await Media.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting media'
        });
    }
});

// Serve media file
router.get('/:id/file', protect, async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Check if file exists
        try {
            await fs.access(media.path);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }
        
        // Set appropriate headers
        res.setHeader('Content-Type', media.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
        
        // Stream the file
        res.sendFile(path.resolve(media.path));
        
    } catch (error) {
        console.error('Serve file error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error serving file'
        });
    }
});

// Download media file
router.get('/:id/download', protect, async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Check if file exists
        try {
            await fs.access(media.path);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }
        
        // Set download headers
        res.setHeader('Content-Type', media.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${media.originalName}"`);
        
        // Stream the file
        res.sendFile(path.resolve(media.path));
        
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error downloading file'
        });
    }
});

// Get media statistics
router.get('/stats/overview', protect, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get total count and size
        const totalStats = await Media.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            }
        ]);
        
        // Get counts by type
        const typeStats = await Media.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    size: { $sum: '$fileSize' }
                }
            }
        ]);
        
        // Get recent uploads (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentUploads = await Media.countDocuments({
            userId: userId,
            createdAt: { $gte: weekAgo }
        });
        
        const stats = {
            total: totalStats[0] || { totalFiles: 0, totalSize: 0 },
            byType: typeStats.reduce((acc, stat) => {
                acc[stat._id] = { count: stat.count, size: stat.size };
                return acc;
            }, {}),
            recentUploads
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics'
        });
    }
});

module.exports = router;