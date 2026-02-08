/**
 * User Service
 * Handles all user-related API calls
 */

import { api } from '../client';
import { ENDPOINTS } from '../endpoints';
import type {
    GetUserByIdDto,
    GetUsersByRoleDtoPaginationResult,
    GetStudentCoursesDto,
    AddUserToRoleCommand,
    DeleteUserRoleCommand,
    PaginationParams,
    ApiResponse,
} from '@/types/api.types';

/**
 * Get user by ID
 * @param id - User ID
 * @returns User details
 */
export const getUserById = async (id: number): Promise<GetUserByIdDto> => {
    const response = await api.get<ApiResponse<GetUserByIdDto>>(ENDPOINTS.USERS.GET(id));
    return response.data.data!;
};

/**
 * Get users by role
 * @param roleId - Role ID
 * @param params - Pagination parameters
 * @returns Paginated list of users
 */
export const getUsersByRole = async (
    roleId: number,
    params?: PaginationParams
): Promise<GetUsersByRoleDtoPaginationResult> => {
    const response = await api.get<ApiResponse<GetUsersByRoleDtoPaginationResult>>(
        ENDPOINTS.USERS.BY_ROLE(roleId),
        { params }
    );
    return response.data.data!;
};

/**
 * Add role to user
 * @param id - User ID
 * @param command - Role to add
 */
export const addUserToRole = async (id: number, command: AddUserToRoleCommand): Promise<void> => {
    await api.put<ApiResponse>(ENDPOINTS.USERS.ADD_ROLE(id), command);
};

/**
 * Remove role from user
 * @param id - User ID
 * @param command - Role to remove
 */
export const removeUserRole = async (
    id: number,
    command: DeleteUserRoleCommand
): Promise<void> => {
    await api.delete<ApiResponse>(ENDPOINTS.USERS.REMOVE_ROLE(id), { data: command });
};

/**
 * Get student's enrolled courses
 * @returns List of student's courses
 */
export const getStudentCourses = async (): Promise<GetStudentCoursesDto[]> => {
    const response = await api.get<ApiResponse<GetStudentCoursesDto[]>>(
        ENDPOINTS.STUDENTS.MY_COURSES
    );
    return response.data.data!;
};
