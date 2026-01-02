# Auth0 Setup Guide for MediaMix Hub

This guide will help you set up Auth0 for social media authentication in your MediaMix Hub application.

## Prerequisites

- Auth0 account (free tier available)
- MediaMix Hub application running locally
- Basic understanding of OAuth 2.0 flow

## Step 1: Create Auth0 Account and Application

1. **Sign up for Auth0**
   - Go to [auth0.com](https://auth0.com)
   - Click "Sign Up" and create a free account
   - Choose "Personal" for the account type

2. **Create a New Application**
   - In the Auth0 Dashboard, go to "Applications"
   - Click "Create Application"
   - Name: "MediaMix Hub"
   - Type: "Single Page Web Applications"
   - Click "Create"

## Step 2: Configure Application Settings

1. **Basic Settings**
   - Go to your application's "Settings" tab
   - Note down your:
     - Domain (e.g., `your-domain.auth0.com`)
     - Client ID
     - Client Secret

2. **Application URIs**
   - **Allowed Callback URLs**: 
     ```
     http://localhost:3000/auth/success,
     http://localhost:5000/api/auth0/callback
     ```
   - **Allowed Logout URLs**: 
     ```
     http://localhost:3000/login-backend.html
     ```
   - **Allowed Web Origins**: 
     ```
     http://localhost:3000
     ```
   - **Allowed Origins (CORS)**: 
     ```
     http://localhost:3000
     ```

3. **Advanced Settings**
   - Go to "Advanced Settings" → "Grant Types"
   - Ensure these are enabled:
     - Authorization Code
     - Refresh Token
     - Client Credentials

## Step 3: Set Up Social Connections

1. **Google OAuth**
   - Go to "Authentication" → "Social"
   - Click on "Google"
   - Toggle "Enable" to ON
   - You'll need to create a Google OAuth app:
     - Go to [Google Cloud Console](https://console.cloud.google.com)
     - Create a new project or select existing
     - Enable Google+ API
     - Create OAuth 2.0 credentials
     - Add authorized redirect URI: `https://your-domain.auth0.com/login/callback`
   - Enter your Google Client ID and Client Secret in Auth0

2. **GitHub OAuth**
   - In Auth0, go to "Authentication" → "Social"
   - Click on "GitHub"
   - Toggle "Enable" to ON
   - Create a GitHub OAuth app:
     - Go to GitHub Settings → Developer settings → OAuth Apps
     - Click "New OAuth App"
     - Authorization callback URL: `https://your-domain.auth0.com/login/callback`
   - Enter your GitHub Client ID and Client Secret in Auth0

3. **Facebook OAuth** (Optional)
   - Similar process in Auth0 Social connections
   - Create Facebook app at [developers.facebook.com](https://developers.facebook.com)
   - Add Facebook Login product
   - Set redirect URI: `https://your-domain.auth0.com/login/callback`

## Step 4: Configure Environment Variables

Update your `backend/.env` file with your Auth0 credentials:

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
AUTH0_CALLBACK_URL=http://localhost:5000/api/auth0/callback
AUTH0_LOGOUT_URL=http://localhost:3000/login-backend.html
```

## Step 5: Update Frontend Configuration

Update `Front-End/auth0-config.js` with your Auth0 domain and client ID:

```javascript
const AUTH0_CONFIG = {
    domain: 'your-domain.auth0.com',
    clientId: 'your-client-id',
    audience: 'https://your-domain.auth0.com/api/v2/',
    redirectUri: window.location.origin + '/auth/success',
    logoutUri: window.location.origin + '/login-backend.html',
    scope: 'openid profile email'
};
```

## Step 6: Test the Integration

1. **Start your servers**:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (in another terminal)
   cd Front-End
   python -m http.server 3000
   ```

2. **Test Social Login**:
   - Go to `http://localhost:3000/login-backend.html`
   - Click on "Continue with Google" or "Continue with GitHub"
   - Complete the OAuth flow
   - You should be redirected back to your app with authentication

## Step 7: Production Configuration

For production deployment:

1. **Update Callback URLs** in Auth0 to include your production domain
2. **Update Environment Variables** with production values
3. **Enable HTTPS** (required for production Auth0 apps)
4. **Configure Custom Domain** (optional but recommended)

## Troubleshooting

### Common Issues

1. **"Callback URL mismatch"**
   - Ensure callback URLs in Auth0 match exactly with your application URLs
   - Check for trailing slashes and protocol (http vs https)

2. **"Access denied"**
   - Verify your Client ID and Client Secret are correct
   - Check that the application type is set to "Single Page Web Applications"

3. **Social login not working**
   - Ensure social connections are enabled in Auth0
   - Verify social provider credentials are correct
   - Check that redirect URIs are properly configured in social provider settings

4. **CORS errors**
   - Add your domain to "Allowed Origins (CORS)" in Auth0 application settings
   - Ensure your frontend domain is whitelisted

### Debug Mode

Enable debug mode by adding to your frontend:

```javascript
// In auth0-config.js
const AUTH0_CONFIG = {
    // ... other config
    debug: true // Add this for debugging
};
```

## Security Best Practices

1. **Never expose Client Secret** in frontend code
2. **Use HTTPS** in production
3. **Implement proper token validation** on the backend
4. **Set appropriate token expiration times**
5. **Use secure session storage** for tokens
6. **Implement proper logout** to clear all tokens

## Support

- Auth0 Documentation: [auth0.com/docs](https://auth0.com/docs)
- Auth0 Community: [community.auth0.com](https://community.auth0.com)
- GitHub Issues: Create an issue in your repository

## Next Steps

After successful setup:

1. **Customize login page** with your branding
2. **Add user profile management** features
3. **Implement role-based access control**
4. **Set up user metadata** for additional user information
5. **Configure email templates** for Auth0 emails
6. **Set up monitoring and analytics** in Auth0 dashboard