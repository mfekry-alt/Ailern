import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/lib/constants';
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

    baseURL: 'https://ailern.runasp.net/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} | Token: ${accessToken ? 'present' : 'MISSING'}`);
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
            console.log('[API] Token expired — attempting refresh...');
            const response = await api.post(
                '/Auth/refresh-token',
                {
                    accessToken: accessToken,
                    refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
                },
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
            setAccessToken(newAccessToken);

            if (newRefreshToken) {
                storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }

            processQueue();
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            setAccessToken(null);
            storage.remove(STORAGE_KEYS.USER);
            storage.remove(STORAGE_KEYS.REFRESH_TOKEN);

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