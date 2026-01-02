# MediaMix Hub - Next.js & React Native Frontend

This document provides a comprehensive guide for the modern Next.js and React Native implementations of MediaMix Hub, built with Tailwind CSS and TypeScript.

## 🚀 Project Structure

```
├── frontend-nextjs/          # Next.js Web Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Next.js pages
│   │   ├── store/           # Zustand state management
│   │   ├── lib/             # Utilities and API client
│   │   ├── types/           # TypeScript type definitions
│   │   └── styles/          # Global styles and Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── frontend-react-native/    # React Native Mobile App
│   ├── app/                 # Expo Router pages
│   ├── components/          # Reusable UI components
│   ├── store/               # Zustand state management
│   ├── lib/                 # Utilities and API client
│   ├── types/               # TypeScript type definitions
│   ├── package.json
│   ├── app.json
│   └── tailwind.config.js
│
└── backend/                 # Node.js Backend (existing)
```

## 🛠️ Technology Stack

### Next.js Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **UI Components**: Headless UI + Custom components
- **Animations**: Framer Motion
- **Icons**: Heroicons

### React Native Mobile
- **Framework**: Expo with TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **UI Components**: Custom components
- **Icons**: Expo Vector Icons (Ionicons)
- **Storage**: AsyncStorage

## 📦 Installation & Setup

### Next.js Frontend

1. **Navigate to the Next.js directory:**
   ```bash
   cd frontend-nextjs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install additional Tailwind CSS plugins:**
   ```bash
   npm install @tailwindcss/forms @tailwindcss/aspect-ratio
   ```

4. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

### React Native Mobile

1. **Navigate to the React Native directory:**
   ```bash
   cd frontend-react-native
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Expo CLI globally (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

4. **Start the Expo development server:**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator:**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## 🎨 Design System

Both applications use a consistent design system built with Tailwind CSS:

### Color Palette
```css
/* Primary Colors */
primary-50: #f0f4ff
primary-500: #6366f1  /* Main brand color */
primary-600: #4f46e5

/* Secondary Colors */
secondary-500: #f59e0b
secondary-600: #d97706

/* Accent Colors */
accent-purple: #8b5cf6
accent-pink: #ec4899
accent-cyan: #06b6d4
accent-emerald: #10b981
```

### Typography
- **Primary Font**: Inter (400, 500, 600, 700)
- **Heading Font**: Poppins (400, 500, 600, 700)

### Components

#### Shared Components
Both platforms include consistent UI components:

- **Button**: Multiple variants (primary, secondary, danger, ghost)
- **Input**: Form inputs with validation and icons
- **Modal**: Overlay modals with animations
- **Toast**: Notification system
- **LoadingSpinner**: Loading indicators

#### Usage Examples

**Next.js Button:**
```tsx
import Button from '@/components/ui/Button';

<Button 
  variant="primary" 
  size="lg" 
  isLoading={isSubmitting}
  onClick={handleSubmit}
>
  Upload Media
</Button>
```

**React Native Button:**
```tsx
import Button from '../components/ui/Button';

<Button 
  title="Upload Media"
  variant="primary" 
  size="lg" 
  isLoading={isSubmitting}
  onPress={handleSubmit}
/>
```

## 🔧 State Management

Both applications use Zustand for state management with the same store structure:

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}
```

### Media Store
```typescript
interface MediaState {
  items: MediaItem[];
  filteredItems: MediaItem[];
  isLoading: boolean;
  filters: FilterOptions;
  uploadTasks: UploadTask[];
  // ... actions
}
```

## 🌐 API Integration

Both applications use the same API client structure with platform-specific adaptations:

### Shared API Methods
- Authentication (login, register, profile)
- Media management (upload, update, delete, list)
- Dashboard data
- File operations

### Platform Differences

**Next.js (Browser):**
- Uses `localStorage` for token storage
- File uploads via `FormData` with `File` objects
- Direct blob downloads

**React Native (Mobile):**
- Uses `AsyncStorage` for token storage
- File uploads via `FormData` with URI-based files
- Platform-specific file handling

## 📱 Features

### Authentication
- **Login/Register**: Email and password authentication
- **Profile Management**: Update user information
- **Password Change**: Secure password updates
- **Auto-login**: Persistent authentication

### Media Management
- **Upload**: Drag & drop (web) / Camera & Gallery (mobile)
- **Gallery**: Grid and list views with filtering
- **Search**: Real-time search across files and tags
- **Sorting**: Multiple sorting options
- **Tags**: Organize media with custom tags
- **Preview**: In-app media preview
- **Download**: Direct file downloads

### Dashboard
- **Statistics**: File counts, storage usage, recent uploads
- **Recent Activity**: Timeline of user actions
- **Storage Analytics**: Detailed storage breakdown

## 🎯 Key Features Comparison

| Feature | Next.js Web | React Native Mobile |
|---------|-------------|-------------------|
| Authentication | ✅ Full support | ✅ Full support |
| File Upload | ✅ Drag & drop | ✅ Camera/Gallery |
| Media Gallery | ✅ Grid/List views | ✅ Grid/List views |
| Search & Filter | ✅ Real-time | ✅ Real-time |
| Media Preview | ✅ In-browser | ✅ Native viewers |
| Offline Support | ❌ Online only | 🔄 Planned |
| Push Notifications | ❌ N/A | 🔄 Planned |
| Responsive Design | ✅ All devices | ✅ Native responsive |

## 🚀 Deployment

### Next.js Deployment

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**Manual Build:**
```bash
npm run build
npm start
```

### React Native Deployment

**Expo Application Services (EAS):**
```bash
npm install -g eas-cli
eas login
eas build --platform all
```

**Development Build:**
```bash
expo install expo-dev-client
eas build --profile development
```

## 🔧 Configuration

### Environment Variables

**Next.js (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**React Native (app.json):**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:5000/api"
    }
  }
}
```

### Tailwind Configuration

Both applications share similar Tailwind configurations with platform-specific adaptations:

**Shared Colors and Spacing:**
- Consistent color palette
- Unified spacing scale
- Shared component classes

**Platform Differences:**
- Next.js: Full Tailwind CSS with plugins
- React Native: NativeWind with mobile-optimized classes

## 🧪 Testing

### Next.js Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### React Native Testing
```bash
# Unit tests
npm run test

# Type checking
npm run type-check
```

## 📚 Development Guidelines

### Code Structure
- **Components**: Reusable UI components in `/components`
- **Pages**: Route components in `/pages` (Next.js) or `/app` (RN)
- **Stores**: Global state in `/store`
- **Types**: TypeScript definitions in `/types`
- **Utils**: Helper functions in `/lib`

### Naming Conventions
- **Components**: PascalCase (e.g., `MediaCard.tsx`)
- **Files**: camelCase (e.g., `authStore.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Tailwind utility classes

### Best Practices
1. **Type Safety**: Use TypeScript for all components
2. **Responsive Design**: Mobile-first approach
3. **Performance**: Lazy loading and code splitting
4. **Accessibility**: ARIA labels and semantic HTML
5. **Error Handling**: Comprehensive error boundaries

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the coding standards**
4. **Write tests for new features**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Issues**: GitHub Issues
- **Documentation**: This README and inline code comments
- **Community**: Discussions tab in the repository

---

**Happy coding! 🚀**