# Production-Grade Authentication System

A robust, scalable authentication system with token refresh, stale-while-revalidate caching, and automatic user state synchronization.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Auth Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Login     │───▶│  /auth/login │───▶│ /users/me   │───▶│ Global State│ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│        │                   │                   │                   │       │
│        ▼                   ▼                   ▼                   ▼       │
│   Credentials        Tokens + User         Fresh User           Cached      │
│   (email/pass)       Data (fallback)       Data (primary)       in Store    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Token Refresh Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   401 Error │───▶│ /auth/refresh│───▶│ Update Token│───▶│ Refetch /me │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│        │                   │                   │                   │       │
│        ▼                   ▼                   ▼                   ▼       │
│   Request Fails     New Tokens           Store New           Fresh User   │
│                     Received             Access Token         Data        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. **Stale-While-Revalidate Pattern**
- **Instant UI**: User data loads immediately from localStorage cache
- **Background Refresh**: Fresh data fetched from `/users/me` automatically
- **No Flicker**: UI updates seamlessly when fresh data arrives

### 2. **Token Management**
- **Access Token**: Stored in memory + localStorage (for persistence)
- **Refresh Token**: Stored securely in localStorage
- **Automatic Refresh**: 401 responses trigger automatic token refresh
- **Queue System**: Concurrent requests wait for single refresh (no duplicate calls)

### 3. **Avatar Synchronization (Strict /users/me Pattern)**
- **/users/me is the SINGLE SOURCE OF TRUTH** for all user profile data including avatar
- **After Login**: Calls `/auth/login`, then immediately calls `/users/me` for canonical data
- **After Token Refresh**: Re-fetches `/users/me` to ensure avatar URL is current
- **After Photo Change**: 
  1. Upload via `/auth/change-photo` (IGNORE the returned URL)
  2. Immediately call `/users/me` for the correct CDN URL
  3. Update state ONLY from `/users/me` response
- **After Photo Delete**: Call `/auth/delete-photo`, then `/users/me` to confirm removal
- **No temporary URLs**: Storage/upload URLs from photo endpoints are NEVER used for UI

### 4. **Edge Case Handling**
- **App Reload**: Loads cached user instantly, refreshes in background
- **Expired Refresh Token**: Clears state and redirects to login
- **Concurrent Refreshes**: Request queue prevents duplicate refresh calls
- **Network Failures**: Retries with exponential backoff

## File Structure

```
src/
├── api/
│   ├── client.ts              # Axios instance + interceptors
│   ├── endpoints.ts           # API endpoint definitions
│   └── services/
│       ├── auth.service.ts    # Login, refresh, logout
│       └── user.service.ts    # getMe, user CRUD
├── features/
│   └── auth/
│       ├── AuthProvider.tsx   # Initializes auth on app load
│       ├── api.ts             # React Query hooks (useMe, useLogin, etc.)
│       ├── store.ts           # Zustand auth store
│       └── index.ts           # Public exports
├── app/
│   └── providers.tsx          # QueryClient + React Query setup
└── App.tsx                    # AuthProvider integration
```

## Usage

### 1. Wrap Your App with AuthProvider

```tsx
// App.tsx
import { AuthProvider } from '@/features/auth';

function App() {
  return (
    <AppProviders>
      <AuthProvider>  {/* Add this */}
        <YourApp />
      </AuthProvider>
    </AppProviders>
  );
}
```

### 2. Read User Data in Components

```tsx
// Navbar.tsx
import { useAuthStore } from '@/features/auth';

function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  
  // Avatar shows immediately from cache, updates when fresh data arrives
  return (
    <nav>
      {isAuthenticated && (
        <img 
          src={user?.avatar || '/default-avatar.png'} 
          alt={user?.fullName}
        />
      )}
    </nav>
  );
}
```

### 3. Use useMe for Reactive User Data

```tsx
// ProfilePage.tsx
import { useMe } from '@/features/auth';

function ProfilePage() {
  const { data: user, isLoading, error } = useMe();
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      <h1>{user?.fullName}</h1>
      <img src={user?.avatar} />
    </div>
  );
}
```

### 4. Login Flow

```tsx
// LoginPage.tsx
import { useLogin } from '@/features/auth';

function LoginPage() {
  const login = useLogin();
  
  const handleSubmit = async (credentials) => {
    try {
      await login.mutateAsync(credentials);
      // AuthProvider automatically:
      // 1. Stores tokens
      // 2. Fetches /users/me
      // 3. Updates global state
      // 4. Caches user data
      navigate('/dashboard');
    } catch (error) {
      showError(error.message);
    }
  };
}
```

### 5. Manual Refresh (if needed)

```tsx
import { useRefreshUser } from '@/features/auth';

function SomeComponent() {
  const refreshUser = useRefreshUser();
  
  const handleUpdate = async () => {
    await updateSomeData();
    await refreshUser(); // Re-fetches /users/me
  };
}
```

## API Reference

### Hooks

| Hook | Purpose |
|------|---------|
| `useMe()` | Fetches and caches current user data |
| `useLogin()` | Handles login + fetches fresh user data |
| `useLogout()` | Handles logout + clears state |
| `useRefreshUser()` | Manual user data refresh helper |
| `useChangePhoto()` | Updates avatar with optimistic UI |

### Store (Zustand)

```ts
const {
  user,           // Current user data (with avatar)
  isAuthenticated, // Boolean auth state
  isLoading,      // Loading state
  accessToken,    // Current access token
  setUser,        // Update user data
  setAccessToken, // Update token
  logout,         // Clear all auth state
  hasRole,        // Check single role
  hasAnyRole,     // Check multiple roles
} = useAuthStore();
```

## How It Works

### On App Load

1. **AuthProvider mounts**
2. **initFromCache()** loads user from localStorage → instant UI
3. **useMe() query runs** if access token exists
4. **Fresh data** replaces cached data when API responds
5. **Navbar avatar** updates automatically (React Query + Zustand sync)

### On Token Expiry

1. **API request** returns 401
2. **Interceptor catches** 401 and checks `isRefreshing`
3. **If refreshing**: Add request to queue
4. **If not refreshing**: Start refresh, mark `isRefreshing = true`
5. **Refresh API** called with stored refresh token
6. **New tokens** stored, queue processed
7. **Callback triggered**: `invalidateQueries(QUERY_KEYS.ME)`
8. **useMe refetches** with new token
9. **Avatar updates** with fresh URL

### On Photo Change (Strict /users/me Pattern)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Photo Upload Flow                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│
│  │   Select    │───▶│   Upload    │───▶│  GET /me    │───▶│ Update State││
│  │    Photo    │    │   /change   │    │   (TRUTH)   │    │   from /me   ││
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘│
│        │                   │                   │                   │      │
│        ▼                   ▼                   ▼                   ▼      │
│   User selects       Upload to         Fetch canonical    UI shows    │
│   image file         storage           user data with     correct CDN   │
│                      (ignore URL)      final CDN URL       URL          │
│                                                                              │
│  ⚠️ CRITICAL: The URL returned by /change-photo is NOT the final CDN URL!    │
│  ✅ ALWAYS fetch /users/me after upload to get the canonical avatar URL.    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **User selects** photo file
2. **Upload** to `/auth/change-photo` (response URL is IGNORED)
3. **Immediately fetch** `/users/me` for canonical user data
4. **Update state** ONLY from `/users/me` response (this has the correct CDN URL)
5. **UI displays** the avatar URL from state (which came from `/users/me`)

### On Photo Delete

1. **Call** `/auth/delete-photo`
2. **Immediately fetch** `/users/me` to confirm deletion
3. **Update state** from `/users/me` response (avatar will be null)
4. **UI removes** avatar display

## Configuration

### Axios Interceptor (client.ts)

```ts
// Token refresh configuration
let isRefreshing = false;
let failedQueue: Array<{ resolve; reject }> = [];

// After successful refresh:
setOnTokenRefreshedCallback(() => {
  // Triggered after token refresh
  // Automatically refetches user data
});
```

### React Query (useMe)

```ts
{
  initialData: getCachedUser(),  // Show cache instantly
  staleTime: 5 * 60 * 1000,      // 5 min stale time
  gcTime: 10 * 60 * 1000,        // 10 min cache time
  retry: 2,                      // Retry on failure
  enabled: !!accessToken,         // Only if logged in
}
```

## Security Considerations

1. **XSS Protection**: Tokens stored in localStorage (mitigated by CSP)
2. **CSRF Protection**: Handled by backend
3. **Token Rotation**: Refresh tokens rotated on each use
4. **Secure Logout**: All tokens cleared on logout
5. **No Token in URL**: Tokens only in headers

## Troubleshooting

### Avatar Not Showing After Refresh

Check browser console for:
- `[Auth] Token refreshed, refetching user data...`
- `[Auth] User data refreshed: ... avatar: ...`

If missing:
1. Check `/users/me` endpoint returns `imageUrl`
2. Verify interceptor is calling `setOnTokenRefreshedCallback`
3. Ensure `useMe` hook is mounted in AuthProvider

### Login Success But No User Data

Check for:
- `[Auth] Failed to fetch /users/me after login`
- Verify `/users/me` endpoint is accessible with valid token

### Multiple Refresh Calls

Should not happen due to `isRefreshing` flag + queue system. If occurring:
1. Check for multiple axios instances
2. Verify interceptor not registered multiple times

## Migration from Old System

If upgrading from a system without `/users/me`:

1. Add `USERS.ME` endpoint to `endpoints.ts`
2. Create `user.service.ts` with `getMe` function
3. Replace `useMe` implementation with new version
4. Update `useLogin` to call `userService.getMe()`
5. Add `AuthProvider` to App.tsx
6. Update `useChangePhoto` to use `/users/me` instead of refresh token

No changes needed in components using `useAuthStore()` - they work the same way.

## Important: /users/me is the Single Source of Truth

### The Rule
**NEVER** use any other endpoint's response to update user profile data (especially avatar URL).  
**ALWAYS** fetch `/users/me` after any profile-changing operation and use THAT response to update state.

### Examples

```tsx
// ❌ WRONG: Using upload response URL
const changePhoto = useMutation({
  mutationFn: uploadPhoto,
  onSuccess: (uploadResponse) => {
    // DON'T DO THIS - uploadResponse URL is temporary/storage URL!
    setUser({ ...user, avatar: uploadResponse.url });
  },
});

// ✅ CORRECT: Fetching /users/me after upload
const changePhoto = useMutation({
  mutationFn: async (file) => {
    await uploadPhoto(file);              // Step 1: Upload
    return userService.getMe();           // Step 2: Fetch canonical data
  },
  onSuccess: (meResponse) => {
    // This avatar URL is the correct CDN URL
    setUser(transformMeResponse(meResponse));
  },
});
```

### Affected Operations
- **Photo Upload**: Call `/auth/change-photo` → `/users/me` → update state
- **Photo Delete**: Call `/auth/delete-photo` → `/users/me` → update state
- **Login**: Call `/auth/login` → `/users/me` → update state
- **Token Refresh**: After refresh → `/users/me` → update state

### Why This Pattern?
1. **Consistency**: One endpoint owns the user data shape
2. **Correct URLs**: Backend controls CDN URL generation
3. **Race Condition Safety**: Always get latest data after mutations
4. **Debugging**: Clear data flow makes issues easier to trace
