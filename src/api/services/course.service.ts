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

export const createCourse = async (command: CreateCourseCommand): Promise<void> => {
    try {
        const response = await api.post<ApiResponse>(ENDPOINTS.COURSES.CREATE, command);
        console.log('[Courses] Create response:', response.data);
    } catch (error: any) {
        if (error.response?.data?.errors) {
            console.error('⚠️ Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
        } else {
            console.error('[Courses] Create failed:', error.response?.status, error.message);
        }
        throw error;
    }
};

/**
 * Get courses for a specific instructor (includes drafts)
 * @param instructorId - The ID of the instructor (optional - will use current user if not provided)
 * @param params - Pagination parameters
 * @returns Paginated list of instructor's courses
 */
export const getInstructorCourses = async (
    instructorId?: number,
    params?: PaginationParams
): Promise<GetAllCoursesDtoPaginationResult> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };

    const result: GetAllCoursesDtoPaginationResult = {
        items: [],
        totalResults: 0,
        pagesCount: 0,
        start: 0,
        end: 0,
    };

    // Strategy 1: Try /Courses/mine endpoint (doesn't require ID)
    try {
        console.log('[Courses] Attempting to fetch via /Courses/mine...');
        const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
            ENDPOINTS.COURSES.MY_COURSES,
            { params: defaultParams }
        );
        const data = response.data.data || response.data;
        if (data && (data as any).items) {
            result.items = (data as any).items || [];
            result.totalResults = (data as any).totalResults || 0;
            result.pagesCount = (data as any).pagesCount || (data as any).totalPages || 0;
            result.start = (data as any).start || 0;
            result.end = (data as any).end || 0;
            console.log(`[Courses] Found ${result.items.length} courses via /Courses/mine`);
            return result;
        }
    } catch (error: any) {
        console.warn('[Courses] /Courses/mine failed:', error.response?.status, error.message);
    }

    // Strategy 2: Try instructor-specific endpoint if ID is provided
    if (instructorId) {
        try {
            console.log(`[Courses] Attempting to fetch via /Courses/instructors/${instructorId}...`);
            const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
                ENDPOINTS.COURSES.INSTRUCTOR_COURSES(instructorId),
                { params: defaultParams }
            );
            const data = response.data.data || response.data;
            if (data) {
                result.items = (data as any).items || [];
                result.totalResults = (data as any).totalResults || 0;
                result.pagesCount = (data as any).pagesCount || (data as any).totalPages || 0;
                result.start = (data as any).start || 0;
                result.end = (data as any).end || 0;
                console.log(`[Courses] Found ${result.items.length} courses via instructor endpoint`);
                return result;
            }
        } catch (error: any) {
            console.error(`[Courses] /Courses/instructors/${instructorId} failed:`, error.response?.status, error.message);
        }
    }

    console.warn('[Courses] All strategies failed - returning empty result');
    return result;
};

export const getAllCourses = async (
    params?: PaginationParams
): Promise<GetAllCoursesDtoPaginationResult> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };

    // Initialize default result structure (Strictly matching your interface)
    const result: GetAllCoursesDtoPaginationResult = {
        items: [],
        totalResults: 0,
        pagesCount: 0,
        start: 0,
        end: 0
    };

    try {
        const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
            ENDPOINTS.COURSES.LIST,
            { params: defaultParams }
        );

        // DEBUG: Print exactly what the backend sent
        console.log('📦 [Courses] Raw Data:', response.data);

        // 1. Check if data is directly in response.data (some backends do this)
        const directData = response.data as any;
        // 2. Check if data is inside response.data.data (standard wrapper)
        const wrapperData = response.data.data as any;

        const dataToUse = (wrapperData?.items || wrapperData?.totalResults) ? wrapperData :
            (directData?.items || directData?.totalResults) ? directData : null;

        if (dataToUse) {
            result.items = dataToUse.items || [];
            result.totalResults = dataToUse.totalResults || 0;

            // Map common backend names to your frontend names
            if (dataToUse.totalPages !== undefined) result.pagesCount = dataToUse.totalPages;
            if (dataToUse.pagesCount !== undefined) result.pagesCount = dataToUse.pagesCount;

            if (dataToUse.start !== undefined) result.start = dataToUse.start;
            if (dataToUse.end !== undefined) result.end = dataToUse.end;

            return result;
        }

        // If standard checks failed, try the workarounds
        console.warn('[Courses] Standard path empty. Trying workarounds...');

        // WORKAROUND 1: Lowercase params
        try {
            const res2 = await api.get('/Courses', { params: { pageNumber: 1, pageSize: 50 } });
            const d2 = res2.data.data || res2.data; // Check both wrapper and direct
            if (d2?.items?.length > 0) {
                result.items = d2.items;
                result.totalResults = d2.totalResults;
                result.pagesCount = d2.totalPages || d2.pagesCount || 0;
                return result;
            }
        } catch (e) { /* ignore */ }

        // WORKAROUND 2: No params
        try {
            const res3 = await api.get('/Courses');
            const d3 = res3.data.data || res3.data;
            if (d3?.items?.length > 0) {
                result.items = d3.items;
                result.totalResults = d3.totalResults;
                result.pagesCount = d3.totalPages || d3.pagesCount || 0;
                return result;
            }
        } catch (e) { /* ignore */ }

    } catch (error) {
        console.error('[Courses] List failed:', error);
    }

    return result;
};

// --- Standard Functions (No changes needed) ---

export const getCourseById = async (id: number): Promise<GetCourseDto> => {
    const response = await api.get<ApiResponse<GetCourseDto>>(ENDPOINTS.COURSES.GET(id));
    return response.data.data!;
};

export const updateCourse = async (id: number, command: UpdateCourseDetailsCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.UPDATE(id), command);
};

export const deleteCourse = async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.COURSES.DELETE(id));
};

export const rejectCourse = async (id: number, command: RejectCourseCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.REJECT(id), command);
};

export const enrollInCourse = async (id: number): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.COURSES.ENROLL(id));
};

export const getAvailableCourses = async (params?: PaginationParams): Promise<GetAvailableCoursesDtoPaginationResult> => {
    const response = await api.get<ApiResponse<GetAvailableCoursesDtoPaginationResult>>(
        ENDPOINTS.COURSES.AVAILABLE_COURSES, { params }
    );
    return response.data.data!;
};

export const getEnrollmentRequests = async (id: number, params?: PaginationParams): Promise<GetEnrollmentRequestsDto[]> => {
    const response = await api.get<ApiResponse<GetEnrollmentRequestsDto[]>>(
        ENDPOINTS.COURSES.ENROLLMENT_REQUESTS(id), { params }
    );
    return response.data.data!;
};

export const approveEnrollment = async (courseId: number, studentId: number): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.APPROVE_ENROLLMENT(courseId, studentId));
};

export const rejectEnrollment = async (courseId: number, studentId: number, command: RejectEnrollmentCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.COURSES.REJECT_ENROLLMENT(courseId, studentId), command);
};

export const deleteEnrollment = async (courseId: number, studentId: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.COURSES.DELETE_ENROLLMENT(courseId, studentId));
};

export const getCourseStudents = async (id: number): Promise<GetStudentsByCourseIdDto[]> => {
    const response = await api.get<ApiResponse<GetStudentsByCourseIdDto[]>>(ENDPOINTS.COURSES.STUDENTS(id));
    return response.data.data!;
};