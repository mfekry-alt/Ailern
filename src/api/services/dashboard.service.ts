/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, AdminDashboardData } from '@/types/api.types';
import type { QuizDashboardData } from '@/types/quiz-dashboard.types';

/**
 * Get Quiz Dashboard Data
 * GET /api/Dashboard/quiz/{quizId}
 */
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

/**
 * Get Admin Dashboard Data
 * GET /api/Dashboard/admin
 */
export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
    const response = await api.get<ApiResponse<AdminDashboardData>>(
        ENDPOINTS.DASHBOARD.ADMIN
    );
    // Handle both wrapped and unwrapped responses
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data as AdminDashboardData;
    }
    return payload as unknown as AdminDashboardData;
};
