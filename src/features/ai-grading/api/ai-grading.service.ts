/**
 * AI Auto Grading Service
 * Handles communication with the backend AI grading engine.
 */
import { api } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
    AIGradingAttemptResult,
    AIGradedQuestion,
    GradingMode,
    AIGradingCriteriaResponse,
    AIGradingConfigUpdateRequest,
} from '../types/ai-grading.types';
import type { ApiResponse, AttemptResultDto, AnswerDto } from '@/types/api.types';

// ─── Helpers ───────────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
    data: T;
    success?: boolean;
    message?: string;
}

const unwrapData = <T>(body: unknown): T | undefined => {
    if (body && typeof body === 'object' && 'data' in (body as object)) {
        return (body as ApiEnvelope<T>).data;
    }
    return undefined;
};

// ─── Trigger AI Grading ────────────────────────────────────────────────────

/**
 * Triggers AI grading for a specific attempt.
 * POST /api/Attempts/{attemptId}/ai-grade
 */
export const triggerAIGrading = async (
    attemptId: string,
    gradingMode: GradingMode = 'BALANCED',
): Promise<void> => {
    await api.post(
        ENDPOINTS.ATTEMPTS.AI_GRADE(attemptId),
        { gradingMode },
    );
};

// ─── Get AI Grading Result ─────────────────────────────────────────────────

/**
 * Fetches the AI grading result for a specific attempt.
 * GET /api/Attempts/{attemptId}/ai-result
 */
export const getAIGradingResult = async (
    attemptId: string,
): Promise<AIGradingAttemptResult> => {
    const response = await api.get<ApiResponse<AttemptResultDto>>(
        ENDPOINTS.ATTEMPTS.AI_RESULT(attemptId),
    );

    const data = unwrapData<AttemptResultDto>(response.data);

    if (!data) {
        throw new Error('No AI grading result returned');
    }

    return mapAttemptResultToAIGrading(data, attemptId);
};

// ─── Mapper ────────────────────────────────────────────────────────────────

/**
 * Maps the backend AttemptResultDto into the frontend AIGradingAttemptResult shape.
 * This keeps the UI decoupled from the raw API response structure.
 */
function mapAttemptResultToAIGrading(
    dto: AttemptResultDto,
    attemptId: string,
): AIGradingAttemptResult {
    const answers = dto.answers ?? [];
    const totalScore = dto.totalScore || 0;
    const score = dto.score ?? 0;

    const questions: AIGradedQuestion[] = answers.map((answer: AnswerDto) => ({
        id: answer.questionId || String(answer.order),
        order: answer.order,
        type: answer.type as 'MCQ' | 'TrueFalse' | 'Written',
        questionText: answer.questionText || '',
        studentAnswer: answer.answer || '',
        correctAnswer: answer.options?.find(o => o.isCorrect)?.optionText,
        options: answer.options?.map(opt => ({
            optionText: opt.optionText,
            isSelected: opt.isSelected,
            isCorrect: opt.isCorrect,
            order: opt.order,
        })),
        aiResult: {
            score: answer.score ?? 0,
            max_score: answer.maxScore ?? 0,
            breakdown: {},
            feedback: answer.feedback ? [answer.feedback] : [],
            final_comment: answer.feedback || '',
        },
    }));

    return {
        attemptId,
        quizId: dto.quizId || '',
        quizTitle: dto.quizTitle || '',
        studentName: '',
        totalScore: score,
        maxScore: totalScore,
        percentage: totalScore > 0 ? Math.round((score / totalScore) * 100) : 0,
        gradingMode: 'BALANCED',
        overallFeedback: '',
        questions,
        gradedAt: new Date().toISOString(),
    };
}

// ─── AI Grading Configuration ───────────────────────────────────────────────

/**
 * Fetches the AI grading configuration for a quiz.
 * GET /api/quizzes/{quizId}/ai-grading-criteria
 */
export const getAIGradingCriteria = async (quizId: string): Promise<AIGradingCriteriaResponse> => {
    const response = await api.get<ApiResponse<AIGradingCriteriaResponse>>(
        ENDPOINTS.QUIZZES.AI_GRADING_CRITERIA(quizId)
    );
    const data = unwrapData<AIGradingCriteriaResponse>(response.data);
    return data ?? [];
};

/**
 * Updates the AI grading configuration for a specific question.
 * PUT /api/quizzes/{quizId}/questions/{questionId}/grading-config
 */
export const updateQuestionAIGradingConfig = async (
    quizId: string,
    questionId: string,
    payload: AIGradingConfigUpdateRequest
): Promise<void> => {
    await api.put<ApiResponse<null>>(
        ENDPOINTS.QUIZZES.UPDATE_GRADING_CONFIG(quizId, questionId),
        payload
    );
};
