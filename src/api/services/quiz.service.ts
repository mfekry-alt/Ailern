/**
 * Quiz Service - Handles all quiz-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { CreateQuizCommand, GetQuizDto, ApiResponse } from '@/types/api.types';

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

/**
 * Create a new quiz with questions
 */
export const createQuiz = async (command: CreateQuizCommand): Promise<GetQuizDto> => {
    const response = await api.post<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.CREATE, command);
    return response.data.data!;
};

/**
 * Get all quizzes for a course
 */
export const getCourseQuizzes = async (courseId: string): Promise<GetQuizDto[]> => {
    try {
        const response = await api.get<ApiResponse<GetQuizDto[]> | GetQuizDto[]>(ENDPOINTS.QUIZZES.BY_COURSE(courseId));
        const payload = response.data as ApiResponse<GetQuizDto[]> | GetQuizDto[];
        return Array.isArray(payload) ? payload : (payload.data ?? []);
    } catch {
        const response = await api.get<ApiResponse<GetQuizDto[]> | GetQuizDto[]>(ENDPOINTS.QUIZZES.LIST, {
            params: { courseId },
        });
        const payload = response.data as ApiResponse<GetQuizDto[]> | GetQuizDto[];
        return Array.isArray(payload) ? payload : (payload.data ?? []);
    }
};

/**
 * Get a single quiz by ID
 */
export const getQuiz = async (id: string): Promise<GetQuizDto> => {
    const response = await api.get<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.GET(id));
    return response.data.data!;
};

/**
 * Update an existing quiz
 */
export const updateQuiz = async (
    id: string,
    command: Partial<CreateQuizCommand>
): Promise<GetQuizDto> => {
    const response = await api.put<ApiResponse<GetQuizDto>>(ENDPOINTS.QUIZZES.UPDATE(id), command);
    return response.data.data!;
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.QUIZZES.DELETE(id));
};

/**
 * Generate quiz questions using AI for a quiz
 */
export const generateQuizQuestionsByAI = async (quizId: string, payload: GenerateQuizByAIPayload): Promise<any> => {
    const formData = buildGenerateFormData(payload);
    const response = await api.post<ApiResponse<any> | any>(
        ENDPOINTS.QUIZZES.GENERATE_BY_AI(quizId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrapApiResponse(response.data);
};

/**
 * Get AI generation job status/results
 */
export const getQuizGenerationJob = async (jobId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any> | any>(ENDPOINTS.QUIZZES.JOB_STATUS(jobId));
    return unwrapApiResponse(response.data);
};

/**
 * Get available files for AI question generation for a quiz
 */
export const getQuizGenerationFiles = async (quizId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any> | any>(ENDPOINTS.QUIZZES.GENERATE_FILES(quizId));
    return unwrapApiResponse(response.data);
};
