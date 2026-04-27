/**
 * Instructor Service
 * Handles instructor dashboard API calls:
 *   - GET /instructor          → stats (totalCourses, totalStudents, …)
 *   - GET /UpcomingEvents      → upcoming assignments & quizzes
 *   - GET /instructor/my-courses → instructor's own courses
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    InstructorStatsDto,
    UpcomingEventDto,
    GetAllCoursesDtoPaginationResult,
    PaginationParams,
    ApiResponse,
} from '@/types/api.types';

// ── Stats ──────────────────────────────────────────────────────────────
export const getInstructorStats = async (): Promise<InstructorStatsDto> => {
    const response = await api.get<ApiResponse<InstructorStatsDto>>(
        ENDPOINTS.INSTRUCTOR.STATS,
    );
    // Handle both { data: { data: … } } and { data: … } envelopes
    const payload = response.data as any;
    return payload.data ?? (payload as unknown as InstructorStatsDto);
};

// ── Upcoming Events ────────────────────────────────────────────────────
export const getUpcomingEvents = async (): Promise<UpcomingEventDto[]> => {
    const response = await api.get<ApiResponse>(
        ENDPOINTS.INSTRUCTOR.UPCOMING_EVENTS,
    );
    // Response shape: { data: { totalResults, items: [...] } }
    const payload = response.data as any;
    const raw = payload.data ?? payload;
    const data = raw as any;
    return data?.items ?? (Array.isArray(data) ? data : []);
};

// ── My Courses ─────────────────────────────────────────────────────────
export const getInstructorMyCourses = async (
    params?: PaginationParams,
): Promise<GetAllCoursesDtoPaginationResult> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };

    const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
        ENDPOINTS.INSTRUCTOR.MY_COURSES,
        {
            params: {
                pageNumber: defaultParams.PageNumber,
                pageSize: defaultParams.PageSize,
            },
        },
    );

    const payload = response.data as any;
    const raw = payload.data ?? payload;
    const data = raw as any;

    return {
        items: data?.items ?? (Array.isArray(data) ? data : []),
        totalResults: data?.totalResults ?? 0,
        pagesCount: data?.totalPages ?? data?.pagesCount ?? 0,
        start: data?.start ?? 0,
        end: data?.end ?? 0,
    };
};
