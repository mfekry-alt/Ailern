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
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Retrieve latest token directly from storage to ensure we have the most up-to-date one
        // especially after a refresh or login
        const storedToken = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
        if (storedToken) {
            accessToken = storedToken;
        }

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} | Token: ${accessToken ? 'present' : 'MISSING'}`);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        throw error;
    }
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

// Callback to notify auth system to refetch user after token refresh
let onTokenRefreshedCallback: (() => void) | null = null;

/**
 * Set callback to be called after successful token refresh
 * This allows auth system to refetch user data with new token
 */
export const setOnTokenRefreshedCallback = (callback: (() => void) | null) => {
    onTokenRefreshedCallback = callback;
};

// Separate callback to notify SignalR to reconnect after token refresh
let onSignalRTokenRefreshedCallback: (() => void) | null = null;

/**
 * Set callback to be called after successful token refresh for SignalR reconnection.
 * This allows the NotificationProvider to reconnect with the latest JWT.
 */
export const setOnSignalRTokenRefreshedCallback = (callback: (() => void) | null) => {
    onSignalRTokenRefreshedCallback = callback;
};

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (token) {
                        originalRequest.headers.Authorization = 'Bearer ' + token;
                    }
                    return api(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;


        try {
            console.log('[API] Token expired — attempting refresh...');
            const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);

            // If no refresh token, fail immediately
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            // Create a new axios instance for refresh to avoid interceptor loop
            const refreshApi = axios.create({
                baseURL: API_URL,
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await refreshApi.post(
                '/Auth/refresh-token',
                {
                    refreshToken: refreshToken
                }
            );

            // Safer extraction of tokens
            const data = response.data?.data || response.data;
            const newAccessToken = data?.accessToken;
            const newRefreshToken = data?.refreshToken;

            if (!newAccessToken) {
                throw new Error('Refresh failed - no access token received');
            }

            setAccessToken(newAccessToken);
            // Update the failed request config with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            if (newRefreshToken) {
                storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }

            // Notify auth system to refetch user data with new token
            // This ensures avatar and other user data is fresh after refresh
            if (onTokenRefreshedCallback) {
                try {
                    onTokenRefreshedCallback();
                } catch (e) {
                    console.error('[API] Error in token refresh callback:', e);
                }
            }

            // Notify SignalR to reconnect with the new JWT
            if (onSignalRTokenRefreshedCallback) {
                try {
                    onSignalRTokenRefreshedCallback();
                } catch (e) {
                    console.error('[API] Error in SignalR token refresh callback:', e);
                }
            }

            // Resolve queue with new token
            processQueue(null, newAccessToken);

            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            // If refresh fails, it likely means the refresh token itself is expired or invalid.
            // In this case, we MUST clear everything and force a login.
            // We should NOT let the error propagate in a way that causes a loop or a generic 500.
            setAccessToken(null);
            storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
            storage.remove(STORAGE_KEYS.USER);
            storage.remove(STORAGE_KEYS.REFRESH_TOKEN);

            // Dispatch a custom event so a React component can handle
            // the redirect via React Router (no full-page reload).
            if (globalThis.window !== undefined) {
                globalThis.window.dispatchEvent(
                    new CustomEvent('auth:session_expired')
                );
            }

            // Return a specific error indicating session expiry, rather than the raw 401/500
            return Promise.reject(new Error('Session expired. Please login again.'));
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