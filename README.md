# OffChat Admin Nexus

A comprehensive admin dashboard for managing an offline messaging platform. Built with modern React, TypeScript, and production-ready features.

##  Features

### **Completed Features**
- **Admin Dashboard**: Full-featured admin panel with user management, moderation tools, analytics, and settings
- **User Management**: Complete CRUD operations, role-based permissions, user approval workflow
- **Authentication**: Secure login/signup with localStorage persistence and session management
- **Real-time Analytics**: Live-updating charts and statistics with simulated data
- **Moderation Tools**: User suspension, banning, and warning systems
- **Data Management**: Export/import user data with GDPR compliance features
- **PWA Support**: Progressive Web App with service worker, offline caching, and install prompts
- **Responsive Design**: Mobile-first design with dark/light theme support
- **Error Handling**: Global error boundaries and comprehensive error states
- **Performance**: Code splitting, lazy loading, and optimized builds
- **Testing**: Vitest setup with React Testing Library
- **Deployment**: Docker containerization with nginx for production

###  **Key Components**
- **AdminSidebar**: Navigation with role-based access
- **UserManagement**: User CRUD with approval/rejection workflow
- **MessageAnalytics**: Real-time charts and statistics
- **ModerationTools**: User action management
- **DataTools**: GDPR-compliant data export/deletion
- **AuditLogs**: Comprehensive activity logging
- **BackupManager**: System backup and restore functionality

##  **Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: ShadCN UI + Tailwind CSS + Radix UI
- **State Management**: React Query + Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Build**: Vite with SWC
- **Deployment**: Docker + Nginx

## **Installation & Setup**

### Prerequisites
- Node.js 18+ and npm
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd offchat-admin-nexus-main

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8081
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:8080
```

##  **Testing**

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

##  **PWA Features**

- **Offline Support**: Service worker caches static assets and API responses
- **Install Prompt**: Automatic PWA installation prompts
- **Background Sync**: Handles offline actions when back online
- **Push Notifications**: Framework for push notification support

##  **Security Features**

- **Input Validation**: Comprehensive form validation
- **Error Boundaries**: Prevents app crashes from component errors
- **CSP Headers**: Content Security Policy in production
- **XSS Protection**: Built-in XSS prevention
- **CSRF Ready**: Framework for CSRF token implementation

## **Performance Optimizations**

- **Code Splitting**: Lazy loading of routes and components
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Service worker caching strategies
- **Image Optimization**: Efficient image handling
- **Bundle Analysis**: Build size monitoring

## **API Architecture**

The application includes a comprehensive API service layer that can easily switch between:
- **Development**: Mock implementations with localStorage
- **Production**: Real REST API endpoints

```typescript
// Easy to extend for real API integration
const apiService = new ApiService();
await apiService.login(credentials);
await apiService.getUsers();
await apiService.updateUser(userId, updates);
```

## **Theme & Customization**

- **Dark/Light Mode**: System preference detection with manual toggle
- **Custom Colors**: CSS custom properties for theming
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation support

##  **Analytics & Monitoring**

- **Real-time Charts**: Live-updating data visualizations
- **User Metrics**: Message counts, activity tracking, report statistics
- **Audit Logging**: Comprehensive action logging with search/filter
- **Performance Monitoring**: Error tracking and performance metrics

##  **Development Commands**

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build

# Quality
npm run lint         # ESLint checking
npm run test         # Run tests
npm run test:coverage # Test coverage

# Docker
docker-compose up --build  # Full deployment
```

##  **Deployment Options**

### Docker (Recommended)
```bash
docker-compose up --build
```

### Manual Deployment
```bash
npm run build
# Serve dist/ folder with any static server
```

### Cloud Platforms
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag & drop dist/ folder or connect repo
- **Railway**: Docker-based deployment
- **Render**: Static site deployment

##  **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

##  **License**

This project is licensed under the MIT License - see the LICENSE file for details.

##  **Support**

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the code comments for implementation details

---

**Default Admin Credentials:**
- Username: `admin`
- Password: `12341234`
