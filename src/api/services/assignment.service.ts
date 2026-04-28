/**
 * Assignment Service
 * Handles all assignment-related API calls
 */

import axios from 'axios';
import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    AssignmentCreateCommand,
    AssignmentUpdateCommand,
    AssignmentSubmissionCreateCommand,
    ConfirmAssignmentUploadCommand,
    GetAssignmentDto,
    GetAssignmentSubmissionDto,
    GetMySubmissionDto,
    ApiResponse,
    PaginationParams,
    AssignmentMutationResponse,
} from '@/types/api.types';

// Type aliases for convenience
export type GetAllAssignmentsDto = GetAssignmentDto;
export type GetAllAssignmentSubmissionsDto = GetAssignmentSubmissionDto;

/**
 * Create a new assignment
 * @param courseId - Course ID
 * @param command - Assignment details
 */
export const createAssignment = async (courseId: number, command: AssignmentCreateCommand): Promise<AssignmentMutationResponse> => {
    const response = await api.post<ApiResponse<AssignmentMutationResponse>>(ENDPOINTS.ASSIGNMENTS.CREATE(courseId), command);
    const payload = response.data as any;
    // backend usually returns response inside payload.data
    return (payload?.data ?? payload) as AssignmentMutationResponse;
};

/**
 * Confirm assignment upload after file uploads complete
 * @param command - Assignment ID to confirm
 */
export const confirmAssignmentUpload = async (
    command: ConfirmAssignmentUploadCommand
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.ASSIGNMENTS.CONFIRM_UPLOAD, command);
};

/**
 * Update an existing assignment
 * @param id - Assignment ID
 * @param command - Updated assignment details
 */
export const updateAssignment = async (
    id: number,
    command: AssignmentUpdateCommand
): Promise<AssignmentMutationResponse> => {
    const response = await api.put<ApiResponse<AssignmentMutationResponse>>(ENDPOINTS.ASSIGNMENTS.UPDATE(id), command);
    const payload = response.data as any;
    return (payload?.data ?? payload) as AssignmentMutationResponse;
};

/**
 * Upload a raw file directly to Wasabi pre-signed URL with axios tracking
 */
export const uploadFileToPresignedUrlWithProgress = async (
    url: string,
    file: File,
    onProgress: (progress: number) => void
): Promise<void> => {
    await axios.put(url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        }
    });
};

/**
 * Delete an assignment
 * @param id - Assignment ID
 */
export const deleteAssignment = async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.ASSIGNMENTS.DELETE(id));
};

/**
 * Get a single assignment by ID
 * @param id - Assignment ID
 * @returns Assignment details
 */
export const getAssignment = async (id: number): Promise<GetAssignmentDto> => {
    const response = await api.get<ApiResponse<GetAssignmentDto>>(ENDPOINTS.ASSIGNMENTS.GET(id));
    return (response.data as any).data!;
};

/**
 * Delete an assignment file
 * @param assignmentId - Assignment ID
 * @param fileId - File ID to delete
 */
export const deleteAssignmentFile = async (
    assignmentId: number,
    fileId: string
): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.ASSIGNMENTS.DELETE_FILE(assignmentId, fileId));
};

/**
 * Get course assignments for instructor
 * @param courseId - Course ID
 * @param params - Pagination parameters
 * @returns List of assignments
 */
export const getCourseAssignmentsForInstructor = async (
    courseId: number,
    params?: PaginationParams
): Promise<GetAssignmentDto[]> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };
    const response = await api.get<ApiResponse<GetAssignmentDto[]>>(
        ENDPOINTS.ASSIGNMENTS.COURSE_ASSIGNMENTS_INSTRUCTOR(courseId),
        { params: defaultParams }
    );
    return (response.data as any).data!;
};

/**
 * Get course assignments for student
 * @param courseId - Course ID
 * @param params - Pagination parameters
 * @returns List of assignments
 */
export const getCourseAssignmentsForStudent = async (
    courseId: number,
    params?: PaginationParams
): Promise<GetAssignmentDto[]> => {
    const defaultParams: PaginationParams = {
        PageNumber: 1,
        PageSize: 50,
        ...params,
    };
    const response = await api.get<ApiResponse<GetAssignmentDto[]>>(
        ENDPOINTS.ASSIGNMENTS.COURSE_ASSIGNMENTS_STUDENT(courseId),
        { params: defaultParams }
    );
    return (response.data as any).data!;
};

/**
 * Create an assignment submission (student)
 * @param command - Submission details with file metadata
 * @returns Response containing submissionId and uploadUrls
 */
export interface SubmissionCreateResponse {
    id?: number;
    submissionId?: number;
    uploadUrls?: string[];
    uploadFilesUrls?: string[];
    urls?: string[];
}

export const createSubmission = async (
    command: AssignmentSubmissionCreateCommand
): Promise<SubmissionCreateResponse> => {
    const response = await api.post<ApiResponse<SubmissionCreateResponse>>(ENDPOINTS.SUBMISSIONS.CREATE, command);
    return (response.data as any).data ?? {};
};

/**
 * Delete a submission
 * @param id - Submission ID
 */
export const deleteSubmission = async (id: number): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.SUBMISSIONS.DELETE(id));
};

/**
 * Get all submissions for an assignment (instructor)
 * @param assignmentId - Assignment ID
 * @param status - Optional status filter
 * @returns List of submissions
 */
export const getSubmissionsByAssignment = async (
    assignmentId: number,
    status?: string
): Promise<GetAssignmentSubmissionDto[]> => {
    // Backend signature: GetAllSubmissionsForAssignment(int assignmentId, string status, int pageNo = 1, int pageSize = 10)
    // Backend status constants: "all", "ontime", "late" (all lowercase)
    const params: any = {
        status: status || 'all',
        pageNo: 1,
        pageSize: 50,
    };

    const response = await api.get<any>(
        ENDPOINTS.SUBMISSIONS.GET_BY_ASSIGNMENT(assignmentId),
        { params }
    );
    
    return response.data.data?.items ? response.data.data.items : response.data.data || [];
};

/**
 * Get current student's submission for an assignment
 * @param assignmentId - Assignment ID
 * @returns The student's submission
 */
export const getMySubmissionByAssignment = async (
    assignmentId: number
): Promise<GetMySubmissionDto> => {
    const response = await api.get<ApiResponse<GetMySubmissionDto>>(
        ENDPOINTS.SUBMISSIONS.GET_MY_SUBMISSION(assignmentId)
    );
    return (response.data as any).data!;
};

/**
 * Get submission files
 * @param assignmentId - Assignment ID
 * @param submissionId - Submission ID
 * @returns List of file metadata
 */
export const getSubmissionFiles = async (
    assignmentId: number,
    submissionId: number
): Promise<any> => {
    const response = await api.get<ApiResponse>(
        ENDPOINTS.SUBMISSIONS.GET_FILES(assignmentId, submissionId)
    );
    return (response.data as any).data;
};

/**
 * Get all assignments for instructor across all their courses
 * Fetches courses first, then aggregates assignments from each course
 * @param params - Pagination parameters
 * @returns List of assignments
 */
export const getInstructorAssignments = async (
    params?: PaginationParams
): Promise<GetAssignmentDto[]> => {
    // Use instructor-scoped courses endpoint to avoid forbidden /Courses access for instructors.
    const { getInstructorCourses } = await import('./course.service');
    const coursesData = await getInstructorCourses(undefined, { PageSize: 100 });

    const courses = coursesData.items || [];
    if (courses.length === 0) return [];

    // Fetch assignments for each course in parallel
    const assignmentPromises = courses.map((course) =>
        getCourseAssignmentsForInstructor(course.id, params).catch(() => [] as GetAssignmentDto[])
    );

    const allAssignments = await Promise.all(assignmentPromises);
    return allAssignments.flat();
};

/**
 * Get assignment submissions (alias for getSubmissionsByAssignment)
 * @param assignmentId - Assignment ID
 * @returns List of submissions
 */
export const getAssignmentSubmissions = async (
    assignmentId: number
): Promise<GetAssignmentSubmissionDto[]> => {
    return getSubmissionsByAssignment(assignmentId);
};

/**
 * Review a submission
 * @param submissionId - Submission ID
 * @param feedback - Review feedback
 */
export const reviewSubmission = async (
    submissionId: number,
    feedback: string
): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.SUBMISSIONS.REVIEW(submissionId), { feedback });
};
