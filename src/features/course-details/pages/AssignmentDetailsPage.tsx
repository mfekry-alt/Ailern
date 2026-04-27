import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useCourseAssignments,
    useAssignmentDetails,
    useAssignmentSubmission,
    useSubmitAssignment,
    useDeleteSubmission,
} from '../api';
import { SubmitAssignmentModal } from '../components/SubmitAssignmentModal';
import { ViewSubmissionPanel } from '../components/ViewSubmissionPanel';
import { TabLoadingState } from '../components/TabLoadingState';
import {
    Calendar,
    Clock,
    Upload,
    CheckCircle,
    AlertCircle,
    Eye,
    ChevronLeft,
    FileText,
    Download,
    Loader2,
} from 'lucide-react';
import type { GetAssignmentDto } from '../types';
import { formatDateTime, formatDate, parseUtcDate } from '@/utils/dateFormat';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const AssignmentDetailsPage = () => {
    const { courseId, assignmentId } = useParams();
    const navigate = useNavigate();

    const cId = Number(courseId) || 0;
    const aId = Number(assignmentId) || 0;

    const { data: assignmentDetails, isLoading: isDetailsLoading, error: detailsError } = useAssignmentDetails(aId);

    // We also fetch course assignments to get the `isSubmitted` and `hasFeedback` state
    // since the singular assignment API might not include student submission context.
    const { data: assignments, isLoading: isAssignmentsLoading } = useCourseAssignments(cId);

    const submitMutation = useSubmitAssignment(cId);
    const deleteMutation = useDeleteSubmission(cId);

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isViewSubmissionOpen, setIsViewSubmissionOpen] = useState(false);

    const { data: submissionData, isLoading: submissionLoading, error: submissionError } = useAssignmentSubmission(aId, isViewSubmissionOpen);
    const submission = submissionData ?? null;

    const handleOpenSubmitModal = useCallback(() => setIsSubmitModalOpen(true), []);
    const handleCloseSubmitModal = useCallback(() => setIsSubmitModalOpen(false), []);

    const handleSubmit = useCallback(
        async (files: File[]) => {
            if (!assignmentDetails) return;
            await submitMutation.mutateAsync({
                assignmentId: assignmentDetails.id,
                files,
            });
            handleCloseSubmitModal();
        },
        [assignmentDetails, submitMutation, handleCloseSubmitModal]
    );

    const handleViewSubmission = useCallback(() => setIsViewSubmissionOpen(true), []);
    const handleCloseSubmission = useCallback(() => setIsViewSubmissionOpen(false), []);

    const handleDeleteSubmission = useCallback(
        async (subId: number) => {
            if (!window.confirm('Are you sure you want to delete your submission?')) return;
            await deleteMutation.mutateAsync(subId);
            handleCloseSubmission();
        },
        [deleteMutation, handleCloseSubmission]
    );

    // Compute derived properties
    const assignmentFromList = assignments?.find(a => a.id === aId);

    const isSubmitted = assignmentFromList?.isSubmitted ?? false;
    const hasFeedback = assignmentFromList?.hasFeedback ?? false;

    // assignmentDetails or fallback to assignmentFromList
    const assignment = assignmentDetails || assignmentFromList;

    const canSubmit = useMemo(() => {
        if (!assignment) return false;
        const now = new Date();
        const dueDate = parseUtcDate(assignment.dueDate);
        return (dueDate && now < dueDate) || assignment.allowLateSubmission === true;
    }, [assignment]);

    const status = useMemo(() => {
        if (!assignment) return 'pending';
        const now = new Date();
        const due = parseUtcDate(assignment.dueDate);
        if (isSubmitted) return 'submitted';
        if (due && due.getTime() < now.getTime()) return 'late';
        return 'pending';
    }, [assignment, isSubmitted]);

    if (isDetailsLoading || (isAssignmentsLoading && !assignments)) return <TabLoadingState />;

    if (detailsError || !assignment) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 max-w-md mx-auto">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-500/20 shadow-inner">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    Failed to load assignment
                </h2>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-8">
                    Could not fetch assignment details. Please try again.
                </p>
                <button
                    onClick={() => navigate(`/courses/${cId}/assignments`)}
                    className="flex items-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-[#21A9FF] text-slate-700 dark:text-slate-300 hover:text-[#21A9FF] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Assignments
                </button>
            </div>
        );
    }

    const badgeConfig = {
        pending: {
            style: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
            icon: Clock,
            label: 'Pending',
        },
        submitted: {
            style: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            icon: CheckCircle,
            label: 'Submitted',
        },
        late: {
            style: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
            icon: AlertCircle,
            label: 'Overdue',
        },
    }[status];

    const BadgeIcon = badgeConfig.icon;
    const isLate = status === 'late';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            {/* Header & Back Navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(`/courses/${cId}/assignments`)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-[#21A9FF] hover:border-blue-200 dark:hover:border-slate-600 transition-all shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Assignment Details
                </h2>
            </div>

            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl border border-gray-100 dark:border-slate-700/50 rounded-2xl p-10 sm:p-12 shadow-sm relative overflow-hidden">
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#21A9FF] via-indigo-500 to-purple-500 opacity-60" />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Assignment Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${badgeConfig.style}`}>
                                <BadgeIcon className="w-3.5 h-3.5" />
                                {badgeConfig.label}
                            </span>
                            {assignment.isPublished && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-[#21A9FF] border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                    Published
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                            {assignment.title}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] group hover:-translate-y-0.5 transition-all">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105 ${isLate ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' : 'bg-blue-50 text-[#21A9FF] border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
                                    <p className={`text-sm font-black truncate ${isLate ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                        {formatDateTime(assignment.dueDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] group hover:-translate-y-0.5 transition-all">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105 ${assignment.allowLateSubmission ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20' : 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}>
                                    {assignment.allowLateSubmission ? <Clock className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Late Submissions</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                        {assignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            Created: {formatDateTime(assignment.createdAt)}
                        </p>
                    </div>

                    {/* Action Panel */}
                    <div className="shrink-0 w-full lg:w-96">
                        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800/50">
                                <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Your Work</h4>
                                {isSubmitted && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                            </div>

                            {!isSubmitted && canSubmit && (
                                <button
                                    onClick={handleOpenSubmitModal}
                                    disabled={submitMutation.isPending}
                                    className="w-full bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-widest px-4 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(33,169,255,0.39)] hover:shadow-[0_6px_20px_rgba(33,169,255,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {submitMutation.isPending ? 'Submitting...' : 'Submit Work'}
                                </button>
                            )}

                            {!isSubmitted && !canSubmit && (
                                <div className="p-4 bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20 rounded-xl text-center">
                                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
                                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Deadline Passed</p>
                                </div>
                            )}

                            {isSubmitted && (
                                <button
                                    onClick={handleViewSubmission}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-[#21A9FF] hover:text-[#21A9FF] text-slate-700 dark:text-white font-black text-xs uppercase tracking-widest px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Submission
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="my-6 border-gray-100 dark:border-slate-800" />

                {/* Instructions Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-[#21A9FF] rounded-full" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Instructions</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-slate-800/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
                        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                            {assignment.instructions || 'No instructions provided for this assignment.'}
                        </div>
                    </div>
                </div>

                {/* Reference Files Section (Instructor Files) */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Instructor Resources</h3>
                    </div>
                    
                    {(!((assignment as any).submissionFiles?.length > 0)) ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800/50 shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <FileText className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No files attached</h4>
                            <p className="text-[11px] font-medium text-slate-500">The instructor has not provided any additional resources.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {((assignment as any).submissionFiles || []).map((file: any) => (
                                <div
                                    key={file.id}
                                    className="flex flex-col bg-white dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-800/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group overflow-hidden"
                                >
                                    <div className="p-4 flex items-start gap-3 flex-1 border-b border-gray-50 dark:border-slate-800/30">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 group-hover:scale-105 transition-transform">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate" title={file.fileName}>
                                                {file.fileName}
                                            </p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Instructor Resource</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
                                        {file.fileUrl && (
                                            <>
                                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="View">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </a>
                                                <a href={file.fileUrl} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Download">
                                                    <Download className="w-3.5 h-3.5" /> Download
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <SubmitAssignmentModal
                open={isSubmitModalOpen}
                onClose={handleCloseSubmitModal}
                assignmentTitle={assignment.title}
                onSubmit={handleSubmit}
                isPending={submitMutation.isPending}
            />

            <ViewSubmissionPanel
                open={isViewSubmissionOpen}
                onClose={handleCloseSubmission}
                submission={submission}
                isLoading={submissionLoading}
                assignment={assignment as GetAssignmentDto}
                onDelete={handleDeleteSubmission}
                isDeleting={deleteMutation.isPending}
                error={submissionError}
            />
        </div>
    );
};
