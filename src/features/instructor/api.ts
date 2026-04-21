/**
 * Instructor Dashboard — React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { instructorService } from '@/api/services';
import type { PaginationParams } from '@/types/api.types';

/**
 * Fetch instructor dashboard statistics
 * GET /instructor → { totalCourses, totalStudents, totalQuizzes, totalAssignments }
 */
export const useInstructorStats = () => {
    return useQuery({
        queryKey: QUERY_KEYS.INSTRUCTOR_STATS,
        queryFn: () => instructorService.getInstructorStats(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Fetch upcoming events (assignments & quizzes)
 * GET /UpcomingEvents
 */
export const useUpcomingEvents = () => {
    return useQuery({
        queryKey: QUERY_KEYS.UPCOMING_EVENTS,
        queryFn: () => instructorService.getUpcomingEvents(),
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Fetch instructor's own courses
 * GET /instructor/my-courses
 */
export const useInstructorMyCourses = (params?: PaginationParams) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.INSTRUCTOR_MY_COURSES, params],
        queryFn: () => instructorService.getInstructorMyCourses(params),
    });
};
