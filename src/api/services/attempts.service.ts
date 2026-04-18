/**
 * Quiz Attempts Service
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface StartAttemptResponse {
    id: string;
    attemptEndDate: string;
    [key: string]: any;
}

export interface AttemptQuestion {
    id: string;
    question: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    instructions: string | null;
    options: { option: string; optionId: string }[];
    writtenAnswer: string | null;
    selectedOptionId: string | null;
}

export interface SaveAnswerEntry {
    questionId: string;
    optionId?: string | null;
    writtenAnswer?: string | null;
}

/** @deprecated Use SaveAnswerEntry instead */
export type QuestionAttempt = SaveAnswerEntry;

/** @deprecated API expects a raw array; use SaveAnswerEntry[] */
export interface SaveAttemptPayload {
    answers: SaveAnswerEntry[];
}

/** Local answer row (supports legacy `answer` / `selectedOptions` from older forms) */
export type LocalAnswerLike = {
    questionId: string;
    optionId?: string | null;
    writtenAnswer?: string | null;
    answer?: string;
    selectedOptions?: string[];
};

/**
 * Build POST /Attempts/{id}/save body: a JSON array of entries.
 * Written → non-empty writtenAnswer, optionId null.
 * MCQ / TrueFalse → optionId set, writtenAnswer null.
 * Omits rows with nothing to save for that question type.
 */
export function buildSaveAnswerEntries(
    questions: Array<{ id: string; type: string }>,
    answers: LocalAnswerLike[],
): SaveAnswerEntry[] {
    const out: SaveAnswerEntry[] = [];
    for (const raw of answers) {
        const q = questions.find((x) => x.id === raw.questionId);
        if (!q) continue;
        const optionId = raw.optionId ?? raw.selectedOptions?.[0] ?? null;
        const writtenRaw = raw.writtenAnswer ?? raw.answer ?? null;

        if (q.type === 'Written') {
            const text = typeof writtenRaw === 'string' ? writtenRaw.trim() : '';
            if (!text) continue;
            out.push({ questionId: raw.questionId, writtenAnswer: text, optionId: null });
        } else {
            if (!optionId) continue;
            out.push({ questionId: raw.questionId, optionId: String(optionId), writtenAnswer: null });
        }
    }
    return out;
}

export interface AttemptResult {
    quizId: string;
    score: number;
    totalScore: number;
    percentage: number;
    status: string;
    studentId?: number;
    quizName?: string;
    submittedAt?: string;
    attemptNumber?: number;
    timeSpent?: number;
}

export interface StudentAnswer {
    questionId: string;
    questionText: string;
    studentAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    points?: number;
    possiblePoints?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const extractArray = (res: any): any[] => {
    if (!res) return [];
    const body = res.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.data?.attempts)) return body.data.attempts;
    if (Array.isArray(body?.attempts)) return body.attempts;
    if (Array.isArray(body?.items)) return body.items;
    return [];
};

// ─── Start Attempt ─────────────────────────────────────────────────────────

let activeStartPromise: Promise<StartAttemptResponse> | null = null;

export const startQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {
    if (activeStartPromise) return activeStartPromise;

    activeStartPromise = (async () => {
        try {
            const response = await api.post<any>(ENDPOINTS.ATTEMPTS.START(quizId), {});
            const raw = response.data?.data ?? response.data;
            return {
                ...raw,
                id: String(raw.id || raw.attemptId || ''),
                attemptEndDate: raw.attemptEndDate || raw.endDate || '',
            } as StartAttemptResponse;
        } finally {
            activeStartPromise = null;
        }
    })();

    return activeStartPromise;
};

/** @deprecated Use startQuizAttempt instead */
export const startOrResumeQuizAttempt = startQuizAttempt;

// ─── Get Attempt Questions ─────────────────────────────────────────────────

let activeQuestionsPromise: Partial<Record<string, Promise<AttemptQuestion[]>>> = {};

export const getAttemptQuestions = async (attemptId: string): Promise<AttemptQuestion[]> => {
    if (activeQuestionsPromise[attemptId]) return activeQuestionsPromise[attemptId]!;

    activeQuestionsPromise[attemptId] = (async () => {
        try {
            const response = await api.get<ApiResponse<any[]>>(ENDPOINTS.ATTEMPTS.GET_QUESTIONS(attemptId));
            const rawQuestions = response.data?.data ?? response.data ?? [];
            const arr = Array.isArray(rawQuestions) ? rawQuestions : [];

            return arr.map((q: any): AttemptQuestion => ({
                id: String(q.id || ''),
                question: q.question || q.questionText || q.text || '',
                type: q.type || q.questionType || 'MCQ',
                instructions: q.instructions || null,
                options: (q.options || []).map((opt: any) => ({
                    option: opt.option || opt.optionText || opt.text || '',
                    optionId: String(opt.optionId || opt.id || ''),
                })),
                writtenAnswer: q.writtenAnswer || null,
                selectedOptionId: q.selectedOptionId || q.optionId || null,
            }));
        } finally {
            delete activeQuestionsPromise[attemptId];
        }
    })();

    return activeQuestionsPromise[attemptId]!;
};

// ─── Save Progress ─────────────────────────────────────────────────────────

/** POST body must be a raw JSON array (no wrapper object). Skips HTTP call when empty. */
export const saveAttemptProgress = async (attemptId: string, answers: SaveAnswerEntry[]) => {
    if (!answers.length) return null;
    const response = await api.post<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SAVE(attemptId), answers);
    return response.data;
};

// ─── Submit Attempt ────────────────────────────────────────────────────────

export const submitQuizAttempt = async (attemptId: string) => {
    const response = await api.put<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SUBMIT(attemptId), {});
    return response.data;
};

// ─── Get Attempts List ─────────────────────────────────────────────────────

let activeAllAttemptsPromise: Record<string, Promise<any[]> | undefined> = {};

export const getQuizAttempts = async (quizId: string): Promise<any[]> => {
    if (activeAllAttemptsPromise[quizId]) return activeAllAttemptsPromise[quizId]!;

    activeAllAttemptsPromise[quizId] = (async () => {
        try {
            const response = await api.get<any>(ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId));
            return extractArray(response);
        } catch {
            return [];
        } finally {
            delete activeAllAttemptsPromise[quizId];
        }
    })();

    return activeAllAttemptsPromise[quizId]!;
};

// ─── Get Attempt Result ────────────────────────────────────────────────────

let activeResultPromises: Record<string, Promise<AttemptResult> | undefined> = {};

export const getAttemptResult = async (attemptId: string): Promise<AttemptResult> => {
    if (activeResultPromises[attemptId]) return activeResultPromises[attemptId]!;

    activeResultPromises[attemptId] = (async () => {
        try {
            const response = await api.get<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
            const data = response.data?.data || {};

            const achieved = data.achievedScore || data.score || 0;
            const total = data.totalScore || data.totalMarks || 1;

            return {
                quizId: data.quizId,
                score: achieved,
                totalScore: total,
                percentage: Math.round((achieved / total) * 100),
                status: data.status || 'Submitted',
                quizName: data.quizName,
                submittedAt: data.submittedAt || data.updatedAt,
                attemptNumber: data.attemptNumber,
            };
        } finally {
            delete activeResultPromises[attemptId];
        }
    })();

    return activeResultPromises[attemptId]!;
};

// ─── Get Student Answers ───────────────────────────────────────────────────

export const getStudentAnswers = async (attemptId: string): Promise<StudentAnswer[]> => {
    try {
        const response = await api.get<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
        const data = response.data?.data;
        const resultsArray = data?.attemptResult || data?.answers || [];

        return resultsArray.map((item: any) => ({
            questionId: String(item.questionId || ''),
            questionText: item.questionText || item.question || '',
            studentAnswer: item.studentAnswer || item.booleanAnswer || String(item.optionId || ''),
            correctAnswer: item.correctAnswer || item.correctOptionText,
            isCorrect: item.score > 0 || item.isCorrect,
            points: item.score || item.pointsAchieved || 0,
            possiblePoints: item.maxScore || item.possiblePoints || 1,
        }));
    } catch {
        return [];
    }
};

// ─── Grading Operations ────────────────────────────────────────────────────

export interface GradeEntry {
    questionId: string;
    score: number;
    feedback?: string;
}

export interface GradeSubmissionPayload {
    grades: GradeEntry[];
    status: 'Submitted' | 'Reviewed';
}

export const gradeSubmission = async (attemptId: string, payload: GradeSubmissionPayload): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GRADE(attemptId), payload);
    return response.data?.data || response.data;
};
