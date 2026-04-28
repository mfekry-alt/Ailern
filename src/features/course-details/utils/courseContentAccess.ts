import { isAxiosError } from 'axios';
import type { GetQuizDto } from '@/types/api.types';

/** True when the student has an unfinished quiz attempt for this course (from course quiz list). */
export function hasActiveInProgressAttemptInCourse(quizzes: GetQuizDto[] | undefined): boolean {
    if (!quizzes?.length) return false;
    return quizzes.some((q) => q.hasActiveAttempt);
}

export function getFirstQuizWithActiveAttempt(quizzes: GetQuizDto[] | undefined): GetQuizDto | undefined {
    return (quizzes ?? []).find((q) => q.hasActiveAttempt);
}

export function getHttpErrorMessage(error: unknown, fallback: string): string {
    if (!isAxiosError(error)) return fallback;
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
        return (data as { message: string }).message;
    }
    if (typeof data === 'string' && data.trim()) return data;
    return fallback;
}
