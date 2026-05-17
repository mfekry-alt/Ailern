import * as signalR from '@microsoft/signalr';
import { getAccessToken } from '@/api/client';

/** Must match server SendAsync("StatusUpdated", ...) */
export const AI_RESOURCES_HUB_METHOD = 'StatusUpdated';

/** Must match server SendAsync("QuestionsGenerated", ...) */
export const QUESTIONS_GENERATED_METHOD = 'QuestionsGenerated';

/** Must match server SendAsync("AIServiceProblem", ...) */
export const AI_SERVICE_PROBLEM_METHOD = 'AIServiceProblem';

export type AiResourceLiveStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export type QuestionsGeneratedHandler = (questionsCount: number, completed: boolean) => void;

export type AIServiceProblemHandler = (error?: string) => void;

export function getAiResourcesHubUrl(): string {
    const api = import.meta.env.VITE_API_URL ?? 'https://localhost:7080/api/';
    const trimmed = api.replace(/\/+$/, '');
    const origin = trimmed.replace(/\/api\/?$/i, '');
    return `${origin}/hubs/ai-resources`;
}

export function parseAiResourceStatus(raw: unknown): AiResourceLiveStatus | undefined {
    if (raw == null) return undefined;
    const s = String(raw).trim();
    if (['Pending', 'Processing', 'Completed', 'Failed'].includes(s)) return s as AiResourceLiveStatus;
    const lower = s.toLowerCase();
    if (lower === 'pending') return 'Pending';
    if (lower === 'processing') return 'Processing';
    if (lower === 'completed') return 'Completed';
    if (lower === 'failed') return 'Failed';
    return undefined;
}

export type StatusUpdatedHandler = (fileId: string, status: AiResourceLiveStatus, error?: string) => void;

/**
 * Build and start the AI resources hub. Caller must `.stop()` on unmount / tab close.
 */
export function createAiResourcesHubConnection(
    onStatusUpdated: StatusUpdatedHandler,
    onQuestionsGenerated?: QuestionsGeneratedHandler,
    onAIServiceProblem?: AIServiceProblemHandler
): signalR.HubConnection {
    const hubUrl = getAiResourcesHubUrl();

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
            accessTokenFactory: () => getAccessToken() ?? '',
            transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

    connection.on(AI_RESOURCES_HUB_METHOD, (fileId: unknown, status: unknown, error: unknown) => {
        console.log('(( ===StatusUpdated 📌📌 received from hub === )) =====> ', fileId, status, error);
        const id = fileId != null ? String(fileId) : '';
        const parsed = parseAiResourceStatus(status);
        const errorMsg = error ? String(error) : undefined;
        if (!id || !parsed) return;
        console.log('StatusUpdated parsed', id, parsed, errorMsg);
        onStatusUpdated(id, parsed, errorMsg);
    });

    if (onQuestionsGenerated) {
        connection.on(QUESTIONS_GENERATED_METHOD, (questionsCount: unknown, completed: unknown) => {
            console.log('(( ===QuestionsGenerated 🤖 received from hub === )) =====> ', questionsCount, completed);
            const count = Number(questionsCount) || 0;
            const isCompleted = Boolean(completed);
            onQuestionsGenerated(count, isCompleted);
        });
    }

    if (onAIServiceProblem) {
        connection.on(AI_SERVICE_PROBLEM_METHOD, (error: unknown) => {
            const errorMsg = error != null && String(error).trim() !== '' ? String(error).trim() : undefined;
            onAIServiceProblem(errorMsg);
        });
    }

    return connection;
}
