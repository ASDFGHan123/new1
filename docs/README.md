# OffChat Admin Dashboard

A lightweight admin dashboard for managing an offline messaging platform. Built with modern React, TypeScript, and clean development-focused features.

## Features

### Core Functionality
- **Admin Dashboard**: Clean and modern admin interface for platform management
- **User Management**: Basic user operations with role-based permissions
- **Authentication**: Simple login system without persistent storage
- **Mock Data**: All features work with in-memory mock data for development
- **Responsive Design**: Mobile-first design with dark/light theme support
- **Error Handling**: Global error boundaries and comprehensive error states
- **Performance**: Code splitting, lazy loading, and optimized builds
- **Testing**: Vitest setup with React Testing Library

### Key Components
- **AdminSidebar**: Clean navigation interface
- **UserManagement**: Basic user operations and management
- **MessageAnalytics**: Mock data visualizations and statistics
- **ModerationTools**: User action management interface
- **DataTools**: Basic data management tools
- **AuditLogs**: Activity logging with search/filter
- **BackupManager**: Simple backup simulation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: ShadCN UI + Tailwind CSS + Radix UI
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Build**: Vite with SWC

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd offchat-admin-nexus-main

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

### Build

```bash
# Build for development
npm run build

# Preview build
npm run preview
```

## Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for development
npm run preview      # Preview build

# Quality
npm run lint         # ESLint checking
npm run test         # Run tests
npm run test:coverage # Test coverage
```

## Features Overview

- **No Persistence**: All data is in-memory and resets on page refresh
- **Development Focus**: Built for development and testing purposes
- **Mock Backend**: All API calls are simulated with mock data
- **Clean Architecture**: Well-organized components and clear separation of concerns
- **Modern UI**: Professional interface with Tailwind CSS and ShadCN components

## Default Admin Credentials

- Username: `admin`
- Password: `12341234`

## Architecture

The application follows a clean architecture pattern:

- **Components**: Reusable UI components
- **Pages**: Route-based page components
- **Hooks**: Custom React hooks for shared logic
- **Utils**: Helper functions and utilities
- **API Layer**: Mock API service for development

## Development Notes

- All data is stored in React state only
- No localStorage or external persistence
- Perfect for development and testing
- Easy to integrate with a real backend API

## Support

For questions and support:
- Review the code comments for implementation details
- Check component documentation in the source files
