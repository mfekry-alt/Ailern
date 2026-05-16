/**
 * Discussion Service
 * Handles all discussion-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse } from '@/types/api.types';
import type {
    GetDiscussionDto,
    CreateDiscussionCommand,
    UpdateDiscussionCommand,
    CreateAnswerCommand,
} from '@/features/qna/types/discussion.types';

/**
 * Robustly unwrap API responses that may or may not be enveloped.
 */
function unwrap<T>(response: { data: any }, defaultError: string): T {
    const payload = response.data;
    const data = payload?.data ?? payload;
    
    if (payload?.success === false) {
        throw new Error(payload?.message || defaultError);
    }
    
    return data as T;
}

export const getDiscussions = async (courseId: number | string): Promise<GetDiscussionDto[]> => {
    const response = await api.get<ApiResponse<GetDiscussionDto[]>>(
        ENDPOINTS.DISCUSSIONS.LIST(courseId)
    );
    const data = unwrap<GetDiscussionDto[]>(response, 'Failed to fetch discussions');
    return Array.isArray(data) ? data : [];
};

export const createDiscussion = async (
    courseId: number | string,
    command: CreateDiscussionCommand
): Promise<GetDiscussionDto> => {
    const response = await api.post<ApiResponse<GetDiscussionDto>>(
        ENDPOINTS.DISCUSSIONS.CREATE(courseId),
        command
    );
    return unwrap<GetDiscussionDto>(response, 'Failed to create discussion');
};

export const upVoteDiscussion = async (
    courseId: number | string,
    discussionId: string | number
): Promise<void> => {
    const response = await api.post(ENDPOINTS.DISCUSSIONS.UP_VOTE(courseId, discussionId));
    unwrap(response, 'Failed to upvote');
};

export const downVoteDiscussion = async (
    courseId: number | string,
    discussionId: string | number
): Promise<void> => {
    const response = await api.delete(ENDPOINTS.DISCUSSIONS.DOWN_VOTE(courseId, discussionId));
    unwrap(response, 'Failed to downvote');
};

export const updateDiscussion = async (
    courseId: number | string,
    discussionId: string | number,
    command: UpdateDiscussionCommand
): Promise<GetDiscussionDto> => {
    const response = await api.put<ApiResponse<GetDiscussionDto>>(
        ENDPOINTS.DISCUSSIONS.UPDATE(courseId, discussionId),
        command
    );
    return unwrap<GetDiscussionDto>(response, 'Failed to update discussion');
};

export const deleteDiscussion = async (
    courseId: number | string,
    discussionId: string | number
): Promise<void> => {
    const response = await api.delete(ENDPOINTS.DISCUSSIONS.DELETE(courseId, discussionId));
    unwrap(response, 'Failed to delete discussion');
};

export const pinDiscussion = async (
    courseId: number | string,
    discussionId: string | number
): Promise<void> => {
    const response = await api.put(ENDPOINTS.DISCUSSIONS.PIN(courseId, discussionId));
    unwrap(response, 'Failed to pin discussion');
};

export const unpinDiscussion = async (
    courseId: number | string,
    discussionId: string | number
): Promise<void> => {
    const response = await api.put(ENDPOINTS.DISCUSSIONS.UNPIN(courseId, discussionId));
    unwrap(response, 'Failed to unpin discussion');
};

export const answerDiscussion = async (
    courseId: number | string,
    discussionId: string | number,
    command: CreateAnswerCommand
): Promise<void> => {
    const response = await api.put(ENDPOINTS.DISCUSSIONS.ANSWER(courseId, discussionId), command);
    unwrap(response, 'Failed to submit answer');
};
