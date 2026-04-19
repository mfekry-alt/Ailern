import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services';
import type { QuizDashboardData } from '@/types/quiz-dashboard.types';

const QUIZ_DASHBOARD_KEY = (quizId: string) => ['quiz-dashboard', quizId];

export const useQuizDashboard = (quizId: string) =>
    useQuery<QuizDashboardData>({
        queryKey: QUIZ_DASHBOARD_KEY(quizId),
        queryFn: () => dashboardService.getQuizDashboard(quizId),
        enabled: !!quizId,
        staleTime: 60 * 1000, // 1 min
    });
