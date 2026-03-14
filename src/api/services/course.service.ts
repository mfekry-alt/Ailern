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
 * Get courses for a specific instructor (Temporary Workaround)
 * Currently fetches ALL courses because the backend endpoint for specific instructors is not ready yet.
 */
export const getInstructorCourses = async (
    instructorId: string | number, // الإيميل أو الـ ID
    params?: PaginationParams
): Promise<GetAllCoursesDtoPaginationResult> => {

    console.log('[Courses] ⚠️ Backend endpoint for specific instructor not ready. Fetching ALL courses instead.');

    // ببساطة نقوم باستدعاء دالة جلب كل الكورسات الموجودة بالأسفل
    return await getAllCourses(params);
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
        // ⚡ التعديل هنا: إرسال الـ params بحروف صغيرة لضمان قراءتها من السيرفر
        const response = await api.get<ApiResponse<GetAllCoursesDtoPaginationResult>>(
            ENDPOINTS.COURSES.LIST,
            {
                params: {
                    pageNumber: defaultParams.PageNumber || 1,
                    pageSize: defaultParams.PageSize || 50
                }
            }
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