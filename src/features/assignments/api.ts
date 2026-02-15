import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { assignmentService } from '@/api/services';
import type {
    AssignmentCreateCommand,
    AssignmentUpdateCommand,
    ConfirmAssignmentUploadCommand,
    PaginationParams,
} from '@/types/api.types';

/**
 * Fetch assignments for a specific course (instructor view)
 */
export const useCourseAssignments = (courseId: number, params?: PaginationParams) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS, courseId, params],
        queryFn: () => assignmentService.getCourseAssignmentsForInstructor(courseId, params),
        enabled: !!courseId,
    });
};

/**
 * Fetch a single assignment by ID
 */
export const useAssignment = (id: number) => {
    return useQuery({
        queryKey: QUERY_KEYS.ASSIGNMENT(id),
        queryFn: () => assignmentService.getAssignment(id),
        enabled: !!id,
    });
};

/**
 * Create a new assignment
 * Handles isPublished toggle: isDraft=true → isPublished=false, isDraft=false → isPublished=true
 */
export const useCreateAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: AssignmentCreateCommand) => assignmentService.createAssignment(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSIGNMENTS });
        },
    });
};

/**
 * Update an existing assignment
 * Handles isPublished toggle for draft vs published status
 */
export const useUpdateAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, command }: { id: number; command: AssignmentUpdateCommand }) =>
            assignmentService.updateAssignment(id, command),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSIGNMENTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSIGNMENT(variables.id) });
        },
    });
};

/**
 * Delete an assignment
 */
export const useDeleteAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => assignmentService.deleteAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSIGNMENTS });
        },
    });
};

/**
 * Confirm assignment upload after files are uploaded
 */
export const useConfirmAssignmentUpload = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: ConfirmAssignmentUploadCommand) =>
            assignmentService.confirmAssignmentUpload(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS });
        },
    });
};

/**
 * Delete an assignment file
 */
export const useDeleteAssignmentFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assignmentId, fileId }: { assignmentId: number; fileId: number }) =>
            assignmentService.deleteAssignmentFile(assignmentId, fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS });
        },
    });
};
