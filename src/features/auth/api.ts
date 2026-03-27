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
            // Real API doesn't have logout endpoint, just clear local data
            authService.logout();
        },
        onSettled: () => {
            logout();
            queryClient.clear();
        },
    });
};

// Forgot password mutation - Uses real API
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email: string) => authService.sendPasswordResetEmail({ email }),
    });
};

// Reset password mutation - Uses real API
export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: { token: string; password: string; email: string }) =>
            authService.changePassword({
                email: data.email,
                token: data.token,
                newPassword: data.password,
            }),
    });
};
