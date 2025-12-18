# System Settings - Quick Start Guide

## 🚀 Quick Setup (2 minutes)

### Step 1: Run Migration
```bash
python manage.py migrate admin_panel --settings=offchat_backend.settings.development
```

### Step 2: Start Backend
```bash
python manage.py runserver --settings=offchat_backend.settings.development
```

### Step 3: Start Frontend
```bash
npm run dev
```

### Step 4: Access Settings
1. Go to http://localhost:5173
2. Login as admin
3. Click "Settings" in sidebar
4. Done! ✅

## 📋 Settings Categories

| Category | Settings | Purpose |
|----------|----------|---------|
| **General** | 5 | App name, version, maintenance, uploads, timeouts |
| **Security** | 9 | Passwords, login, 2FA, rate limiting |
| **Chat** | 6 | Messages, groups, encryption, indicators |
| **Email** | 6 | SMTP, notifications, TLS |
| **Backup** | 4 | Auto backup, frequency, retention |

## 🎯 Common Tasks

### Change Password Requirements
1. Go to Settings → Security
2. Toggle password requirements
3. Save Changes

### Enable Maintenance Mode
1. Go to Settings → General
2. Toggle "Maintenance Mode"
3. Save Changes

### Configure Email
1. Go to Settings → Email
2. Update SMTP settings
3. Save Changes

### Adjust Rate Limiting
1. Go to Settings → Security
2. Change "Rate Limit Requests"
3. Save Changes

## 🔧 API Quick Reference

### Get All Settings
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/settings/
```

### Update One Setting
```bash
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "true"}' \
  http://localhost:8000/api/admin/settings/maintenance_mode/update/
```

### Update Multiple Settings
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

### Reset All Settings
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/admin/settings/reset/
```

## 📊 Default Values

### General
- `app_name`: OffChat
- `app_version`: 1.0.0
- `maintenance_mode`: false
- `max_file_upload_size`: 52428800 (50MB)
- `session_timeout`: 3600 (1 hour)

### Security
- `password_min_length`: 8
- `max_login_attempts`: 5
- `lockout_duration`: 900 (15 min)
- `rate_limit_requests`: 100/min
- `enable_two_factor`: false

### Chat
- `max_message_length`: 5000
- `max_group_members`: 500
- `message_retention_days`: 90
- `enable_message_encryption`: true
- `enable_typing_indicators`: true
- `enable_read_receipts`: true

### Email
- `email_notifications_enabled`: true
- `email_from_address`: noreply@offchat.com
- `smtp_host`: smtp.gmail.com
- `smtp_port`: 587
- `smtp_use_tls`: true

### Backup
- `auto_backup_enabled`: true
- `backup_frequency`: daily
- `backup_retention_days`: 30
- `backup_location`: /backups

## ✅ Verification Checklist

- [ ] Migration ran successfully
- [ ] Settings appear in admin dashboard
- [ ] Can modify settings
- [ ] Changes save correctly
- [ ] Audit logs show changes
- [ ] Reset to defaults works
- [ ] API endpoints respond
- [ ] No console errors

## 🐛 Troubleshooting

**Settings not showing?**
- Check migration: `python manage.py showmigrations admin_panel`
- Verify admin login
- Check browser console

**Changes not saving?**
- Check network tab for errors
- Verify admin permissions
- Check server logs

**API returning 404?**
- Verify URL path
- Check admin authentication
- Ensure migration applied

## 📚 Full Documentation

See `docs/SYSTEM_SETTINGS_GUIDE.md` for complete documentation.

## 🎓 Key Concepts

- **Settings**: System-wide configuration values
- **Categories**: Logical grouping (General, Security, etc.)
- **Audit Log**: Records all changes with admin user
- **Bulk Update**: Update multiple settings in one request
- **Reset**: Revert all settings to defaults

## 🔐 Security Notes

✅ Admin authentication required
✅ All changes logged
✅ Input validation
✅ Rate limiting support
✅ Sensitive settings marked private

## 📞 Support

For issues or questions:
1. Check `docs/SYSTEM_SETTINGS_GUIDE.md`
2. Review audit logs for errors
3. Check server logs
4. Verify database connectivity

---

**Status**: ✅ Ready for Production
**Last Updated**: 2024
**Version**: 1.0.0
