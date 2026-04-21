import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import {
    getCourseAssignmentsForStudent,
    createSubmission,
    deleteSubmission,
    getAssignment,
    getMySubmissionByAssignment,
} from '@/api/services/assignment.service';
import type { SubmitPayload } from '../types';

export const useCourseAssignments = (courseId: number) =>
    useQuery({
        queryKey: QUERY_KEYS.COURSE_ASSIGNMENTS(courseId.toString()),
        queryFn: () => getCourseAssignmentsForStudent(courseId),
        enabled: courseId > 0,
    });

export const useAssignmentDetails = (assignmentId: number) =>
    useQuery({
        queryKey: ['assignment-details', assignmentId],
        queryFn: () => getAssignment(assignmentId),
        enabled: assignmentId > 0,
    });

export const useAssignmentSubmission = (assignmentId: number, enabled: boolean) =>
    useQuery({
        queryKey: QUERY_KEYS.ASSIGNMENT_SUBMISSION(assignmentId),
        queryFn: () => getMySubmissionByAssignment(assignmentId),
        enabled: enabled && assignmentId > 0,
    });

export const useSubmitAssignment = (courseId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ assignmentId, files }: SubmitPayload) => {
            // 1. Extract file metadata
            const metadata = files.map((f) => ({
                fileName: f.name,
                fileSize: f.size,
                contentType: f.type,
            }));

            // 2. Create submission and get presigned URLs
            const data = await createSubmission({
                assignmentId,
                fileMetaData: metadata,
            });

            // 3. Extract upload URLs from response (submissionId no longer needed for confirmation)
            const uploadUrls: string[] =
                data?.uploadUrls ??
                data?.uploadFilesUrls ??
                data?.urls ??
                [];

            // 4. Upload files to presigned URLs (if any)
            if (uploadUrls.length > 0 && files.length > 0) {
                const uploadResults = await Promise.all(
                    files.map(async (file, i) => {
                        const uploadUrl = uploadUrls[i];
                        if (!uploadUrl) {
                            throw new Error(`No upload URL provided for file: ${file.name}`);
                        }

                        const response = await fetch(uploadUrl, {
                            method: 'PUT',
                            headers: { 'Content-Type': file.type || 'application/octet-stream' },
                            body: file,
                        });

                        if (!response.ok) {
                            throw new Error(
                                `Failed to upload file "${file.name}": ${response.status} ${response.statusText}`
                            );
                        }

                        return { fileName: file.name, success: true };
                    })
                );

                // Verify all uploads succeeded
                const failedUploads = uploadResults.filter((r) => !r.success);
                if (failedUploads.length > 0) {
                    throw new Error(
                        `Failed to upload ${failedUploads.length} file(s): ${failedUploads
                            .map((f) => f.fileName)
                            .join(', ')}`
                    );
                }
            }

            // 5. Upload complete - backend background job handles confirmation automatically
            // No need to call confirm-upload endpoint anymore

            return { uploadedFiles: files.length };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.COURSE_ASSIGNMENTS(courseId.toString()),
            });
        },
    });
};

export const useDeleteSubmission = (courseId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (submissionId: number) => deleteSubmission(submissionId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.COURSE_ASSIGNMENTS(courseId.toString()),
            });
        },
    });
};
