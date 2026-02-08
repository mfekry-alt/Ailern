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
    await api.post<ApiResponse>(ENDPOINTS.COURSES.CREATE, command);
};

/**
 * Get all courses with pagination
 * @param params - Pagination and filter parameters
 * @returns Paginated list of courses
 */
export const getAllCourses = async (
    params?: PaginationParams
): Promise<GetAllCoursesDtoPaginationResult> => {
    const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
        ENDPOINTS.COURSES.LIST,
        { params }
    );
    return response.data.data!;
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
