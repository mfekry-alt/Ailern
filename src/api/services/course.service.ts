/**
 * Course Service
 * Handles all course-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    CreateCourseCommand,
    UpdateCourseDetailsCommand,
    RejectCourseCommand,
    RejectEnrollmentCommand,
    GetCourseDto,
    GetAllCoursesDtoPaginationResult,
    GetAvailableCoursesDtoPaginationResult,
    GetEnrollmentRequestsDto,
    GetStudentsByCourseIdDto,
    PaginationParams,
    ApiResponse,
} from '@/types/api.types';

/**
 * Create a new course
 * @param command - Course details
 */
export const createCourse = async (command: CreateCourseCommand): Promise<void> => {
    console.log('[Courses] Creating course with payload:', JSON.stringify(command));
    try {
        const response = await api.post<ApiResponse>(ENDPOINTS.COURSES.CREATE, command);
        console.log('[Courses] Create response:', JSON.stringify(response.data));
    } catch (error: any) {
        if (error.response?.data?.errors) {
            console.error('⚠️ Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
        } else {
            console.error('[Courses] Create failed:', error.response?.status, JSON.stringify(error.response?.data));
        }
        throw error;
    }
};

/**
 * Get all courses with pagination
 * @param params - Pagination and filter parameters
 * @returns Paginated list of courses
 */
export const getAllCourses = async (
    params?: PaginationParams
): Promise<GetAllCoursesDtoPaginationResult> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };
    const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
        ENDPOINTS.COURSES.LIST,
        { params: defaultParams }
    );

    // FIX 1: Initialize with 'pagesCount', 'start', 'end' instead of 'totalPages'
    // This satisfies the TypeScript interface error you saw.
    const result: GetAllCoursesDtoPaginationResult = response.data.data || {
        items: [],
        totalResults: 0,
        pagesCount: 0,
        start: 0,
        end: 0
    };

    // Debug: Log the FULL raw response
    // console.log('[Courses] Full raw API response:', JSON.stringify(response.data));

    // Workaround: Backend pagination bug — returns totalResults > 0 but items: []
    if (!result.items || result.items.length === 0) {
        console.warn('[Courses] List endpoint returned empty items. Trying alternative param formats...');

        // Attempt 1: Try lowercase params (pageNumber, pageSize)
        try {
            const res2 = await api.get('/Courses', {
                params: { pageNumber: 1, pageSize: 50 }
            });
            const data2 = res2.data.data;
            if (data2?.items?.length > 0) {
                result.items = data2.items;
                result.totalResults = data2.totalResults;

                // FIX 2: Map backend 'totalPages' to 'pagesCount' if it exists
                // We use (data2 as any) to safely access properties that might not be on the type
                if ((data2 as any).totalPages !== undefined) {
                    result.pagesCount = (data2 as any).totalPages;
                }

                // If start/end are missing in data2, we can leave them as 0 or calculate them
                // This prevents the "Property 'totalPages' does not exist" error

                return result;
            }
        } catch (e: any) {
            // console.log('[Courses] lowercase params failed:', e.response?.status);
        }

        // Attempt 2: Try with no params at all
        try {
            const res3 = await api.get('/Courses');
            const data3 = res3.data.data;
            if (data3?.items?.length > 0) {
                result.items = data3.items;
                result.totalResults = data3.totalResults;
                if ((data3 as any).totalPages !== undefined) {
                    result.pagesCount = (data3 as any).totalPages;
                }
                return result;
            }
        } catch (e: any) {
            // console.log('[Courses] no params failed:', e.response?.status);
        }

        // Attempt 3: Try SortBy and Order params
        try {
            const res4 = await api.get('/Courses', {
                params: { PageNumber: 1, PageSize: 50, SortBy: 'id', Order: 'asc' }
            });
            const data4 = res4.data.data;
            if (data4?.items?.length > 0) {
                result.items = data4.items;
                result.totalResults = data4.totalResults;
                if ((data4 as any).totalPages !== undefined) {
                    result.pagesCount = (data4 as any).totalPages;
                }
                return result;
            }
        } catch (e: any) {
            // console.log('[Courses] SortBy params failed:', e.response?.status);
        }
    }

    return result;
};

/**
 * Get a course by ID
 * @param id - Course ID
 * @returns Course details
 */
export const getCourseById = async (id: number): Promise<GetCourseDto> => {
    const response = await api.get<ApiResponse<GetCourseDto>>(ENDPOINTS.COURSES.GET(id));
    return response.data.data!;
};

/**
 * Update course details
 * @param id - Course ID
 * @param command - Updated course details
 */
export const updateCourse = async (
    id: number,
    command: UpdateCourseDetailsCommand
): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.UPDATE(id), command);
};

/**
 * Delete a course
 * @param id - Course ID
 */
export const deleteCourse = async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.COURSES.DELETE(id));
};

/**
 * Reject a course
 * @param id - Course ID
 * @param command - Rejection reason
 */
export const rejectCourse = async (id: number, command: RejectCourseCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.REJECT(id), command);
};

/**
 * Enroll in a course
 * @param id - Course ID
 */
export const enrollInCourse = async (id: number): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.COURSES.ENROLL(id));
};

/**
 * Get available courses for enrollment
 * @param params - Pagination parameters
 * @returns Paginated list of available courses
 */
export const getAvailableCourses = async (
    params?: PaginationParams
): Promise<GetAvailableCoursesDtoPaginationResult> => {
    const response = await api.get<ApiResponse<GetAvailableCoursesDtoPaginationResult>>(
        ENDPOINTS.COURSES.AVAILABLE_COURSES,
        { params }
    );
    return response.data.data!;
};

/**
 * Get enrollment requests for a course
 * @param id - Course ID
 * @param params - Pagination parameters
 * @returns List of enrollment requests
 */
export const getEnrollmentRequests = async (
    id: number,
    params?: PaginationParams
): Promise<GetEnrollmentRequestsDto[]> => {
    const response = await api.get<ApiResponse<GetEnrollmentRequestsDto[]>>(
        ENDPOINTS.COURSES.ENROLLMENT_REQUESTS(id),
        { params }
    );
    return response.data.data!;
};

/**
 * Approve student enrollment
 * @param courseId - Course ID
 * @param studentId - Student ID
 */
export const approveEnrollment = async (courseId: number, studentId: number): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.APPROVE_ENROLLMENT(courseId, studentId));
};

/**
 * Reject student enrollment
 * @param courseId - Course ID
 * @param studentId - Student ID
 * @param command - Rejection reason
 */
export const rejectEnrollment = async (
    courseId: number,
    studentId: number,
    command: RejectEnrollmentCommand
): Promise<void> => {
    await api.put<ApiResponse>(
        ENDPOINTS.COURSES.REJECT_ENROLLMENT(courseId, studentId),
        command
    );
};

/**
 * Remove student from course
 * @param courseId - Course ID
 * @param studentId - Student ID
 */
export const deleteEnrollment = async (courseId: number, studentId: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.COURSES.DELETE_ENROLLMENT(courseId, studentId));
};

/**
 * Get students enrolled in a course
 * @param id - Course ID
 * @returns List of students
 */
export const getCourseStudents = async (id: number): Promise<GetStudentsByCourseIdDto[]> => {
    const response = await api.get<ApiResponse<GetStudentsByCourseIdDto[]>>(
        ENDPOINTS.COURSES.STUDENTS(id)
    );
    return response.data.data!;
};