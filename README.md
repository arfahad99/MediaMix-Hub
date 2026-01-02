# MediaMix Hub 🎬

A modern, full-stack media management application with a beautiful, creative frontend and robust Node.js backend. Upload, organize, and manage your images, videos, and audio files with style.

## ✨ Features

### 🎨 Modern Frontend
- **Creative Design**: Beautiful gradient backgrounds, smooth animations, and modern UI components
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Drag & Drop Upload**: Intuitive file upload with drag and drop support
- **Real-time Preview**: Instant preview of images, videos, and audio files
- **Advanced Search**: Search by filename, description, or tags
- **Multiple View Modes**: Grid and list view options
- **Smart Filtering**: Filter by file type (images, videos, audio)
- **Tag Management**: Add and manage tags for better organization

### 🔐 Authentication System
- **Secure Login/Register**: JWT-based authentication
- **User Profiles**: Manage user information and preferences
- **Session Management**: Automatic token refresh and secure logout

### 🚀 Backend Features
- **RESTful API**: Clean, well-documented API endpoints
- **File Upload**: Secure file upload with validation
- **Database Integration**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Comprehensive error handling and logging
- **File Management**: Automatic file cleanup and storage management

### 📊 Dashboard & Analytics
- **Usage Statistics**: Track file counts, storage usage, and recent uploads
- **File Type Breakdown**: Visual breakdown of media types
- **Recent Activity**: View recent uploads and activities
- **Storage Management**: Monitor storage usage and limits

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup with modern features
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript**: Modern ES6+ features, async/await
- **Font Awesome**: Beautiful icons
- **Google Fonts**: Inter and Poppins fonts

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Azure Cosmos DB**: Database (MongoDB API)
- **Mongoose**: ODM for MongoDB/Cosmos DB
- **JWT**: Authentication
- **Multer**: File upload handling
- **Bcrypt**: Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Azure account with Cosmos DB (MongoDB API) or local MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mediamix-hub
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the `backend` directory:
   
   **For Azure Cosmos DB (Recommended):**
   ```env
   # Azure Cosmos DB Configuration
   AZURE_COSMOS_CONNECTION_STRING=mongodb://your-cosmos-account:your-primary-key@your-cosmos-account.mongo.cosmos.azure.com:10255/mediamix-hub?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@your-cosmos-account@
   
   # Azure Cosmos DB Details
   AZURE_COSMOS_ACCOUNT_NAME=your-cosmos-account
   AZURE_COSMOS_DATABASE_NAME=mediamix-hub
   AZURE_COSMOS_PRIMARY_KEY=your-primary-key
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   
   # File Upload Configuration
   MAX_FILE_SIZE=52428800
   UPLOAD_PATH=./uploads
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # User Storage Limit (in bytes)
   USER_STORAGE_LIMIT=1073741824
   ```
   
   **For Local MongoDB (Development):**
   ```env
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/mediamix-hub
   
   # Other settings same as above...
   ```

4. **Set up Azure Cosmos DB** (if using Azure)
   
   See [AZURE_SETUP.md](AZURE_SETUP.md) for detailed Azure Cosmos DB setup instructions.

5. **Set up the frontend**
   ```bash
   cd ../Front-End
   npm install
   ```

### Running the Application

#### Option 1: Using the startup scripts (Windows)
1. **Start the backend**: Double-click `start-backend.bat`
2. **Start the frontend**: Double-click `start-frontend.bat`

#### Option 2: Manual startup
1. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   cd Front-End
   npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 📁 Project Structure

```
mediamix-hub/
├── Front-End/                 # Frontend application
│   ├── index.html            # Main application page
│   ├── login.html            # Login page
│   ├── styles.css            # Main styles
│   ├── auth-styles.css       # Authentication styles
│   ├── app.js                # Main application logic
│   ├── auth.js               # Authentication logic
│   └── package.json          # Frontend dependencies
├── backend/                   # Backend API
│   ├── config/               # Configuration files
│   │   └── database.js       # Database connection
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── upload.js        # File upload middleware
│   │   └── errorHandler.js  # Error handling middleware
│   ├── models/              # Database models
│   │   ├── User.js          # User model
│   │   └── Media.js         # Media model
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── media.js         # Media management routes
│   │   └── user.js          # User management routes
│   ├── uploads/             # File storage directory
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables
├── .kiro/                    # Kiro specifications
│   └── specs/
│       └── media-mix-hub/
├── start-backend.bat         # Windows backend startup script
├── start-frontend.bat        # Windows frontend startup script
└── README.md                # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Media Management
- `GET /api/media` - Get all user media (with pagination, search, filter)
- `GET /api/media/:id` - Get single media item
- `POST /api/media/upload` - Upload new media
- `PUT /api/media/:id` - Update media (description, tags)
- `DELETE /api/media/:id` - Delete media
- `GET /api/media/:id/file` - Serve media file
- `GET /api/media/:id/download` - Download media file
- `GET /api/media/stats/overview` - Get media statistics

### User Management
- `GET /api/user/dashboard` - Get dashboard data
- `GET /api/user/activity` - Get user activity log
- `GET /api/user/storage` - Get storage usage statistics
- `DELETE /api/user/account` - Delete user account

## 🎨 Design Features

### Color Scheme
- **Primary**: Indigo (#6366f1) to Purple (#8b5cf6) gradient
- **Secondary**: Amber (#f59e0b) to Pink (#ec4899) gradient
- **Success**: Emerald (#10b981) to Cyan (#06b6d4) gradient
- **Neutral**: Comprehensive gray scale from 50 to 900

### Typography
- **Headings**: Poppins (Google Fonts)
- **Body**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Animations
- **Fade In Up**: Smooth entry animations for cards
- **Hover Effects**: Subtle transform and shadow changes
- **Loading States**: Smooth spinner animations
- **Modal Transitions**: Scale and fade transitions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers
- **Input Validation**: Comprehensive input sanitization
- **File Type Validation**: Restrict allowed file types
- **File Size Limits**: Prevent oversized uploads

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Large touch targets and gestures
- **Adaptive Layout**: Grid and flexbox for flexible layouts

## 🚀 Performance Features

- **Lazy Loading**: Images and content loaded on demand
- **Compression**: Gzip compression for API responses
- **Caching**: Appropriate cache headers
- **Optimized Images**: Responsive image handling
- **Minimal Dependencies**: Lightweight vanilla JS frontend

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
- Manual testing through the UI
- Browser developer tools for debugging
- Network tab for API monitoring

## 🔧 Configuration

### Environment Variables
All configuration is handled through environment variables in the `.env` file:

- **Database**: Azure Cosmos DB connection string or MongoDB URI
- **Security**: JWT secret, rate limiting
- **File Upload**: Size limits, storage path
- **CORS**: Allowed origins
- **Storage**: User storage limits

### Azure Cosmos DB Configuration
MediaMix Hub is optimized for Azure Cosmos DB with:
- **Partitioning**: Optimized partition keys for better performance
- **Indexing**: Custom indexes for efficient queries
- **Connection Pooling**: Optimized connection settings
- **Retry Logic**: Built-in retry mechanisms for reliability
- **Monitoring**: Connection status and health checks

See [AZURE_SETUP.md](AZURE_SETUP.md) for complete setup instructions.

### File Upload Configuration
- **Max File Size**: 50MB (configurable)
- **Allowed Types**: Images, videos, audio
- **Storage**: Local filesystem (can be extended to cloud storage)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** for beautiful icons
- **Google Fonts** for typography
- **MongoDB** for the database
- **Express.js** for the web framework
- **The open source community** for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

**Built with ❤️ for modern media management**