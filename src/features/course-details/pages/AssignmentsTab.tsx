import { useState, useCallback, useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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
import { FileText, AlertCircle, RefreshCw, Search, Filter, ChevronDown, Trash2, X } from 'lucide-react';
import type { GetAssignmentDto } from '../types';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export const AssignmentsTab = () => {
    const { courseId: paramCourseId } = useParams<{ courseId: string }>();
    const { numericCourseId: contextNumericId } = useOutletContext<CourseContext>() || {};
    
    // Prioritize context, fallback to params
    const cId = contextNumericId ?? (paramCourseId ? parseInt(paramCourseId, 10) : 0);

    const { data: assignments, isLoading, error, refetch } = useCourseAssignments(cId);
    const submitMutation = useSubmitAssignment(cId);
    const deleteMutation = useDeleteSubmission(cId);

    const [submitModalAssignment, setSubmitModalAssignment] = useState<GetAssignmentDto | null>(null);
    const [viewSubmissionAssignmentId, setViewSubmissionAssignmentId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'not_submitted' | 'open' | 'closed'>('all');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; submissionId: number | null }>({ open: false, submissionId: null });

    const {
        data: submissionData,
        isLoading: submissionLoading,
        error: submissionError,
    } = useAssignmentSubmission(viewSubmissionAssignmentId ?? 0, viewSubmissionAssignmentId !== null);

    const submission = submissionData ?? null;

    const filteredAssignments = useMemo(() => {
        if (!assignments || !Array.isArray(assignments)) return [];
        const term = searchQuery.toLowerCase();
        return assignments.filter(a => {
            // Filter by status
            if (filterStatus === 'submitted' && !a.isSubmitted) return false;
            if (filterStatus === 'not_submitted' && a.isSubmitted) return false;
            if (filterStatus === 'open') {
                const isPastDue = a.dueDate ? new Date(a.dueDate) < new Date() : false;
                if (isPastDue) return false;
            }
            if (filterStatus === 'closed') {
                const isPastDue = a.dueDate ? new Date(a.dueDate) < new Date() : true;
                if (!isPastDue) return false;
            }
            // Filter by search
            const searchOk = !term || (a.title ?? '').toLowerCase().startsWith(term);
            return searchOk;
        });
    }, [assignments, searchQuery, filterStatus]);

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
            handleCloseSubmitModal();
        },
        [submitModalAssignment, submitMutation, handleCloseSubmitModal]
    );

    const handleViewSubmission = useCallback((assignmentId: number) => {
        setViewSubmissionAssignmentId(assignmentId);
    }, []);

    const handleCloseSubmission = useCallback(() => {
        setViewSubmissionAssignmentId(null);
    }, []);

    const handleDeleteSubmission = useCallback(
        async (submissionId: number) => {
            setDeleteConfirm({ open: true, submissionId });
        },
        []
    );

    const confirmDelete = useCallback(async () => {
        if (!deleteConfirm.submissionId) return;
        await deleteMutation.mutateAsync(deleteConfirm.submissionId);
        setDeleteConfirm({ open: false, submissionId: null });
        handleCloseSubmission();
    }, [deleteConfirm.submissionId, deleteMutation, handleCloseSubmission]);

    const cancelDelete = useCallback(() => {
        setDeleteConfirm({ open: false, submissionId: null });
    }, []);

    if (isLoading) return <TabLoadingState />;

    if (error || !assignments) {
        if (!isLoading && cId > 0 && error) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Failed to load assignments
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                        There was an error fetching the assignments for this course. Please try again later.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            );
        }
    }

    const assignmentsList = Array.isArray(assignments) ? assignments : [];

    if (assignmentsList.length === 0 && !isLoading) {
        return (
            <EmptyState
                icon={FileText}
                title="No assignments"
                description="No assignments have been published for this course yet."
            />
        );
    }

    const viewSubmissionAssignment = assignmentsList.find((a) => a.id === viewSubmissionAssignmentId) || null;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#21A9FF]" />
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Assignments
                    </h2>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="relative z-30 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search assignments..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white font-semibold transition-all" 
                    />
                </div>

                <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm hover:border-blue-300 dark:hover:border-slate-500 transition-colors min-w-[160px]"
                    >
                        <span className="flex-1 text-gray-800 dark:text-white">
                            {filterStatus === 'all' ? 'All Status' : filterStatus === 'not_submitted' ? 'Not Submitted' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStatusDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5">
                                {[
                                    { value: 'all' as const, label: 'All Status' },
                                    { value: 'submitted' as const, label: 'Submitted' },
                                    { value: 'not_submitted' as const, label: 'Not Submitted' },
                                    { value: 'open' as const, label: 'Open' },
                                    { value: 'closed' as const, label: 'Closed' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilterStatus(opt.value); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-between ${filterStatus === opt.value
                                                ? 'bg-blue-50 dark:bg-[#21A9FF]/10 text-[#21A9FF]'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {opt.label}
                                        {filterStatus === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAssignments.map((assignment) => (
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelDelete} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 animate-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            onClick={cancelDelete}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            {/* Icon */}
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Delete Submission?
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                                Are you sure you want to delete your submission? This action cannot be undone.
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={cancelDelete}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-500/25 active:scale-95 disabled:cursor-not-allowed"
                                >
                                    {deleteMutation.isPending ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
