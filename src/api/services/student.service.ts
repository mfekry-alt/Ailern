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
import { getCourseAssignmentsForStudent } from './assignment.service';
import { getCourseQuizzes } from './quiz.service';
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

/**
 * Get all assignments for the student across all enrolled courses
 */
export const getMyStudentAssignments = async (
    courseId?: number,
    preFetchedCourses?: GetStudentCoursesDto[],
    paginationParams?: PaginationParams
): Promise<GetAssignmentDto[]> => {
    if (courseId) {
        const res = await getCourseAssignmentsForStudent(courseId, paginationParams);
        // Extract items safely
        const data = (res as any)?.data ?? res;
        if (Array.isArray(data)) return data;
        if (data?.items && Array.isArray(data.items)) return data.items;
        return [];
    }

    const courses = preFetchedCourses ?? await getMyStudentCourses(paginationParams);

    if (courses.length === 0) return [];

    const promises = courses.map(course =>
        getCourseAssignmentsForStudent(course.id, paginationParams)
            .then((res: any) => {
                // استخراج الداتا الحقيقية من الـ Object
                const data = res?.data ?? res;
                if (Array.isArray(data)) return data;
                if (data?.items && Array.isArray(data.items)) return data.items;
                return [];
            })
            .catch(() => [])
    );

    const results = await Promise.all(promises);
    return results.flat(); 
};

export const getMyStudentQuizzes = async (
    courseId?: number,
    preFetchedCourses?: GetStudentCoursesDto[]
): Promise<GetAllQuizDto[]> => {
    if (courseId) {
        return getCourseQuizzes(courseId.toString());
    }

    const courses = preFetchedCourses ?? await getMyStudentCourses({ PageNumber: 1, PageSize: 100 });

    if (courses.length === 0) return [];

    const promises = courses.map(course =>
        getCourseQuizzes(course.id.toString())
            .then((items) =>
                items.map((q) => ({
                    ...q,
                    courseName: course.name,
                }))
            )
            .catch(() => [])
    );

    const results = await Promise.all(promises);
    return results.flat();
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

        let assignments: GetAssignmentDto[] = [];
        let quizzes: GetAllQuizDto[] = [];

        if (courses.length > 0) {
            const [fetchedAssignments, fetchedQuizzes] = await Promise.all([
                getMyStudentAssignments(undefined, courses).catch(() => []),
                getMyStudentQuizzes(undefined, courses).catch(() => []),
            ]);
            assignments = fetchedAssignments;
            quizzes = fetchedQuizzes;
        }

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

        const now = new Date();
        const upcomingAssignments = assignments
            .filter((a) => new Date(a.dueDate) > now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);

        const pendingQuizzes = quizzes
            .filter((q: GetAllQuizDto) => q.status === 'Published')
            .slice(0, 5);

        return {
            courses,
            continueLearning,
            upcomingAssignments,
            pendingQuizzes,
            stats: {
                totalCourses: courses.length,
                completedAssignments: 0,
                pendingAssignments: assignments.length,
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