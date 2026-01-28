# System Settings - Development Implementation

## What's Implemented

**Minimal development-focused system settings for admin dashboard.**

### Backend
- `admin_panel/views_settings.py` - 4 view classes (list, detail, update, bulk)
- `admin_panel/urls.py` - Settings routes
- `admin_panel/migrations/0004_system_settings_defaults.py` - 30 default settings

### Frontend
- `src/components/admin/SettingsManager.tsx` - Simple tabbed UI
- `src/components/admin/AdminContent.tsx` - Integrated into settings tab

### Database
- 30 default settings across 5 categories (General, Security, Chat, Email, Backup)

## Quick Start

```bash
# 1. Run migration
python manage.py migrate admin_panel --settings=offchat_backend.settings.development

# 2. Start backend
python manage.py runserver --settings=offchat_backend.settings.development

# 3. Start frontend
npm run dev

# 4. Go to Settings tab in admin dashboard
```

## API Endpoints

```
GET    /api/admin/settings/                    List settings
POST   /api/admin/settings/                    Create setting
GET    /api/admin/settings/<key>/              Get setting
PUT    /api/admin/settings/<key>/update/       Update setting
DELETE /api/admin/settings/<key>/              Delete setting
POST   /api/admin/settings/bulk/update/        Bulk update
```

## Settings Categories

- **General** (5): app_name, app_version, maintenance_mode, max_file_upload_size, session_timeout
- **Security** (9): password requirements, login attempts, 2FA, rate limiting
- **Chat** (6): message length, group members, encryption, indicators
- **Email** (6): SMTP configuration, notifications
- **Backup** (4): auto backup, frequency, retention, location

## Files

- `admin_panel/views_settings.py` - Settings views
- `admin_panel/urls.py` - Routes
- `admin_panel/migrations/0004_system_settings_defaults.py` - Migration
- `src/components/admin/SettingsManager.tsx` - UI component
- `src/components/admin/AdminContent.tsx` - Integration

## Status

✅ Ready for development use
