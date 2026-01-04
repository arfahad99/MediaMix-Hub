const express = require('express');
const SharedLink = require('../models/SharedLink');
const Media = require('../models/Media');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create a shared link
router.post('/', protect, async (req, res) => {
    try {
        const { mediaId, permission = 'view', expiryDays = 30, password, maxAccessCount, customMessage } = req.body;
        
        // Validation
        if (!mediaId) {
            return res.status(400).json({
                success: false,
                message: 'Media ID is required'
            });
        }
        
        // Check if media exists and belongs to user
        const media = await Media.findOne({
            _id: mediaId,
            userId: req.user.userId
        });
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found or access denied'
            });
        }
        
        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
        
        // Create shared link
        const sharedLink = new SharedLink({
            mediaId: media._id,
            userId: req.user.userId,
            permission,
            expiryDate,
            maxAccessCount: maxAccessCount ? parseInt(maxAccessCount) : null,
            requiresPassword: !!password,
            password: password || null,
            metadata: {
                createdIP: req.ip,
                userAgent: req.get('User-Agent'),
                customMessage: customMessage || null
            }
        });
        
        await sharedLink.save();
        
        res.status(201).json({
            success: true,
            message: 'Shared link created successfully',
            sharedLink: {
                linkId: sharedLink.linkId,
                shareToken: sharedLink.shareToken,
                shareUrl: sharedLink.fullShareUrl,
                permission: sharedLink.permission,
                expiryDate: sharedLink.expiryDate,
                requiresPassword: sharedLink.requiresPassword,
                maxAccessCount: sharedLink.maxAccessCount
            }
        });
        
    } catch (error) {
        console.error('Create shared link error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating shared link'
        });
    }
});

// Get user's shared links
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, mediaId, isActive } = req.query;
        
        const query = { userId: req.user.userId };
        if (mediaId) query.mediaId = mediaId;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        const sharedLinks = await SharedLink.find(query)
            .populate('mediaId', 'fileName fileType fileSize')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit);
            
        const total = await SharedLink.countDocuments(query);
        
        res.json({
            success: true,
            sharedLinks,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Get shared links error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching shared links'
        });
    }
});

// Get shared link details
router.get('/:linkId', protect, async (req, res) => {
    try {
        const sharedLink = await SharedLink.findOne({
            linkId: req.params.linkId,
            userId: req.user.userId
        }).populate('mediaId', 'fileName fileType fileSize description');
        
        if (!sharedLink) {
            return res.status(404).json({
                success: false,
                message: 'Shared link not found'
            });
        }
        
        res.json({
            success: true,
            sharedLink
        });
        
    } catch (error) {
        console.error('Get shared link error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching shared link'
        });
    }
});

// Access shared content (public endpoint)
router.get('/public/:shareToken', async (req, res) => {
    try {
        const { shareToken } = req.params;
        const { password } = req.query;
        
        const sharedLink = await SharedLink.findByToken(shareToken)
            .populate('mediaId', 'fileName fileType fileSize description filePath azureInfo')
            .populate('userId', 'username displayName');
        
        if (!sharedLink) {
            return res.status(404).json({
                success: false,
                message: 'Shared link not found or expired'
            });
        }
        
        // Check access permissions
        const accessCheck = sharedLink.checkAccess(password);
        if (!accessCheck.allowed) {
            return res.status(403).json({
                success: false,
                message: accessCheck.reason
            });
        }
        
        // Validate password if required
        if (sharedLink.requiresPassword && password) {
            const isValidPassword = await sharedLink.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
        }
        
        // Record access
        await sharedLink.recordAccess('view', req.ip, req.get('User-Agent'));
        
        res.json({
            success: true,
            media: {
                fileName: sharedLink.mediaId.fileName,
                fileType: sharedLink.mediaId.fileType,
                fileSize: sharedLink.mediaId.fileSize,
                description: sharedLink.mediaId.description,
                fileUrl: sharedLink.mediaId.fileUrl
            },
            sharedBy: sharedLink.userId.displayName,
            permission: sharedLink.permission,
            customMessage: sharedLink.metadata?.customMessage
        });
        
    } catch (error) {
        console.error('Access shared link error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error accessing shared content'
        });
    }
});

// Update shared link
router.put('/:linkId', protect, async (req, res) => {
    try {
        const { permission, expiryDays, password, maxAccessCount, customMessage, isActive } = req.body;
        
        const sharedLink = await SharedLink.findOne({
            linkId: req.params.linkId,
            userId: req.user.userId
        });
        
        if (!sharedLink) {
            return res.status(404).json({
                success: false,
                message: 'Shared link not found'
            });
        }
        
        // Update fields
        if (permission) sharedLink.permission = permission;
        if (expiryDays) {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + parseInt(expiryDays));
            sharedLink.expiryDate = newExpiry;
        }
        if (password !== undefined) {
            sharedLink.password = password || null;
            sharedLink.requiresPassword = !!password;
        }
        if (maxAccessCount !== undefined) {
            sharedLink.maxAccessCount = maxAccessCount ? parseInt(maxAccessCount) : null;
        }
        if (customMessage !== undefined) {
            if (!sharedLink.metadata) sharedLink.metadata = {};
            sharedLink.metadata.customMessage = customMessage || null;
        }
        if (isActive !== undefined) {
            sharedLink.isActive = isActive;
        }
        
        await sharedLink.save();
        
        res.json({
            success: true,
            message: 'Shared link updated successfully',
            sharedLink
        });
        
    } catch (error) {
        console.error('Update shared link error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating shared link'
        });
    }
});

// Delete shared link
router.delete('/:linkId', protect, async (req, res) => {
    try {
        const sharedLink = await SharedLink.findOneAndDelete({
            linkId: req.params.linkId,
            userId: req.user.userId
        });
        
        if (!sharedLink) {
            return res.status(404).json({
                success: false,
                message: 'Shared link not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Shared link deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete shared link error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting shared link'
        });
    }
});

// Get sharing analytics
router.get('/analytics/overview', protect, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        // Basic analytics without complex aggregation for now
        const totalLinks = await SharedLink.countDocuments({ userId: req.user.userId });
        const activeLinks = await SharedLink.countDocuments({ userId: req.user.userId, isActive: true });
        
        res.json({
            success: true,
            analytics: {
                userStats: {
                    totalLinks,
                    activeLinks,
                    expiredLinks: totalLinks - activeLinks
                }
            }
        });
        
    } catch (error) {
        console.error('Get sharing analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching analytics'
        });
    }
});

module.exports = router;