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
import { FileText, AlertCircle, RefreshCw, Search, Filter, ChevronDown } from 'lucide-react';
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
            if (!window.confirm('Are you sure you want to delete your submission?')) return;
            await deleteMutation.mutateAsync(submissionId);
            handleCloseSubmission();
        },
        [deleteMutation, handleCloseSubmission]
    );

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
        </div>
    );
};
