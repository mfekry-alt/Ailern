/**
 * Student Service
 * Handles all student-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type { GetStudentCoursesDto, PaginationParams, ApiResponse } from '@/types/api.types';

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
    return response.data.data!;
};
