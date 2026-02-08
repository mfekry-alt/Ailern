/**
 * Assignment Service
 * Handles all assignment-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    AssignmentCreateCommand,
    AssignmentUpdateCommand,
    AssignmentSubmissionCreateCommand,
    ConfirmAssignmentUploadCommand,
    GetAssignmentDto,
    GetAssignmentSubmissionDto,
    ApiResponse,
    PaginationParams,
} from '@/types/api.types';

/**
 * Create a new assignment
 * @param command - Assignment details
 */
export const createAssignment = async (command: AssignmentCreateCommand): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.ASSIGNMENTS.CREATE, command);
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
): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.ASSIGNMENTS.UPDATE(id), command);
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
    return response.data.data!;
};

/**
 * Delete an assignment file
 * @param assignmentId - Assignment ID
 * @param fileId - File ID to delete
 */
export const deleteAssignmentFile = async (
    assignmentId: number,
    fileId: number
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
    const response = await api.get<ApiResponse<GetAssignmentDto[]>>(
        ENDPOINTS.ASSIGNMENTS.COURSE_ASSIGNMENTS_INSTRUCTOR(courseId),
        { params }
    );
    return response.data.data!;
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
    const response = await api.get<ApiResponse<GetAssignmentDto[]>>(
        ENDPOINTS.ASSIGNMENTS.COURSE_ASSIGNMENTS_STUDENT(courseId),
        { params }
    );
    return response.data.data!;
};

/**
 * Create an assignment submission (student)
 * @param command - Submission details with file metadata
 */
export const createSubmission = async (
    command: AssignmentSubmissionCreateCommand
): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.SUBMISSIONS.CREATE, command);
};

/**
 * Confirm submission upload after files are uploaded
 * @param id - Submission ID
 */
export const confirmSubmissionUpload = async (id: number): Promise<void> => {
    await api.post<ApiResponse>(ENDPOINTS.SUBMISSIONS.CONFIRM_UPLOAD(id));
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
 * @returns List of submissions
 */
export const getSubmissionsByAssignment = async (
    assignmentId: number
): Promise<GetAssignmentSubmissionDto[]> => {
    const response = await api.get<ApiResponse<GetAssignmentSubmissionDto[]>>(
        ENDPOINTS.SUBMISSIONS.GET_BY_ASSIGNMENT(assignmentId)
    );
    return response.data.data!;
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
    return response.data.data;
};
