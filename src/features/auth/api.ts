import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setAccessToken } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { QUERY_KEYS, STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from './store';
import { storage } from '@/lib/storage';
import type { User, LoginForm, RegisterForm, ApiResponse } from '@/types';

// Get current user
export const useMe = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const setLoading = useAuthStore((state) => state.setLoading);

    return useQuery({
        queryKey: QUERY_KEYS.ME,
        queryFn: async () => {
            const response = await api.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME);
            const user = response.data.data;
            setUser(user);
            setLoading(false);
            return user;
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!storage.get(STORAGE_KEYS.ACCESS_TOKEN),
    });
};

// Login mutation
export const useLogin = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: LoginForm) => {
            const response = await api.post<ApiResponse<{ user: User; accessToken: string; csrfToken?: string }>>('/auth/login', data);
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

// Register mutation
export const useRegister = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RegisterForm) => {
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

// Logout mutation
export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.post(ENDPOINTS.AUTH.LOGOUT);
        },
        onSettled: () => {
            logout();
            setAccessToken(null);
            queryClient.clear();
        },
    });
};

// Forgot password mutation
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: async (email: string) => {
            const response = await api.post<ApiResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
            return response.data;
        },
    });
};

// Reset password mutation
export const useResetPassword = () => {
    return useMutation({
        mutationFn: async (data: { token: string; password: string }) => {
            const response = await api.post<ApiResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, data);
            return response.data;
        },
    });
};
