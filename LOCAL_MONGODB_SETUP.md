# MediaMix Hub - Local MongoDB Setup Guide

This guide will help you set up and test MediaMix Hub locally with MongoDB before deploying to Azure.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Git** (for version control)

## Step 1: Install MongoDB Locally

### Option A: MongoDB Community Server (Recommended for local testing)

1. **Download MongoDB Community Server**:
   - Visit: https://www.mongodb.com/try/download/community
   - Select your operating system
   - Download and install

2. **Start MongoDB Service**:
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux (systemd)
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running**:
   ```bash
   # Connect to MongoDB shell
   mongosh
   # or older versions
   mongo
   ```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` file with Atlas connection string

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   - The `.env` file is already created with local MongoDB settings
   - For local MongoDB: `MONGODB_URI=mongodb://localhost:27017/mediamix-hub`
   - For MongoDB Atlas: Replace with your Atlas connection string

4. **Create uploads directory**:
   ```bash
   mkdir uploads
   mkdir uploads/thumbnails
   ```

5. **Start the backend server**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Verify backend is running**:
   - Open browser to: http://localhost:5000/api/health
   - Should see: `{"success": true, "message": "MediaMix Hub API is running"}`

## Step 3: Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd Front-End
   ```

2. **Install dependencies** (if any):
   ```bash
   npm install
   ```

3. **Serve frontend files**:
   
   ### Option A: Using Live Server (VS Code Extension)
   - Install "Live Server" extension in VS Code
   - Right-click on `login-backend.html`
   - Select "Open with Live Server"

   ### Option B: Using Python HTTP Server
   ```bash
   # Python 3
   python -m http.server 3000
   
   # Python 2
   python -m SimpleHTTPServer 3000
   ```

   ### Option C: Using Node.js http-server
   ```bash
   # Install globally
   npm install -g http-server
   
   # Serve files
   http-server -p 3000
   ```

4. **Access the application**:
   - Open browser to: http://localhost:3000/login-backend.html

## Step 4: Testing the Application

### 1. Test Authentication

1. **Register a new account**:
   - Click "Register" tab
   - Fill in: Name, Email, Password
   - Click "Create Account"

2. **Login with existing account**:
   - Use the credentials you just created
   - Or use demo credentials (if you add them to the database)

### 2. Test File Upload

1. **Upload a file**:
   - Drag and drop a file or click to browse
   - Add description and tags
   - Click "Upload Files"

2. **Verify in database**:
   ```bash
   mongosh
   use mediamix-hub
   db.media.find().pretty()
   db.users.find().pretty()
   ```

### 3. Test File Management

1. **View files** in the gallery
2. **Edit** file descriptions and tags
3. **Delete** files
4. **Search and filter** files

## Step 5: Database Verification

### Connect to MongoDB and verify data:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use mediamix-hub

# View collections
show collections

# View users
db.users.find().pretty()

# View media files
db.media.find().pretty()

# View indexes
db.users.getIndexes()
db.media.getIndexes()
```

## File Structure for Backend Testing

```
MediaMix Hub/
├── backend/
│   ├── .env                 # Environment variables
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   ├── config/
│   │   └── database.js     # Database configuration
│   ├── models/
│   │   ├── User.js         # User model
│   │   └── Media.js        # Media model
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── media.js        # Media routes
│   │   └── user.js         # User routes
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   ├── upload.js       # File upload handling
│   │   └── errorHandler.js # Error handling
│   └── uploads/            # File storage directory
├── Front-End/
│   ├── login-backend.html  # Login page for backend
│   ├── index-backend.html  # Main app for backend
│   ├── auth-backend.js     # Backend authentication
│   ├── app-backend.js      # Main app with backend API
│   ├── data-models.js      # Data validation utilities
│   ├── styles.css          # Styling
│   └── auth-styles.css     # Authentication styling
```

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Failed**:
   ```bash
   # Check if MongoDB is running
   mongosh
   
   # Check MongoDB logs
   tail -f /var/log/mongodb/mongod.log  # Linux
   # or check Windows Event Viewer
   ```

2. **Port Already in Use**:
   ```bash
   # Find process using port 5000
   lsof -i :5000  # macOS/Linux
   netstat -ano | findstr :5000  # Windows
   
   # Kill the process or change PORT in .env
   ```

3. **File Upload Issues**:
   - Check `uploads/` directory exists and is writable
   - Verify `MAX_FILE_SIZE` in `.env`
   - Check browser console for errors

### Frontend Issues

1. **CORS Errors**:
   - Ensure backend CORS is configured for `http://localhost:3000`
   - Check `FRONTEND_URL` in backend `.env`

2. **API Connection Failed**:
   - Verify backend is running on port 5000
   - Check `API_BASE_URL` in frontend JavaScript files

3. **Authentication Issues**:
   - Clear browser localStorage
   - Check JWT_SECRET in backend `.env`
   - Verify token expiration settings

## Next Steps

Once local testing is complete:

1. **Prepare for Azure Deployment**:
   - Update connection strings for Azure Cosmos DB
   - Configure Azure Blob Storage for file uploads
   - Set up Azure App Service for backend
   - Deploy frontend to Azure Static Web Apps

2. **Environment Variables for Production**:
   - Use Azure Key Vault for secrets
   - Configure production database connections
   - Set up monitoring and logging

## Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm test            # Run tests (if configured)
npm run lint        # Check code quality

# Database
mongosh                              # Connect to MongoDB
use mediamix-hub                    # Switch database
db.dropDatabase()                   # Reset database (careful!)
db.users.createIndex({email: 1})   # Create indexes

# Frontend
cd Front-End
python -m http.server 3000         # Serve files
# or
npx http-server -p 3000            # Alternative server
```

## Security Notes for Local Testing

- The `.env` file contains development secrets
- JWT_SECRET should be changed for production
- File uploads are stored locally in `uploads/` directory
- CORS is configured for localhost only
- Rate limiting is enabled but with generous limits for testing

This setup provides a complete local testing environment that mirrors the production architecture while using local MongoDB instead of Azure Cosmos DB.