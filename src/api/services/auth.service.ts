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
    EmailConfirmationParams,
    ApiResponse,
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

    // DEBUG: Log the full login response to see if we're missing an ID field
    console.log(' [Auth] Full login response:', JSON.stringify(response.data, null, 2));
    console.log(' [Auth] Token data:', JSON.stringify(tokenData, null, 2));
    console.log(' [Auth] Available fields:', Object.keys(tokenData));
    console.log(' [Auth] Looking for numeric ID in:', {
        id: (tokenData as any).id,
        userId: (tokenData as any).userId,
        instructorId: (tokenData as any).instructorId,
        user: (tokenData as any).user,
    });

    // Store tokens
    setAccessToken(tokenData.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);

    // Extract numeric ID from response
    const numericId = tokenData.instructorId || tokenData.studentId || tokenData.id;

    storage.set(STORAGE_KEYS.USER, {
        id: numericId || tokenData.email,
        userName: tokenData.userName,
        email: tokenData.email,
        role: tokenData.role,
    });

    console.log(' [Auth] Stored user with ID:', numericId || tokenData.email);

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
    await api.post<ApiResponse>(ENDPOINTS.AUTH.SEND_PASSWORD_RESET_EMAIL, command);
};

/**
 * Change/reset password
 * @param command - Password reset command with token
 */
export const changePassword = async (command: UserPasswordResetCommand): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.AUTH.CHANGE_PASSWORD, command);
};

/**
 * Logout user (clears local storage)
 */
export const logout = (): void => {
    setAccessToken(null);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
};
