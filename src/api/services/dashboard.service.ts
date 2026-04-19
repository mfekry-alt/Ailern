/**
 * Quiz Dashboard Service
 * GET /api/Dashboard/quiz/{quizId}
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';
import type { QuizDashboardData } from '@/types/quiz-dashboard.types';

export const getQuizDashboard = async (quizId: string): Promise<QuizDashboardData> => {
    const response = await api.get<ApiResponse<QuizDashboardData>>(
        ENDPOINTS.DASHBOARD.QUIZ(quizId)
    );
    // Handle both wrapped and unwrapped responses
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data as QuizDashboardData;
    }
    return payload as unknown as QuizDashboardData;
};
