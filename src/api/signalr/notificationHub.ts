import * as signalR from '@microsoft/signalr';
import { getAccessToken } from '@/api/client';
import { API_URL } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Maps to the backend `NotificationType` enum.
 * Keep in sync with the C# definition.
 */
export const NotificationType = {
    NewAssignmentAdded:            'NewAssignmentAdded',
    CourseMaterialsUpdated:        'CourseMaterialsUpdated',
    NewQuizAdded:                  'NewQuizAdded',
    AttemptReviewed:               'AttemptReviewed',
    DeadlineReached:               'DeadlineReached',
    AiQuestionGenerationFinished:  'AiQuestionGenerationFinished',
    CourseRemovedByAdmin:          'CourseRemovedByAdmin',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];


type NotificationHandler = (title: string, message: string, type: NotificationType) => void;
type StatusChangeCallback = (status: NotificationConnectionStatus) => void;

// ─── Hub URL Derivation ───────────────────────────────────────────────────────

/**
 * Derives the absolute NotificationHub URL from VITE_API_URL.
 * e.g. "https://api.example.com/api" → "https://api.example.com/notificationHub"
 */
function getNotificationHubUrl(): string {
    const trimmed = API_URL.replace(/\/+$/, '');
    const origin = trimmed.replace(/\/api\/?$/i, '');
    return `${origin}/notificationHub`;
}

// ─── Singleton Manager ────────────────────────────────────────────────────────

/**
 * NotificationHubManager is a singleton that manages a single SignalR HubConnection
 * to the backend NotificationHub.
 *
 * Design principles:
 * - Only ONE HubConnection instance exists at any time.
 * - `connect()` is idempotent: calling it when already connected/connecting is safe.
 * - `disconnect()` performs a clean, ordered shutdown.
 * - `reconnectWithNewToken()` stops, waits, then reconnects with the latest token from storage.
 * - Multiple notification handlers and status-change callbacks are supported.
 * - `accessTokenFactory` always reads from the live module-level `getAccessToken()`,
 *   so SignalR always gets the latest JWT without needing a rebuild.
 */
class NotificationHubManager {
    private connection: signalR.HubConnection | null = null;

    /**
     * Guards against parallel connect() calls.
     * While a connect is in flight, any new caller awaits the same promise.
     */
    private connectingPromise: Promise<void> | null = null;

    private _isConnected = false;
    private _isConnecting = false;

    /** Set of notification payload handlers (supports multiple subscribers). */
    private handlers: Set<NotificationHandler> = new Set();

    /** Set of connection-status change callbacks. */
    private statusCallbacks: Set<StatusChangeCallback> = new Set();

    // ── Public API ─────────────────────────────────────────────────────────────

    getConnectionStatus(): NotificationConnectionStatus {
        if (this._isConnected) return 'connected';
        if (this._isConnecting) return 'connecting';
        return 'disconnected';
    }

    /**
     * Register a handler for incoming `recieveNotification` events.
     * @returns Cleanup function that removes the handler.
     */
    addNotificationHandler(handler: NotificationHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    /**
     * Register a callback that fires whenever the connection status changes.
     * @returns Cleanup function that removes the callback.
     */
    addStatusChangeCallback(cb: StatusChangeCallback): () => void {
        this.statusCallbacks.add(cb);
        return () => this.statusCallbacks.delete(cb);
    }

    /**
     * Establishes the SignalR connection.
     * - Safe to call multiple times; subsequent calls while connecting/connected are no-ops.
     * - Parallel callers share the same in-flight promise.
     */
    async connect(): Promise<void> {
        if (this._isConnected) {
            console.log('[NotificationHub] Already connected — skipping connect()');
            return;
        }

        // Return the in-flight promise to the new caller instead of starting a second one.
        if (this.connectingPromise) {
            console.log('[NotificationHub] Already connecting — awaiting existing promise');
            return this.connectingPromise;
        }

        this._isConnecting = true;
        this.emitStatus('connecting');

        const promise = (async () => {
            try {
                const conn = this.buildConnection();
                this.attachListeners(conn);
                this.connection = conn;

                await conn.start();

                this._isConnected = true;
                this._isConnecting = false;
                console.log('[NotificationHub] ✓ Connected to', getNotificationHubUrl());
                this.emitStatus('connected');
            } catch (err) {
                this._isConnected = false;
                this._isConnecting = false;
                this.connection = null;
                console.error('[NotificationHub] ✗ Failed to connect:', err);
                this.emitStatus('disconnected');
                throw err;
            } finally {
                this.connectingPromise = null;
            }
        })();

        this.connectingPromise = promise;
        return promise;
    }

    /**
     * Stops the connection cleanly and resets all internal state.
     * Safe to call even if already disconnected.
     */
    async disconnect(): Promise<void> {
        // Cancel any pending in-flight connect guard.
        this.connectingPromise = null;

        const conn = this.connection;
        this.connection = null;
        this._isConnected = false;
        this._isConnecting = false;

        if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
            try {
                await conn.stop();
                console.log('[NotificationHub] Connection stopped cleanly');
            } catch (e) {
                console.warn('[NotificationHub] Error while stopping connection:', e);
            }
        }

        this.emitStatus('disconnected');
    }

    /**
     * Reconnects using the latest access token from storage.
     * Called when the JWT is refreshed so SignalR uses the new token immediately.
     *
     * Flow:
     *   1. disconnect() — stops the old connection fully
     *   2. Small delay to let the server close the socket
     *   3. connect()   — builds a new connection; accessTokenFactory reads the new token
     */
    async reconnectWithNewToken(): Promise<void> {
        console.log('[NotificationHub] Token updated — reconnecting with new JWT...');
        await this.disconnect();
        // Brief pause to ensure the server-side connection is fully torn down.
        await new Promise<void>(resolve => setTimeout(resolve, 150));
        await this.connect();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private emitStatus(status: NotificationConnectionStatus): void {
        this.statusCallbacks.forEach(cb => {
            try {
                cb(status);
            } catch (e) {
                console.error('[NotificationHub] Status callback error:', e);
            }
        });
    }

    /**
     * Builds a new HubConnection.  The `accessTokenFactory` closure always reads
     * from the live `getAccessToken()` value, so no rebuild is needed after a refresh —
     * SignalR will fetch the latest token on the next request automatically.
     */
    private buildConnection(): signalR.HubConnection {
        return new signalR.HubConnectionBuilder()
            .withUrl(getNotificationHubUrl(), {
                // Always returns the current JWT; safe across token refreshes.
                accessTokenFactory: () => getAccessToken() ?? '',
                transport:
                    signalR.HttpTransportType.WebSockets |
                    signalR.HttpTransportType.LongPolling,
            })
            .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }

    /**
     * Attaches the server-event listeners and lifecycle hooks to a connection.
     * This must be called before `.start()`.
     */
    private attachListeners(conn: signalR.HubConnection): void {
        // ── Server event: notification payload ──────────────────────────────────
        conn.on('recieveNotification', (rawTitle: unknown, rawMessage: unknown, rawType: unknown) => {
            const title   = rawTitle   != null ? String(rawTitle).trim()   : '';
            const message = rawMessage != null ? String(rawMessage).trim() : '';
            // Safely coerce the type; fall back to NewAssignmentAdded if unrecognized.
            const type: NotificationType =
                Object.values(NotificationType).includes(rawType as NotificationType)
                    ? (rawType as NotificationType)
                    : NotificationType.NewAssignmentAdded;

            console.log('[NotificationHub] ← recieveNotification:', title, '|', message, '|', type);

            this.handlers.forEach(h => {
                try {
                    h(title, message, type);
                } catch (e) {
                    console.error('[NotificationHub] Notification handler error:', e);
                }
            });
        });

        // ── Lifecycle events ────────────────────────────────────────────────────
        conn.onreconnecting(err => {
            console.warn('[NotificationHub] Reconnecting...', err?.message ?? '');
            this._isConnected = false;
            this._isConnecting = true;
            this.emitStatus('connecting');
        });

        conn.onreconnected(connectionId => {
            console.log('[NotificationHub] ✓ Reconnected. ConnectionId:', connectionId);
            this._isConnected = true;
            this._isConnecting = false;
            this.emitStatus('connected');
        });

        conn.onclose(err => {
            console.warn('[NotificationHub] Connection closed.', err?.message ?? '');
            this._isConnected = false;
            this._isConnecting = false;
            // Only reset our reference if this closure event belongs to the active connection.
            if (this.connection === conn) {
                this.connection = null;
            }
            this.emitStatus('disconnected');
        });
    }
}

// ─── Export singleton ─────────────────────────────────────────────────────────

/** The single shared NotificationHub manager for the entire application. */
export const notificationHubManager = new NotificationHubManager();
