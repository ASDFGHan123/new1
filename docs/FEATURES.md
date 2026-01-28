# OffChat Admin Nexus - Features Documentation

## Table of Contents
- [Online Status Tracking](#online-status-tracking)
- [User Management](#user-management)
- [Settings Management](#settings-management)
- [Video Features](#video-features)
- [Trash Management](#trash-management)
- [Notification System](#notification-system)
- [Audit Logging](#audit-logging)
- [Backup & Restore](#backup--restore)

---

## Online Status Tracking

### Overview
The online status tracking system allows real-time monitoring of user presence in the chat application.

### Features
- Real-time online/offline status updates
- Last seen timestamps
- Heartbeat mechanism for connection monitoring
- WebSocket integration for instant updates

### Implementation Details
- Uses Django channels for WebSocket connections
- Heartbeat endpoint at `/users/heartbeat/`
- Automatic status updates based on user activity
- Configurable timeout periods

### Configuration
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

---

## User Management

### Overview
Comprehensive user management system with role-based access control.

### Features
- User creation, editing, and deletion
- Role assignment (admin, moderator, user)
- Permission management
- User status management (active, suspended, banned)
- Department and office assignments

### Moderator Permissions
Moderators can be assigned specific permissions:
- `view_users` - View user list
- `create_user` - Create new users
- `edit_user` - Edit user details
- `delete_user` - Delete users
- `view_audit_logs` - View audit logs

### API Endpoints
- `GET /api/admin/users/` - List users
- `POST /api/admin/users/` - Create user
- `PUT /api/admin/users/{id}/` - Update user
- `DELETE /api/admin/users/{id}/` - Delete user
- `GET /api/admin/permissions/moderators/` - List moderators with permissions
- `PUT /api/admin/permissions/set/{user_id}/` - Set user permissions

---

## Settings Management

### Overview
System settings management for configuring various aspects of the application.

### Features
- System-wide configuration
- Email settings
- Security settings
- Notification preferences
- Chat settings

### Categories
1. **General Settings**
   - Application name
   - Default language
   - Time zone settings

2. **Email Settings**
   - SMTP configuration
   - Email templates
   - Notification settings

3. **Security Settings**
   - Password policies
   - Session timeout
   - Two-factor authentication

4. **Chat Settings**
   - Message retention
   - File upload limits
   - Chat moderation rules

---

## Video Features

### Overview
Video sharing and management capabilities within the chat system.

### Features
- Video upload and storage
- Video streaming
- Video metadata management
- Video permissions

### Implementation
- Uses Django's file storage system
- Supports multiple video formats
- Configurable storage limits
- Video thumbnail generation

### API Endpoints
- `POST /api/admin/videos/upload/` - Upload video
- `GET /api/admin/videos/` - List videos
- `DELETE /api/admin/videos/{id}/` - Delete video

---

## Trash Management

### Overview
Soft delete system for recovering deleted items.

### Features
- Soft delete for users, messages, and other entities
- Trash bin for deleted items
- Restore functionality
- Permanent deletion option
- Auto-cleanup of old trash items

### Implementation
- Uses Django signals to handle soft deletes
- Separate trash management interface
- Configurable retention periods

### API Endpoints
- `GET /api/admin/trash/` - List trash items
- `POST /api/admin/trash/restore/{id}/` - Restore item
- `DELETE /api/admin/trash/permanent/{id}/` - Permanent delete

---

## Notification System

### Overview
Real-time notification system for user alerts and system messages.

### Features
- Real-time notifications
- Email notifications
- Push notifications (mobile)
- Notification preferences
- Notification history

### Types of Notifications
1. **System Notifications**
   - Maintenance alerts
   - Security warnings
   - System updates

2. **User Notifications**
   - New messages
   - Friend requests
   - Group invitations

3. **Admin Notifications**
   - User reports
   - System alerts
   - Moderation actions

---

## Audit Logging

### Overview
Comprehensive audit trail for tracking system activities.

### Features
- User action logging
- System event tracking
- Admin activity monitoring
- Searchable log entries
- Log export functionality

### Logged Events
- User login/logout
- Permission changes
- Data modifications
- System configuration changes
- Security events

### Implementation
- Uses Django's logging framework
- Custom log handlers for specific events
- Log rotation and archival
- Configurable log levels

---

## Backup & Restore

### Overview
System backup and restore functionality for data protection.

### Features
- Automated backups
- Manual backup creation
- Selective restore options
- Backup scheduling
- Backup encryption

### Backup Types
1. **Database Backup**
   - Complete database dump
   - Incremental backups
   - Table-specific backups

2. **Media Backup**
   - User uploads
   - Video files
   - Document attachments

3. **Configuration Backup**
   - System settings
   - Environment variables
   - Custom configurations

### API Endpoints
- `POST /api/admin/backups/create/` - Create backup
- `GET /api/admin/backups/` - List backups
- `POST /api/admin/backups/restore/{id}/` - Restore from backup
- `DELETE /api/admin/backups/{id}/` - Delete backup

---

## Additional Features

### Department & Office Management
- Hierarchical organization structure
- Department-based user grouping
- Office locations
- Manager assignments

### Role-Based Access Control (RBAC)
- Granular permissions
- Role inheritance
- Custom roles
- Permission groups

### Real-time Features
- WebSocket connections
- Live updates
- Presence indicators
- Typing indicators

### Security Features
- Two-factor authentication
- Session management
- IP whitelisting
- Rate limiting
- CSRF protection

---

## Development Notes

### Technologies Used
- **Backend**: Django, Django REST Framework, Django Channels
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL (production), SQLite (development)
- **Cache**: Redis
- **Task Queue**: Celery
- **WebSocket**: Django Channels

### Architecture Patterns
- MVC (Model-View-Controller)
- RESTful API design
- Component-based frontend
- Microservices-ready structure

### Best Practices
- Code documentation
- Unit testing
- Integration testing
- Security audits
- Performance monitoring
