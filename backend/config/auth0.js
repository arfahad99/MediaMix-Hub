const { ManagementClient, AuthenticationClient } = require('auth0');

// Auth0 Management Client for user management
const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE
});

// Auth0 Authentication Client for token validation
const authenticationClient = new AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET
});

// Configuration object
const auth0Config = {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    callbackURL: process.env.AUTH0_CALLBACK_URL,
    logoutURL: process.env.AUTH0_LOGOUT_URL,
    scope: 'openid profile email'
};

module.exports = {
    managementClient,
    authenticationClient,
    auth0Config
};