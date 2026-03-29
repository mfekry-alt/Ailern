/**
 * Quiz Attempts Service - الشامل لكل عمليات محاولات الاختبار
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface QuestionAttempt {
    questionId: string;
    optionNumber?: number | null;
    booleanAnswer?: string | null;
    writtenAnswer?: string | null;
}

export interface SaveAttemptPayload {
    answers: QuestionAttempt[];
}

export interface StartAttemptResponse {
    id: string;
    quizId: string;
    timeSpent: number;
    startAt: string;
    submittedAt?: string;
    status: 'InProgress' | 'Submitted' | 'In-Progress' | 'Graded';
    score?: number | null;
    attemptNumber?: number;
    totalMarks?: number;
    duration?: number;
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

// 💡 Helper لتوحيد شكل المحاولة
const normalizeAttempt = (attempt: any): StartAttemptResponse => {
    if (!attempt) return attempt;
    return {
        ...attempt,
        id: attempt.id || attempt.attemptId || attempt.quizAttemptId || attempt.Id,
        startAt: attempt.startAt || attempt.startedAt || attempt.createdAt || new Date().toISOString(),
        status: attempt.status || 'InProgress'
    };
};

// 💡 Helper لاستخراج المصفوفات بأمان
const extractArray = (res: any): any[] => {
    const body = res.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.data?.attempts)) return body.data.attempts;
    if (Array.isArray(body?.attempts)) return body.attempts;
    if (Array.isArray(body?.items)) return body.items;
    return [];
};

// ─── Exported Functions ───────────────────────────────────────────────────

/**
 * 1. جلب تاريخ محاولات الطالب لاختبار معين
 */
export const getQuizAttempts = async (quizId: string): Promise<StartAttemptResponse[]> => {
    try {
        const response = await api.get<any>(ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId));
        return extractArray(response).map(normalizeAttempt);
    } catch (error) {
        console.error('✗ Failed to fetch quiz attempts:', error);
        return [];
    }
};

/**
 * 2. بدء محاولة جديدة أو استئناف محاولة قائمة (InProgress)
 * تعالج خطأ 409 و 400 بشكل تلقائي
 */
export const startOrResumeQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {
    try {
        const response = await api.post(ENDPOINTS.ATTEMPTS.START(quizId), {});
        return normalizeAttempt(response.data?.data || response.data);
    } catch (error: any) {
        const status = error.response?.status;
        const msg = error.response?.data?.message || "";

        if (status === 400 || status === 409 || msg.includes('In-Progress')) {
            console.warn('⚠️ Recovering active attempt...');
            const attempts = await getQuizAttempts(quizId);
            const active = attempts.find(a => String(a.status).toLowerCase().replace('-', '') === 'inprogress');
            if (active) return active;
        }
        throw error;
    }
};

/**
 * 3. جلب أسئلة المحاولة وتوحيد أسماء الحقول
 */
export const getAttemptQuestions = async (attemptId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(ENDPOINTS.ATTEMPTS.GET_QUESTIONS(attemptId));
    const rawQuestions = response.data.data ?? [];

    return rawQuestions.map((q: any) => ({
        id: q.id,
        text: q.question || q.text || q.questionText || '',
        type: q.type || q.questionType || 'MCQ',
        points: q.mark || q.points || 1,
        options: (q.options || []).map((opt: any) => ({
            id: String(opt.id || opt.optionNumber),
            text: opt.option || opt.optionText || opt.text || '',
            optionNumber: opt.optionNumber
        }))
    }));
};

/**
 * 4. حفظ الإجابات مؤقتاً
 */
export const saveAttemptProgress = async (attemptId: string, payload: SaveAttemptPayload) => {
    const response = await api.post<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SAVE(attemptId), payload);
    return response.data;
};

/**
 * 5. التسليم النهائي للاختبار
 */
export const submitQuizAttempt = async (attemptId: string, payload: SaveAttemptPayload) => {
    const response = await api.put<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SUBMIT(attemptId), payload);
    return response.data;
};

/**
 * 6. جلب نتيجة المحاولة (كانت ناقصة وهي سبب الخطأ الأخير)
 */
export const getAttemptResult = async (attemptId: string): Promise<AttemptResult> => {
    const response = await api.get<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
    const data = response.data.data;

    // حساب النسبة المئوية
    const achieved = data?.achievedScore || data?.score || 0;
    const total = data?.totalScore || data?.totalMarks || 1;

    return {
        quizId: data?.quizId,
        score: achieved,
        totalScore: total,
        percentage: Math.round((achieved / total) * 100),
        status: data?.status || 'Submitted',
        quizName: data?.quizName,
        submittedAt: data?.submittedAt || data?.updatedAt,
        attemptNumber: data?.attemptNumber
    };
};

/**
 * 7. جلب تفاصيل الإجابات (للمراجعة بعد الامتحان)
 */
export const getStudentAnswers = async (attemptId: string): Promise<StudentAnswer[]> => {
    try {
        const response = await api.get<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
        const data = response.data?.data;
        const resultsArray = data?.attemptResult || data?.answers || [];

        return resultsArray.map((item: any) => ({
            questionId: item.questionId,
            questionText: item.questionText || '',
            studentAnswer: item.studentAnswer || item.booleanAnswer || String(item.optionNumber || ''),
            correctAnswer: item.correctAnswer,
            isCorrect: item.score > 0,
            points: item.score,
            possiblePoints: item.maxScore || item.possiblePoints
        }));
    } catch (error) {
        return [];
    }
};