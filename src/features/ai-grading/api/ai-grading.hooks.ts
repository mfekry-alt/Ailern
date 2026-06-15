import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAIGradingCriteria, updateQuestionAIGradingConfig } from './ai-grading.service';
import type { AIGradingConfigUpdateRequest } from '../types/ai-grading.types';

export const AI_GRADING_KEYS = {
    all: ['aiGrading'] as const,
    criteria: (quizId: string) => [...AI_GRADING_KEYS.all, 'criteria', quizId] as const,
};

export const useGetAIGradingConfigurations = (quizId: string) => {
    return useQuery({
        queryKey: AI_GRADING_KEYS.criteria(quizId),
        queryFn: () => getAIGradingCriteria(quizId),
        enabled: !!quizId,
    });
};

export const useUpdateQuestionGradingConfiguration = (quizId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ questionId, payload }: { questionId: string; payload: AIGradingConfigUpdateRequest }) =>
            updateQuestionAIGradingConfig(quizId, questionId, payload),
        onSuccess: () => {
            // Invalidate the cache for this quiz's AI grading configuration
            queryClient.invalidateQueries({
                queryKey: AI_GRADING_KEYS.criteria(quizId),
            });
        },
    });
};
