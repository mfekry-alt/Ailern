import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import {
    createAiResourcesHubConnection,
    type StatusUpdatedHandler,
    type QuestionsGeneratedHandler,
    type AIServiceProblemHandler,
} from '@/api/signalr/aiResourcesHub';

/**
 * Subscribes to AI resource processing status for the current user.
 * When `enabled` is false, any active connection is stopped.
 * Stops on unmount and on `pagehide` (tab close / navigation away).
 */
export function useAiResourcesHub(
    onStatusUpdated: StatusUpdatedHandler,
    enabled: boolean,
    onQuestionsGenerated?: QuestionsGeneratedHandler,
    onAIServiceProblem?: AIServiceProblemHandler
) {
    const handlerRef = useRef(onStatusUpdated);
    handlerRef.current = onStatusUpdated;

    const questionsHandlerRef = useRef(onQuestionsGenerated);
    questionsHandlerRef.current = onQuestionsGenerated;

    const serviceProblemHandlerRef = useRef(onAIServiceProblem);
    serviceProblemHandlerRef.current = onAIServiceProblem;

    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const stop = useCallback(async () => {
        const conn = connectionRef.current;
        connectionRef.current = null;
        if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
            try {
                await conn.stop();
            } catch {
                /* ignore */
            }
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            void stop();
            return;
        }

        const conn = createAiResourcesHubConnection(
            (fileId, status, error) => handlerRef.current(fileId, status, error),
            (count, completed) => questionsHandlerRef.current?.(count, completed),
            (error) => serviceProblemHandlerRef.current?.(error)
        );
        connectionRef.current = conn;

        let cancelled = false;

        void (async () => {
            try {
                await conn.start();
            } catch (e) {
                if (!cancelled) console.error('[ai-resources hub] failed to start', e);
            }
        })();

        const onPageHide = () => {
            void stop();
        };
        window.addEventListener('pagehide', onPageHide);

        return () => {
            cancelled = true;
            window.removeEventListener('pagehide', onPageHide);
            void stop();
        };
    }, [enabled, stop]);

    return { stop };
}
