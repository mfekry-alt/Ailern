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
} from '@/types/api.types';
import { getCourseAssignmentsForStudent } from './assignment.service';
import { getCourseQuizzes } from './quiz.service';

/**
 * Get student's enrolled courses
 * @param params - Pagination parameters (defaults to pageNo=1, pageSize=4)
 * @returns List of student's courses
 */
export const getMyStudentCourses = async (
    params?: PaginationParams
): Promise<GetStudentCoursesDto[]> => {
    const paginationParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 4,
        ...params
    };
    const response = await api.get<ApiResponse<GetStudentCoursesDto[]>>(
        ENDPOINTS.STUDENTS.MY_COURSES,
        { params: paginationParams }
    );
    const payload = response.data?.data ?? response.data;
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && Array.isArray((payload as any).items)) {
        return (payload as any).items;
    }
    return [];
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
        // 1. Fetch courses ONLY ONCE
        const courses = await getMyStudentCourses().catch(() => []);

        let assignments: GetAssignmentDto[] = [];
        let quizzes: GetAllQuizDto[] = [];

        // 2. If we have courses, fetch assignments and quizzes by PASSING the courses
        if (courses.length > 0) {
            const [fetchedAssignments, fetchedQuizzes] = await Promise.all([
                // Pass undefined for courseId, but pass the courses array as the second argument
                getMyStudentAssignments(undefined, courses).catch(() => []),
                getMyStudentQuizzes(undefined, courses).catch(() => [])
            ]);
            assignments = fetchedAssignments;
            quizzes = fetchedQuizzes;
        }

        // Calculate simple stats
        const now = new Date();
        const upcomingAssignments = assignments
            .filter(a => new Date(a.dueDate) > now)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);

        const pendingQuizzes = quizzes
            .filter((q: GetAllQuizDto) => q.status === 'Published')
            .slice(0, 5);

        return {
            courses: courses.slice(0, 3), // Top 3 recent
            upcomingAssignments,
            pendingQuizzes,
            stats: {
                totalCourses: courses.length,
                completedAssignments: 0, // Placeholder
                pendingAssignments: assignments.length,
                averageGrade: 0 // Placeholder
            }
        };
    } catch (error) {
        console.error('Failed to load student dashboard data', error);
        // Return empty structure instead of crashing completely so UI can show partial data or empty state
        return {
            courses: [],
            upcomingAssignments: [],
            pendingQuizzes: [],
            stats: { totalCourses: 0, completedAssignments: 0, pendingAssignments: 0, averageGrade: 0 }
        };
    }
};