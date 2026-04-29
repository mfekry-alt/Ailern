/**
 * Auth Provider
 * 
 * Initializes authentication state on app load and manages the authentication lifecycle.
 * Implements stale-while-revalidate pattern for instant UI with background refresh.
 */

import { useEffect } from 'react';
import { useAuthStore } from './store';
import { useMe } from './api';

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider initializes the authentication system on app load.
 * 
 * Flow:
 * 1. Load cached user from localStorage for instant UI (navbar avatar, etc.)
 * 2. If access token exists, fetch fresh user data from /users/me in background
 * 3. React Query's stale-while-revalidate pattern ensures:
 *    - Cached data is shown immediately
 *    - Fresh data replaces cache when API responds
 *    - UI updates automatically without flicker
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const initFromCache = useAuthStore((state) => state.initFromCache);

    // Initialize auth state from cache on mount
    useEffect(() => {
        console.log('[AuthProvider] Initializing auth state from cache...');
        initFromCache();
    }, [initFromCache]);

    // Set up the useMe query which handles:
    // - Initial data from cache (instant UI)
    // - Background fetch to /users/me (fresh data)
    // - Token refresh callback wiring (axios interceptor)
    const { isLoading, error, data: user } = useMe();

    // Log auth state changes for debugging
    useEffect(() => {
        if (user) {
            console.log('[AuthProvider] User loaded:', user.email, 'avatar:', user.avatar);
        }
        if (error) {
            console.error('[AuthProvider] Error loading user:', error);
        }
    }, [user, error]);

    // Note: We don't show loading spinner here because:
    // 1. Cached data is shown immediately via initialData
    // 2. The app should render regardless of auth state
    // 3. Individual components handle their own loading states
    return <>{children}</>;
};

export default AuthProvider;
