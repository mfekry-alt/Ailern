import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type { ApiError } from '@/types';

let accessToken: string | null = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    }
};

export const getAccessToken = () => accessToken;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // If error is not 401 or request already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const csrfToken = storage.get<string>(STORAGE_KEYS.CSRF_TOKEN);
            const response = await api.post(
                '/auth/refresh',
                {},
                {
                    headers: {
                        'X-CSRF-Token': csrfToken || '',
                    },
                }
            );

            const { accessToken: newAccessToken, csrfToken: newCsrfToken } = response.data;
            setAccessToken(newAccessToken);

            if (newCsrfToken) {
                storage.set(STORAGE_KEYS.CSRF_TOKEN, newCsrfToken);
            }

            processQueue();
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            setAccessToken(null);
            storage.remove(STORAGE_KEYS.USER);
            storage.remove(STORAGE_KEYS.CSRF_TOKEN);

            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

// Error handler utility
export const handleApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        return {
            message: axiosError.response?.data?.message || 'An unexpected error occurred',
            code: axiosError.response?.data?.code,
            status: axiosError.response?.status || 500,
            fieldErrors: axiosError.response?.data?.fieldErrors,
        };
    }
    return {
        message: 'An unexpected error occurred',
        status: 500,
    };
};

