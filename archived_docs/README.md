# OffChat Admin Nexus

A comprehensive admin dashboard for managing an offline messaging platform with real-time features, role-based access control, and modern web technologies.

## 🚀 Overview

OffChat Admin Nexus is a production-ready administrative interface built with React, TypeScript, and Django. It provides complete control over user management, system settings, real-time monitoring, and communication features for the OffChat messaging platform.

## ✨ Key Features

### 🎯 Core Functionality
- **Admin Dashboard**: Modern, responsive admin interface
- **User Management**: Complete CRUD operations with role-based permissions
- **Real-time Features**: WebSocket support for live updates and notifications
- **Analytics & Monitoring**: Comprehensive system analytics and health monitoring
- **Security**: Multi-layer security with JWT authentication and RBAC
- **Performance**: Optimized with caching, lazy loading, and code splitting

### 🔧 Technical Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **ShadCN/UI** component library
- **React Query** for state management
- **Zustand** for global state
- **React Router** for navigation

#### Backend
- **Django 4.2** with Django REST Framework
- **Django Channels** for WebSocket support
- **Celery** for background tasks
- **Redis** for caching and message broker
- **PostgreSQL** for production database
- **SQLite** for development

#### DevOps & Tools
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **ESLint** and **Prettier** for code quality
- **Jest** and **Vitest** for testing
- **Storybook** for component documentation

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 18.0 or higher
- **Python**: 3.11 or higher
- **PostgreSQL**: 13.0 or higher (production)
- **Redis**: 6.0 or higher
- **RAM**: 4GB minimum
- **Storage**: 10GB free space

### Recommended
- **Node.js**: 20.0 or higher
- **Python**: 3.12 or higher
- **RAM**: 8GB or more
- **SSD** for better performance

## 🛠️ Installation

### Quick Start (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd offchat-admin-nexus-main

# Run the setup script
./scripts/setup.sh  # Linux/macOS
# or
scripts\setup.bat    # Windows

# Start development servers
./scripts/start.sh    # Linux/macOS
# or
scripts\start.bat     # Windows
```

### Manual Installation

#### 1. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

#### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd src

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

#### 3. Additional Services
```bash
# Start Redis
redis-server

# Start Celery worker (optional)
celery -A offchat_backend worker -l info

# Start Celery beat (optional)
celery -A offchat_backend beat -l info
```

## 📁 Project Structure

```
offchat-admin-nexus-main/
├── admin_panel/           # Django admin app
│   ├── views/            # Admin views and API endpoints
│   ├── urls.py           # URL routing
│   └── services/         # Business logic services
├── users/                # User management app
│   ├── models.py         # User models and permissions
│   ├── views.py          # User views and authentication
│   └── management/       # Django management commands
├── chat/                 # Real-time chat features
│   ├── models.py         # Chat models
│   ├── consumers.py      # WebSocket consumers
│   └── routing.py        # WebSocket routing
├── src/                  # React frontend
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React context providers
│   ├── lib/              # API services and utilities
│   ├── pages/            # Page components
│   └── hooks/            # Custom React hooks
├── docs/                 # Comprehensive documentation
├── scripts/              # Setup and utility scripts
├── tests/                # Test files
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── manage.py            # Django management script
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=offchat_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

#### Frontend (src/.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_USE_REAL_DATA=true
```

## 🚀 Usage

### Accessing the Application

1. **Admin Dashboard**: http://localhost:3000/admin
2. **API Documentation**: http://localhost:8000/api/docs/
3. **Django Admin**: http://localhost:8000/admin/

### Default Credentials
- **Username**: admin
- **Password**: 12341234

> ⚠️ **Security Note**: Change default credentials in production

### Key Features

#### User Management
- Create, read, update, delete users
- Assign roles and permissions
- Manage user status (active, suspended, banned)
- Department and office assignments

#### Role-Based Access Control
- **Admin**: Full system access
- **Moderator**: Limited administrative permissions
- **User**: Basic access only

#### Real-time Features
- Live user status updates
- Real-time notifications
- WebSocket-based communication
- Online presence tracking

#### System Monitoring
- Performance metrics
- User activity logs
- System health checks
- Error tracking

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### Integration Tests
```bash
# Run full test suite
npm run test:all
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- [**Features Documentation**](docs/FEATURES.md) - Detailed feature descriptions
- [**Setup Guide**](docs/SETUP.md) - Complete installation and configuration
- [**Security Guide**](docs/SECURITY.md) - Security implementation and best practices
- [**Troubleshooting**](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [**Development Guide**](docs/DEVELOPMENT.md) - Development workflow and guidelines

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment
1. Configure environment variables
2. Set up PostgreSQL and Redis
3. Run database migrations
4. Collect static files
5. Configure web server (Nginx/Apache)
6. Set up SSL certificates
7. Configure monitoring and logging

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database set up and migrated
- [ ] Static files collected
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled

## 🔒 Security

### Implemented Security Measures
- JWT-based authentication
- Role-based access control (RBAC)
- CSRF protection
- XSS protection
- SQL injection prevention
- Rate limiting
- Audit logging
- Secure headers
- Data encryption

### Security Best Practices
- Regular security updates
- Dependency vulnerability scanning
- Security audit logs
- Penetration testing
- Code reviews

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](docs/DEVELOPMENT.md) for details.

### Contribution Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use TypeScript for frontend
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- Check the [troubleshooting guide](docs/TROUBLESHOOTING.md)
- Search existing issues
- Create a new issue with details
- Join our community discussions

### Reporting Issues
When reporting issues, please include:
- Operating system and version
- Browser and version
- Steps to reproduce
- Error messages
- Expected vs actual behavior

## 🗺️ Roadmap

### Upcoming Features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app companion
- [ ] Advanced reporting
- [ ] API rate limiting UI
- [ ] Custom themes
- [ ] Plugin system

### Technical Improvements
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Advanced caching strategies
- [ ] Performance optimizations
- [ ] Enhanced testing coverage

## 📊 Statistics

- **Lines of Code**: ~50,000
- **Test Coverage**: 85%+
- **Supported Languages**: English (more coming soon)
- **Browser Support**: Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Yes

## 🙏 Acknowledgments

- Django team for the excellent framework
- React community for amazing tools
- All contributors and users
- Open source community

---

**Made with ❤️ by the OffChat Team**

---

## Quick Links

- [📖 Documentation](docs/)
- [🚀 Quick Start](docs/SETUP.md)
- [🔒 Security](docs/SECURITY.md)
- [🐛 Troubleshooting](docs/TROUBLESHOOTING.md)
- [💻 Development](docs/DEVELOPMENT.md)
- [📊 Features](docs/FEATURES.md)
