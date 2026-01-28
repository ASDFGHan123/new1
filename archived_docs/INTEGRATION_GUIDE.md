# Integration Guide - Departments & Chat App

## Quick Integration Checklist

### Step 1: Update Main URLs
**File:** `offchat_backend/urls.py`

Add these imports and patterns:
```python
from django.urls import path, include

urlpatterns = [
    # ... existing patterns ...
    path('api/chat/', include('chat.chat_urls')),
]
```

### Step 2: Update ASGI Configuration
**File:** `offchat_backend/asgi.py`

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.chat_routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

### Step 3: Install Required Packages
```bash
pip install channels channels-redis daphne
```

### Step 4: Update Settings
**File:** `offchat_backend/settings/base.py`

```python
INSTALLED_APPS = [
    'daphne',
    'channels',
    # ... other apps ...
    'chat',
    'users',
]

ASGI_APPLICATION = 'offchat_backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### Step 5: Run Migrations
```bash
python manage.py migrate
```

### Step 6: Start Development Server
```bash
# Using Daphne (for WebSocket support)
daphne -b 0.0.0.0 -p 8000 offchat_backend.asgi:application

# Or using runserver with channels
python manage.py runserver
```

---

## API Usage Examples

### Departments API

#### Create Department
```bash
curl -X POST http://localhost:8000/api/departments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Information Technology",
    "description": "IT Department",
    "manager": "John Doe",
    "code": "IT001"
  }'
```

#### Get All Departments
```bash
curl http://localhost:8000/api/departments/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Department Details
```bash
curl http://localhost:8000/api/departments/1/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Department
```bash
curl -X PUT http://localhost:8000/api/departments/1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "IT Department",
    "manager": "Jane Doe"
  }'
```

#### Delete Department
```bash
curl -X DELETE http://localhost:8000/api/departments/1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "trash"}'
```

#### Get Department Members
```bash
curl http://localhost:8000/api/departments/1/members/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Department Offices
```bash
curl http://localhost:8000/api/departments/1/offices/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Chat API

#### Create Conversation
```bash
curl -X POST http://localhost:8000/api/chat/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_type": "individual",
    "participants": [1, 2]
  }'
```

#### Get Conversations
```bash
curl http://localhost:8000/api/chat/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Send Message
```bash
curl -X POST http://localhost:8000/api/chat/conversations/conv-id/messages/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World",
    "message_type": "text"
  }'
```

#### Get Messages
```bash
curl http://localhost:8000/api/chat/conversations/conv-id/messages/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Group
```bash
curl -X POST http://localhost:8000/api/chat/groups/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team A",
    "description": "Team A Group",
    "group_type": "public"
  }'
```

#### Join Group
```bash
curl -X POST http://localhost:8000/api/chat/groups/group-id/join/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Leave Group
```bash
curl -X POST http://localhost:8000/api/chat/groups/group-id/leave/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Upload File
```bash
curl -X POST http://localhost:8000/api/chat/attachments/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file" \
  -F "message_id=msg-id"
```

#### Search
```bash
curl "http://localhost:8000/api/chat/search/?q=hello&type=all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get User Status
```bash
curl "http://localhost:8000/api/chat/user-status/?user_ids=1,2,3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update User Status
```bash
curl -X POST http://localhost:8000/api/chat/user-status/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "online"}'
```

---

## WebSocket Usage

### Connect to Conversation
```javascript
const conversationId = 'conversation-uuid';
const ws = new WebSocket(`ws://localhost/ws/chat/${conversationId}/`);

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Send Message
```javascript
ws.send(JSON.stringify({
  type: 'chat_message',
  content: 'Hello World'
}));
```

### Send Typing Indicator
```javascript
ws.send(JSON.stringify({
  type: 'typing',
  is_typing: true
}));
```

### Send Read Receipt
```javascript
ws.send(JSON.stringify({
  type: 'read_receipt',
  message_id: 'message-uuid'
}));
```

### Connect to Group
```javascript
const groupId = 'group-uuid';
const ws = new WebSocket(`ws://localhost/ws/group/${groupId}/`);

// Same message handling as conversation
```

---

## Frontend Integration

### React Hook for Chat
```typescript
import { useEffect, useState } from 'react';

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(
      `ws://localhost/ws/chat/${conversationId}/`
    );

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data]);
      }
    };

    setWs(websocket);

    return () => websocket.close();
  }, [conversationId]);

  const sendMessage = (content: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        content
      }));
    }
  };

  return { messages, sendMessage };
}
```

### Usage in Component
```typescript
function ChatComponent({ conversationId }: { conversationId: string }) {
  const { messages, sendMessage } = useChat(conversationId);
  const [input, setInput] = useState('');

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.message_id}>{msg.content}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

## Troubleshooting

### WebSocket Connection Failed
- Ensure Redis is running: `redis-server`
- Check ASGI configuration
- Verify WebSocket URL is correct
- Check browser console for errors

### Messages Not Appearing
- Verify user is authenticated
- Check user is participant in conversation
- Verify Redis connection
- Check Django logs

### Department API Returns 404
- Ensure URL routing is correct
- Verify department exists
- Check authentication token

### File Upload Fails
- Check file size (max 10MB)
- Verify file type is allowed
- Check message_id is valid
- Ensure user is participant

---

## Production Deployment

### Using Gunicorn + Daphne
```bash
# Install
pip install gunicorn

# Run
gunicorn offchat_backend.wsgi:application --bind 0.0.0.0:8000
daphne -b 0.0.0.0 -p 8001 offchat_backend.asgi:application
```

### Using Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "offchat_backend.asgi:application"]
```

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379/0
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
SECRET_KEY=your-secret-key
```

---

## Status: ✅ COMPLETE

All components are integrated and ready for use.
