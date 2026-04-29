import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeRole, QUERY_KEYS, STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from './store';
import { storage } from '@/lib/storage';
import { authService } from '@/api/services';
import * as userService from '@/api/services/user.service';
import type { MeResponseDto } from '@/api/services/user.service';
import { setOnTokenRefreshedCallback } from '@/api/client';
import type { User } from '@/types';
import type { GetTokenResponseDto } from '@/types/api.types';
import { useEffect } from 'react';

// Helper to transform API user to app User type
const transformApiUser = (apiUser: GetTokenResponseDto): User => {
    const fullNameParts = apiUser.userName.split(' ');

    // Extract numeric ID - prioritize role-specific IDs
    const numericId = apiUser.instructorId ||
        apiUser.studentId ||
        apiUser.id;

    return {
        id: numericId || apiUser.email, // Use numeric ID if available, fallback to email
        email: apiUser.email,
        firstName: fullNameParts[0] || apiUser.userName,
        lastName: fullNameParts.slice(1).join(' ') || '',
        fullName: apiUser.userName,
        roles: [normalizeRole(apiUser.role)],
        avatar: apiUser.imageUrl || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

// Helper to transform MeResponseDto to User type
const transformMeResponse = (meData: MeResponseDto): User => {
    const fullNameParts = meData.fullName.split(' ');

    return {
        id: meData.id,
        email: meData.email,
        firstName: fullNameParts[0] || meData.userName,
        lastName: fullNameParts.slice(1).join(' ') || '',
        fullName: meData.fullName,
        roles: [normalizeRole(meData.role)],
        avatar: meData.imageUrl || undefined,
        createdAt: meData.createdAt || new Date().toISOString(),
        updatedAt: meData.updatedAt || new Date().toISOString(),
    };
};

// Get cached user from localStorage for initial data
const getCachedUser = (): User | null => {
    try {
        return storage.get<User>(STORAGE_KEYS.USER);
    } catch {
        return null;
    }
};

/**
 * Hook to fetch and manage current user data
 * Implements stale-while-revalidate pattern:
 * - Shows cached data immediately (instant UI)
 * - Refetches in background to get fresh data
 * - Updates UI automatically when fresh data arrives
 */
export const useMe = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: QUERY_KEYS.ME,
        queryFn: async () => {
            console.log('[Auth] Fetching /users/me...');
            const meData = await userService.getMe();
            const user = transformMeResponse(meData);
            setUser(user);
            console.log('[Auth] User data refreshed:', user.email, 'avatar:', user.avatar);
            return user;
        },
        // Stale-while-revalidate configuration:
        // - Use cached data immediately (no loading state for cached data)
        // - Refetch in background when stale
        initialData: getCachedUser, // Show cached user instantly
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes
        retry: 2,
        retryDelay: 1000,
        // Only run query if we have an access token
        enabled: !!storage.get(STORAGE_KEYS.ACCESS_TOKEN),
        // Don't refetch on window focus (we'll handle that manually if needed)
        refetchOnWindowFocus: false,
    });

    // Set up callback for token refresh to refetch user data
    useEffect(() => {
        const handleTokenRefresh = () => {
            console.log('[Auth] Token refreshed, refetching user data...');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
        };

        setOnTokenRefreshedCallback(handleTokenRefresh);

        return () => {
            setOnTokenRefreshedCallback(null);
        };
    }, [queryClient]);

    return query;
};

/**
 * Manual refetch helper for use after login or when explicitly needed
 */
export const useRefreshUser = () => {
    const queryClient = useQueryClient();

    return async () => {
        console.log('[Auth] Manually refreshing user data...');
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
        return queryClient.fetchQuery({ queryKey: QUERY_KEYS.ME });
    };
};

// Login mutation - Uses real API
export const useLogin = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            // Step 1: Login to get tokens
            const loginData = await authService.login(credentials);

            // Step 2: Set tokens in storage
            setAccessToken(loginData.accessToken);

            // Step 3: Fetch full user data from /users/me
            // This ensures we have the most up-to-date user info including avatar
            try {
                const meData = await userService.getMe();
                return { loginData, meData };
            } catch (meError) {
                console.error('[Auth] Failed to fetch /users/me after login:', meError);
                // Fallback: use login response data
                return { loginData, meData: null };
            }
        },
        onSuccess: ({ loginData, meData }) => {
            // Step 4: Transform and store user data
            let user: User;

            if (meData) {
                // Use fresh /users/me data
                user = transformMeResponse(meData);
                console.log('[Auth] Login successful with /users/me data, avatar:', user.avatar);
            } else {
                // Fallback to login response data
                user = transformApiUser(loginData);
                console.log('[Auth] Login successful with login response data, avatar:', user.avatar);
            }

            // Update global state
            setUser(user);

            // Update React Query cache
            queryClient.setQueryData(QUERY_KEYS.ME, user);

            // Schedule a background refresh to ensure we have the latest data
            // This handles cases where /me failed initially or data changed during login
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
            }, 100);
        },
        // Prevent error from propagating to error boundaries - handled by component
        throwOnError: false,
    });
};

// Logout mutation - Uses real API
export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await authService.logout();
        },
        onSettled: () => {
            logout();
            queryClient.clear();
        },
    });
};

// Register mutation
export const useRegister = () => {
    return useMutation({
        mutationFn: authService.register,
    });
};

// Forgot password mutation - Uses real API
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email: string) => authService.sendPasswordResetEmail({ email }),
    });
};

// Reset password mutation (email link) — POST /api/auth/reset-password
export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: { token: string; password: string; email: string }) =>
            authService.resetPasswordWithToken({
                email: data.email,
                token: data.token,
                newPassword: data.password,
            }),
    });
};

// Change password while logged in — POST /api/auth/change-password
export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) =>
            authService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            }),
    });
};

// Change email while logged in — PUT /api/Auth/change-email
export const useChangeEmail = () => {
    return useMutation({
        mutationFn: (data: { newEmail: string; currentPassword: string }) =>
            authService.changeEmail({
                newEmail: data.newEmail,
                currentPassword: data.currentPassword,
            }),
    });
};

// Change user photo — PUT /api/Auth/change-photo
export const useChangePhoto = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    return useMutation({
        // We call change-photo endpoint but IGNORE the response URL completely.
        // The ONLY source of truth for avatar URL is GET /users/me.
        mutationFn: async (file: File) => {
            await authService.changePhoto(file);
            // Immediately fetch the canonical user data from /users/me
            // This is the ONLY valid source for avatar URL
            return userService.getMe();
        },
        onSuccess: (meData) => {
            // Transform and update state ONLY from /users/me response
            const freshUser = transformMeResponse(meData);
            setUser(freshUser);
            queryClient.setQueryData(QUERY_KEYS.ME, freshUser);
            console.log('[Auth] Photo updated via /users/me, avatar:', freshUser.avatar);
        },
        onError: (error) => {
            console.error('[Auth] Photo upload or /users/me fetch failed:', error);
            // DO NOT update state on error - keep existing valid avatar
            // The UI will continue showing the current avatar from cache
            throw error;
        },
    });
};

// Delete user photo — DELETE /api/Auth/delete-photo
export const useDeletePhoto = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        // Call delete endpoint then immediately fetch canonical data from /users/me
        mutationFn: async () => {
            await authService.deletePhoto();
            // /users/me is the ONLY source of truth for user state
            return userService.getMe();
        },
        onSuccess: (meData) => {
            // Update state ONLY from /users/me response
            const freshUser = transformMeResponse(meData);
            setUser(freshUser);
            queryClient.setQueryData(QUERY_KEYS.ME, freshUser);
            console.log('[Auth] Photo deleted via /users/me, avatar:', freshUser.avatar);
        },
        onError: (error) => {
            console.error('[Auth] Photo delete or /users/me fetch failed:', error);
            // DO NOT update state on error - keep existing valid data
            throw error;
        },
    });
};