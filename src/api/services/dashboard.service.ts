/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { 
    ApiResponse, 
    AdminDashboardData,
    AIQuestionGenerationDashboardData,
    AIGradingDashboardData
} from '@/types/api.types';
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

/**
 * Get AI Question Generation Dashboard Data
 * GET /api/Dashboard/admin/ai_question_generation_dashboard
 */
export const getAIQuestionGenerationDashboard = async (): Promise<AIQuestionGenerationDashboardData> => {
    const response = await api.get<ApiResponse<AIQuestionGenerationDashboardData>>(
        '/Dashboard/admin/ai_question_generation_dashboard'
    );
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data as AIQuestionGenerationDashboardData;
    }
    return payload as unknown as AIQuestionGenerationDashboardData;
};

/**
 * Get AI Grading Dashboard Data
 * GET /api/Dashboard/admin/ai_grading_dashboard
 */
export const getAIGradingDashboard = async (): Promise<AIGradingDashboardData> => {
    const response = await api.get<ApiResponse<AIGradingDashboardData>>(
        '/Dashboard/admin/ai_grading_dashboard'
    );
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        return payload.data as AIGradingDashboardData;
    }
    return payload as unknown as AIGradingDashboardData;
};
