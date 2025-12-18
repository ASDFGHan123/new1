# System Settings Implementation Guide

## Overview
Complete system settings management system for OffChat Admin Dashboard with full frontend, backend, and database integration.

## Architecture

### Backend Components

#### 1. **SystemSettings Model** (`admin_panel/models.py`)
- Stores all system configuration settings
- Categories: General, Security, Chat, Email, Backup
- Fields:
  - `key`: Unique setting identifier
  - `value`: Setting value (stored as string)
  - `category`: Setting category
  - `description`: Human-readable description
  - `is_public`: Whether accessible to regular users
  - `updated_by`: Admin who last updated
  - `updated_at`: Last update timestamp

#### 2. **API Endpoints** (`admin_panel/urls.py`)
```
GET    /api/admin/settings/                    - List all settings (with optional category filter)
POST   /api/admin/settings/                    - Create new setting
GET    /api/admin/settings/<key>/              - Get specific setting
PUT    /api/admin/settings/<key>/update/       - Update setting
DELETE /api/admin/settings/<key>/              - Delete setting
POST   /api/admin/settings/bulk/update/        - Bulk update multiple settings
POST   /api/admin/settings/reset/              - Reset settings to defaults
```

#### 3. **Views** (`admin_panel/views.py`)
- `SystemSettingsListView`: List and create settings
- `SystemSettingDetailView`: Retrieve specific setting
- `SystemSettingUpdateView`: Update and delete settings
- `SystemSettingsBulkUpdateView`: Bulk update multiple settings
- All views include audit logging

#### 4. **Serializers** (`admin_panel/serializers.py`)
- `SystemSettingSerializer`: Read-only serialization
- `SystemSettingCreateUpdateSerializer`: Create/update with validation

### Frontend Components

#### 1. **SettingsManager Component** (`src/components/admin/SettingsManager.tsx`)
Features:
- Tabbed interface by category (General, Security, Chat, Email, Backup)
- Smart input rendering based on setting type:
  - Boolean settings → Toggle switches
  - Numeric settings → Number inputs
  - Enum settings → Select dropdowns
  - Text settings → Text inputs
- Real-time change tracking
- Unsaved changes indicator
- Bulk save functionality
- Reset to defaults option

#### 2. **Settings API Service** (`src/lib/settings-api.ts`)
Methods:
- `getAll(category?)`: Fetch all or filtered settings
- `getByKey(key)`: Get specific setting
- `update(key, data)`: Update single setting
- `bulkUpdate(settings)`: Update multiple settings
- `delete(key)`: Delete setting
- `reset(category?)`: Reset to defaults

### Database

#### Migration: `0004_system_settings_defaults.py`
Creates 30 default settings across 5 categories:

**General Settings (5)**
- `app_name`: Application name
- `app_version`: Version number
- `maintenance_mode`: Enable/disable maintenance
- `max_file_upload_size`: Max upload size (50MB default)
- `session_timeout`: Session timeout (3600s default)

**Security Settings (9)**
- `password_min_length`: Minimum 8 characters
- `password_require_uppercase`: Require uppercase
- `password_require_numbers`: Require numbers
- `password_require_special`: Require special chars
- `max_login_attempts`: 5 attempts before lockout
- `lockout_duration`: 900 seconds lockout
- `enable_two_factor`: 2FA toggle
- `rate_limit_enabled`: Rate limiting toggle
- `rate_limit_requests`: 100 requests/minute

**Chat Settings (6)**
- `max_message_length`: 5000 characters
- `max_group_members`: 500 members max
- `message_retention_days`: 90 days retention
- `enable_message_encryption`: E2E encryption
- `enable_typing_indicators`: Typing indicators
- `enable_read_receipts`: Read receipts

**Email Settings (6)**
- `email_notifications_enabled`: Email toggle
- `email_from_address`: From address
- `email_from_name`: From name
- `smtp_host`: SMTP server
- `smtp_port`: SMTP port
- `smtp_use_tls`: TLS toggle

**Backup Settings (4)**
- `auto_backup_enabled`: Auto backup toggle
- `backup_frequency`: daily/weekly/monthly
- `backup_retention_days`: 30 days retention
- `backup_location`: Backup directory

## Usage

### Admin Dashboard
1. Navigate to **Settings** tab in admin sidebar
2. Select category (General, Security, Chat, Email, Backup)
3. Modify settings as needed
4. Changes are tracked in real-time
5. Click **Save Changes** to persist
6. Click **Reset to Defaults** to revert all settings

### API Usage

**Get all settings:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/settings/
```

**Get settings by category:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/settings/?category=security
```

**Update single setting:**
```bash
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "true"}' \
  http://localhost:8000/api/admin/settings/maintenance_mode/update/
```

**Bulk update settings:**
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {"key": "maintenance_mode", "value": "true"},
      {"key": "rate_limit_requests", "value": "200"}
    ]
  }' \
  http://localhost:8000/api/admin/settings/bulk/update/
```

**Reset to defaults:**
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/settings/reset/
```

## Audit Logging
All setting changes are logged with:
- Action type: `SYSTEM_SETTINGS_CHANGED`
- Admin user who made change
- Old and new values
- Timestamp
- Category information

## Security Considerations
1. All endpoints require admin authentication
2. Settings are validated before saving
3. Sensitive settings (passwords, keys) should use `is_public=False`
4. All changes are audit logged
5. Rate limiting applies to API endpoints

## Integration Points

### Frontend
- Settings tab in admin sidebar
- Integrated into AdminContent component
- Uses centralized settings API service

### Backend
- Integrated with audit logging service
- Supports bulk operations
- Includes validation and error handling

### Database
- Indexed on key, category, is_public
- Supports efficient queries
- Automatic timestamp tracking

## Future Enhancements
1. Settings validation rules
2. Settings encryption for sensitive values
3. Settings versioning/history
4. Settings export/import
5. Settings templates
6. Real-time settings sync across instances
7. Settings webhooks for external systems

## Troubleshooting

**Settings not loading:**
- Check admin authentication
- Verify migration was applied: `python manage.py migrate admin_panel`
- Check browser console for API errors

**Changes not saving:**
- Verify admin permissions
- Check network tab for API response
- Review audit logs for errors

**Reset not working:**
- Ensure admin user exists
- Check database connectivity
- Verify migration data integrity

## Files Modified/Created

### Backend
- `admin_panel/models.py` - SystemSettings model (already existed)
- `admin_panel/serializers.py` - Updated with SystemSettingSerializer
- `admin_panel/views.py` - Added settings endpoints
- `admin_panel/urls.py` - Added settings routes
- `admin_panel/migrations/0004_system_settings_defaults.py` - Default settings

### Frontend
- `src/components/admin/SettingsManager.tsx` - Settings UI component
- `src/components/admin/AdminContent.tsx` - Updated to include settings
- `src/lib/settings-api.ts` - Settings API service
- `src/components/admin/AdminSidebar.tsx` - Already has settings link

## Deployment Checklist
- [ ] Run migrations: `python manage.py migrate admin_panel`
- [ ] Verify settings appear in admin dashboard
- [ ] Test creating/updating settings
- [ ] Test bulk update functionality
- [ ] Test reset to defaults
- [ ] Verify audit logs record changes
- [ ] Test with different user roles
- [ ] Monitor API performance
- [ ] Backup database before production deployment
