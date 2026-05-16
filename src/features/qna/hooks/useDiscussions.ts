import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as discussionService from '@/api/services/discussion.service';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { 
    CreateDiscussionCommand, 
    UpdateDiscussionCommand, 
    CreateAnswerCommand 
} from '../types/discussion.types';

export const useDiscussions = (courseId: number | string) => {
    return useQuery({
        queryKey: QUERY_KEYS.DISCUSSIONS(courseId),
        queryFn: () => discussionService.getDiscussions(courseId),
        enabled: !!courseId,
    });
};

export const useCreateDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: CreateDiscussionCommand) => 
            discussionService.createDiscussion(courseId, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
            toast.success('Discussion created successfully');
        },
        onError: () => {
            toast.error('Failed to create discussion');
        },
    });
};

export const useVoteDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ discussionId, type }: { discussionId: string | number; type: 'up' | 'down' }) => 
            type === 'up' 
                ? discussionService.upVoteDiscussion(courseId, discussionId)
                : discussionService.downVoteDiscussion(courseId, discussionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
        },
        onError: () => {
            toast.error('Failed to update vote');
        },
    });
};

export const usePinDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ discussionId, pin }: { discussionId: string | number; pin: boolean }) => 
            pin 
                ? discussionService.pinDiscussion(courseId, discussionId)
                : discussionService.unpinDiscussion(courseId, discussionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
            toast.success('Discussion pin status updated');
        },
        onError: () => {
            toast.error('Failed to update pin status');
        },
    });
};

export const useUpdateDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ discussionId, command }: { discussionId: string | number; command: UpdateDiscussionCommand }) => 
            discussionService.updateDiscussion(courseId, discussionId, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
            toast.success('Discussion updated successfully');
        },
        onError: () => {
            toast.error('Failed to update discussion');
        },
    });
};

export const useDeleteDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (discussionId: string | number) => 
            discussionService.deleteDiscussion(courseId, discussionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
            toast.success('Discussion deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete discussion');
        },
    });
};

export const useAnswerDiscussion = (courseId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ discussionId, command }: { discussionId: string | number; command: CreateAnswerCommand }) => 
            discussionService.answerDiscussion(courseId, discussionId, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISCUSSIONS(courseId) });
            toast.success('Answer submitted successfully');
        },
        onError: () => {
            toast.error('Failed to submit answer');
        },
    });
};
