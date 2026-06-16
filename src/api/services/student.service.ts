/**
 * Student Service
 * Handles all student-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    GetStudentCoursesDto,
    PaginationParams,
    ApiResponse,
    GetAssignmentDto,
    GetAllQuizDto,
    GetMyLearningDto,
    PaginationResult,
} from '@/types/api.types';
import { getMyLearning } from './course.service';

const extractStudentCoursesItems = (responseData: unknown): GetStudentCoursesDto[] => {
    const root = responseData as { data?: unknown } | PaginationResult<GetStudentCoursesDto> | GetStudentCoursesDto[] | undefined;
    const inner = (root as any)?.data ?? root;
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === 'object' && Array.isArray((inner as PaginationResult<GetStudentCoursesDto>).items)) {
        return (inner as PaginationResult<GetStudentCoursesDto>).items;
    }
    return [];
};

/** Enrolled courses list with `progress` % when provided by API */
export const getMyStudentCourses = async (
    params?: PaginationParams & { pageNo?: number; pageSize?: number }
): Promise<GetStudentCoursesDto[]> => {
    const pageNo = params?.pageNo ?? params?.PageNumber ?? 1;
    const pageSize = params?.pageSize ?? params?.PageSize ?? 10;

    const response = await api.get<ApiResponse<PaginationResult<GetStudentCoursesDto>> | PaginationResult<GetStudentCoursesDto>>(
        ENDPOINTS.STUDENTS.MY_COURSES,
        {
            params: {
                pageNo,
                pageSize,
            },
        }
    );
    return extractStudentCoursesItems(response.data);
};



export interface StudentDashboardData {
    courses: GetStudentCoursesDto[];
    continueLearning: {
        courseId: number;
        name: string;
        subtitle: string;
        lastLearningItemId?: string | null;
        type: number;
        instructorName: string;
        code: string;
        progress?: number;
        lastWatchedTime?: number | null;
        lastPageNumber?: number | null;
        imageUrl?: string | null;
    }[];
    upcomingAssignments: GetAssignmentDto[];
    pendingQuizzes: GetAllQuizDto[];
    stats: {
        totalCourses: number;
        completedAssignments: number;
        pendingAssignments: number;
        averageGrade: number;
    }
}

/**
 * Get aggregated data for student dashboard
 */
export const getStudentDashboardData = async (): Promise<StudentDashboardData> => {
    try {
        const [courses, myLearningResult] = await Promise.all([
            getMyStudentCourses({ pageNo: 1, pageSize: 50 }).catch(() => [] as GetStudentCoursesDto[]),
            getMyLearning({ pageNo: 1, pageSize: 5 }).catch(() => ({
                items: [] as GetMyLearningDto[],
                totalResults: 0,
                pagesCount: 0,
                start: 0,
                end: 0,
            })),
        ]);

        const continueLearning = (myLearningResult.items ?? []).map((row) => {
            const meta = courses.find((c) => c.id === row.courseId);
            return {
                courseId: row.courseId,
                name: row.name,
                subtitle:
                    row.lastWatchedTime != null && row.lastWatchedTime >= 0
                        ? `Video · ${Math.floor(row.lastWatchedTime / 60)}m ${row.lastWatchedTime % 60}s`
                        : row.lastPageNumber != null && row.lastPageNumber >= 1
                          ? `Reading · page ${row.lastPageNumber}`
                          : 'Continue where you left off',
                lastLearningItemId: row.lastLearningItemId,
                type: row.type as number,
                instructorName: meta?.instructorName ?? '',
                code: meta?.code ?? '',
                progress: meta?.progress,
                lastWatchedTime: row.lastWatchedTime,
                lastPageNumber: row.lastPageNumber,
                imageUrl: meta?.imageUrl,
            };
        });

        return {
            courses,
            continueLearning,
            upcomingAssignments: [],
            pendingQuizzes: [],
            stats: {
                totalCourses: courses.length,
                completedAssignments: 0,
                pendingAssignments: 0,
                averageGrade: 0,
            },
        };
    } catch (error) {
        console.error('Failed to load student dashboard data', error);
        return {
            courses: [],
            continueLearning: [],
            upcomingAssignments: [],
            pendingQuizzes: [],
            stats: {
                totalCourses: 0,
                completedAssignments: 0,
                pendingAssignments: 0,
                averageGrade: 0,
            },
        };
    }
};