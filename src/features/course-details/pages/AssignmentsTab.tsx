import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    useCourseAssignments,
    useAssignmentSubmission,
    useSubmitAssignment,
    useDeleteSubmission,
} from '../api';
import { AssignmentCard } from '../components/AssignmentCard';
import { SubmitAssignmentModal } from '../components/SubmitAssignmentModal';
import { ViewSubmissionPanel } from '../components/ViewSubmissionPanel';
import { EmptyState } from '../components/EmptyState';
import { TabLoadingState } from '../components/TabLoadingState';
import { ListChecks, AlertCircle, RefreshCw } from 'lucide-react';
import type { GetAssignmentDto } from '../types';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export const AssignmentsTab = () => {
    const { courseId, numericCourseId } = useOutletContext<CourseContext>();
    const cId = numericCourseId ?? 0;

    const { data: assignments, isLoading, error, refetch } = useCourseAssignments(cId);
    const submitMutation = useSubmitAssignment(cId);
    const deleteMutation = useDeleteSubmission(cId);

    const [submitModalAssignment, setSubmitModalAssignment] = useState<GetAssignmentDto | null>(null);
    const [viewSubmissionAssignmentId, setViewSubmissionAssignmentId] = useState<number | null>(null);

    const {
        data: submissionData,
        isLoading: submissionLoading,
        error: submissionError,
    } = useAssignmentSubmission(viewSubmissionAssignmentId ?? 0, viewSubmissionAssignmentId !== null);

    const submission = submissionData ?? null;

    const handleOpenSubmitModal = useCallback((assignment: GetAssignmentDto) => {
        setSubmitModalAssignment(assignment);
    }, []);

    const handleCloseSubmitModal = useCallback(() => {
        setSubmitModalAssignment(null);
    }, []);

    const handleSubmit = useCallback(
        async (files: File[]) => {
            if (!submitModalAssignment) return;
            await submitMutation.mutateAsync({
                assignmentId: submitModalAssignment.id,
                files,
            });
        },
        [submitModalAssignment, submitMutation]
    );

    const handleViewSubmission = useCallback((assignmentId: number) => {
        setViewSubmissionAssignmentId(assignmentId);
    }, []);

    const handleCloseSubmission = useCallback(() => {
        setViewSubmissionAssignmentId(null);
    }, []);

    const handleDeleteSubmission = useCallback(
        async (submissionId: number) => {
            if (!window.confirm('Are you sure you want to delete your submission?')) return;
            await deleteMutation.mutateAsync(submissionId);
            handleCloseSubmission();
        },
        [deleteMutation, handleCloseSubmission]
    );

    if (isLoading) return <TabLoadingState />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Failed to load assignments
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                    Could not fetch course assignments. Please try again.
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    const assignmentsList = assignments || [];

    if (!assignmentsList || assignmentsList.length === 0) {
        return (
            <EmptyState
                icon={ListChecks}
                title="No assignments"
                description="No assignments have been published for this course yet."
            />
        );
    }

    const viewSubmissionAssignment = assignmentsList.find((a) => a.id === viewSubmissionAssignmentId) || null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                    <ListChecks className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Assignments
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                        {assignmentsList.length} {assignmentsList.length === 1 ? 'assignment' : 'assignments'} available
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {assignmentsList.map((assignment) => (
                    <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        hasSubmission={assignment.isSubmitted ?? false}
                        hasFeedback={assignment.hasFeedback ?? false}
                        isSubmitting={
                            submitMutation.isPending &&
                            submitModalAssignment?.id === assignment.id
                        }
                        onSubmit={() => handleOpenSubmitModal(assignment)}
                        onViewSubmission={() => handleViewSubmission(assignment.id)}
                    />
                ))}
            </div>

            <SubmitAssignmentModal
                open={submitModalAssignment !== null}
                onClose={handleCloseSubmitModal}
                assignmentTitle={submitModalAssignment?.title ?? ''}
                onSubmit={handleSubmit}
                isPending={submitMutation.isPending}
            />

            <ViewSubmissionPanel
                open={viewSubmissionAssignmentId !== null}
                onClose={handleCloseSubmission}
                submission={submission}
                isLoading={submissionLoading}
                assignment={viewSubmissionAssignment}
                onDelete={handleDeleteSubmission}
                isDeleting={deleteMutation.isPending}
                error={submissionError}
            />
        </div>
    );
};
