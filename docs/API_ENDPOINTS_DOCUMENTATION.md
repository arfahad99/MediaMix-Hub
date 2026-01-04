# 🚀 MediaMix Hub - Complete API Documentation

## 📋 Overview

The MediaMix Hub API provides comprehensive RESTful endpoints for managing multimedia content, user authentication, and sharing functionality. This API is designed for Azure Cloud deployment with full integration support.

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Base URL

- **Local Development:** `http://localhost:8000/api`
- **Azure Production:** `https://mediamix-hub-api.azurewebsites.net/api`

---

## 👤 Authentication Endpoints

### POST `/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "johndoe",
    "displayName": "johndoe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST `/auth/login`
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "identifier": "johndoe", // username or email
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-10T08:15:00.000Z"
  }
}
```

### GET `/auth/profile` 🔒
Retrieves the authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-10T08:15:00.000Z"
  }
}
```

### PUT `/auth/profile` 🔒
Updates the authenticated user's profile.

**Request Body:**
```json
{
  "displayName": "John Smith",
  "email": "johnsmith@example.com"
}
```

### PUT `/auth/change-password` 🔒
Changes the authenticated user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

---

## 📁 Media Management Endpoints

### GET `/media` 🔒
Retrieves all media files for the authenticated user with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `type` (string): Filter by file type (`image`, `video`, `audio`)
- `search` (string): Search in filename, description, or tags
- `sortBy` (string): Sort field (default: `createdAt`)
- `sortOrder` (string): Sort order (`asc`, `desc`, default: `desc`)

**Response (200):**
```json
{
  "success": true,
  "media": [
    {
      "mediaId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fileName": "vacation-photo.jpg",
      "fileType": "image",
      "fileSize": 2048576,
      "fileSizeFormatted": "2.00 MB",
      "description": "Beautiful sunset at the beach",
      "tags": ["vacation", "sunset", "beach"],
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "viewCount": 15,
      "downloadCount": 3,
      "fileUrl": "https://storage.blob.core.windows.net/media/vacation-photo.jpg"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 47,
    "limit": 10
  }
}
```

### GET `/media/:id` 🔒
Retrieves details of a specific media item.

**Response (200):**
```json
{
  "success": true,
  "media": {
    "mediaId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "fileName": "vacation-photo.jpg",
    "fileType": "image",
    "fileSize": 2048576,
    "description": "Beautiful sunset at the beach",
    "tags": ["vacation", "sunset", "beach"],
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "viewCount": 15,
    "downloadCount": 3,
    "azureInfo": {
      "containerName": "media-uploads",
      "url": "https://storage.blob.core.windows.net/media/vacation-photo.jpg"
    }
  }
}
```

### POST `/media/upload` 🔒
Uploads a new media file.

**Request:** Multipart form data
- `media` (file): The media file to upload
- `description` (string): Description of the media
- `tags` (string): Comma-separated tags or JSON array

**Response (201):**
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "media": {
    "mediaId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "fileName": "vacation-photo.jpg",
    "fileType": "image",
    "fileSize": 2048576,
    "description": "Beautiful sunset at the beach",
    "tags": ["vacation", "sunset", "beach"],
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "fileUrl": "https://storage.blob.core.windows.net/media/vacation-photo.jpg"
  }
}
```

### PUT `/media/:id` 🔒
Updates metadata of an existing media item.

**Request Body:**
```json
{
  "description": "Updated description",
  "tags": ["new", "tags", "here"]
}
```

### DELETE `/media/:id` 🔒
Deletes a media item and its associated file.

**Response (200):**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

### GET `/media/:id/file` 🔒
Serves the actual media file for viewing.

**Response:** Binary file data with appropriate headers

### GET `/media/:id/download` 🔒
Downloads the media file with download headers.

**Response:** Binary file data with download headers

### GET `/media/stats/overview` 🔒
Retrieves media statistics for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": {
      "totalFiles": 47,
      "totalSize": 157286400
    },
    "byType": {
      "image": { "count": 25, "size": 52428800 },
      "video": { "count": 15, "size": 94371840 },
      "audio": { "count": 7, "size": 10485760 }
    },
    "recentUploads": 12
  }
}
```

---

## 🔗 Sharing Endpoints

### POST `/share` 🔒
Creates a new shared link for a media item.

**Request Body:**
```json
{
  "mediaId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "permission": "view", // "view", "download", "both"
  "expiryDays": 30,
  "password": "optional-password",
  "maxAccessCount": 100,
  "customMessage": "Check out this amazing photo!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Shared link created successfully",
  "sharedLink": {
    "linkId": "a1b2c3d4e5f6g7h8",
    "shareToken": "64f8a1b2c3d4e5f6a7b8c9d1e2f3g4h5",
    "shareUrl": "https://mediamix-hub-frontend.azurewebsites.net/share/64f8a1b2c3d4e5f6a7b8c9d1e2f3g4h5",
    "permission": "view",
    "expiryDate": "2024-02-14T10:30:00.000Z",
    "requiresPassword": true,
    "maxAccessCount": 100
  }
}
```

### GET `/share` 🔒
Retrieves all shared links created by the authenticated user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `mediaId` (string): Filter by specific media ID
- `isActive` (boolean): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "sharedLinks": [
    {
      "linkId": "a1b2c3d4e5f6g7h8",
      "shareToken": "64f8a1b2c3d4e5f6a7b8c9d1e2f3g4h5",
      "mediaId": {
        "fileName": "vacation-photo.jpg",
        "fileType": "image",
        "fileSize": 2048576
      },
      "permission": "view",
      "shareDate": "2024-01-15T10:30:00.000Z",
      "expiryDate": "2024-02-14T10:30:00.000Z",
      "accessCount": 25,
      "maxAccessCount": 100,
      "isActive": true,
      "canAccess": true
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 23,
    "limit": 20
  }
}
```

### GET `/share/:linkId` 🔒
Retrieves details of a specific shared link.

**Response (200):**
```json
{
  "success": true,
  "sharedLink": {
    "linkId": "a1b2c3d4e5f6g7h8",
    "shareToken": "64f8a1b2c3d4e5f6a7b8c9d1e2f3g4h5",
    "mediaId": {
      "fileName": "vacation-photo.jpg",
      "fileType": "image",
      "fileSize": 2048576,
      "description": "Beautiful sunset at the beach"
    },
    "permission": "view",
    "shareDate": "2024-01-15T10:30:00.000Z",
    "expiryDate": "2024-02-14T10:30:00.000Z",
    "accessCount": 25,
    "lastAccessDate": "2024-01-20T14:22:00.000Z",
    "accessLog": [
      {
        "accessDate": "2024-01-20T14:22:00.000Z",
        "ipAddress": "192.168.1.100",
        "action": "view",
        "success": true
      }
    ]
  }
}
```

### GET `/share/public/:shareToken`
**Public endpoint** - Accesses shared content without authentication.

**Query Parameters:**
- `password` (string): Required if the link is password-protected

**Response (200):**
```json
{
  "success": true,
  "media": {
    "fileName": "vacation-photo.jpg",
    "fileType": "image",
    "fileSize": 2048576,
    "description": "Beautiful sunset at the beach",
    "fileUrl": "https://storage.blob.core.windows.net/media/vacation-photo.jpg"
  },
  "sharedBy": "John Doe",
  "permission": "view",
  "customMessage": "Check out this amazing photo!"
}
```

### GET `/share/public/:shareToken/download`
**Public endpoint** - Downloads shared content.

**Query Parameters:**
- `password` (string): Required if the link is password-protected

**Response:** Binary file data or redirect to Azure Blob Storage URL

### PUT `/share/:linkId` 🔒
Updates an existing shared link.

**Request Body:**
```json
{
  "permission": "both",
  "expiryDays": 60,
  "password": "new-password",
  "maxAccessCount": 200,
  "customMessage": "Updated message",
  "isActive": true
}
```

### DELETE `/share/:linkId` 🔒
Deletes a shared link.

**Response (200):**
```json
{
  "success": true,
  "message": "Shared link deleted successfully"
}
```

### GET `/share/analytics/overview` 🔒
Retrieves sharing analytics for the authenticated user.

**Query Parameters:**
- `days` (number): Number of days to analyze (default: 30)

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "dailyStats": [
      {
        "_id": "2024-01-15",
        "totalLinks": 5,
        "activeLinks": 4,
        "totalAccesses": 127,
        "avgAccessesPerLink": 25.4
      }
    ],
    "userStats": {
      "totalLinks": 23,
      "activeLinks": 18,
      "expiredLinks": 3,
      "totalAccesses": 1247,
      "totalDownloads": 89,
      "avgAccessesPerLink": 54.2,
      "mostAccessedLink": 156
    },
    "popularLinks": [
      {
        "linkId": "a1b2c3d4e5f6g7h8",
        "mediaId": {
          "fileName": "vacation-photo.jpg",
          "fileType": "image"
        },
        "accessCount": 156,
        "shareDate": "2024-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 🔧 Azure Functions Integration

### POST `/functions/imageProcessor`
Processes images using Azure Functions (AI analysis, resizing, optimization).

**Request Body:**
```json
{
  "imageUrl": "https://storage.blob.core.windows.net/media/image.jpg",
  "operation": "analyze", // "analyze", "resize", "optimize"
  "options": {
    "sizes": [
      { "name": "thumbnail", "width": 150, "height": 150 },
      { "name": "medium", "width": 800, "height": 600 }
    ],
    "quality": 85
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "operation": "analyze",
  "result": {
    "description": "A beautiful sunset over the ocean",
    "confidence": 0.95,
    "tags": [
      { "name": "sunset", "confidence": 0.98 },
      { "name": "ocean", "confidence": 0.92 }
    ],
    "isAdultContent": false,
    "dominantColors": ["orange", "blue", "yellow"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials or token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error message"
}
```

---

## 🚀 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints:** 5 requests per minute
- **Upload endpoints:** 10 requests per minute
- **General endpoints:** 100 requests per minute

---

## 📝 Notes for Azure Deployment

1. **File Storage:** Files are stored in Azure Blob Storage with public URLs
2. **Database:** Uses Azure Cosmos DB with MongoDB API
3. **Authentication:** JWT tokens with 7-day expiration
4. **CORS:** Configured for frontend domain access
5. **Monitoring:** All endpoints logged to Application Insights

---

## 🧪 Testing Your API

### Using cURL:

**Register a user:**
```bash
curl -X POST https://mediamix-hub-api.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

**Upload a file:**
```bash
curl -X POST https://mediamix-hub-api.azurewebsites.net/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "media=@/path/to/your/file.jpg" \
  -F "description=Test upload" \
  -F "tags=test,demo"
```

**Create a shared link:**
```bash
curl -X POST https://mediamix-hub-api.azurewebsites.net/api/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mediaId":"YOUR_MEDIA_ID","permission":"view","expiryDays":30}'
```

---

## ✅ API Validation Checklist

- [ ] All endpoints return consistent JSON responses
- [ ] Authentication is properly implemented
- [ ] File uploads work with Azure Blob Storage
- [ ] Sharing functionality is complete
- [ ] Error handling is comprehensive
- [ ] Rate limiting is configured
- [ ] CORS is properly set up
- [ ] Database queries are optimized
- [ ] Azure Functions integration works
- [ ] API documentation is complete

**🎉 Your API is now ready for Azure deployment and assessment!**