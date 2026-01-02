const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticationClient, auth0Config } = require('../config/auth0');

const router = express.Router();

// Auth0 login initiation
router.get('/login', (req, res) => {
    const authURL = `https://${auth0Config.domain}/authorize?` +
        `response_type=code&` +
        `client_id=${auth0Config.clientId}&` +
        `redirect_uri=${encodeURIComponent(auth0Config.callbackURL)}&` +
        `scope=${encodeURIComponent(auth0Config.scope)}&` +
        `state=${req.query.state || 'default'}`;
    
    res.redirect(authURL);
});

// Auth0 callback handler
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.redirect(`${auth0Config.logoutURL}?error=authorization_failed`);
        }

        // Exchange authorization code for tokens
        const tokenResponse = await authenticationClient.oauth.authorizationCodeGrant({
            code,
            redirect_uri: auth0Config.callbackURL
        });

        const { access_token, id_token } = tokenResponse.data;

        // Get user info from Auth0
        const userInfo = await authenticationClient.users.getInfo(access_token);

        // Find or create user in our database
        let user = await User.findOne({ 
            $or: [
                { email: userInfo.email },
                { auth0Id: userInfo.sub }
            ]
        });

        if (!user) {
            // Create new user
            user = new User({
                name: userInfo.name || userInfo.nickname || 'Auth0 User',
                email: userInfo.email,
                auth0Id: userInfo.sub,
                profilePicture: userInfo.picture,
                isEmailVerified: userInfo.email_verified || false,
                authProvider: 'auth0',
                lastLogin: new Date()
            });
        } else {
            // Update existing user
            user.auth0Id = userInfo.sub;
            user.profilePicture = userInfo.picture;
            user.isEmailVerified = userInfo.email_verified || user.isEmailVerified;
            user.lastLogin = new Date();
        }

        await user.save();

        // Generate our own JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Redirect to frontend with token
        const redirectURL = `${auth0Config.logoutURL.replace('/login-backend.html', '/auth/success')}?token=${token}&state=${state}`;
        res.redirect(redirectURL);

    } catch (error) {
        console.error('Auth0 callback error:', error);
        res.redirect(`${auth0Config.logoutURL}?error=callback_failed`);
    }
});

// Auth0 logout
router.get('/logout', (req, res) => {
    const logoutURL = `https://${auth0Config.domain}/v2/logout?` +
        `client_id=${auth0Config.clientId}&` +
        `returnTo=${encodeURIComponent(auth0Config.logoutURL)}`;
    
    res.redirect(logoutURL);
});

// Get Auth0 user profile
router.get('/profile/:auth0Id', async (req, res) => {
    try {
        const { auth0Id } = req.params;
        
        // Get user from Auth0
        const auth0User = await managementClient.users.get({ id: auth0Id });
        
        res.json({
            success: true,
            profile: auth0User.data
        });
    } catch (error) {
        console.error('Auth0 profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Auth0 profile'
        });
    }
});

module.exports = router;