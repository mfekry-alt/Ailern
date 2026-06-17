/**
 * NotificationProvider
 *
 * Bridges the SignalR NotificationHub lifecycle with React's auth state.
 *
 * Responsibilities:
 *  1. Register a handler that feeds incoming hub events into the Zustand store
 *     (which also enqueues a toast automatically).
 *  2. Propagate connection-status changes from the hub manager to the store.
 *  3. Connect when the user authenticates; disconnect (and clear state) on logout.
 *  4. Detect JWT changes in the Zustand auth store (e.g. silent refresh) and
 *     force the hub manager to reconnect with the new token.
 *  5. React to the low-level API-interceptor token-refresh callback so
 *     SignalR is also reconnected when the axios layer silently refreshes.
 *  6. Render the global <NotificationToastContainer /> so toasts appear app-wide.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useNotificationStore } from './store';
import { notificationHubManager } from '@/api/signalr/notificationHub';
import { setOnSignalRTokenRefreshedCallback } from '@/api/client';
import { NotificationToastContainer } from './NotificationToast';

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const isAuthenticated  = useAuthStore(s => s.isAuthenticated);
    const accessToken      = useAuthStore(s => s.accessToken);

    const addNotification     = useNotificationStore(s => s.addNotification);
    const setConnectionStatus = useNotificationStore(s => s.setConnectionStatus);
    const clearAll            = useNotificationStore(s => s.clearAll);

    /** Track the previous token value so we can detect genuine changes. */
    const prevTokenRef = useRef<string | null>(null);

    // ── 1. Wire connection-status callbacks ────────────────────────────────────
    useEffect(() => {
        const remove = notificationHubManager.addStatusChangeCallback(setConnectionStatus);
        return remove;
    }, [setConnectionStatus]);

    // ── 2. Wire notification-payload handler ───────────────────────────────────
    useEffect(() => {
        const remove = notificationHubManager.addNotificationHandler(
            (title, message, type) => {
                // addNotification persists to the store AND enqueues a toast.
                addNotification(title, message, type);
            }
        );

        return remove;
    }, [addNotification]);

    // ── 3. Connect on login / disconnect on logout ─────────────────────────────
    useEffect(() => {
        if (isAuthenticated) {
            notificationHubManager.connect().catch(err => {
                console.error('[NotificationProvider] Initial connect failed:', err);
            });
        } else {
            // User logged out — stop the hub and wipe local notification state.
            notificationHubManager.disconnect().then(() => clearAll()).catch(() => {
                clearAll();
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // ── 4. Reconnect when the JWT stored in Zustand changes ───────────────────
    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            prevTokenRef.current = accessToken;
            return;
        }

        const prev = prevTokenRef.current;
        prevTokenRef.current = accessToken;

        // Only trigger if the token genuinely changed (not the initial mount).
        if (prev !== null && prev !== accessToken) {
            console.log('[NotificationProvider] Access token changed — reconnecting SignalR...');
            notificationHubManager.reconnectWithNewToken().catch(err => {
                console.error('[NotificationProvider] Reconnect after token change failed:', err);
            });
        }
    }, [accessToken, isAuthenticated]);

    // ── 5. React to axios interceptor's token-refresh success event ────────────
    useEffect(() => {
        setOnSignalRTokenRefreshedCallback(() => {
            if (isAuthenticated) {
                console.log('[NotificationProvider] API refresh detected — reconnecting SignalR...');
                notificationHubManager.reconnectWithNewToken().catch(err => {
                    console.error('[NotificationProvider] Post-refresh reconnect failed:', err);
                });
            }
        });

        return () => {
            setOnSignalRTokenRefreshedCallback(null);
        };
    }, [isAuthenticated]);

    return (
        <>
            {children}
            {/* Global floating toast container – rendered outside the page flow */}
            <NotificationToastContainer />
        </>
    );
};

export default NotificationProvider;
