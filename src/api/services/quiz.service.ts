/**
 * Quiz Service - Handles all quiz-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { CreateQuizCommand, GetQuizDto, ApiResponse } from '@/types/api.types';

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
    const response = await api.get<ApiResponse<GetQuizDto[]>>(ENDPOINTS.QUIZZES.BY_COURSE(courseId));
    return response.data.data ?? [];
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
