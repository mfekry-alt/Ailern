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
    GetQuizDto
} from '@/types/api.types';
import { getCourseAssignmentsForStudent } from './assignment.service';
import { getCourseQuizzes } from './quiz.service';

/**
 * Get student's enrolled courses
 * @param params - Pagination parameters
 * @returns List of student's courses
 */
export const getMyStudentCourses = async (
    params?: PaginationParams
): Promise<GetStudentCoursesDto[]> => {
    const response = await api.get<ApiResponse<GetStudentCoursesDto[]>>(
        ENDPOINTS.STUDENTS.MY_COURSES,
        { params }
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
 * @param courseId - Optional course ID to filter by
 */
export const getMyStudentAssignments = async (
    courseId?: number
): Promise<GetAssignmentDto[]> => {
    if (courseId) {
        return getCourseAssignmentsForStudent(courseId);
    }

    // specific endpoint for all assignments not available, aggregate from courses
    const courses = await getMyStudentCourses();
    const promises = courses.map(course =>
        getCourseAssignmentsForStudent(course.id)
            .catch(() => []) // Silently fail for individual course errors
    );

    const results = await Promise.all(promises);
    return results.flat();
};

/**
 * Get all quizzes for the student across all enrolled courses
 * @param courseId - Optional course ID to filter by
 */
export const getMyStudentQuizzes = async (
    courseId?: number
): Promise<GetQuizDto[]> => {
    if (courseId) {
        // Cast to string as quiz service expects string ID currently
        return getCourseQuizzes(courseId.toString());
    }

    const courses = await getMyStudentCourses();
    const promises = courses.map(course =>
        getCourseQuizzes(course.id.toString())
            .catch(() => [])
    );

    const results = await Promise.all(promises);
    return results.flat();
};

export interface StudentDashboardData {
    courses: GetStudentCoursesDto[];
    upcomingAssignments: GetAssignmentDto[];
    pendingQuizzes: GetQuizDto[];
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
        const courses = await getMyStudentCourses().catch(() => []);

        // If course fetch failed or empty, we can't really get assignments/quizzes easily 
        // without iterating them, or if specific endpoints don't exist.
        // We'll proceed with empty lists if courses fail.
        let assignments: GetAssignmentDto[] = [];
        let quizzes: GetQuizDto[] = [];

        if (courses.length > 0) {
            const [fetchedAssignments, fetchedQuizzes] = await Promise.all([
                getMyStudentAssignments().catch(() => []),
                getMyStudentQuizzes().catch(() => [])
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
            .filter((q: GetQuizDto) => q.status === 'Published') // Using string literal as per likely enum
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

