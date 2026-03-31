/**
 * Quiz Service - Handles all quiz-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { CreateQuizCommand, GetQuizDto, ApiResponse, QuestionRequest } from '@/types/api.types';

export interface QuizGenerationFile {
    id: string;
    fileName: string;
    fileSize?: number;
    contentType?: string;
}

export interface GenerateQuizByAIPayload {
    fileIds?: string[];
    newUploadedFiles?: File[];
    questionsCount: number;
    questionTypeCounts: {
        MCQ: number;
        TrueFalse: number;
        Written: number;
    };
    questionDifficultyPercents: {
        Easy: number;
        Medium: number;
        Hard: number;
    };
    query?: string;
}

// --- Helper Functions ---
const unwrapApiResponse = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as ApiResponse<T>).data as T;
    }
    return payload as T;
};

const buildGenerateFormData = (payload: GenerateQuizByAIPayload): FormData => {
    const formData = new FormData();

    payload.fileIds?.forEach(id => formData.append('FileIds', id));
    payload.newUploadedFiles?.forEach(file => formData.append('NewUploadedFiles', file));

    formData.append('QuestionsCount', String(payload.questionsCount));
    formData.append('QuestionTypeCounts.MCQ', String(payload.questionTypeCounts.MCQ));
    formData.append('QuestionTypeCounts.TrueFalse', String(payload.questionTypeCounts.TrueFalse));
    formData.append('QuestionTypeCounts.Written', String(payload.questionTypeCounts.Written));

    formData.append('QuestionDifficultyPercents.Easy', String(payload.questionDifficultyPercents.Easy));
    formData.append('QuestionDifficultyPercents.Medium', String(payload.questionDifficultyPercents.Medium));
    formData.append('QuestionDifficultyPercents.Hard', String(payload.questionDifficultyPercents.Hard));

    if (payload.query?.trim()) {
        formData.append('Query', payload.query.trim());
    }

    return formData;
};

// --- Quiz CRUD Operations ---

/**
 * Create a new quiz with questions
 * Payload must match the exact schema expected by the backend
 */
export const createQuiz = async (command: CreateQuizCommand): Promise<GetQuizDto> => {
    // 💡 إجبار إضافة الحقل حتى لو كان غير موجوداً في الـ Component
    const payload = {
        ...command,
        attemptTimeLimit: command.attemptTimeLimit ?? 0
    };

    const response = await api.post<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.CREATE, payload);
    return response.data.data!;
};

/**
 * Get all quizzes for a course
 */
export const getCourseQuizzes = async (courseId: string | number): Promise<GetQuizDto[]> => {
    try {
        const response = await api.get<any>(ENDPOINTS.QUIZZES.BY_COURSE(String(courseId)));

        // التعامل مع الرد سواء كان مصفوفة مباشرة أو كائن مغلف
        const payload = response.data;

        // 1. لو الداتا جوه data.items (زي ما ظاهر في الصورة الأخيرة)
        if (payload?.data?.items && Array.isArray(payload.data.items)) {
            return payload.data.items;
        }

        // 2. لو الداتا جوه data مباشرة
        if (payload?.data && Array.isArray(payload.data)) {
            return payload.data;
        }

        // 3. لو الرد مصفوفة مباشرة
        if (Array.isArray(payload)) {
            return payload;
        }

        return [];
    } catch (error) {
        console.error('Fetch quizzes failed, trying fallback...', error);
        // Fallback endpoint
        const response = await api.get<any>(ENDPOINTS.QUIZZES.LIST, {
            params: { courseId },
        });
        const payload = response.data;
        const data = payload?.data?.items ?? payload?.data ?? payload;
        return Array.isArray(data) ? data : [];
    }
};

// أضف | undefined عشان الـ check اللي تحت يشتغل صح
let activeQuizPromises: Record<string, Promise<GetQuizDto> | undefined> = {};

export const getQuiz = async (id: string): Promise<GetQuizDto> => {
    if (activeQuizPromises[id]) {
        return activeQuizPromises[id];
    }

    activeQuizPromises[id] = (async () => {
        try {
            const response = await api.get<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.GET(id));
            return response.data.data!;
        } finally {
            delete activeQuizPromises[id];
        }
    })();

    return activeQuizPromises[id];
};

/**
 * Update an existing quiz
 */
export const updateQuiz = async (
    id: string,
    command: Partial<CreateQuizCommand>
): Promise<GetQuizDto> => {
    // 💡 إجبار الحقل على التواجد لتجنب إسقاطه بواسطة المتصفح عند إرسال الـ JSON
    const payload = {
        ...command,
        attemptTimeLimit: command.attemptTimeLimit ?? 0
    };

    const response = await api.put<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.UPDATE(id), payload);
    return response.data.data!;
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.QUIZZES.DELETE(id));
};

// --- AI Generation Operations ---

/**
 * Generate quiz questions using AI from files or text
 */
export const generateQuizQuestionsByAI = async (quizId: string, payload: GenerateQuizByAIPayload): Promise<any> => {
    const formData = buildGenerateFormData(payload);
    const response = await api.post<ApiResponse<any>>(
        ENDPOINTS.QUIZZES.GENERATE_BY_AI(quizId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrapApiResponse(response.data);
};

/**
 * Quick AI Generation - Used for generating questions on the fly
 */
export const generateAIQuestions = async (params: {
    topic: string;
    difficulty: "Easy" | "Medium" | "Hard";
    count: number;
    context?: string;
}): Promise<QuestionRequest[]> => {
    const response = await api.post<ApiResponse<QuestionRequest[]>>('/Quizzes/quick-generate', params);
    return response.data.data || [];
};

/**
 * Get AI generation job status/results
 */
export const getQuizGenerationJob = async (jobId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(ENDPOINTS.QUIZZES.JOB_STATUS(jobId));
    return unwrapApiResponse(response.data);
};

/**
 * Get available files for AI question generation for a quiz
 */
export const getQuizGenerationFiles = async (quizId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(ENDPOINTS.QUIZZES.GENERATE_FILES(quizId));
    return unwrapApiResponse(response.data);
};