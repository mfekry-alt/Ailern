/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { api, setAccessToken } from '../client';
import { ENDPOINTS } from '../endpoints';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import axios from 'axios';
import type {
    UserLoginByEmailAndPasswordCommand,
    GetTokenResponseDto,
    GetRefreshTokenCommand,
    RevokeRefreshTokenCommand,
    ResendEmailConfirmationCommand,
    ForgetPasswordCommand,
    UserPasswordResetCommand,
    ChangePasswordCommand,
    ChangeEmailCommand,
    ChangeUserPhotoCommand,
    DeleteUserPhotoCommand,
    EmailConfirmationParams,
    ApiResponse,
    RegisterCommand,
    FileMetaData,
    ConfirmChangeUserEmailCommand,
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

    if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
    }

    const tokenData = response.data.data;

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

    if (!response.data.success) {
        throw new Error(response.data.message || 'Token refresh failed');
    }

    const tokenData = response.data.data;

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
    command: ForgetPasswordCommand
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
 * Change email while logged in — PUT /api/Auth/change-email
 */
export const changeEmail = async (command: ChangeEmailCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.AUTH.CHANGE_EMAIL, command);
};

/**
 * Confirm change email — GET /api/Auth/confirm-change-email
 */
export const confirmChangeEmail = async (command: ConfirmChangeUserEmailCommand): Promise<void> => {
    await api.get<ApiResponse>(ENDPOINTS.AUTH.CONFIRM_CHANGE_EMAIL, { params: command });
};

/**
 * Change user photo — PUT /api/Auth/change-photo
 * 
 * ⚠️ IMPORTANT: The URL returned by this function is NOT the source of truth!
 * The backend returns a storage/upload URL, not the final CDN URL.
 * 
 * ✅ CORRECT PATTERN:
 *   1. Call changePhoto() to upload the file
 *   2. IGNORE the returned URL
 *   3. Call GET /users/me to get the canonical user data
 *   4. Use the avatar URL from /users/me response ONLY
 * 
 * This ensures the avatar URL is always the correct, final CDN URL.
 * 
 * @param file - The image file to upload
 * @returns The upload URL (for logging/debug only - DO NOT use for UI)
 */
export const changePhoto = async (file: File): Promise<string> => {
    // 1. Send metadata JSON to get the upload URL
    const response = await api.put<ApiResponse<string>>(
        ENDPOINTS.AUTH.CHANGE_PHOTO,
        {
            Image: {
                FileName: file.name,
                FileSize: file.size,
                ContentType: file.type || 'application/octet-stream'
            }
        }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Photo change failed');
    }

    const uploadUrl = response.data.data;

    // 2. Upload the binary file directly to the returned URL
    await axios.put(uploadUrl, file, {
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
        },
    });

    // 3. Return URL for debug/logging only.
    // ⚠️ DO NOT use this URL for UI display - always fetch from /users/me!
    return uploadUrl.split('?')[0];
};

/**
 * Delete user photo — DELETE /api/Auth/delete-photo
 */
export const deletePhoto = async (): Promise<void> => {
    // Note: The API might expect an empty object as body for DELETE if it's a command
    await api.delete<ApiResponse>(ENDPOINTS.AUTH.DELETE_PHOTO, { data: {} });
};

/**
 * Check email confirmation status (polling)
 */
export const checkEmailConfirmationStatus = async (): Promise<{ isConfirmed: boolean }> => {
    const response = await api.get<ApiResponse<{ isConfirmed: boolean }>>(
        ENDPOINTS.AUTH.CHECK_EMAIL_CONFIRMATION_STATUS
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Confirmation status check failed');
    }

    return response.data.data;
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