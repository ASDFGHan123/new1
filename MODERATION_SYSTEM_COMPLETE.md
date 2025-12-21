# Moderation System Implementation Summary

## Overview
A complete, production-ready moderation system has been implemented for the OffChat Admin Dashboard with three core features:

1. **Message Moderation** - Flag, review, and manage inappropriate messages
2. **User Moderation** - Suspend, ban, warn, or mute users
3. **Content Review Workflows** - Approve/reject pending content submissions

---

## Database Models (SQLite)

### 1. FlaggedMessage
- **Purpose**: Track reported/flagged messages for moderation review
- **Fields**:
  - `id` (UUID): Primary key
  - `message_id`: Reference to original message
  - `message_content`: Content of flagged message
  - `sender_id`, `sender_username`: User who sent the message
  - `reason`: Report reason (spam, harassment, hate_speech, violence, explicit, misinformation, other)
  - `description`: Additional details from reporter
  - `status`: pending, approved, rejected, removed
  - `reported_by`: User who reported it
  - `reviewed_by`: Moderator who reviewed it
  - `review_notes`: Moderator's notes
  - `reported_at`, `reviewed_at`: Timestamps

**Methods**:
- `approve(reviewed_by, notes)`: Mark as approved
- `reject(reviewed_by, notes)`: Mark as rejected
- `remove(reviewed_by, notes)`: Remove the message

### 2. UserModeration
- **Purpose**: Track moderation actions taken against users
- **Fields**:
  - `id` (UUID): Primary key
  - `user`: ForeignKey to User being moderated
  - `action_type`: suspend, ban, warn, mute
  - `reason`: Why action was taken
  - `status`: active, expired, lifted
  - `duration_days`: How long the action lasts (null = permanent)
  - `moderator`: Admin who took the action
  - `created_at`, `expires_at`, `lifted_at`: Timestamps

**Methods**:
- `is_active()`: Check if moderation is currently active
- `lift()`: Remove the moderation action

### 3. ContentReview
- **Purpose**: Manage content review workflow for new submissions
- **Fields**:
  - `id` (UUID): Primary key
  - `content_type`: message, user_profile, group
  - `content_id`: Reference to content
  - `content_data`: JSON data of the content
  - `status`: pending, in_review, approved, rejected
  - `priority`: 1 (low) to 3 (high)
  - `submitted_by`: User who submitted
  - `reviewed_by`: Moderator who reviewed
  - `review_notes`: Moderator's notes
  - `created_at`, `reviewed_at`: Timestamps

**Methods**:
- `approve(reviewed_by, notes)`: Approve content
- `reject(reviewed_by, notes)`: Reject content

---

## Backend API Endpoints

### Message Moderation
```
GET    /admin/flagged-messages/              - List flagged messages
POST   /admin/flagged-messages/              - Create new flag
GET    /admin/flagged-messages/<id>/         - Get details
POST   /admin/flagged-messages/<id>/approve/ - Approve message
POST   /admin/flagged-messages/<id>/reject/  - Reject message
POST   /admin/flagged-messages/<id>/remove/  - Remove message
GET    /admin/flagged-messages/stats/        - Get statistics
```

**Query Parameters**:
- `status`: Filter by status (pending, approved, rejected, removed)
- `reason`: Filter by report reason

### User Moderation
```
GET    /admin/user-moderation/               - List moderations
POST   /admin/user-moderation/               - Create moderation
GET    /admin/user-moderation/<id>/          - Get details
POST   /admin/user-moderation/<id>/lift/     - Lift moderation
GET    /admin/user-moderation/active/        - Get active moderations
GET    /admin/user-moderation/stats/         - Get statistics
```

**Query Parameters**:
- `action_type`: Filter by action (suspend, ban, warn, mute)
- `status`: Filter by status (active, expired, lifted)
- `user_id`: Filter by user

### Content Review
```
GET    /admin/content-reviews/               - List reviews
POST   /admin/content-reviews/               - Create review
GET    /admin/content-reviews/<id>/          - Get details
POST   /admin/content-reviews/<id>/approve/  - Approve content
POST   /admin/content-reviews/<id>/reject/   - Reject content
POST   /admin/content-reviews/<id>/start-review/ - Start review
GET    /admin/content-reviews/pending/       - Get pending reviews
GET    /admin/content-reviews/stats/         - Get statistics
```

**Query Parameters**:
- `status`: Filter by status (pending, in_review, approved, rejected)
- `content_type`: Filter by type (message, user_profile, group)
- `priority`: Filter by priority (1, 2, 3)

---

## Frontend Components

### ModerationPanel.tsx
Main component with three tabs:

1. **Message Moderation Tab**
   - Statistics cards (Total, Pending, Approved, Rejected, Removed)
   - Filter buttons for each status
   - List of flagged messages with:
     - Sender info and reason
     - Message preview
     - Status badge
     - Review notes textarea
     - Action buttons (Approve, Reject, Remove)

2. **User Moderation Tab**
   - Statistics cards (Total, Active, Suspended, Banned)
   - Filter buttons for each status
   - List of active moderations with:
     - Username and action type
     - Reason for action
     - Moderator info
     - Expiration date (if applicable)
     - Lift button to remove moderation

3. **Content Review Tab**
   - Statistics cards (Total, Pending, In Review, Approved, Rejected)
   - Filter buttons for each status
   - List of content reviews with:
     - Content type and priority
     - JSON preview of content
     - Status badge
     - Review notes textarea
     - Action buttons (Approve, Reject)

### Features
- Real-time statistics
- Filtering by status
- Review notes for each action
- Toast notifications for success/error
- Loading states
- Empty states
- Color-coded status badges

---

## API Client (moderation-api.ts)

TypeScript client with methods for:
- Getting flagged messages with filters
- Approving/rejecting/removing messages
- Getting message statistics
- Creating user moderations
- Lifting moderations
- Getting active moderations
- Getting moderation statistics
- Creating content reviews
- Approving/rejecting reviews
- Getting pending reviews
- Getting review statistics

---

## Database Migration

File: `admin_panel/migrations/0006_moderation_models.py`

Creates three new tables:
- `flagged_messages`
- `user_moderation`
- `content_reviews`

With appropriate indexes on:
- status, reason, reported_at, sender_id (flagged_messages)
- user, action_type, status, created_at (user_moderation)
- status, content_type, priority, created_at (content_reviews)

---

## Integration Steps

1. **Run migrations**:
   ```bash
   python manage.py migrate --settings=offchat_backend.settings.development
   ```

2. **The ModerationPanel is already integrated** in AdminContent.tsx:
   ```tsx
   case 'moderation':
     return (
       <ErrorBoundary>
         <ModerationPanel />
       </ErrorBoundary>
     );
   ```

3. **The sidebar already has the Moderation tab**:
   ```tsx
   { icon: ShieldAlert, label: "Moderation", value: "moderation" }
   ```

---

## Usage Examples

### Flag a Message
```typescript
const response = await moderationApi.getFlaggedMessages({ status: 'pending' });
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

### Review Content
```typescript
await moderationApi.approveContentReview(reviewId, 'Looks good');
```

---

## Features Implemented

✅ **Message Moderation**
- Flag inappropriate messages
- Review flagged messages
- Approve/reject/remove messages
- Add review notes
- Filter by status and reason
- View statistics

✅ **User Moderation**
- Suspend users (temporary)
- Ban users (permanent)
- Warn users
- Mute users
- Set duration for temporary actions
- Lift moderations
- View active moderations
- View statistics

✅ **Content Review Workflow**
- Submit content for review
- Review pending content
- Approve/reject content
- Set priority levels
- Add review notes
- Filter by status and type
- View statistics

---

## Security Features

- All endpoints require authentication
- Moderator actions are logged in AuditLog
- User status changes are reflected in User model
- Timestamps track all actions
- Review notes provide accountability

---

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination support via query parameters
- Efficient filtering
- Lazy loading of components
- Memoized statistics

---

## Next Steps (Optional Enhancements)

1. Add bulk actions for messages
2. Add appeal system for banned users
3. Add automated moderation rules
4. Add moderation queue prioritization
5. Add moderation team assignments
6. Add moderation reports/analytics
7. Add webhook notifications
8. Add moderation history/audit trail

---

## Files Created/Modified

### Created:
- `admin_panel/migrations/0006_moderation_models.py`
- `admin_panel/moderation_serializers.py`
- `admin_panel/moderation_views.py`
- `src/lib/moderation-api.ts`
- `src/components/admin/ModerationPanel.tsx`

### Modified:
- `admin_panel/models.py` (added 3 models)
- `admin_panel/urls.py` (added 21 endpoints)
- `src/components/admin/AdminContent.tsx` (already has moderation case)
- `src/components/admin/AdminSidebar.tsx` (already has moderation tab)

---

## Testing

To test the moderation system:

1. Start the development server
2. Navigate to Admin Dashboard
3. Click "Moderation" in the sidebar
4. Use the three tabs to manage:
   - Flagged messages
   - User moderations
   - Content reviews

All data is persisted in SQLite database and can be viewed in Django admin.
