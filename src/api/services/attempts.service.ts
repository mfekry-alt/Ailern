/**
 * Quiz Attempts Service
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    AnswerDto,
    ApiEnvelope,
    ApiResponse,
    AttemptQuestionDto,
    AttemptResultDto,
    GetAttemptsByQuizIdDto,
    GradeSubmissionBody,
} from '@/types/api.types';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface StartAttemptResponse {
    attemptId: string;
    attemptEndDate: string;
    /** UTC ISO-8601 timestamp of when the attempt was started */
    startedAt: string;
    /** Duration of the quiz in minutes */
    durationMinutes: number;
    /** Alias for legacy callers */
    id: string;
}

/** Response from the NTP-style time sync endpoint */
export interface SyncTimeResponse {
    serverTime: string;
    attemptEndTime: string;
}

/** Normalized attempt question for UI (maps from AttemptQuestionDto) */
export interface AttemptQuestion {
    id: string;
    question: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    mark: number;
    instructions: string | null;
    options: { option: string; optionId: string; order?: number }[];
    writtenAnswer: string | null;
    selectedOptionId: string | null;
    order: number;
    shuffledOptionIds: string[];
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

/** Summary for result screens (from AttemptResultDto) */
export interface AttemptResult {
    quizId: string;
    score: number;
    totalScore: number;
    percentage: number;
    status: string;
    quizName?: string;
    submittedAt?: string;
    attemptNumber?: number;
    timeSpent?: number;
    raw?: AttemptResultDto;
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

export interface InstructorAttemptAnswer extends AnswerDto {
    questionId: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const unwrapData = <T>(body: unknown): T | undefined => {
    if (body && typeof body === 'object' && 'data' in (body as object)) {
        return (body as ApiEnvelope<T>).data;
    }
    return undefined;
};

// ─── Start Attempt ─────────────────────────────────────────────────────────

let activeStartPromise: Promise<StartAttemptResponse> | null = null;

export const startQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {
    if (activeStartPromise) return activeStartPromise;

    activeStartPromise = (async () => {
        try {
            const response = await api.post<ApiResponse<{ attemptId: string; attemptEndDate: string; startedAt?: string; durationMinutes?: number }>>(
                ENDPOINTS.ATTEMPTS.START(quizId),
                {}
            );
            const raw: { attemptId?: string; attemptEndDate?: string; id?: string; endDate?: string; startedAt?: string; durationMinutes?: number } =
                unwrapData<{ attemptId?: string; attemptEndDate?: string; id?: string; endDate?: string; startedAt?: string; durationMinutes?: number }>(response.data)
                ?? {};
            const attemptId = String(raw?.attemptId ?? (raw as { id?: string })?.id ?? '');
            const attemptEndDate = String(raw?.attemptEndDate ?? (raw as { endDate?: string })?.endDate ?? '');
            const startedAt = raw?.startedAt ?? '';
            const durationMinutes = raw?.durationMinutes ?? 0;
            return { attemptId, id: attemptId, attemptEndDate, startedAt, durationMinutes };
        } finally {
            activeStartPromise = null;
        }
    })();

    return activeStartPromise;
};

/** @deprecated Use startQuizAttempt instead */
export const startOrResumeQuizAttempt = startQuizAttempt;

// ─── Time Sync ─────────────────────────────────────────────────────────────

/** GET /api/Attempts/{attemptId}/sync — returns serverTime + attemptEndTime for NTP calibration */
export const syncAttemptTime = async (attemptId: string): Promise<SyncTimeResponse> => {
    const response = await api.get<ApiResponse<SyncTimeResponse>>(
        ENDPOINTS.ATTEMPTS.SYNC(attemptId)
    );
    const data = unwrapData<SyncTimeResponse>(response.data);
    if (!data) {
        throw new Error('Time sync failed: no data returned');
    }
    return data;
};

// ─── Get Attempt Questions ─────────────────────────────────────────────────

let activeQuestionsPromise: Partial<Record<string, Promise<AttemptQuestion[]>>> = {};

export const getAttemptQuestions = async (attemptId: string): Promise<AttemptQuestion[]> => {
    if (activeQuestionsPromise[attemptId]) return activeQuestionsPromise[attemptId]!;

    activeQuestionsPromise[attemptId] = (async () => {
        try {
            const response = await api.get<ApiResponse<AttemptQuestionDto[]>>(ENDPOINTS.ATTEMPTS.GET_QUESTIONS(attemptId));
            const rawQuestions = unwrapData(response.data) ?? [];
            const arr = Array.isArray(rawQuestions) ? rawQuestions : [];

            return arr.map((q: AttemptQuestionDto): AttemptQuestion => ({
                id: String(q.id || ''),
                question: q.question || '',
                type: q.type || 'MCQ',
                mark: Number(q.mark ?? 0),
                instructions: q.instructions ?? null,
                options: (q.options || []).map((opt) => ({
                    option: opt.option || '',
                    optionId: String(opt.optionId || ''),
                    order: opt.order,
                })),
                writtenAnswer: q.writtenAnswer ?? null,
                selectedOptionId: q.selectedOptionId ?? null,
                order: q.order,
                shuffledOptionIds: q.shuffledOptionIds ?? [],
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

/** GET /api/Quizzes/{quizId}/my-attempts — returns GetAttemptsByQuizIdDto */
export const getMyAttemptsForQuiz = async (quizId: string): Promise<GetAttemptsByQuizIdDto | null> => {
    try {
        const response = await api.get<ApiResponse<GetAttemptsByQuizIdDto>>(
            ENDPOINTS.ATTEMPTS.MY_ATTEMPTS_FOR_QUIZ(quizId)
        );
        return unwrapData(response.data) ?? null;
    } catch {
        return null;
    }
};

/** @deprecated Prefer getMyAttemptsForQuiz — kept for callers expecting a flat attempts array */
export const getQuizAttempts = async (quizId: string): Promise<unknown[]> => {
    const dto = await getMyAttemptsForQuiz(quizId);
    return dto?.attempts ?? [];
};

// ─── Get Attempt Result ────────────────────────────────────────────────────

let activeResultPromises: Record<string, Promise<AttemptResult> | undefined> = {};

export const getAttemptResult = async (attemptId: string): Promise<AttemptResult> => {
    if (activeResultPromises[attemptId]) return activeResultPromises[attemptId]!;

    activeResultPromises[attemptId] = (async () => {
        try {
            const response = await api.get<ApiResponse<AttemptResultDto>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
            const data: AttemptResultDto = unwrapData<AttemptResultDto>(response.data) ?? {
                attemptId,
                status: 'Submitted',
                quizTitle: '',
                quizId: '',
                answers: [],
                timeSpent: 0,
                totalScore: 0,
                score: 0,
            };

            const achieved = data.score ?? 0;
            const total = data.totalScore || 1;

            return {
                quizId: data.quizId,
                score: achieved,
                totalScore: total,
                percentage: Math.round((achieved / total) * 100),
                status: data.status || 'Submitted',
                quizName: data.quizTitle,
                submittedAt: undefined,
                attemptNumber: undefined,
                timeSpent: data.timeSpent,
                raw: data,
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
        const response = await api.get<ApiResponse<AttemptResultDto>>(ENDPOINTS.ATTEMPTS.GET_STUDENT_ANSWERS(attemptId));
        const data = unwrapData<AttemptResultDto>(response.data);
        const resultsArray = data?.answers ?? [];

        return resultsArray.map((item: AnswerDto, idx: number) => ({
            questionId: String(idx),
            questionText: item.questionText || '',
            studentAnswer: item.answer ?? '',
            correctAnswer: undefined,
            isCorrect: item.score > 0,
            points: item.score,
            possiblePoints: item.maxScore,
        }));
    } catch {
        return [];
    }
};

/** GET /api/Attempts/{attemptId}/student-answers — instructor review payload */
export const getAttemptStudentAnswers = async (attemptId: string): Promise<AttemptResultDto> => {
    const response = await api.get<ApiResponse<AttemptResultDto>>(ENDPOINTS.ATTEMPTS.GET_STUDENT_ANSWERS(attemptId));
    const data = unwrapData<AttemptResultDto>(response.data);
    if (!data) {
        throw new Error('No student answers returned');
    }
    return data;
};

// ─── Grading Operations ────────────────────────────────────────────────────

export interface GradeEntry {
    questionId: string;
    score: number;
    feedback?: string;
}

export type GradeSubmissionPayload = GradeSubmissionBody;

export const gradeSubmission = async (attemptId: string, payload: GradeSubmissionPayload): Promise<unknown> => {
    const response = await api.put<ApiResponse<null>>(ENDPOINTS.ATTEMPTS.GRADE(attemptId), payload);
    return unwrapData(response.data);
};
