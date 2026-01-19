# Changes Required for App.tsx

## Step 1: Add Import at Top
After line 15 (after other imports), add:
```typescript
import { useOnlineStatusTracking } from "@/hooks/useOnlineStatusTracking";
```

## Step 2: Add State in AppContent Component
After line 82 (after usePresenceTracking()), add:
```typescript
const [token, setToken] = useState<string | null>(null);
useOnlineStatusTracking(token);
```

## Step 3: Update handleLogin Function
In handleLogin function, after line 155 (after apiService.setAuthToken), add:
```typescript
setToken(userData.access);
```

## Step 4: Update handleAdminLogin Function
In handleAdminLogin function, after line 210 (after apiService.setAuthToken), add:
```typescript
setToken(userData.access);
```

## Step 5: Update handleLogout Function
In handleLogout function, after line 245 (after localStorage.removeItem), add:
```typescript
setToken(null);
```

## Complete Example

### Before:
```typescript
const handleLogin = async (identifier: string, password: string) => {
  try {
    const response = await apiService.login({ username: identifier, password });
    
    if (response.success && response.data) {
      const userData = response.data;
      localStorage.setItem('access_token', userData.access);
      localStorage.setItem('refresh_token', userData.refresh);
      apiService.setAuthToken(userData.access);
      
      const userObj = { 
        id: String(userData.user.id), 
        username: userData.user.username, 
        status: "online" as const, 
        role: userData.user.role,
        avatar: userData.user.avatar 
      };
      setUser(userObj);
      localStorage.setItem('offchat_user', JSON.stringify(userObj));
      return true;
    }
  }
};
```

### After:
```typescript
const handleLogin = async (identifier: string, password: string) => {
  try {
    const response = await apiService.login({ username: identifier, password });
    
    if (response.success && response.data) {
      const userData = response.data;
      localStorage.setItem('access_token', userData.access);
      localStorage.setItem('refresh_token', userData.refresh);
      apiService.setAuthToken(userData.access);
      setToken(userData.access);  // ADD THIS LINE
      
      const userObj = { 
        id: String(userData.user.id), 
        username: userData.user.username, 
        status: "online" as const, 
        role: userData.user.role,
        avatar: userData.user.avatar 
      };
      setUser(userObj);
      localStorage.setItem('offchat_user', JSON.stringify(userObj));
      return true;
    }
  }
};
```

## That's It!

Once you make these 5 changes to App.tsx, the online/offline tracking will be fully functional:
- Users will automatically go online on login
- Heartbeat will be sent every 30 seconds
- Users will automatically go offline after 2 minutes of inactivity
- Admin panel will show real-time online/offline status
