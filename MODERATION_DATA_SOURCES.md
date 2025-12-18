# Moderation Tab Data Sources

## Overview
The Moderation tab in the Admin Dashboard displays data from two main sources:

## 1. ModerationPanel Component
**File**: `src/components/admin/ModerationPanel.tsx`

### Data Source
- **API Endpoint**: `http://localhost:8000/api/admin/suspicious-activities/`
- **Backend Handler**: `admin_panel/moderation_views.py` → `suspicious_activities_list()`
- **Database Model**: `users/models.py` → `SuspiciousActivity`

### Data Displayed
- **Unresolved Activities**: Count of suspicious activities not yet resolved
- **Critical Severity**: Count of critical-level suspicious activities
- **Resolved Activities**: Count of resolved suspicious activities
- **Activity Details**:
  - Activity Type (e.g., "brute_force", "sql_injection", etc.)
  - Description
  - IP Address
  - Associated User (if applicable)
  - Severity Level (low, medium, high, critical)
  - Timestamp
  - Resolution Status

### Actions Available
- Mark suspicious activity as resolved
- View activity details

---

## 2. MessageModeration Component
**File**: `src/components/admin/MessageModeration.tsx`

### Data Source
- **API Endpoint**: `http://localhost:8000/api/admin/flagged-messages/`
- **Status**: ⚠️ **ENDPOINT NOT YET IMPLEMENTED IN BACKEND**
- **Expected Database Model**: Should be created in `chat/models.py`

### Data Displayed (When Implemented)
- **Pending Reviews**: Count of messages awaiting moderation
- **Total Flagged**: Total count of flagged messages
- **Resolved**: Count of resolved flagged messages
- **Message Details**:
  - Message Content
  - Sender Username
  - Severity (low, medium, high)
  - Status (pending, reviewed, resolved)
  - Reason for Flagging
  - Timestamp

### Actions Available (When Implemented)
- Approve message
- Delete message
- Warn sender

---

## Data Flow Diagram

```
Admin Dashboard
    ↓
AdminContent.tsx (activeTab === 'moderation')
    ↓
    ├─→ ModerationPanel
    │       ↓
    │   moderationApi.getSuspiciousActivities()
    │       ↓
    │   GET /api/admin/suspicious-activities/
    │       ↓
    │   Backend: suspicious_activities_list()
    │       ↓
    │   Database: SuspiciousActivity Model
    │
    └─→ MessageModeration
            ↓
        moderationApi.getFlaggedMessages() [NOT IMPLEMENTED]
            ↓
        GET /api/admin/flagged-messages/ [NOT IMPLEMENTED]
            ↓
        Backend: [NEEDS TO BE CREATED]
            ↓
        Database: [NEEDS TO BE CREATED]
```

---

## Implementation Status

### ✅ Completed
- ModerationPanel component with suspicious activities display
- Backend API for suspicious activities
- Dark mode styling for both components

### ⚠️ Pending Implementation
- MessageModeration backend API endpoint
- FlaggedMessage database model
- Message flagging functionality
- Backend handlers for message moderation actions

---

## To Implement MessageModeration

1. **Create FlaggedMessage Model** in `chat/models.py`
2. **Create API Endpoint** in `admin_panel/views.py` or `chat/views.py`
3. **Create Serializers** for FlaggedMessage
4. **Add URL Routes** to Django URL configuration
5. **Implement Actions**: approve, delete, warn sender

---

## API Response Format

### Suspicious Activities Response
```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.1",
      "user": {
        "id": "uuid",
        "username": "username"
      },
      "activity_type": "brute_force",
      "description": "Multiple failed login attempts",
      "severity": "high",
      "is_resolved": false,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Flagged Messages Response (Expected Format)
```json
{
  "count": 3,
  "results": [
    {
      "id": "uuid",
      "content": "message content",
      "sender": "username",
      "senderId": "uuid",
      "conversationId": "uuid",
      "flaggedAt": "2024-01-15T10:30:00Z",
      "reason": "Spam",
      "severity": "medium",
      "status": "pending"
    }
  ]
}
```
