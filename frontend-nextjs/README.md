# MediaMix Hub - Next.js Frontend

A modern, responsive frontend for MediaMix Hub built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Authentication**: JWT-based auth with username/email login support
- **File Upload**: Drag & drop file upload with validation
- **Media Gallery**: Grid/list view with search, filter, and sort
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: Zustand for clean, simple state management
- **Form Handling**: React Hook Form with validation
- **Notifications**: React Hot Toast for user feedback
- **Type Safety**: Full TypeScript coverage

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Login page: http://localhost:3000/auth/login

## 🏗️ Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   └── Navbar.tsx          # Navigation bar
│   ├── sections/
│   │   ├── WelcomeSection.tsx  # Welcome/hero section
│   │   ├── StatsSection.tsx    # Statistics dashboard
│   │   ├── UploadSection.tsx   # File upload section
│   │   └── GallerySection.tsx  # Media gallery
│   └── ui/
│       ├── Button.tsx          # Reusable button component
│       ├── Input.tsx           # Form input component
│       ├── Modal.tsx           # Modal dialog component
│       ├── LoadingSpinner.tsx  # Loading indicator
│       ├── UploadArea.tsx      # Drag & drop upload area
│       └── MediaCard.tsx       # Media item card
├── lib/
│   ├── api.ts                  # API client with auth
│   └── utils.ts                # Utility functions
├── pages/
│   ├── _app.tsx               # App wrapper
│   ├── index.tsx              # Main dashboard
│   └── auth/
│       └── login.tsx          # Login/register page
├── store/
│   ├── authStore.ts           # Authentication state
│   └── mediaStore.ts          # Media management state
├── styles/
│   └── globals.css            # Global styles
└── types/
    └── index.ts               # TypeScript definitions
```

## 🎨 Key Components

### Authentication
- **Login/Register**: Single page with tabs for both forms
- **Password Visibility**: Toggle for all password fields
- **Username Support**: Login with username or email
- **Form Validation**: Real-time validation with error messages

### File Upload
- **Drag & Drop**: React Dropzone integration
- **File Validation**: Type, size, and format validation
- **Preview**: Selected files preview with remove option
- **Progress**: Upload progress indication
- **Metadata**: Description and tags for uploaded files

### Media Gallery
- **View Modes**: Grid and list view options
- **Search**: Real-time search across files
- **Filtering**: Filter by file type (all, image, video, audio)
- **Sorting**: Multiple sort options (date, name, size)
- **Actions**: View, edit, and delete operations

### UI Components
- **Responsive**: Mobile-first design
- **Accessible**: ARIA labels and keyboard navigation
- **Consistent**: Unified design system
- **Interactive**: Hover states and animations

## 🔧 Configuration

### API Integration
The app connects to your existing Node.js backend:
- Base URL: `http://localhost:5000/api`
- Authentication: JWT tokens in localStorage
- Auto-redirect: Redirects to login on 401 errors

### Tailwind CSS
Custom configuration with:
- Extended color palette
- Custom animations
- Component classes
- Utility classes

### TypeScript
Full type coverage with:
- Interface definitions
- API response types
- Component prop types
- Store type definitions

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

## 🔄 State Management

### Auth Store
- User authentication state
- Login/register actions
- Token management
- Auto-logout on expiration

### Media Store
- Media files state
- Upload/edit/delete actions
- Search and filtering
- Statistics tracking

## 📱 Responsive Design

- **Mobile**: < 768px - Single column, touch-friendly
- **Tablet**: 768px - 1024px - Adaptive grid layout
- **Desktop**: > 1024px - Full feature layout

## 🎯 Features Implemented

✅ **Authentication System**
- Login with username or email
- Registration with username
- Password visibility toggles
- JWT token management
- Auto-redirect on auth failure

✅ **File Upload System**
- Drag & drop interface
- File validation and preview
- Progress indication
- Metadata input (description, tags)
- Error handling

✅ **Media Gallery**
- Grid and list views
- Real-time search
- Type-based filtering
- Multiple sort options
- Responsive design

✅ **UI/UX**
- Modern, clean design
- Smooth animations
- Loading states
- Toast notifications
- Modal dialogs

## 🔮 Next Steps

The application is ready for use! You can:

1. **Connect to Backend**: Ensure your Node.js backend is running
2. **Test Features**: Try login, upload, and gallery functionality
3. **Customize**: Modify colors, layouts, or add new features
4. **Deploy**: Build and deploy to your preferred platform

## 🤝 Integration with Backend

This frontend is designed to work with your existing Node.js backend:
- Uses the same API endpoints
- Supports username/email login
- Handles JWT authentication
- File upload with FormData
- Error handling and user feedback

The conversion from vanilla JavaScript to Next.js is complete! 🎉