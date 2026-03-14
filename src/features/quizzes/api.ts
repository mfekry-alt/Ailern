import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { quizService } from '@/api/services';
import type { CreateQuizCommand } from '@/types/api.types';

/**
 * Fetch all quizzes for a course
 */
export const useCourseQuizzes = (courseId: string) =>
    useQuery({
        queryKey: QUERY_KEYS.QUIZZES(courseId),
        queryFn: () => quizService.getCourseQuizzes(courseId),
        enabled: !!courseId,
    });

/**
 * Fetch a single quiz by ID
 */
export const useQuiz = (id: string) =>
    useQuery({
        queryKey: QUERY_KEYS.QUIZ(id),
        queryFn: () => quizService.getQuiz(id),
        enabled: !!id,
    });

/**
 * Create a new quiz
 */
export const useCreateQuiz = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (cmd: CreateQuizCommand) => quizService.createQuiz(cmd),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(vars.courseId) });
        },
    });
};

/**
 * Update an existing quiz
 */
export const useUpdateQuiz = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, cmd }: { id: string; cmd: Partial<import('@/types/api.types').CreateQuizCommand> }) =>
            quizService.updateQuiz(id, cmd),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ(vars.id) });
        },
    });
};

/**
 * Delete a quiz
 */
export const useDeleteQuiz = (courseId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => quizService.deleteQuiz(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseId) });
        },
    });
};
