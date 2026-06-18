import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { signalRNotificationService } from '@/services/signalrNotificationService';
import type { NotificationDto } from '@/types/api.types';

export interface ToastData {
    id: string;
    title: string;
    message: string;
    type: string;
}

export const useRealtimeNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [queue, setQueue] = useState<ToastData[]>([]);
    const [activeToast, setActiveToast] = useState<ToastData | null>(null);

    // Setup connection based on auth status
    useEffect(() => {
        if (user) {
            signalRNotificationService.connect();
        } else {
            signalRNotificationService.disconnect();
        }
    }, [user]);

    // Listen to recieveNotification events
    useEffect(() => {
        if (!user) return;

        const unsubscribe = signalRNotificationService.addListener((title, message, type) => {
            const newNotif: NotificationDto = {
                id: `realtime_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                title,
                message,
                type,
                createdAt: new Date().toISOString(),
                isRead: false,
            };

            // Update React Query cache for all active notification queries
            const queries = queryClient.getQueryCache().getAll();
            queries.forEach((query) => {
                const key = query.queryKey;
                if (Array.isArray(key) && key[0] === 'notifications') {
                    queryClient.setQueryData<any>(key, (oldData: any) => {
                        if (!oldData) return oldData;
                        const items = oldData.items || [];
                        return {
                            ...oldData,
                            items: [newNotif, ...items],
                            totalResults: (oldData.totalResults || 0) + 1,
                        };
                    });
                }
            });

            // Queue the toast to be shown
            setQueue((prev) => [
                ...prev,
                {
                    id: newNotif.id,
                    title,
                    message,
                    type,
                },
            ]);
        });

        return () => {
            unsubscribe();
        };
    }, [user, queryClient]);

    // Pop the next toast from the queue when there is no active toast
    useEffect(() => {
        if (activeToast || queue.length === 0) return;

        const nextToast = queue[0];
        setActiveToast(nextToast);
        setQueue((prev) => prev.slice(1));
    }, [queue, activeToast]);

    // Handle the 5-second auto-dismiss timer for the active toast
    useEffect(() => {
        if (!activeToast) return;

        const timer = setTimeout(() => {
            setActiveToast(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeToast]);

    return {
        activeToast,
        clearActiveToast: () => setActiveToast(null),
    };
};
