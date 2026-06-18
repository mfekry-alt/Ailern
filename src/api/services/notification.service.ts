/**
 * Notification Service
 * Handles all notification-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, NotificationDto, PaginationResult } from '@/types/api.types';

/**
 * Get Paginated Notifications
 * GET /api/Notifications/Notifications
 */
export const getNotifications = async (
    pageNumber: number = 1,
    pageSize: number = 3
): Promise<PaginationResult<NotificationDto>> => {
    const response = await api.get<ApiResponse<PaginationResult<NotificationDto>>>(
        ENDPOINTS.NOTIFICATIONS.GET,
        {
            params: {
                PageNumber: pageNumber,
                PageSize: pageSize,
            },
        }
    );
    const payload = response.data;
    // Handle both wrapped and unwrapped response envelopes
    const raw = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
    const data = raw as any;

    return {
        items: data?.items ?? (Array.isArray(data) ? data : []),
        totalResults: data?.totalResults ?? 0,
        pagesCount: data?.totalPages ?? data?.pagesCount ?? 0,
        start: data?.start ?? 0,
        end: data?.end ?? 0,
    };
};

/**
 * Mark All Notifications As Read
 * PUT /api/Notifications/MarkAllAsRead
 */
export const markAllAsRead = async (): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(
        ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ
    );
    const payload = response.data;
    return (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
};

/**
 * Delete a Notification
 * DELETE /api/Notifications/{notificationId}
 */
export const deleteNotification = async (notificationId: string): Promise<any> => {
    const response = await api.delete<ApiResponse<any>>(
        ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
    );
    const payload = response.data;
    return (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
};
