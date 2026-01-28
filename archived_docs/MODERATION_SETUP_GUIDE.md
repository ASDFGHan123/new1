# Moderation System - Quick Setup Guide

## Installation & Setup

### Step 1: Run Database Migration
```bash
python manage.py migrate --settings=offchat_backend.settings.development
```

This creates three new tables:
- `flagged_messages` - For message moderation
- `user_moderation` - For user actions (ban, suspend, etc.)
- `content_reviews` - For content review workflows

### Step 2: Verify Installation
The moderation system is already integrated into the admin dashboard:
- ✅ Backend models created
- ✅ API endpoints configured
- ✅ Frontend component created
- ✅ Sidebar tab added
- ✅ Routes configured

### Step 3: Access the Moderation Panel
1. Start the development servers:
   ```bash
   scripts\start-dev.bat
   ```

2. Navigate to Admin Dashboard (http://localhost:5173)

3. Click "Moderation" in the sidebar

4. You'll see three tabs:
   - **Message Moderation** - Review and manage flagged messages
   - **User Moderation** - Manage user suspensions and bans
   - **Content Review** - Approve/reject pending content

---

## Using the Moderation System

### Message Moderation

**Workflow:**
1. Users report inappropriate messages
2. Messages appear in "Message Moderation" tab with status "Pending"
3. Moderators review the message content
4. Moderators can:
   - **Approve** - Keep the message, mark as reviewed
   - **Reject** - Keep the message but mark as false report
   - **Remove** - Delete the message from the system

**Features:**
- Filter by status (Pending, Approved, Rejected, Removed)
- Filter by reason (Spam, Harassment, Hate Speech, Violence, Explicit, Misinformation, Other)
- Add review notes for each decision
- View reporter and timestamp information
- Real-time statistics

### User Moderation

**Workflow:**
1. Admin creates moderation action against a user
2. User's account status is updated (suspended/banned)
3. Moderation appears in "User Moderation" tab
4. Admin can:
   - **Lift** - Remove the moderation action early
   - **View** - See reason, duration, and moderator info

**Action Types:**
- **Suspend** - Temporary restriction (set duration in days)
- **Ban** - Permanent restriction
- **Warn** - Warning without restriction
- **Mute** - Cannot send messages

**Features:**
- Set duration for temporary actions
- View active moderations
- Lift moderations early
- Filter by status (Active, Expired, Lifted)
- Real-time statistics

### Content Review

**Workflow:**
1. Content is submitted for review (messages, profiles, groups)
2. Content appears in "Content Review" tab with status "Pending"
3. Moderators review the content
4. Moderators can:
   - **Approve** - Content is published/activated
   - **Reject** - Content is not published
   - **Start Review** - Mark as "In Review" to indicate work in progress

**Features:**
- Set priority levels (1=Low, 2=Normal, 3=High)
- Filter by status (Pending, In Review, Approved, Rejected)
- Filter by content type (Message, User Profile, Group)
- View content data in JSON format
- Add review notes
- Real-time statistics

---

## API Endpoints Reference

### Message Moderation
```
GET    /admin/flagged-messages/              List all flagged messages
POST   /admin/flagged-messages/              Create new flag
GET    /admin/flagged-messages/<id>/         Get message details
POST   /admin/flagged-messages/<id>/approve/ Approve message
POST   /admin/flagged-messages/<id>/reject/  Reject message
POST   /admin/flagged-messages/<id>/remove/  Remove message
GET    /admin/flagged-messages/stats/        Get statistics
```

### User Moderation
```
GET    /admin/user-moderation/               List all moderations
POST   /admin/user-moderation/               Create moderation
GET    /admin/user-moderation/<id>/          Get moderation details
POST   /admin/user-moderation/<id>/lift/     Lift moderation
GET    /admin/user-moderation/active/        Get active moderations
GET    /admin/user-moderation/stats/         Get statistics
```

### Content Review
```
GET    /admin/content-reviews/               List all reviews
POST   /admin/content-reviews/               Create review
GET    /admin/content-reviews/<id>/          Get review details
POST   /admin/content-reviews/<id>/approve/  Approve content
POST   /admin/content-reviews/<id>/reject/   Reject content
POST   /admin/content-reviews/<id>/start-review/ Start review
GET    /admin/content-reviews/pending/       Get pending reviews
GET    /admin/content-reviews/stats/         Get statistics
```

---

## Database Schema

### flagged_messages
```sql
CREATE TABLE flagged_messages (
    id UUID PRIMARY KEY,
    message_id VARCHAR(255),
    message_content TEXT,
    sender_id VARCHAR(255),
    sender_username VARCHAR(150),
    reason VARCHAR(50),
    description TEXT,
    status VARCHAR(20),
    reported_by_id INTEGER,
    reviewed_by_id INTEGER,
    review_notes TEXT,
    reported_at DATETIME,
    reviewed_at DATETIME
);
```

### user_moderation
```sql
CREATE TABLE user_moderation (
    id UUID PRIMARY KEY,
    user_id INTEGER,
    action_type VARCHAR(20),
    reason TEXT,
    status VARCHAR(20),
    duration_days INTEGER,
    moderator_id INTEGER,
    created_at DATETIME,
    expires_at DATETIME,
    lifted_at DATETIME
);
```

### content_reviews
```sql
CREATE TABLE content_reviews (
    id UUID PRIMARY KEY,
    content_type VARCHAR(20),
    content_id VARCHAR(255),
    content_data JSON,
    status VARCHAR(20),
    priority INTEGER,
    submitted_by_id INTEGER,
    reviewed_by_id INTEGER,
    review_notes TEXT,
    created_at DATETIME,
    reviewed_at DATETIME
);
```

---

## Example Usage

### Creating a User Moderation via API
```bash
curl -X POST http://localhost:8000/admin/user-moderation/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "user-id",
    "action_type": "suspend",
    "reason": "Violating community guidelines",
    "duration_days": 7
  }'
```

### Approving a Flagged Message
```bash
curl -X POST http://localhost:8000/admin/flagged-messages/message-id/approve/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Message is appropriate"
  }'
```

### Getting Statistics
```bash
curl -X GET http://localhost:8000/admin/flagged-messages/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Migration Fails
- Ensure you're using the correct settings: `--settings=offchat_backend.settings.development`
- Check that the database is accessible
- Verify no other migrations are pending

### Moderation Tab Not Showing
- Clear browser cache
- Restart development server
- Check browser console for errors

### API Endpoints Return 404
- Verify URLs are correct in `admin_panel/urls.py`
- Check that moderation_views.py is properly imported
- Restart Django server

### No Data Showing
- Ensure migration has run successfully
- Check that you're authenticated as admin
- Verify data exists in database via Django admin

---

## Next Steps

1. **Test the system** by creating test data
2. **Configure moderation rules** (optional)
3. **Set up notifications** for moderators
4. **Create moderation team** with different roles
5. **Monitor statistics** and adjust policies

---

## Support

For issues or questions:
1. Check the MODERATION_SYSTEM_COMPLETE.md file
2. Review the API endpoints documentation
3. Check Django logs for errors
4. Verify database migrations completed successfully
