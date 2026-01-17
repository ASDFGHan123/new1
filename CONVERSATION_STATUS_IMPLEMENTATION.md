# Conversation Status Implementation

## Overview
Implemented a conversation status tracking system that displays conversations as **active** or **inactive** based on whether any participant is currently online.

## Changes Made

### 1. **Chat Models** (`chat/models.py`)
- Added `ConversationStatus` enum with choices: `ACTIVE` and `INACTIVE`
- Added `conversation_status` field to `Conversation` model (default: `INACTIVE`)
- Added index on `conversation_status` for query optimization
- Added two new methods:
  - `is_active()`: Returns `True` if any participant is online
  - `update_status()`: Updates conversation status based on participant online status
- Updated `update_activity()` method to also update `conversation_status` to `ACTIVE`

### 2. **Migration** (`chat/migrations/0005_conversation_status.py`)
- Created migration to add `conversation_status` field
- Added database index for efficient querying

### 3. **Serializers** (`chat/serializers.py`)
- Updated `ConversationSerializer` to include:
  - `conversation_status` field (read-only)
  - `is_active` computed field that calls the model's `is_active()` method
- Both fields are now returned in API responses

### 4. **Views** (`chat/views.py`)
- Updated `MessageListCreateView.post()` to:
  - Call `conversation.update_activity()` when a message is sent
  - Call `conversation.update_status()` to update status based on current participant online status

## How It Works

1. **Automatic Status Update**: When a message is sent in a conversation:
   - `conversation_status` is set to `ACTIVE`
   - `last_message_at` is updated

2. **Real-time Status Check**: The `is_active()` method checks if any participant has `online_status='online'`

3. **API Response**: Conversations now include:
   ```json
   {
     "id": "...",
     "conversation_status": "active",  // or "inactive"
     "is_active": true,                 // computed field
     ...
   }
   ```

## Usage

### Frontend Integration
```typescript
// Get conversation status
const conversation = await fetchConversation(id);
console.log(conversation.conversation_status); // "active" or "inactive"
console.log(conversation.is_active);           // true or false
```

### Database Query
```python
# Get all active conversations
active_conversations = Conversation.objects.filter(
    conversation_status='active'
)

# Get all inactive conversations
inactive_conversations = Conversation.objects.filter(
    conversation_status='inactive'
)
```

## Status Determination Logic

- **ACTIVE**: 
  - When a message is sent (automatically set)
  - When any participant has `online_status='online'`

- **INACTIVE**:
  - Default state for new conversations
  - When all participants are offline/away

## Database Schema
```sql
ALTER TABLE conversations ADD COLUMN conversation_status VARCHAR(20) DEFAULT 'inactive';
CREATE INDEX conversations_status_idx ON conversations(conversation_status);
```

## Performance Considerations
- Added database index on `conversation_status` for fast filtering
- `is_active()` method queries participants with `online_status='online'` (indexed field)
- Status updates are minimal and only occur on message send

## Future Enhancements
- Add WebSocket support to update status in real-time
- Add background task to periodically update inactive conversations
- Add conversation status history tracking
