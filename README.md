# MediaMix Hub 🎬

A modern, full-stack media management application with a beautiful Next.js frontend and robust Node.js backend. Upload, organize, and manage your images, videos, and audio files with style.

## ✨ Features

### 🎨 Modern Frontend (Next.js)
- **Next.js 16**: Latest React framework with TypeScript support
- **Responsive Design**: Beautiful, mobile-first design with Tailwind CSS
- **Drag & Drop Upload**: Intuitive file upload with React Dropzone
- **Real-time Preview**: Instant preview of images, videos, and audio files
- **Advanced Search**: Search by filename, description, or tags
- **Multiple View Modes**: Grid and list view options
- **Smart Filtering**: Filter by file type (images, videos, audio)
- **Tag Management**: Add and manage tags for better organization
- **State Management**: Zustand for clean, simple state management

### 🔐 Authentication System
- **Secure Login/Register**: JWT-based authentication with username/email support
- **User Profiles**: Manage user information and preferences
- **Session Management**: Automatic token refresh and secure logout
- **Password Security**: Bcrypt hashing with visibility toggles
- **Flexible Login**: Login with either username or email address

### 🚀 Backend Features
- **RESTful API**: Clean, well-documented API endpoints
- **File Upload**: Secure file upload with validation using Multer
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

### Frontend (Next.js)
- **Next.js 16**: React framework with TypeScript
- **React 18**: Latest React with hooks and concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Hook Form**: Performant forms with easy validation
- **React Dropzone**: Drag and drop file uploads
- **Axios**: HTTP client for API requests
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Beautiful icons

### Backend (Node.js)
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **Bcrypt**: Password hashing
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting
- **Express Validator**: Input validation

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd MediaMix-Hub
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/mediamix-hub
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediamix-hub
   
   # JWT Secret (generate a secure random string)
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
   
   # User Storage Limit (in bytes, 1GB default)
   USER_STORAGE_LIMIT=1073741824
   ```

4. **Set up the frontend**
   ```bash
   cd ../frontend-nextjs
   npm install
   ```

5. **Configure frontend environment variables**
   Create a `.env.local` file in the `frontend-nextjs` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Running the Application

#### Development Mode

1. **Start the backend** (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   cd frontend-nextjs
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

#### Production Mode

1. **Build the frontend**:
   ```bash
   cd frontend-nextjs
   npm run build
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Start the frontend**:
   ```bash
   cd frontend-nextjs
   npm start
   ```

## 📁 Project Structure

```
MediaMix-Hub/
├── docs/                           # 📚 Documentation
│   ├── README.md                  # Detailed documentation
│   ├── AZURE_SETUP.md             # Azure setup guide
│   └── *.md                       # Other documentation files
├── backend/                        # 🚀 Node.js Backend
│   ├── config/                    # Configuration files
│   │   └── database.js            # Database connection
│   ├── middleware/                # Express middleware
│   │   ├── auth.js               # Authentication middleware
│   │   ├── upload.js             # File upload middleware
│   │   └── errorHandler.js       # Error handling
│   ├── models/                   # Database models
│   │   ├── User.js               # User model
│   │   └── Media.js              # Media model
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Authentication routes
│   │   ├── media.js              # Media management routes
│   │   └── user.js               # User management routes
│   ├── uploads/                  # File storage directory
│   ├── server.js                 # Main server file
│   ├── package.json              # Backend dependencies
│   └── .env                      # Environment variables
├── frontend-nextjs/               # ⚛️ Next.js Frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── sections/        # Page sections
│   │   │   └── ui/              # UI components
│   │   ├── lib/                 # Utility libraries
│   │   ├── pages/               # Next.js pages
│   │   ├── store/               # Zustand stores
│   │   ├── styles/              # Global styles
│   │   └── types/               # TypeScript definitions
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   └── .env.local               # Environment variables
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package.json
└── README.md                     # This file
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
- **System Fonts**: Optimized font stack for better performance
- **Weights**: 300, 400, 500, 600, 700

### Animations
- **Smooth Transitions**: CSS transitions for better UX
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

- **Next.js Optimizations**: Automatic code splitting and optimization
- **Image Optimization**: Next.js Image component for optimized images
- **Lazy Loading**: Components and images loaded on demand
- **Compression**: Gzip compression for API responses
- **Caching**: Appropriate cache headers
- **Minimal Dependencies**: Lightweight and optimized bundle

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend-nextjs
npm run lint        # ESLint
npm run type-check  # TypeScript check
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- **Database**: MongoDB connection string
- **Security**: JWT secret, rate limiting
- **File Upload**: Size limits, storage path
- **CORS**: Allowed origins
- **Storage**: User storage limits

#### Frontend (.env.local)
- **API URL**: Backend API endpoint

### File Upload Configuration
- **Max File Size**: 50MB (configurable)
- **Allowed Types**: Images (jpg, jpeg, png, gif, webp), Videos (mp4, avi, mov, wmv), Audio (mp3, wav, ogg, m4a)
- **Storage**: Local filesystem (can be extended to cloud storage)

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificate

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Configure environment variables
4. Set up custom domain (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the database
- **Express.js** for the web framework
- **The open source community** for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔄 Version History

- **v1.0.0** - Initial release with Next.js frontend and Node.js backend
- Full authentication system
- File upload and management
- Responsive design
- RESTful API

---

**Built with ❤️ for modern media management**

### 🚀 Getting Started Quickly

1. Clone the repo
2. Install dependencies: `npm install` in both `backend/` and `frontend-nextjs/`
3. Set up environment variables (see above)
4. Start backend: `cd backend && npm run dev`
5. Start frontend: `cd frontend-nextjs && npm run dev`
6. Visit http://localhost:3000

That's it! You're ready to start managing your media files! 🎉