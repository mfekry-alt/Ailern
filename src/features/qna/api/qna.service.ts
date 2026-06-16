/**
 * Q&A Board — API Service Implementation
 * Replaces the mock service with real API calls.
 */
import type { QnAQuestion, QnAReply, QnATag, QnASortMode } from '../types/qna.types';
import * as discussionService from '@/api/services/discussion.service';
import type { GetDiscussionDto, GetReplyDto } from '../types/discussion.types';

/* ─── Mappers ──────────────────────────────────────────────────────────── */

function mapApiDiscussionToUiQuestion(d: Partial<GetDiscussionDto> & { id: string }): QnAQuestion {
  // Default values for all fields to handle incomplete API responses
  const safeD = {
    id: d.id,
    question: d.question || '',
    title: d.title || 'Untitled',
    studentId: d.studentId ?? 0,
    studentName: d.studentName || 'Student',
    studentAvatar: d.studentAvatar ?? null,
    instructorName: d.instructorName ?? null,
    instructorAvatar: d.instructorAvatar ?? null,
    answer: d.answer ?? null,
    answerAt: d.answerAt ?? null,
    createdAt: d.createdAt || new Date().toISOString(),
    votesCount: d.votesCount ?? 0,
    isUpVotedByCurrentUser: d.isUpVotedByCurrentUser ?? false,
    isPinned: d.isPinned ?? false,
    courseId: d.courseId ?? 0,
  };

  const content = safeD.question;

  // Create a plain text preview from HTML content
  const plainPreview =
    content
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 140) + (content.length > 140 ? '...' : '');

  const replies: QnAReply[] = [];

  if (safeD.answer) {
    replies.push({
      id: `reply-${safeD.id}`,
      questionId: safeD.id,
      author: {
        id: 'instructor-1', // Placeholder as API doesn't provide instructorId
        name: safeD.instructorName || 'Instructor',
        avatar: safeD.instructorAvatar || undefined,
        role: 'instructor',
      },
      content: safeD.answer,
      createdAt: safeD.answerAt || safeD.createdAt,
    });
  }

  const hasInstructorReply = !!safeD.answer;

  // Ensure timestamps are treated as UTC by appending 'Z' if missing
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return new Date().toISOString();
    // If it already has Z or a timezone offset like +02:00, don't touch it
    if (dateStr.endsWith('Z') || dateStr.includes('+')) return dateStr;

    const normalized = `${dateStr}Z`;
    // Check if the resulting date is actually valid
    const testDate = new Date(normalized);
    if (isNaN(testDate.getTime())) {
      console.error('Invalid date from API:', dateStr);
      return new Date().toISOString(); // Fallback to now to prevent crash
    }
    return normalized;
  };

  const createdAt = normalizeDate(safeD.createdAt);
  const answerAt = safeD.answerAt ? normalizeDate(safeD.answerAt) : null;

  return {
    id: safeD.id,
    courseId: safeD.courseId,
    title: safeD.title,
    content: content,
    preview: plainPreview,
    author: {
      id: safeD.studentId,
      name: safeD.studentName,
      avatar: safeD.studentAvatar || undefined,
      role: 'student',
    },
    createdAt: createdAt,
    updatedAt: createdAt,
    lastActivityAt: answerAt || createdAt,
    votes: safeD.votesCount,
    votedByMe: safeD.isUpVotedByCurrentUser,
    status: hasInstructorReply ? 'answered' : 'unanswered',
    isPinned: safeD.isPinned,
    tags: [],
    replyCount: replies.length,
    replies: replies,
    interactors: hasInstructorReply
      ? [
          {
            id: 'instructor-1',
            name: safeD.instructorName || 'Instructor',
            avatar: safeD.instructorAvatar || undefined,
          },
        ]
      : [],
    hasInstructorReply,
  };
}

/* ─── Public API ───────────────────────────────────────────────────────── */

/** Fetch all questions for a course (sorted) */
export async function fetchQuestions(
  courseId: number,
  sort: QnASortMode = 'votes',
  search = ''
): Promise<QnAQuestion[]> {
  const discussions = await discussionService.getDiscussions(courseId);
  let mapped = discussions.map(mapApiDiscussionToUiQuestion);

  // Filter by search
  if (search.trim()) {
    const s = search.toLowerCase();
    mapped = mapped.filter(
      (q) => q.title.toLowerCase().includes(s) || q.content.toLowerCase().includes(s)
    );
  }

  // Filter by type if sort mode is actually a filter
  if (sort === 'answered') {
    mapped = mapped.filter((q) => q.status === 'answered');
  } else if (sort === 'unanswered') {
    mapped = mapped.filter((q) => q.status === 'unanswered');
  } else if (sort === 'pinned') {
    mapped = mapped.filter((q) => q.isPinned);
  }

  // Sort: pinned always first (except when already filtered for pinned), then by sort mode
  mapped.sort((a, b) => {
    if (sort !== 'pinned' && a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

    switch (sort) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'votes':
      case 'answered':
      case 'unanswered':
      case 'pinned':
      default:
        return b.votes - a.votes;
    }
  });

  return mapped;
}

/** Get single question by ID */
export async function fetchQuestion(
  questionId: string,
  courseId: number
): Promise<QnAQuestion | null> {
  // Backend doesn't have a direct "get single discussion" endpoint in the prompt
  // but usually it's there. Since it's not provided, we fetch all and find.
  // However, the prompt says /api/Courses/course/{courseId}/discussions
  const discussions = await discussionService.getDiscussions(courseId);
  const d = discussions.find((x) => x.id === questionId);
  return d ? mapApiDiscussionToUiQuestion(d) : null;
}

/** Toggle upvote */
export async function toggleVote(
  courseId: number,
  questionId: string,
  isUpvote: boolean
): Promise<void> {
  if (isUpvote) {
    await discussionService.upVoteDiscussion(courseId, questionId);
  } else {
    await discussionService.downVoteDiscussion(courseId, questionId);
  }
}

/** Pin / unpin a question (instructor only) */
export async function togglePin(courseId: number, questionId: string, pin: boolean): Promise<void> {
  if (pin) {
    await discussionService.pinDiscussion(courseId, questionId);
  } else {
    await discussionService.unpinDiscussion(courseId, questionId);
  }
}

/** Mark question as answered (instructor only) */
export async function markAnswered(_questionId: string, _answered: boolean): Promise<void> {
  // In this backend, "answered" status is derived from having an instructor reply.
  // The prompt doesn't provide a specific "mark as answered" endpoint.
}

/** Submit instructor reply */
export async function submitReply(
  courseId: number,
  questionId: string,
  htmlContent: string
): Promise<void> {
  await discussionService.answerDiscussion(courseId, questionId, { answer: htmlContent });
}

/** Create a new question */
export async function createQuestion(
  courseId: number,
  title: string,
  content: string,
  _tagIds: string[] = []
): Promise<QnAQuestion> {
  const d = await discussionService.createDiscussion(courseId, { title, content });
  return mapApiDiscussionToUiQuestion(d);
}

/** Update an existing question */
export async function updateQuestion(
  courseId: number,
  questionId: string,
  title: string,
  content: string
): Promise<QnAQuestion> {
  const d = await discussionService.updateDiscussion(courseId, questionId, { title, content });
  return mapApiDiscussionToUiQuestion(d);
}

/** Delete a question */
export async function deleteQuestion(courseId: number, questionId: string): Promise<void> {
  await discussionService.deleteDiscussion(courseId, questionId);
}

/** Available tags for a course */
export async function fetchTags(): Promise<QnATag[]> {
  return []; // Not supported by current provided API
}
