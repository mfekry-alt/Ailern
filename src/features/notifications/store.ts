import { create } from 'zustand';
import { notificationHubManager, type NotificationConnectionStatus, NotificationType } from '@/api/signalr/notificationHub';

// ─── Types ────────────────────────────────────────────────────────────────────

export { NotificationType };

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    receivedAt: string; // ISO-8601
}

/** A lightweight descriptor for active toast popups. */
export interface ToastNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    createdAt: Date;
}

interface NotificationState {
    // ── Persisted list ─────────────────────────────────────────────────────────
    notifications: AppNotification[];
    hasUnread: boolean;
    connectionStatus: NotificationConnectionStatus;

    // ── Active toast queue (max 3 visible) ────────────────────────────────────
    toastQueue: ToastNotification[];

    // ── Notification CRUD ──────────────────────────────────────────────────────
    /** Prepend a new incoming notification (capped at 50) and enqueue a toast. */
    addNotification: (title: string, message: string, type: NotificationType) => void;
    /** Mark every notification as read and clear the unread badge. */
    markAllRead: () => void;
    /** Mark a single notification as read by id. */
    markRead: (id: string) => void;
    /** Clear all notifications (used on logout). */
    clearAll: () => void;

    // ── Toast queue management ─────────────────────────────────────────────────
    /** Remove a toast from the active queue (called after it animates out). */
    dismissToast: (id: string) => void;

    // ── Internal: sync connection status from the hub manager ──────────────────
    setConnectionStatus: (status: NotificationConnectionStatus) => void;

    // ── SignalR lifecycle (called by NotificationProvider) ─────────────────────
    /** Open the SignalR connection to NotificationHub. */
    connect: () => Promise<void>;
    /** Close the SignalR connection and reset status. */
    disconnect: () => Promise<void>;
    /**
     * Call after a JWT refresh so SignalR reconnects with the new token.
     * The manager internally reads the latest token from `getAccessToken()`.
     */
    handleTokenUpdate: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    hasUnread: false,
    connectionStatus: 'disconnected',
    toastQueue: [],

    // ── Notification CRUD ──────────────────────────────────────────────────────

    addNotification: (title, message, type) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const notification: AppNotification = {
            id,
            title,
            message,
            type,
            isRead: false,
            receivedAt: new Date().toISOString(),
        };

        const toast: ToastNotification = {
            id,
            title,
            message,
            type,
            createdAt: new Date(),
        };

        set(state => ({
            // Most-recent first, keep a max of 50 to prevent unbounded growth.
            notifications: [notification, ...state.notifications].slice(0, 50),
            hasUnread: true,
            // Queue: keep at most 3 visible at a time.
            toastQueue: [...state.toastQueue, toast].slice(-3),
        }));
    },

    markAllRead: () =>
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, isRead: true })),
            hasUnread: false,
        })),

    markRead: (id) =>
        set(state => {
            const updated = state.notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            );
            return {
                notifications: updated,
                hasUnread: updated.some(n => !n.isRead),
            };
        }),

    clearAll: () => set({ notifications: [], hasUnread: false, toastQueue: [] }),

    // ── Toast queue management ─────────────────────────────────────────────────

    dismissToast: (id) =>
        set(state => ({
            toastQueue: state.toastQueue.filter(t => t.id !== id),
        })),

    // ── Internal ───────────────────────────────────────────────────────────────

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    // ── SignalR lifecycle ──────────────────────────────────────────────────────

    connect: () => notificationHubManager.connect(),

    disconnect: async () => {
        await notificationHubManager.disconnect();
        set({ connectionStatus: 'disconnected' });
    },

    handleTokenUpdate: () => notificationHubManager.reconnectWithNewToken(),
}));
