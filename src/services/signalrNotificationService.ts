import * as signalR from '@microsoft/signalr';
import { getAccessToken } from '@/api/client';
import { API_URL } from '@/lib/constants';

class SignalRNotificationService {
    private connection: signalR.HubConnection | null = null;
    private listeners: ((title: string, message: string, type: string) => void)[] = [];
    private isConnecting = false;

    public getHubUrl(): string {
        const cleanUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        if (cleanUrl.endsWith('/api')) {
            return cleanUrl.substring(0, cleanUrl.length - 4) + '/notificationHub';
        }
        return cleanUrl + '/notificationHub';
    }

    public connect(): void {
        const token = getAccessToken();
        if (!token) {
            console.log('[SignalR] No access token available. Skipping connection.');
            return;
        }

        if (this.connection) {
            console.log('[SignalR] Connection already exists or in progress.');
            return;
        }

        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;
        const hubUrl = this.getHubUrl();

        console.log(`[SignalR] Connecting to ${hubUrl}...`);

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => {
                    const latestToken = getAccessToken();
                    return latestToken || '';
                }
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on('recieveNotification', (title: string, message: string, type: string) => {
            console.log('[SignalR] Received notification:', { title, message, type });
            this.listeners.forEach((listener) => {
                try {
                    listener(title, message, type);
                } catch (err) {
                    console.error('[SignalR] Error in listener callback:', err);
                }
            });
        });

        this.connection.onreconnecting((error) => {
            console.warn('[SignalR] Connection lost. Reconnecting...', error);
        });

        this.connection.onreconnected((connectionId) => {
            console.log('[SignalR] Reconnected successfully. ConnectionId:', connectionId);
        });

        this.connection.onclose((error) => {
            console.error('[SignalR] Connection closed.', error);
            this.connection = null;
            this.isConnecting = false;
        });

        this.connection.start()
            .then(() => {
                console.log('[SignalR] Connected successfully.');
                this.isConnecting = false;
            })
            .catch((err) => {
                console.error('[SignalR] Error establishing connection:', err);
                this.connection = null;
                this.isConnecting = false;
            });
    }

    public disconnect(): void {
        if (this.connection) {
            console.log('[SignalR] Disconnecting...');
            this.connection.stop()
                .then(() => {
                    console.log('[SignalR] Disconnected.');
                })
                .catch((err) => {
                    console.error('[SignalR] Error closing connection:', err);
                })
                .finally(() => {
                    this.connection = null;
                    this.isConnecting = false;
                });
        }
    }

    public addListener(callback: (title: string, message: string, type: string) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }
}

export const signalRNotificationService = new SignalRNotificationService();
export default signalRNotificationService;
