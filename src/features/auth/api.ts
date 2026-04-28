import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeRole, QUERY_KEYS, STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from './store';
import { storage } from '@/lib/storage';
import { authService } from '@/api/services';
import type { User } from '@/types';
import type { GetTokenResponseDto } from '@/types/api.types';

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

// Get current user (Note: API doesn't have /me endpoint, so we use stored user)
export const useMe = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const setLoading = useAuthStore((state) => state.setLoading);

    return useQuery({
        queryKey: QUERY_KEYS.ME,
        queryFn: async () => {
            // Since API doesn't have /me endpoint, return stored user
            const storedUser = storage.get<User>(STORAGE_KEYS.USER);
            if (storedUser) {
                setUser(storedUser);
                setLoading(false);
                return storedUser;
            }
            // Return null instead of throwing to prevent blocking the app
            setLoading(false);
            return null;
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!storage.get(STORAGE_KEYS.ACCESS_TOKEN),
        // Important: Set initialData so the query doesn't block rendering
        initialData: null,
    });
};

// Login mutation - Uses real API
export const useLogin = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.login, // Use real API service
        onSuccess: (data) => {
            // Transform API response to User format
            const user = transformApiUser(data);
            setUser(user);
            queryClient.setQueryData(QUERY_KEYS.ME, user);
        },
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
        mutationFn: authService.changePhoto,
        onSuccess: async (_data, file) => {
            // 1. Optimistic Update: Show the image immediately using a local blob URL
            const localUrl = URL.createObjectURL(file);
            if (user) {
                const optimisticUser = { ...user, avatar: localUrl };
                setUser(optimisticUser);
                queryClient.setQueryData(QUERY_KEYS.ME, optimisticUser);
            }

            // 2. Background Refresh: Get the official pre-signed GET URL from the server
            // We wait a bit to ensure the backend is in sync
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const rt = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
            if (rt) {
                try {
                    const data = await authService.refreshToken({ refreshToken: rt });
                    const refreshedUser = transformApiUser(data);
                    
                    // If we got a real URL back, replace the local blob with it
                    if (refreshedUser.avatar) {
                        setUser(refreshedUser);
                        queryClient.setQueryData(QUERY_KEYS.ME, refreshedUser);
                        // Clean up the blob URL
                        URL.revokeObjectURL(localUrl);
                    }
                } catch (error) {
                    console.error('Failed to refresh user info after photo change:', error);
                }
            }
        },
    });
};

// Delete user photo — DELETE /api/Auth/delete-photo
export const useDeletePhoto = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.deletePhoto,
        onSuccess: () => {
            if (user) {
                const updatedUser = { ...user, avatar: undefined };
                setUser(updatedUser);
                queryClient.setQueryData(QUERY_KEYS.ME, updatedUser);
            }
        },
    });
};