# OffChat Admin Dashboard - Entity Relationship Diagram (ERD)

## System Overview
The OffChat Admin Dashboard is a comprehensive messaging platform with user management, chat functionality, and administrative features. The system consists of 4 main modules: Users, Chat, Admin Panel, and Notifications.

---

## Database Schema

### 1. USERS Module

#### User
- **PK**: id (BigAutoField)
- **Fields**: username, email, first_name, last_name, avatar, bio, role, status, online_status, last_seen, join_date, message_count, report_count, email_verified, email_verification_token, is_staff, is_active, is_superuser, created_at, updated_at
- **Relationships**: 
  - 1:N → UserSession
  - 1:N → UserActivity
  - 1:N → BlacklistedToken
  - 1:N → IPAccessLog
  - 1:N → SuspiciousActivity
  - 1:N → Notification
  - M:M → Group (through GroupMember)
  - M:M → Conversation (through ConversationParticipant)
  - 1:N → Message (as sender)
  - 1:N → AuditLog (as actor)
  - 1:N → Trash (as deleted_by)
  - 1:N → Backup (as created_by)

#### UserSession
- **PK**: id (BigAutoField)
- **FK**: user_id → User
- **Fields**: session_key, ip_address, user_agent, is_active, created_at, last_activity, expires_at
- **Indexes**: user, session_key, is_active

#### UserActivity
- **PK**: id (BigAutoField)
- **FK**: user_id → User
- **Fields**: action, description, ip_address, user_agent, timestamp
- **Indexes**: user, action, timestamp
- **Triggers**: Creates Notification on post_save

#### BlacklistedToken
- **PK**: id (BigAutoField)
- **FK**: user_id → User
- **Fields**: token, token_type, blacklisted_at, expires_at
- **Indexes**: token, user, token_type, blacklisted_at, expires_at

#### IPAddress
- **PK**: id (BigAutoField)
- **Fields**: ip_address (unique), country, city, region, isp, is_threat, threat_type, first_seen, last_seen, request_count, blocked_until
- **Indexes**: ip_address, is_threat, blocked_until, last_seen

#### IPAccessLog
- **PK**: id (BigAutoField)
- **FK**: user_id → User (nullable)
- **Fields**: ip_address, method, path, user_agent, status_code, response_time, timestamp, is_suspicious, country, city
- **Indexes**: ip_address, timestamp, user, status_code, is_suspicious

#### SuspiciousActivity
- **PK**: id (BigAutoField)
- **FK**: user_id → User (nullable)
- **Fields**: ip_address, activity_type, description, severity, is_resolved, timestamp, metadata
- **Indexes**: ip_address, user, activity_type, severity, is_resolved, timestamp

#### Notification
- **PK**: id (UUIDField)
- **FK**: user_id → User
- **Fields**: notification_type, title, message, is_read, data, created_at
- **Indexes**: user, is_read, created_at

---

### 2. CHAT Module

#### Group
- **PK**: id (UUIDField)
- **FK**: created_by_id → User
- **Fields**: name, description, avatar, group_type, created_at, updated_at, last_activity, is_deleted, deleted_at
- **Relationships**:
  - 1:N → GroupMember
  - 1:1 → Conversation
- **Indexes**: name, group_type, created_by, last_activity, is_deleted

#### GroupMember
- **PK**: id (BigAutoField)
- **FK**: group_id → Group, user_id → User
- **Fields**: role, status, joined_at, last_activity
- **Unique**: (group, user)
- **Indexes**: group, user, role, status

#### Conversation
- **PK**: id (UUIDField)
- **FK**: group_id → Group (nullable, OneToOne)
- **Fields**: conversation_type, title, description, last_message_at, created_at, updated_at, is_deleted, deleted_at
- **Relationships**:
  - M:M → User (through ConversationParticipant)
  - 1:N → Message
  - 1:N → ConversationParticipant
- **Indexes**: conversation_type, last_message_at, created_at, is_deleted

#### ConversationParticipant
- **PK**: id (BigAutoField)
- **FK**: conversation_id → Conversation, user_id → User
- **Fields**: joined_at, last_read_at, unread_count
- **Unique**: (conversation, user)
- **Indexes**: conversation, user, last_read_at

#### Message
- **PK**: id (UUIDField)
- **FK**: conversation_id → Conversation, sender_id → User, reply_to_id → Message (nullable), forwarded_from_id → Message (nullable)
- **Fields**: content, message_type, is_edited, edited_at, is_deleted, deleted_at, timestamp
- **Relationships**:
  - 1:N → Attachment
  - 1:N → Message (self-referencing for replies and forwards)
- **Indexes**: conversation, sender, timestamp, message_type, is_deleted, reply_to

#### Attachment
- **PK**: id (UUIDField)
- **FK**: message_id → Message
- **Fields**: file, file_name, file_type, file_size, mime_type, uploaded_at, duration, thumbnail, width, height, bitrate, codec
- **Indexes**: message, file_type, uploaded_at

---

### 3. ADMIN PANEL Module

#### AuditLog
- **PK**: id (UUIDField)
- **FK**: actor_id → User (nullable)
- **Fields**: action_type, description, target_type, target_id, severity, category, ip_address, user_agent, session_id, metadata, timestamp
- **Indexes**: action_type, actor, target_type, target_id, severity, timestamp, ip_address, category

#### Trash
- **PK**: id (UUIDField)
- **FK**: deleted_by_id → User
- **Fields**: item_type, item_id, item_data, delete_reason, deleted_at
- **Indexes**: item_type, deleted_by, deleted_at

#### Backup
- **PK**: id (UUIDField)
- **FK**: created_by_id → User
- **Fields**: name, description, backup_type, file, file_size, status, progress, record_count, created_at, completed_at
- **Indexes**: backup_type, status, created_by

#### SystemSettings
- **PK**: id (BigAutoField)
- **FK**: updated_by_id → User (nullable)
- **Fields**: key (unique), value, category, description, is_public, updated_at
- **Indexes**: key, category, is_public

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER MANAGEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│
│  User (Core)
│  ├─ 1:N → UserSession
│  ├─ 1:N → UserActivity ──→ Triggers → Notification
│  ├─ 1:N → BlacklistedToken
│  ├─ 1:N → IPAccessLog
│  ├─ 1:N → SuspiciousActivity
│  ├─ 1:N → Notification
│  ├─ M:M → Group (through GroupMember)
│  ├─ M:M → Conversation (through ConversationParticipant)
│  ├─ 1:N → Message (as sender)
│  ├─ 1:N → AuditLog (as actor)
│  ├─ 1:N → Trash (as deleted_by)
│  └─ 1:N → Backup (as created_by)
│
│  IPAddress (Security)
│  └─ Referenced by IPAccessLog
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CHAT & MESSAGING                           │
├─────────────────────────────────────────────────────────────────┤
│
│  Group
│  ├─ 1:N → GroupMember ──→ User
│  └─ 1:1 → Conversation
│
│  Conversation
│  ├─ M:M → User (through ConversationParticipant)
│  ├─ 1:N → Message
│  └─ 1:N → ConversationParticipant
│
│  Message
│  ├─ FK → Conversation
│  ├─ FK → User (sender)
│  ├─ 1:N → Attachment
│  ├─ Self-referencing (reply_to, forwarded_from)
│  └─ 1:N → Message (replies, forwards)
│
│  Attachment
│  └─ FK → Message
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN & MONITORING                          │
├─────────────────────────────────────────────────────────────────┤
│
│  AuditLog
│  ├─ FK → User (actor)
│  └─ Tracks all system actions
│
│  Trash
│  ├─ FK → User (deleted_by)
│  └─ Soft deletion system
│
│  Backup
│  ├─ FK → User (created_by)
│  └─ Backup management
│
│  SystemSettings
│  ├─ FK → User (updated_by)
│  └─ Configuration storage
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Relationships Summary

### One-to-Many (1:N)
- User → UserSession
- User → UserActivity
- User → BlacklistedToken
- User → IPAccessLog
- User → SuspiciousActivity
- User → Notification
- User → Message (as sender)
- User → AuditLog (as actor)
- User → Trash (as deleted_by)
- User → Backup (as created_by)
- Group → GroupMember
- Conversation → Message
- Conversation → ConversationParticipant
- Message → Attachment
- Message → Message (self-referencing)

### Many-to-Many (M:M)
- User ↔ Group (through GroupMember)
- User ↔ Conversation (through ConversationParticipant)

### One-to-One (1:1)
- Group ↔ Conversation

### Self-Referencing
- Message → Message (reply_to, forwarded_from)

---

## Data Flow

### User Activity → Notification Flow
```
1. User performs action (login, message_sent, etc.)
2. UserActivity record created
3. Signal triggered (post_save)
4. Notification created automatically
5. Frontend polls /api/users/notifications/
6. User sees notification in NotificationCenter
7. User opens notification → mark_all_as_read()
8. Unread count badge disappears
```

### Message Flow
```
1. User sends message
2. Message created in Conversation
3. Attachment(s) created if files attached
4. ConversationParticipant.unread_count incremented
5. Conversation.last_message_at updated
6. Group.last_activity updated (if group conversation)
7. AuditLog entry created
```

### User Approval Flow
```
1. New user registers (status: pending)
2. Admin approves user
3. User status changed to active
4. Notification sent to user
5. AuditLog entry created
6. User can now login
```

---

## Database Indexes

### Performance Optimization
- **User**: username, email, status, role, online_status, last_seen
- **UserActivity**: user, action, timestamp
- **UserSession**: user, session_key, is_active
- **Message**: conversation, sender, timestamp, message_type, is_deleted, reply_to
- **Conversation**: conversation_type, last_message_at, created_at, is_deleted
- **Group**: name, group_type, created_by, last_activity, is_deleted
- **AuditLog**: action_type, actor, target_type, target_id, severity, timestamp, ip_address, category
- **Notification**: user, is_read, created_at

---

## Constraints

### Unique Constraints
- User.username (unique)
- User.email (unique)
- UserSession.session_key (unique)
- BlacklistedToken.token (unique)
- IPAddress.ip_address (unique)
- GroupMember (group, user)
- ConversationParticipant (conversation, user)
- SystemSettings.key (unique)

### Foreign Key Constraints
- ON_DELETE=CASCADE: Most relationships (deleting parent deletes children)
- ON_DELETE=SET_NULL: AuditLog.actor, IPAccessLog.user, SuspiciousActivity.user (preserve history)

---

## Statistics & Counters

### User Model
- message_count: Total messages sent
- report_count: Total reports filed

### ConversationParticipant
- unread_count: Unread messages in conversation
- last_read_at: Last time user read messages

### Backup
- progress: Backup completion percentage (0-100)
- record_count: Number of records backed up

### IPAddress
- request_count: Total requests from IP

---

## Audit Trail

All critical actions are logged in AuditLog:
- User management (create, update, delete, approve, suspend, ban)
- Authentication (login, logout, failed login)
- Chat operations (message sent, edited, deleted)
- Group operations (created, updated, member added/removed)
- Admin actions (settings changed, backup created)
- Security events (suspicious activity, rate limit exceeded)

---

## Security Features

1. **Token Blacklisting**: BlacklistedToken model for secure logout
2. **IP Tracking**: IPAddress and IPAccessLog for monitoring
3. **Suspicious Activity Detection**: SuspiciousActivity model
4. **Audit Logging**: Complete action history in AuditLog
5. **Soft Deletion**: Trash model for data recovery
6. **Session Management**: UserSession for active session tracking

---

## Notification System

### Notification Types
- message: New message received
- user_approved: User account approved
- user_rejected: User account rejected
- group_invite: Group invitation
- profile_update: Profile updated
- system: System alerts

### Automatic Triggers
- UserActivity creation → Notification creation (via signal)
- User approval → Notification to user
- Message sent → Notification to recipients

---

## Scalability Considerations

1. **Indexing**: Strategic indexes on frequently queried fields
2. **Partitioning**: AuditLog and IPAccessLog can be partitioned by date
3. **Archiving**: Old records can be moved to archive tables
4. **Caching**: Redis for notifications and session data
5. **Pagination**: All list endpoints support pagination
6. **Soft Deletion**: Trash model prevents hard deletes

---

## Database Statistics

- **Total Tables**: 20
- **Total Relationships**: 30+
- **Indexes**: 50+
- **Unique Constraints**: 8
- **Foreign Keys**: 25+

