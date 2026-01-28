# OffChat Admin Nexus - Development Guide

## Table of Contents
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Database Development](#database-development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Development Environment

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Git

### IDE Setup
Recommended IDEs and configurations:
- **VS Code**: Python, TypeScript, and Django extensions
- **PyCharm**: Django and JavaScript support
- **WebStorm**: Frontend development

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.django",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Environment Configuration
```bash
# .env.development
DEBUG=True
SECRET_KEY=dev-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=offchat_dev
DB_USER=postgres
DB_PASSWORD=dev_password
REDIS_URL=redis://localhost:6379/0
```

---

## Project Structure

```
offchat-admin-nexus-main/
├── admin_panel/           # Django admin app
│   ├── views/            # Admin views
│   ├── urls.py           # Admin URLs
│   └── services/         # Business logic
├── users/                # User management app
│   ├── models.py         # User models
│   ├── views.py          # User views
│   └── management/       # Django management commands
├── chat/                 # Chat functionality
│   ├── models.py         # Chat models
│   ├── consumers.py      # WebSocket consumers
│   └── routing.py        # WebSocket routing
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and API
│   └── pages/            # Page components
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── requirements.txt      # Python dependencies
├── package.json          # Node dependencies
└── manage.py            # Django management
```

### Key Directories

#### Backend (Django)
- **admin_panel/**: Admin dashboard functionality
- **users/**: User authentication and management
- **chat/**: Real-time chat features
- **offchat_backend/**: Main Django project settings

#### Frontend (React)
- **src/components/**: Reusable UI components
- **src/contexts/**: React context providers
- **src/lib/**: API services and utilities
- **src/pages/**: Page-level components

---

## Coding Standards

### Python (Backend)

#### Code Style
Follow PEP 8 and Django best practices:
```python
# Good example
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for the User model."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get a list of users."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

#### Naming Conventions
- **Classes**: PascalCase (e.g., `UserViewSet`)
- **Functions/Variables**: snake_case (e.g., `get_user_data`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Private members**: underscore prefix (e.g., `_internal_method`)

#### Documentation
```python
def create_user(username: str, email: str, password: str) -> User:
    """
    Create a new user with the given credentials.
    
    Args:
        username: The user's username
        email: The user's email address
        password: The user's password (will be hashed)
    
    Returns:
        The created User instance
    
    Raises:
        ValidationError: If the username or email already exists
    """
    pass
```

### TypeScript (Frontend)

#### Code Style
```typescript
// Component example
interface UserProps {
  user: User;
  onUpdate: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserProps> = ({ 
  user, 
  onUpdate, 
  className = '' 
}) => {
  const handleUpdate = useCallback((updatedUser: User) => {
    onUpdate(updatedUser);
  }, [onUpdate]);

  return (
    <div className={`user-card ${className}`}>
      {/* Component JSX */}
    </div>
  );
};
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `UserCard`)
- **Functions/Variables**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `UserProps`)

#### TypeScript Best Practices
```typescript
// Use interfaces for object shapes
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Use generics for reusable components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

// Prefer explicit types
const fetchData = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users/');
  return response.data;
};
```

---

## Testing

### Backend Testing

#### Unit Tests
```python
# users/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_creation(self):
        """Test user creation with valid data."""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.check_password('testpass123'))
```

#### API Tests
```python
# users/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_users(self):
        """Test getting user list."""
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

#### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Testing

#### Unit Tests with Jest
```typescript
// src/components/__tests__/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from '../UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };
  
  const mockOnUpdate = jest.fn();
  
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('calls onUpdate when update button is clicked', () => {
    render(<UserCard user={mockUser} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    expect(mockOnUpdate).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Running Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: Feature branches
- **bugfix/***: Bug fix branches
- **hotfix/***: Critical fixes

### Commit Messages
Follow conventional commits:
```
feat: add user authentication
fix: resolve login issue
docs: update API documentation
style: format code with prettier
refactor: simplify user service
test: add unit tests for user model
chore: update dependencies
```

### Pull Request Process
1. Create feature branch from develop
2. Make changes with proper commits
3. Add tests for new features
4. Update documentation
5. Create pull request to develop
6. Request code review
7. Merge after approval

---

## API Development

### RESTful API Design

#### Endpoint Structure
```
GET    /api/users/           # List users
POST   /api/users/           # Create user
GET    /api/users/{id}/      # Get user
PUT    /api/users/{id}/      # Update user
DELETE /api/users/{id}/      # Delete user
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "message": "User created successfully"
}
```

#### Error Handling
```python
# Custom exception handler
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    if isinstance(exc, ValidationError):
        return Response({
            'success': False,
            'error': exc.detail,
            'code': 'validation_error'
        }, status=400)
    
    return exception_handler(exc, context)
```

### API Documentation
```python
# Using drf-spectacular for OpenAPI
from drf_spectacular.utils import extend_schema, OpenApiParameter

@extend_schema(
    summary='List all users',
    description='Retrieve a paginated list of users',
    parameters=[
        OpenApiParameter(
            name='page',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Page number'
        )
    ],
    responses={200: UserSerializer}
)
def list(self, request):
    pass
```

---

## Frontend Development

### Component Architecture

#### Component Structure
```typescript
// src/components/admin/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/lib/api';
import { User } from '@/types';

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  onUserSelect,
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.get<User[]>('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management">
      {/* Component JSX */}
    </div>
  );
};
```

#### State Management
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await apiService.post<AuthResponse>('/auth/login/', credentials);
      setUser(response.data.user);
      // Store token
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Styling with Tailwind CSS
```typescript
// Component with Tailwind classes
export const UserCard: React.FC<UserProps> = ({ user, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {user.username}
          </h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={() => onUpdate(user)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
};
```

---

## Database Development

### Models
```python
# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Custom user model with additional fields."""
    
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User'),
            ('moderator', 'Moderator'),
            ('admin', 'Admin'),
        ],
        default='user'
    )
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    last_seen = models.DateTimeField(null=True, blank=True)
    online_status = models.CharField(
        max_length=20,
        choices=[
            ('online', 'Online'),
            ('offline', 'Offline'),
            ('away', 'Away'),
        ],
        default='offline'
    )

    def __str__(self):
        return self.username
```

### Migrations
```python
# Create migration
python manage.py makemigrations users

# Apply migration
python manage.py migrate users

# Create empty migration
python manage.py makemigrations --empty users

# Data migration example
def forwards_func(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        user.role = 'user'
        user.save()
```

### Query Optimization
```python
# Use select_related and prefetch_related
users = User.objects.select_related('department').prefetch_related('groups')

# Use indexes
class User(models.Model):
    username = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['username', 'email']),
        ]
```

---

## Deployment

### Docker Configuration
```dockerfile
# Dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["daphne", "offchat_backend.asgi:application", "-b", "0.0.0.0", "-p", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379/0

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=offchat_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Production Settings
```python
# settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## Contributing

### Code Review Guidelines
1. **Functionality**: Does the code work as intended?
2. **Style**: Is the code readable and follows standards?
3. **Tests**: Are there adequate tests?
4. **Documentation**: Is the code documented?
5. **Performance**: Is the code efficient?

### Issue Reporting
1. Use descriptive titles
2. Provide detailed description
3. Include steps to reproduce
4. Add error messages/logs
5. Suggest possible solutions

### Feature Requests
1. Explain the use case
2. Describe desired behavior
3. Consider implementation complexity
4. Discuss alternatives

---

## Development Tools

### Linting and Formatting
```bash
# Python
pip install black flake8 isort
black .
flake8 .
isort .

# TypeScript/JavaScript
npm install -D prettier eslint
npm run lint
npm run format
```

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v2.7.1
    hooks:
      - id: prettier
        files: \.(js|ts|tsx|json|css|md)$
```

### IDE Configuration
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

---

## Performance Optimization

### Backend Optimization
1. **Database Queries**
   - Use `select_related` and `prefetch_related`
   - Add database indexes
   - Optimize N+1 queries

2. **Caching**
   - Redis for session storage
   - View caching
   - Template fragment caching

3. **Async Processing**
   - Celery for background tasks
   - Async views for I/O operations

### Frontend Optimization
1. **Code Splitting**
   - Lazy loading components
   - Route-based code splitting
   - Dynamic imports

2. **Performance Monitoring**
   - React DevTools Profiler
   - Bundle size analysis
   - Performance metrics

---

## Security Considerations

### Backend Security
1. **Authentication**
   - JWT token validation
   - Secure password hashing
   - Session management

2. **Authorization**
   - Role-based access control
   - Permission checking
   - API rate limiting

### Frontend Security
1. **XSS Prevention**
   - Input sanitization
   - Content Security Policy
   - Safe HTML rendering

2. **Data Protection**
   - Secure token storage
   - HTTPS enforcement
   - Sensitive data handling
