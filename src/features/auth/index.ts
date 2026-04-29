/**
 * Auth Feature Module
 * 
 * Central export point for all authentication-related functionality.
 * 
 * Architecture:
 * - AuthProvider: Initializes auth state and manages the auth lifecycle
 * - useAuthStore: Zustand store for global auth state (user, tokens, isAuthenticated)
 * - useMe: React Query hook for fetching /users/me with stale-while-revalidate
 * - useLogin/useLogout: Mutations for authentication actions
 * - useRefreshUser: Manual refresh helper
 * 
 * Usage:
 * ```tsx
 * // In your app entry point (main.tsx or App.tsx)
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // In components
 * const { user, isAuthenticated } = useAuthStore();
 * const { data: user, isLoading } = useMe();
 * ```
 */

// Provider
export { AuthProvider } from './AuthProvider';

// Store
export { useAuthStore } from './store';

// API Hooks
export {
    useMe,
    useLogin,
    useLogout,
    useRegister,
    useForgotPassword,
    useResetPassword,
    useChangePassword,
    useChangeEmail,
    useChangePhoto,
    useDeletePhoto,
    useRefreshUser,
} from './api';

// Types (re-export from services for convenience)
export type { MeResponseDto } from '@/api/services/user.service';
