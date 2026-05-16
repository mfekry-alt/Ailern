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
    GetUserCountsDto,
} from '@/types/api.types';

/** Parameters for fetching users with role filter - matches API pagination params */
export interface GetUsersWithRoleParams {
    pageNo?: number;
    pageSize?: number;
    SearchString?: string;
    SortBy?: string;
    Order?: 'asc' | 'desc';
    role?: string | null;
}

/**
 * Current authenticated user response from /users/me
 */
export interface MeResponseDto {
    id: number;
    userName: string;
    email: string;
    fullName: string;
    role: string;
    imageUrl: string | null;
    phoneNumber?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Get current authenticated user
 * @returns Current user details
 */
export const getMe = async (): Promise<MeResponseDto> => {
    const response = await api.get<ApiResponse<MeResponseDto>>(ENDPOINTS.USERS.ME);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user data');
    }

    const userData = response.data.data;

    if (!userData) {
        throw new Error('User data not found');
    }

    return userData;
};

/**
 * Get user by ID
 * @param id - User ID
 * @returns User details
 */
export const getUserById = async (id: number): Promise<GetUserByIdDto> => {
    const response = await api.get<ApiResponse<GetUserByIdDto>>(ENDPOINTS.USERS.GET(id));
    return (response.data as any).data!;
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
    return (response.data as any).data!;
};

/**
 * Get users with optional role filter
 * @param params - Pagination and role filter parameters
 * @returns Paginated list of users
 */
export const getUsersWithRole = async (
    params?: GetUsersWithRoleParams
): Promise<GetUsersByRoleDtoPaginationResult> => {
    const response = await api.get<ApiResponse<GetUsersByRoleDtoPaginationResult>>(
        ENDPOINTS.USERS.ROLES,
        { params }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch users');
    }

    const data = response.data.data;

    if (!data) {
        throw new Error('No data received from server');
    }

    return data;
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
export const getStudentCourses = async (paginationParams?: PaginationParams): Promise<GetStudentCoursesDto[]> => {
    const response = await api.get<ApiResponse<GetStudentCoursesDto[]>>(
        ENDPOINTS.STUDENTS.MY_COURSES,
        { params: paginationParams }
    );
    const payload = (response.data as any)?.data ?? response.data;
    return payload;
};

/**
 * Delete user by ID
 * @param id - User ID
 * @returns API Response
 */
export const deleteUser = async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(ENDPOINTS.USERS.DELETE_USER(id));

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user');
    }

    return response.data;
};

/**
 * Get user counts by role
 * @returns Object with total counts for all roles
 */
export const getUserCounts = async (): Promise<GetUserCountsDto> => {
    const response = await api.get<ApiResponse<GetUserCountsDto>>(ENDPOINTS.USERS.COUNT);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user counts');
    }

    return response.data.data!;
};
