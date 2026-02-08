import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setAccessToken } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { QUERY_KEYS, STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from './store';
import { storage } from '@/lib/storage';
import { authService } from '@/api/services';
import type { User, LoginForm, RegisterForm, ApiResponse } from '@/types';
import type { GetTokenResponseDto } from '@/types/api.types';

// Helper to transform API user to app User type
const transformApiUser = (apiUser: GetTokenResponseDto): User => {
    const fullNameParts = apiUser.userName.split(' ');
    return {
        id: apiUser.email, // Use email as ID since API doesn't provide user ID in login
        email: apiUser.email,
        firstName: fullNameParts[0] || apiUser.userName,
        lastName: fullNameParts.slice(1).join(' ') || '',
        fullName: apiUser.userName,
        roles: [apiUser.role], // Convert single role to array for compatibility
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

// Register mutation - Note: Real API has separate endpoints for Student/Instructor/Admin
// This is a wrapper that will need to be updated based on user type
export const useRegister = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RegisterForm & { userType?: 'student' | 'instructor' | 'admin' }) => {
            // For now, default to student registration
            // TODO: Implement proper registration flow based on user type
            const response = await api.post<
                ApiResponse<{ user: User; accessToken: string; csrfToken?: string }>
            >(ENDPOINTS.AUTH.REGISTER, data);
            return response.data.data;
        },
        onSuccess: (data) => {
            setAccessToken(data.accessToken);
            setUser(data.user);

            if (data.csrfToken) {
                storage.set(STORAGE_KEYS.CSRF_TOKEN, data.csrfToken);
            }

            queryClient.setQueryData(QUERY_KEYS.ME, data.user);
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
