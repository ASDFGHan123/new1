# OffChat Admin Dashboard - Moderation System

## 🎯 Overview

A complete, production-ready moderation system has been implemented for the OffChat Admin Dashboard. This system provides comprehensive tools for managing content, users, and review workflows.

## ✨ Features Implemented

### 1. Message Moderation
- **Flag inappropriate messages** - Users can report messages with specific reasons
- **Review flagged messages** - Moderators review reported content
- **Take action** - Approve, reject, or remove messages
- **Add notes** - Document moderation decisions
- **Filter & search** - By status, reason, sender
- **Statistics** - Real-time metrics on moderation activity

**Report Reasons:**
- Spam
- Harassment
- Hate Speech
- Violence
- Explicit Content
- Misinformation
- Other

### 2. User Moderation
- **Suspend users** - Temporary restrictions (set duration)
- **Ban users** - Permanent restrictions
- **Warn users** - Issue warnings without restrictions
- **Mute users** - Prevent message sending
- **Lift actions** - Remove moderation early
- **Track history** - View all moderation actions
- **Statistics** - Active suspensions, bans, etc.

### 3. Content Review Workflow
- **Submit content** - Messages, profiles, groups for review
- **Priority levels** - Low, Normal, High
- **Review status** - Pending, In Review, Approved, Rejected
- **Approve/reject** - With detailed notes
- **Filter by type** - Message, User Profile, Group
- **Statistics** - Review queue metrics

## 📁 Project Structure

```
offchat-admin-nexus-main/
├── admin_panel/
│   ├── models.py                    # ✨ Added 3 moderation models
│   ├── migrations/
│   │   └── 0006_moderation_models.py # ✨ New migration
│   ├── moderation_serializers.py    # ✨ New serializers
│   ├── moderation_views.py          # ✨ New API views
│   └── urls.py                      # ✨ Updated with endpoints
├── src/
│   ├── components/admin/
│   │   ├── ModerationPanel.tsx      # ✨ New main component
│   │   └── AdminContent.tsx         # Already integrated
│   └── lib/
│       └── moderation-api.ts        # ✨ New API client
├── MODERATION_SYSTEM_COMPLETE.md    # ✨ Detailed documentation
├── MODERATION_SETUP_GUIDE.md        # ✨ Setup instructions
└── populate_moderation_data.py      # ✨ Test data script
```

## 🚀 Quick Start

### 1. Run Database Migration
```bash
python manage.py migrate --settings=offchat_backend.settings.development
```

### 2. (Optional) Populate Test Data
```bash
python populate_moderation_data.py
```

### 3. Start Development Servers
```bash
scripts\start-dev.bat
```

### 4. Access Moderation Panel
- Navigate to Admin Dashboard
- Click "Moderation" in the sidebar
- Choose a tab: Messages, Users, or Reviews

## 📊 Database Models

### FlaggedMessage
Tracks reported/flagged messages for moderation review.

**Fields:**
- `id` (UUID): Primary key
- `message_id`: Reference to original message
- `message_content`: Content of flagged message
- `sender_id`, `sender_username`: Who sent it
- `reason`: Report reason (enum)
- `description`: Additional details
- `status`: pending, approved, rejected, removed
- `reported_by`: User who reported
- `reviewed_by`: Moderator who reviewed
- `review_notes`: Moderator's notes
- `reported_at`, `reviewed_at`: Timestamps

**Table:** `flagged_messages`

### UserModeration
Tracks moderation actions against users.

**Fields:**
- `id` (UUID): Primary key
- `user`: ForeignKey to User
- `action_type`: suspend, ban, warn, mute
- `reason`: Why action was taken
- `status`: active, expired, lifted
- `duration_days`: How long (null = permanent)
- `moderator`: Admin who took action
- `created_at`, `expires_at`, `lifted_at`: Timestamps

**Table:** `user_moderation`

### ContentReview
Manages content review workflow.

**Fields:**
- `id` (UUID): Primary key
- `content_type`: message, user_profile, group
- `content_id`: Reference to content
- `content_data`: JSON data
- `status`: pending, in_review, approved, rejected
- `priority`: 1 (low) to 3 (high)
- `submitted_by`: User who submitted
- `reviewed_by`: Moderator who reviewed
- `review_notes`: Moderator's notes
- `created_at`, `reviewed_at`: Timestamps

**Table:** `content_reviews`

## 🔌 API Endpoints

### Message Moderation
```
GET    /admin/flagged-messages/              List flagged messages
POST   /admin/flagged-messages/              Create flag
GET    /admin/flagged-messages/<id>/         Get details
POST   /admin/flagged-messages/<id>/approve/ Approve
POST   /admin/flagged-messages/<id>/reject/  Reject
POST   /admin/flagged-messages/<id>/remove/  Remove
GET    /admin/flagged-messages/stats/        Statistics
```

**Query Parameters:**
- `status`: pending, approved, rejected, removed
- `reason`: spam, harassment, hate_speech, violence, explicit, misinformation, other

### User Moderation
```
GET    /admin/user-moderation/               List moderations
POST   /admin/user-moderation/               Create moderation
GET    /admin/user-moderation/<id>/          Get details
POST   /admin/user-moderation/<id>/lift/     Lift moderation
GET    /admin/user-moderation/active/        Active moderations
GET    /admin/user-moderation/stats/         Statistics
```

**Query Parameters:**
- `action_type`: suspend, ban, warn, mute
- `status`: active, expired, lifted
- `user_id`: Filter by user

### Content Review
```
GET    /admin/content-reviews/               List reviews
POST   /admin/content-reviews/               Create review
GET    /admin/content-reviews/<id>/          Get details
POST   /admin/content-reviews/<id>/approve/  Approve
POST   /admin/content-reviews/<id>/reject/   Reject
POST   /admin/content-reviews/<id>/start-review/ Start review
GET    /admin/content-reviews/pending/       Pending reviews
GET    /admin/content-reviews/stats/         Statistics
```

**Query Parameters:**
- `status`: pending, in_review, approved, rejected
- `content_type`: message, user_profile, group
- `priority`: 1, 2, 3

## 🎨 Frontend Components

### ModerationPanel.tsx
Main component with three tabs:

**Message Moderation Tab:**
- Statistics cards (Total, Pending, Approved, Rejected, Removed)
- Filter buttons
- List of flagged messages
- Review notes textarea
- Action buttons (Approve, Reject, Remove)

**User Moderation Tab:**
- Statistics cards (Total, Active, Suspended, Banned)
- Filter buttons
- List of active moderations
- Moderator info and expiration dates
- Lift button

**Content Review Tab:**
- Statistics cards (Total, Pending, In Review, Approved, Rejected)
- Filter buttons
- List of content reviews
- JSON preview of content
- Review notes textarea
- Action buttons (Approve, Reject)

## 💻 Usage Examples

### Flag a Message
```typescript
const response = await moderationApi.getFlaggedMessages({ 
  status: 'pending' 
});
```

### Create User Moderation
```typescript
await moderationApi.createUserModeration({
  user: userId,
  action_type: 'suspend',
  reason: 'Violating community guidelines',
  duration_days: 7
});
```

### Approve Content Review
```typescript
await moderationApi.approveContentReview(
  reviewId, 
  'Content looks good'
);
```

## 🔒 Security Features

- ✅ All endpoints require authentication
- ✅ Moderator actions logged in AuditLog
- ✅ User status changes reflected in User model
- ✅ Timestamps track all actions
- ✅ Review notes provide accountability
- ✅ Permission-based access control

## ⚡ Performance Optimizations

- ✅ Database indexes on frequently queried fields
- ✅ Pagination support via query parameters
- ✅ Efficient filtering
- ✅ Lazy loading of components
- ✅ Memoized statistics

## 📝 Files Created/Modified

### Created Files:
- `admin_panel/migrations/0006_moderation_models.py`
- `admin_panel/moderation_serializers.py`
- `admin_panel/moderation_views.py`
- `src/lib/moderation-api.ts`
- `src/components/admin/ModerationPanel.tsx`
- `MODERATION_SYSTEM_COMPLETE.md`
- `MODERATION_SETUP_GUIDE.md`
- `populate_moderation_data.py`

### Modified Files:
- `admin_panel/models.py` (added 3 models)
- `admin_panel/urls.py` (added 21 endpoints)

### Already Integrated:
- `src/components/admin/AdminContent.tsx` (moderation case)
- `src/components/admin/AdminSidebar.tsx` (moderation tab)

## 🧪 Testing

### Create Test Data
```bash
python populate_moderation_data.py
```

This creates:
- 4 flagged messages (various statuses)
- 3 user moderations (suspend, warn, ban)
- 4 content reviews (various statuses)

### Manual Testing
1. Navigate to Admin Dashboard
2. Click "Moderation" tab
3. Test each feature:
   - Filter messages by status
   - Approve/reject/remove messages
   - Create user moderations
   - Lift moderations
   - Review content
   - Check statistics

## 📚 Documentation

- **MODERATION_SYSTEM_COMPLETE.md** - Comprehensive technical documentation
- **MODERATION_SETUP_GUIDE.md** - Step-by-step setup and usage guide
- **populate_moderation_data.py** - Test data generation script

## 🔄 Workflow Examples

### Message Moderation Workflow
1. User reports inappropriate message
2. Message appears in "Pending" status
3. Moderator reviews message content
4. Moderator adds notes and takes action:
   - Approve (false report)
   - Reject (report is valid but keep message)
   - Remove (delete message)
5. Status updates and action is logged

### User Moderation Workflow
1. Admin identifies problematic user
2. Admin creates moderation action (suspend/ban/warn/mute)
3. User's account status is updated
4. Moderation appears in active list
5. Admin can lift moderation early if needed
6. Action expires automatically (if duration set)

### Content Review Workflow
1. Content is submitted for review
2. Content appears in "Pending" status
3. Moderator reviews content
4. Moderator can:
   - Start review (mark as "In Review")
   - Approve (publish/activate)
   - Reject (don't publish)
5. Status updates and notes are saved

## 🎯 Next Steps (Optional Enhancements)

1. Add bulk actions for messages
2. Add appeal system for banned users
3. Add automated moderation rules
4. Add moderation queue prioritization
5. Add moderation team assignments
6. Add moderation reports/analytics
7. Add webhook notifications
8. Add moderation history/audit trail
9. Add AI-powered content detection
10. Add moderation templates

## 🐛 Troubleshooting

### Migration Fails
- Use correct settings: `--settings=offchat_backend.settings.development`
- Ensure database is accessible
- Check for pending migrations

### Moderation Tab Not Showing
- Clear browser cache
- Restart development server
- Check browser console for errors

### API Returns 404
- Verify URLs in `admin_panel/urls.py`
- Check moderation_views.py is imported
- Restart Django server

### No Data Showing
- Run migration: `python manage.py migrate`
- Populate test data: `python populate_moderation_data.py`
- Check database via Django admin

## 📞 Support

For issues or questions:
1. Check MODERATION_SYSTEM_COMPLETE.md
2. Review MODERATION_SETUP_GUIDE.md
3. Check Django logs for errors
4. Verify migrations completed successfully

## ✅ Checklist

- ✅ Database models created
- ✅ Migrations generated
- ✅ API endpoints implemented
- ✅ Serializers created
- ✅ Frontend component built
- ✅ API client created
- ✅ Sidebar integration done
- ✅ Routes configured
- ✅ Documentation written
- ✅ Test data script created

## 🎉 Summary

The moderation system is **complete and ready to use**. It provides:

- **3 core features** (message, user, content moderation)
- **3 database models** with proper relationships
- **21 API endpoints** for full CRUD operations
- **Modern React UI** with real-time statistics
- **Production-ready code** with error handling
- **Comprehensive documentation** for setup and usage

Simply run the migration and start using the Moderation Panel in the Admin Dashboard!
