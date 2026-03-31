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

// 💡 Helper لتوحيد شكل المحاولة
const normalizeAttempt = (attempt: any): StartAttemptResponse => {
    if (!attempt) return attempt;
    return {
        ...attempt,
        id: String(attempt.id || attempt.attemptId || attempt.quizAttemptId || attempt.Id || ''),
        startAt: attempt.startAt || attempt.startedAt || attempt.createdAt || new Date().toISOString(),
        status: attempt.status || 'InProgress'
    };
};

// 💡 Helper لاستخراج المصفوفات بأمان (منع خطأ all.find)
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

// ─── Exported Functions ───────────────────────────────────────────────────

// 🛡️ قفل مخصص لطلبات جلب كل المحاولات
let activeAllAttemptsPromise: Record<string, Promise<StartAttemptResponse[]> | undefined> = {};

export const getQuizAttempts = async (quizId: string): Promise<StartAttemptResponse[]> => {
    // لو فيه طلب لنفس الكويز شغال حالياً، رجعه هو هو
    if (activeAllAttemptsPromise[quizId]) {
        console.log('🛡️ Returning active AllAttempts promise for:', quizId);
        return activeAllAttemptsPromise[quizId]!;
    }

    activeAllAttemptsPromise[quizId] = (async () => {
        try {
            const response = await api.get<any>(ENDPOINTS.ATTEMPTS.GET_ATTEMPTS(quizId));
            return extractArray(response).map(normalizeAttempt);
        } catch (error) {
            console.error('✗ Failed to fetch quiz attempts:', error);
            return [];
        } finally {
            // مسح القفل بعد ما الريكويست يخلص
            delete activeAllAttemptsPromise[quizId];
        }
    })();

    return activeAllAttemptsPromise[quizId]!;
};

/**
 * دالة البدء التي تستعيد المحاولة القائمة فعلياً
 */
// ✅ 1. المتغير ده لازم يكون هنا (خارج الدالة) عشان يشتغل كـ "قفل" عام
let activeStartPromise: Promise<StartAttemptResponse> | null = null;

export const startOrResumeQuizAttempt = async (quizId: string): Promise<StartAttemptResponse> => {

    // ✅ 2. لو فيه طلب شغال حالياً، رجع نفس الوعد (Promise) وماتعملش طلب جديد
    if (activeStartPromise) {
        console.log('🛡️ Request collision blocked. Returning active promise...');
        return activeStartPromise;
    }

    // ✅ 3. ابدأ التنفيذ واحفظ الوعد في المتغير
    activeStartPromise = (async () => {
        try {
            // فحص المحاولات الموجودة أولاً
            const allAttempts = await getQuizAttempts(quizId);
            const activeAttempt = allAttempts.find(a => {
                const s = String(a.status || '').toLowerCase().replace('-', '');
                return s === 'inprogress' || (!a.submittedAt && s !== 'submitted' && s !== 'graded');
            });

            if (activeAttempt && activeAttempt.id) {
                console.log('💡 Found existing active attempt:', activeAttempt.id);
                return activeAttempt;
            }

            // بدء محاولة جديدة
            console.log('🚀 Starting new quiz attempt...');
            const response = await api.post(ENDPOINTS.ATTEMPTS.START(quizId), {});
            return normalizeAttempt(response.data?.data || response.data);

        } catch (error: any) {
            // معالجة خطأ التعارض (لو السيرفر أنشأها والطلب الأول لسه ماخلصش)
            if (error.response?.status === 400 || error.response?.status === 409) {
                const retryAttempts = await getQuizAttempts(quizId);
                const retryActive = retryAttempts.find(a => {
                    const s = String(a.status || '').toLowerCase().replace('-', '');
                    return s === 'inprogress' || (!a.submittedAt && s !== 'submitted' && s !== 'graded');
                });
                if (retryActive && retryActive.id) return retryActive;
            }
            throw error;
        } finally {
            // ✅ 4. المهم جداً: تصفير القفل بعد انتهاء العملية (بنجاح أو فشل)
            activeStartPromise = null;
        }
    })();

    return activeStartPromise;
};

// 🛡️ ضيف المتغير ده فوق جنب التاني
let activeQuestionsPromise: Partial<Record<string, Promise<any[]>>> = {};

export const getAttemptQuestions = async (attemptId: string): Promise<any[]> => {
    // لو الريكويست ده شغال حالياً لنفس الـ attemptId، رجعه هو هو
    if (activeQuestionsPromise[attemptId]) {
        return activeQuestionsPromise[attemptId];
    }

    activeQuestionsPromise[attemptId] = (async () => {
        try {
            const response = await api.get<ApiResponse<any[]>>(ENDPOINTS.ATTEMPTS.GET_QUESTIONS(attemptId));
            const rawQuestions = response.data?.data ?? [];

            return rawQuestions.map((q: any) => ({
                id: String(q.id || ''),
                text: q.question || q.text || q.questionText || '',
                type: q.type || q.questionType || 'MCQ',
                points: q.mark || q.points || 1,
                options: (q.options || []).map((opt: any) => ({
                    id: String(opt.id || opt.optionNumber),
                    text: opt.option || opt.optionText || opt.text || '',
                    optionNumber: opt.optionNumber
                })),
                studentOptionNumber: q.optionNumber,
                studentBooleanAnswer: q.booleanAnswer,
                studentWrittenAnswer: q.writtenAnswer
            }));
        } finally {
            // مسح القفل بعد ما يخلص
            delete activeQuestionsPromise[attemptId];
        }
    })();

    return activeQuestionsPromise[attemptId];
};

export const saveAttemptProgress = async (attemptId: string, payload: SaveAttemptPayload) => {
    const response = await api.post<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SAVE(attemptId), payload);
    return response.data;
};


export const submitQuizAttempt = async (attemptId: string) => {
    // تم حذف الـ payload من هنا
    const response = await api.put<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.SUBMIT(attemptId));
    return response.data;
};

let activeResultPromises: Record<string, Promise<AttemptResult> | undefined> = {};

export const getAttemptResult = async (attemptId: string): Promise<AttemptResult> => {
    if (activeResultPromises[attemptId]) {
        return activeResultPromises[attemptId]!;
    }

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
                attemptNumber: data.attemptNumber
            };
        } finally {
            delete activeResultPromises[attemptId];
        }
    })();

    return activeResultPromises[attemptId]!;
};

export const getStudentAnswers = async (attemptId: string): Promise<StudentAnswer[]> => {
    try {
        const response = await api.get<ApiResponse<any>>(ENDPOINTS.ATTEMPTS.GET_RESULT(attemptId));
        const data = response.data?.data;
        const resultsArray = data?.attemptResult || data?.answers || [];

        return resultsArray.map((item: any) => ({
            questionId: String(item.questionId || ''),
            questionText: item.questionText || item.question || '',
            studentAnswer: item.studentAnswer || item.booleanAnswer || String(item.optionNumber || ''),
            correctAnswer: item.correctAnswer || item.correctOptionText,
            isCorrect: item.score > 0 || item.isCorrect,
            points: item.score || item.pointsAchieved || 0,
            possiblePoints: item.maxScore || item.possiblePoints || 1
        }));
    } catch (error) {
        return [];
    }
};