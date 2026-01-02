/**
 * Auth0 Configuration for MediaMix Hub Frontend
 */

// Auth0 Configuration
const AUTH0_CONFIG = {
    domain: 'your-auth0-domain.auth0.com',
    clientId: 'your-auth0-client-id',
    audience: 'https://your-auth0-domain.auth0.com/api/v2/',
    redirectUri: window.location.origin + '/auth/success',
    logoutUri: window.location.origin + '/login-backend.html',
    scope: 'openid profile email'
};

// Auth0 Client Class
class Auth0Client {
    constructor() {
        this.auth0 = null;
        this.isAuthenticated = false;
        this.user = null;
        this.init();
    }

    async init() {
        try {
            // Import Auth0 SPA SDK dynamically
            const { createAuth0Client } = await import('https://cdn.skypack.dev/@auth0/auth0-spa-js');
            
            this.auth0 = await createAuth0Client({
                domain: AUTH0_CONFIG.domain,
                clientId: AUTH0_CONFIG.clientId,
                authorizationParams: {
                    redirect_uri: AUTH0_CONFIG.redirectUri,
                    audience: AUTH0_CONFIG.audience,
                    scope: AUTH0_CONFIG.scope
                }
            });

            // Check if user is authenticated
            this.isAuthenticated = await this.auth0.isAuthenticated();
            
            if (this.isAuthenticated) {
                this.user = await this.auth0.getUser();
            }

            console.log('Auth0 client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Auth0 client:', error);
        }
    }

    // Login with redirect
    async loginWithRedirect(options = {}) {
        try {
            await this.auth0.loginWithRedirect({
                authorizationParams: {
                    redirect_uri: AUTH0_CONFIG.redirectUri,
                    ...options
                }
            });
        } catch (error) {
            console.error('Auth0 login failed:', error);
            throw error;
        }
    }

    // Login with popup
    async loginWithPopup(options = {}) {
        try {
            await this.auth0.loginWithPopup({
                authorizationParams: {
                    audience: AUTH0_CONFIG.audience,
                    scope: AUTH0_CONFIG.scope,
                    ...options
                }
            });

            this.isAuthenticated = await this.auth0.isAuthenticated();
            this.user = await this.auth0.getUser();
            
            return this.user;
        } catch (error) {
            console.error('Auth0 popup login failed:', error);
            throw error;
        }
    }

    // Handle redirect callback
    async handleRedirectCallback() {
        try {
            const result = await this.auth0.handleRedirectCallback();
            this.isAuthenticated = await this.auth0.isAuthenticated();
            
            if (this.isAuthenticated) {
                this.user = await this.auth0.getUser();
            }
            
            return result;
        } catch (error) {
            console.error('Auth0 callback handling failed:', error);
            throw error;
        }
    }

    // Get access token
    async getAccessToken() {
        try {
            return await this.auth0.getTokenSilently({
                authorizationParams: {
                    audience: AUTH0_CONFIG.audience,
                    scope: AUTH0_CONFIG.scope
                }
            });
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth0.logout({
                logoutParams: {
                    returnTo: AUTH0_CONFIG.logoutUri
                }
            });
        } catch (error) {
            console.error('Auth0 logout failed:', error);
            throw error;
        }
    }

    // Get user info
    getUser() {
        return this.user;
    }

    // Check authentication status
    async checkAuth() {
        if (!this.auth0) {
            await this.init();
        }
        
        this.isAuthenticated = await this.auth0.isAuthenticated();
        
        if (this.isAuthenticated && !this.user) {
            this.user = await this.auth0.getUser();
        }
        
        return this.isAuthenticated;
    }
}

// Global Auth0 client instance
const auth0Client = new Auth0Client();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.auth0Client = auth0Client;
    window.AUTH0_CONFIG = AUTH0_CONFIG;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth0Client, AUTH0_CONFIG };
}