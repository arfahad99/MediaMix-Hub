# Auth0 Integration Checklist for MediaMix Hub

## ✅ Phase 1: Auth0 Account Setup

### 1.1 Create Auth0 Account
- [ ] Go to https://auth0.com/signup
- [ ] Sign up with your email
- [ ] Choose "Personal" account type
- [ ] Verify your email address

### 1.2 Create Application
- [ ] In Auth0 Dashboard, go to "Applications"
- [ ] Click "Create Application"
- [ ] Name: "MediaMix Hub"
- [ ] Type: "Single Page Web Applications"
- [ ] Click "Create"

### 1.3 Configure Application Settings
- [ ] Go to application "Settings" tab
- [ ] Copy your Domain (e.g., `dev-xyz.us.auth0.com`)
- [ ] Copy your Client ID
- [ ] Copy your Client Secret

### 1.4 Set Application URIs
Add these URLs in your Auth0 application settings:

**Allowed Callback URLs:**
```
http://localhost:3000/auth/success,
http://localhost:5000/api/auth0/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000/login-backend.html
```

**Allowed Web Origins:**
```
http://localhost:3000
```

**Allowed Origins (CORS):**
```
http://localhost:3000
```

## ✅ Phase 2: Social Connections Setup

### 2.1 Google OAuth Setup
- [ ] In Auth0, go to "Authentication" → "Social"
- [ ] Click "Google" and toggle "Enable"
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project or select existing
- [ ] Enable "Google+ API"
- [ ] Create OAuth 2.0 credentials
- [ ] Set authorized redirect URI: `https://YOUR-AUTH0-DOMAIN/login/callback`
- [ ] Copy Client ID and Secret to Auth0

### 2.2 GitHub OAuth Setup
- [ ] In Auth0, click "GitHub" and toggle "Enable"
- [ ] Go to GitHub Settings → Developer settings → OAuth Apps
- [ ] Click "New OAuth App"
- [ ] Set Authorization callback URL: `https://YOUR-AUTH0-DOMAIN/login/callback`
- [ ] Copy Client ID and Secret to Auth0

## ✅ Phase 3: Configuration Files

### 3.1 Update Backend Environment Variables
Edit `backend/.env`:
```env
# Replace with your actual Auth0 values
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
AUTH0_CALLBACK_URL=http://localhost:5000/api/auth0/callback
AUTH0_LOGOUT_URL=http://localhost:3000/login-backend.html
```

### 3.2 Update Frontend Configuration
Edit `Front-End/auth0-config.js`:
```javascript
const AUTH0_CONFIG = {
    domain: 'your-domain.auth0.com',  // Replace with your domain
    clientId: 'your-client-id',       // Replace with your client ID
    audience: 'https://your-domain.auth0.com/api/v2/',
    redirectUri: window.location.origin + '/auth/success',
    logoutUri: window.location.origin + '/login-backend.html',
    scope: 'openid profile email'
};
```

## ✅ Phase 4: Testing

### 4.1 Test Configuration
- [ ] Open http://localhost:3000/test-auth0.html
- [ ] Click "Check Auth0 Configuration"
- [ ] Verify all items show ✅

### 4.2 Test Backend Routes
- [ ] Click "Test Auth0 Login Redirect"
- [ ] Should redirect to Auth0 login page
- [ ] Test with social providers

### 4.3 Test Frontend Integration
- [ ] Go to http://localhost:3000/login-backend.html
- [ ] Click "Continue with Google" or "Continue with GitHub"
- [ ] Complete OAuth flow
- [ ] Should redirect to main app

## ✅ Phase 5: Troubleshooting

### Common Issues:
- **"Callback URL mismatch"**: Check URLs in Auth0 settings match exactly
- **"Access denied"**: Verify Client ID/Secret are correct
- **CORS errors**: Add domain to Auth0 CORS settings
- **Social login fails**: Check social provider credentials

### Debug Steps:
- [ ] Check browser console for errors
- [ ] Check backend logs for Auth0 errors
- [ ] Verify environment variables are loaded
- [ ] Test with Auth0 debug mode enabled

## 🎯 Success Criteria

When everything is working:
- [ ] Users can click social login buttons
- [ ] Auth0 login popup/redirect appears
- [ ] Users can authenticate with Google/GitHub
- [ ] Users are redirected back to MediaMix Hub
- [ ] Users are logged in and can access the app
- [ ] User profile data is synced to local database

## 📞 Support Resources

- Auth0 Documentation: https://auth0.com/docs
- Auth0 Community: https://community.auth0.com
- Google OAuth Setup: https://developers.google.com/identity/protocols/oauth2
- GitHub OAuth Setup: https://docs.github.com/en/developers/apps/building-oauth-apps