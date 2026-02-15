import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { courseService } from '@/api/services';
import type {
    CreateCourseCommand,
    UpdateCourseDetailsCommand,
    PaginationParams,
} from '@/types/api.types';

/**
 * Fetch all courses (instructor view) with pagination
 */
export const useInstructorCourses = (params?: PaginationParams) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.COURSES, params],
        queryFn: () => courseService.getAllCourses(params),
    });
};

/**
 * Fetch a single course by ID
 */
export const useCourse = (id: number) => {
    return useQuery({
        queryKey: QUERY_KEYS.COURSE(id.toString()),
        queryFn: () => courseService.getCourseById(id),
        enabled: !!id,
    });
};

/**
 * Create a new course
 */
export const useCreateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: CreateCourseCommand) => courseService.createCourse(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
        },
    });
};

/**
 * Update an existing course
 */
export const useUpdateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, command }: { id: number; command: UpdateCourseDetailsCommand }) =>
            courseService.updateCourse(id, command),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE(variables.id.toString()) });
        },
    });
};

/**
 * Delete a course
 */
export const useDeleteCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => courseService.deleteCourse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES });
        },
    });
};
