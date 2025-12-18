# Real Backend Data Migration Guide

## Overview
This guide will help you transition from using mock data to real backend data in the OffChat Admin application. The system is already partially configured to use real data, but some components still need to be updated.

## Current Status Analysis

### ✅ What's Already Working
- **API Service**: Already configured to use real HTTP requests in development mode (`import.meta.env.DEV`)
- **Authentication**: Real login/logout with JWT tokens working
- **Backend Server**: Django server running on http://localhost:8000
- **API Endpoints**: All necessary endpoints are available
- **Environment**: `.env` file properly configured with `VITE_API_URL=http://localhost:8000/api`

### 🔧 What Needs to Be Updated
- **App.tsx**: Update user loading logic (already fixed)
- **AuthContext**: Currently uses mock demo users, needs real API integration
- **Chat Components**: Still using mock conversation/message data
- **Admin Dashboard**: Some admin functions may still use mock data

## Step-by-Step Migration Process

### Step 1: Update AuthContext to Use Real API
**File**: `src/contexts/AuthContext.tsx`

**Current Issue**: AuthContext uses hardcoded demo users instead of real API calls.

**Solution**:
```typescript
// Replace the mock login function with real API calls
const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  setIsLoading(true);
  
  try {
    // Use the real API service
    const response = await apiService.login(credentials);
    
    if (response.success && response.data) {
      const authUser: AuthUser = {
        ...response.data.user,
        status: "online"
      };
      
      setUser(authUser);
      localStorage.setItem("offchat_user", JSON.stringify(authUser));
      setIsLoading(false);
      
      return authUser;
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error) {
    setIsLoading(false);
    throw error;
  }
};
```

### Step 2: Verify API Service Mock/Real Data Switching
**File**: `src/lib/api.ts`

**Current Logic** (Lines 156-161):
```typescript
// Use real HTTP requests in development
if (this.isDevelopment) {
  return this.httpRequest<T>(endpoint, options);
} else {
  return this.mockRequest<T>(endpoint, options);
}
```

**Status**: ✅ This is already correct - in development mode, it uses real API calls.

### Step 3: Update Chat Components to Use Real Data
**Files**: 
- `src/components/chat/UnifiedChatInterface.tsx`
- `src/components/chat/GroupChatInterface.tsx`
- `src/pages/UnifiedChatPage.tsx`

**Changes Needed**:
1. Replace mock conversation data with real API calls
2. Implement real message sending/retrieval
3. Add proper error handling for network issues

**Example Implementation**:
```typescript
// In UnifiedChatInterface.tsx
const [conversations, setConversations] = useState<Conversation[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadConversations = async () => {
    try {
      const response = await apiService.getConversations();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  loadConversations();
}, []);
```

### Step 4: Complete Admin Dashboard Integration
**File**: `src/components/admin/UserManagement.tsx`

**Ensure all admin functions use real API**:
- `approveUser()` → API call to `/admin/users/{id}/approve/`
- `rejectUser()` → API call to `/admin/users/{id}/ban/`
- `updateUser()` → API call to `/admin/users/{id}/`
- `deleteUser()` → API call to `/admin/users/{id}/`

### Step 5: Remove Mock Data Dependencies

**Remove from App.tsx**:
```typescript
// REMOVE: Mock data for users, conversations, roles, message templates
const [users, setUsers] = useState<AppUser[]>([]); // Start empty, load from API
const [conversations, setConversations] = useState<AppConversation[]>([]);
const [roles, setRoles] = useState<AppRole[]>([]);
const [messageTemplates, setMessageTemplates] = useState<AppMessageTemplate[]>([]);
```

### Step 6: Add Proper Error Handling

**Implement fallback strategies**:
```typescript
// Add to api.ts
private async httpRequestWithFallback<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    return await this.httpRequest<T>(endpoint, options);
  } catch (error) {
    console.warn(`API request failed for ${endpoint}, using fallback:`, error);
    
    // Return appropriate fallback based on endpoint
    switch (endpoint) {
      case '/auth/admin/users/':
        return { data: [], success: false, error: 'Failed to load users' };
      case '/conversations':
        return { data: [], success: false, error: 'Failed to load conversations' };
      default:
        return { data: null as T, success: false, error: 'API unavailable' };
    }
  }
}
```

### Step 7: Environment Configuration

**Update `.env` for different environments**:
```bash
# Development
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK_DATA=false

# Staging
VITE_API_URL=https://staging-api.offchat.com/api
VITE_USE_MOCK_DATA=false

# Production
VITE_API_URL=https://api.offchat.com/api
VITE_USE_MOCK_DATA=false
```

### Step 8: Update API Service Configuration

**Modify `src/lib/api.ts`** to use environment variable:
```typescript
private useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Use mock data if explicitly enabled or in production without backend
    if (this.useMockData || (!this.isDevelopment && !this.backendAvailable)) {
      return this.mockRequest<T>(endpoint, options);
    } else {
      return this.httpRequest<T>(endpoint, options);
    }
  } catch (error) {
    console.error('API request failed:', error);
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Step 9: Add Backend Health Check

**Implement health check**:
```typescript
// Add to api.ts
private backendAvailable = false;

async checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${this.baseURL}/health/`);
    this.backendAvailable = response.ok;
    return this.backendAvailable;
  } catch {
    this.backendAvailable = false;
    return false;
  }
}
```

### Step 10: Update Component Loading States

**Add proper loading indicators**:
```typescript
// In all components that load data
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getData();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

## Testing the Migration

### 1. Verify Backend is Running
```bash
curl http://localhost:8000/api/auth/login/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "12341234"}'
```

### 2. Test Frontend Integration
- Open http://localhost:8081
- Try logging in with admin credentials
- Verify users are loaded from real API
- Check browser network tab for API calls

### 3. Check Console for Errors
Look for:
- API request failures
- CORS issues
- Authentication errors
- Network connectivity problems

## Rollback Plan

If issues occur, you can quickly rollback by:

1. **Temporary Mock Data Mode**:
   ```bash
   # Add to .env
   VITE_USE_MOCK_DATA=true
   ```

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Summary

The system is already 80% ready for real backend data. The main changes needed are:

1. ✅ **API Service**: Already configured correctly
2. 🔧 **AuthContext**: Update to use real API calls
3. 🔧 **Chat Components**: Replace mock data with API calls
4. 🔧 **Error Handling**: Add proper fallbacks
5. 🔧 **Loading States**: Implement proper loading indicators

The Django backend has all necessary endpoints available, and the React frontend is already configured to make real API calls in development mode.