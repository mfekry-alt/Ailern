/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { api, setAccessToken } from '../client';
import { ENDPOINTS } from '../endpoints';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import type {
    UserLoginByEmailAndPasswordCommand,
    GetTokenResponseDto,
    GetRefreshTokenCommand,
    RevokeRefreshTokenCommand,
    ResendEmailConfirmationCommand,
    SendPasswordResetEmailCommand,
    UserPasswordResetCommand,
    ChangePasswordCommand,
    EmailConfirmationParams,
    ApiResponse,
    RegisterCommand,
} from '@/types/api.types';

/**
 * Login with email and password
 * @param credentials - Email and password
 * @returns Token response with access token, refresh token, and user info
 */
export const login = async (
    credentials: UserLoginByEmailAndPasswordCommand
): Promise<GetTokenResponseDto> => {
    const response = await api.post<ApiResponse<GetTokenResponseDto>>(
        ENDPOINTS.AUTH.LOGIN,
        credentials
    );

    const tokenData = response.data.data!;

    setAccessToken(tokenData.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
    storage.set(STORAGE_KEYS.EXPIRES_ON, tokenData.expiresOn);

    return tokenData;
};

/**
 * Refresh the access token using refresh token
 * @param command - Refresh token command
 * @returns New token response
 */
export const refreshToken = async (
    command: GetRefreshTokenCommand
): Promise<GetTokenResponseDto> => {
    const response = await api.post<ApiResponse<GetTokenResponseDto>>(
        ENDPOINTS.AUTH.REFRESH,
        command
    );

    const tokenData = response.data.data!;

    // Update stored tokens
    setAccessToken(tokenData.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);

    return tokenData;
};

/**
 * Revoke a refresh token
 * @param command - Revoke token command
 */
export const revokeToken = async (command: RevokeRefreshTokenCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.AUTH.REVOKE_TOKEN, command);
};

/**
 * Confirm email address
 * @param params - Token and email
 */
export const confirmEmail = async (params: EmailConfirmationParams): Promise<void> => {
    await api.get<ApiResponse>(ENDPOINTS.AUTH.CONFIRM_EMAIL, { params });
};

/**
 * Resend confirmation email
 * @param command - Email to resend confirmation to
 */
export const resendConfirmationEmail = async (
    command: ResendEmailConfirmationCommand
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.RESEND_CONFIRMATION_EMAIL, command);
};

/**
 * Send password reset email
 * @param command - Email to send reset link to
 */
export const sendPasswordResetEmail = async (
    command: SendPasswordResetEmailCommand
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.FORGET_PASSWORD, command);
};

/**
 * Reset password using token from email link
 */
export const resetPasswordWithToken = async (
    command: UserPasswordResetCommand
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, command);
};

/**
 * Change password while logged in — POST /api/auth/change-password
 */
export const changePassword = async (command: ChangePasswordCommand): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.CHANGE_PASSWORD, command);
};

/**
 * Register a new account
 */
export const register = async (
    data: Omit<RegisterCommand, 'userName'>
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.REGISTER, {
        ...data,
        userName: data.email,
    });
};

/**
 * Sign out: revoke refresh token on server, then clear local session.
 */
export const logout = async (): Promise<void> => {
    const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
        try {
            await revokeToken({ refresToken: refreshToken });
        } catch {
            // Still clear local session if revoke fails (e.g. offline, token already invalid)
        }
    }
    setAccessToken(null);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.EXPIRES_ON);
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.CSRF_TOKEN);
};
