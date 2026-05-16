/**
 * Discussion API Types
 */

export interface GetDiscussionDto {
    id: string;
    title: string;
    question: string;
    answer: string | null;
    answerAt: string | null;
    createdAt: string;
    instructorName: string | null;
    instructorAvatar: string | null;
    studentName: string;
    studentAvatar: string | null;
    votesCount: number;
    isPinned: boolean;
    pinnedAt: string | null;
    // UI needs these even if API doesn't return them in this view
    courseId?: number;
    isUpVotedByCurrentUser: boolean; 
}

export interface GetReplyDto {
    id: string;
    discussionId: string;
    authorId: string | number;
    authorName: string;
    authorImageUrl?: string;
    authorRole: 'Student' | 'Instructor';
    content: string;
    createdAt: string;
}

export interface CreateDiscussionCommand {
    title: string;
    content: string;
}

export interface UpdateDiscussionCommand {
    title: string;
    content: string;
}

export interface CreateAnswerCommand {
    answer: string;
}
