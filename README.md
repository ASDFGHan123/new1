# OffChat Admin Nexus

A professional full-stack admin dashboard for managing chat systems, users, and analytics.

## 📁 **Project Structure**

```
offchat-admin-nexus-main/
├── frontend/                 # React frontend application
│   ├── src/                  # React source code
│   │   ├── components/       # UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React contexts
│   │   ├── lib/             # API services and utilities
│   │   └── utils/           # Helper functions
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.ts       # Vite configuration
│   └── tsconfig.json        # TypeScript configuration
├── backend/                  # Django backend application
│   ├── manage.py            # Django management script
│   ├── requirements.txt     # Python dependencies
│   ├── offchat_backend/     # Django project settings
│   ├── users/               # User management app
│   ├── chat/                # Chat system app
│   ├── admin_panel/         # Admin panel app
│   └── analytics/           # Analytics app
├── scripts/                  # Utility and test scripts
├── docs/                     # Documentation
├── tests/                    # Test files
└── config/                   # Configuration files
```

## 🚀 **Quick Start**

### Backend (Django)
```bash
cd backend
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## 📋 **Features**

- **User Management**: Create, approve, suspend, and manage users
- **Chat System**: Real-time messaging with WebSocket support
- **Admin Panel**: Comprehensive dashboard for system management
- **Analytics**: User activity and system analytics
- **Role-based Access**: Admin and moderator permissions
- **Department Management**: Organize users by departments

## 🔐 **User Approval System**

### Public Registration
- Users register → Status: `pending`
- Login blocked until admin approval
- Admin approves → Status: `active`

### Admin/Moderator Creation
- Admin creates user → Status: `active` (immediate access)
- Moderator creates user → Status: `active` (immediate access)
- No approval required

## 🛠 **Development Setup**

### Prerequisites
- Python 3.8+
- Node.js 16+
- Django 4.2+
- React 18+

### Environment Configuration
Create `.env.local` in the root:
```
VITE_API_URL=http://localhost:8000/api
VITE_USE_REAL_DATA=true
VITE_ENABLE_WEBSOCKET=true
```

### Database Setup
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

## 📚 **API Documentation**

### Authentication Endpoints
- `POST /api/users/login/` - User login
- `POST /api/users/register/` - User registration
- `POST /api/users/logout/` - User logout

### User Management
- `GET /api/users/admin/users/` - List users (Admin/Moderator)
- `POST /api/users/admin/users/` - Create user (Admin/Moderator)
- `POST /api/users/admin/users/{id}/approve/` - Approve user (Admin only)

### Chat System
- `GET /api/chat/conversations/` - List conversations
- `POST /api/chat/messages/` - Send message
- WebSocket: `/ws/chat/` - Real-time messaging

## 🔧 **Configuration**

### Django Settings
- Development: `backend/offchat_backend/settings/development.py`
- Production: `backend/offchat_backend/settings/production.py`

### Frontend Configuration
- Vite config: `frontend/vite.config.ts`
- TypeScript: `frontend/tsconfig.json`

## 🧪 **Testing**

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
cd scripts
python test_user_approval_logic.py
python test_moderator_user_creation.py
```

## 📦 **Deployment**

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
python manage.py collectstatic
python manage.py migrate
```

### Environment Variables
- `SECRET_KEY` - Django secret key
- `DEBUG=False` - Production mode
- `ALLOWED_HOSTS` - Allowed hostnames

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For issues and questions:
- Check the `docs/` folder for detailed documentation
- Review existing GitHub issues
- Create a new issue with detailed information

---

**Note**: This project has been restructured for better organization and maintainability while preserving all existing functionality.
