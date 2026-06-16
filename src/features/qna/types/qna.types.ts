/**
 * Q&A Board — Type Definitions
 * Premium LMS Discussion System
 */

export type QuestionStatus = 'answered' | 'unanswered';

export interface QnATag {
  id: string;
  label: string;
  color?: string; // tailwind color class fragment e.g. 'blue' | 'purple'
}

export interface QnAUser {
  id: string | number;
  name: string;
  avatar?: string;
  role: 'student' | 'instructor';
}

export interface QnAReply {
  id: string;
  questionId: string;
  author: QnAUser;
  content: string; // rich-text HTML
  createdAt: string; // ISO-8601
  updatedAt?: string;
}

export interface QnAQuestion {
  id: string;
  courseId: number;
  title: string;
  content: string; // rich-text HTML
  preview: string; // plain-text truncated preview
  author: QnAUser;
  createdAt: string; // ISO-8601
  updatedAt?: string;
  lastActivityAt: string;
  votes: number;
  votedByMe: boolean;
  status: QuestionStatus;
  isPinned: boolean;
  tags: QnATag[];
  replyCount: number;
  replies: QnAReply[];
  /** Tiny preview avatars of recent interactors */
  interactors: Pick<QnAUser, 'id' | 'name' | 'avatar'>[];
  hasInstructorReply: boolean;
  attachments?: string[]; // image URLs
}

export type QnASortMode = 'votes' | 'recent' | 'answered' | 'unanswered' | 'pinned';

export interface QnAFilterState {
  search: string;
  sort: QnASortMode;
}

/** Threshold after which a question gets a "Trending" badge */
export const TRENDING_VOTE_THRESHOLD = 5;
