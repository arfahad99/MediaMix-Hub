const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            console.log('Missing required fields:', { username: !!username, email: !!email, password: !!password });
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (password.length < 6) {
            console.log('Password too short:', password.length);
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            console.log('Invalid username format:', username);
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
            });
        }

        // Check if user exists with email
        console.log('Checking for existing email:', email.toLowerCase());
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            console.log('Email already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Check if user exists with username
        console.log('Checking for existing username:', username.toLowerCase());
        const existingUserByUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUserByUsername) {
            console.log('Username already exists:', username);
            return res.status(400).json({
                success: false,
                message: 'Username is already taken'
            });
        }

        // Create user (password will be hashed by pre-save middleware)
        console.log('Creating new user...');
        const user = new User({
            username: username.toLowerCase().trim(),
            name: username.trim(), // Use username as display name initially
            email: email.toLowerCase().trim(),
            password: password // Let the pre-save middleware handle hashing
        });

        console.log('Saving user to database...');
        await user.save();
        console.log('User saved successfully:', user._id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Registration successful for user:', user.username);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = field === 'email' ? 'Email is already registered' : 'Username is already taken';
            console.log('Duplicate key error:', message);
            return res.status(400).json({
                success: false,
                message
            });
        }
        
        console.log('Server error during registration:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { identifier: req.body.identifier, passwordLength: req.body.password?.length });
        const { identifier, password } = req.body;

        // Validation
        if (!identifier || !password) {
            console.log('Missing credentials');
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }

        // Find user by email or username
        console.log('Looking for user with identifier:', identifier);
        const user = await User.findByIdentifier(identifier).select('+password');
        console.log('User found:', user ? { id: user._id, username: user.username, email: user.email, hasPassword: !!user.password } : 'No user found');
        
        if (!user) {
            console.log('User not found for identifier:', identifier);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', user.username);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful for user:', user.username);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email: email.toLowerCase(),
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already taken by another user'
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing password'
        });
    }
});

// Logout (optional - mainly for client-side token removal)
router.post('/logout', protect, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;