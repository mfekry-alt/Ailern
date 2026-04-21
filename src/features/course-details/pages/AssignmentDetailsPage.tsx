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
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Failed to load assignment
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                    Could not fetch assignment details. Please try again.
                </p>
                <button
                    onClick={() => navigate(`/courses/${cId}/assignments`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
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
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header & Back Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/courses/${cId}/assignments`)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Assignment Details
                    </h2>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Assignment Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeConfig.style}`}>
                                <BadgeIcon className="w-3.5 h-3.5" />
                                {badgeConfig.label}
                            </span>
                            {assignment.isPublished ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                    Published
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                    Draft
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            {assignment.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium pt-2">
                            <div className={`flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 ${isLate ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-300'}`}>
                                <Calendar className={`w-4 h-4 ${isLate ? 'text-red-500' : 'text-blue-500'}`} />
                                <span>
                                    Due: {formatDateTime(assignment.dueDate)}
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${assignment.allowLateSubmission ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                {assignment.allowLateSubmission ? (
                                    <>
                                        <Clock className="w-4 h-4" />
                                        Late Submission Allowed
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        No Late Submission
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                            Created: {formatDateTime(assignment.createdAt)}
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="shrink-0 w-full md:w-64">
                        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Your Work</h4>
                            
                            {!isSubmitted && canSubmit && (
                                <button
                                    onClick={handleOpenSubmitModal}
                                    disabled={submitMutation.isPending}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                                </button>
                            )}

                            {!isSubmitted && !canSubmit && (
                                <div className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center text-sm font-medium py-3 rounded-xl text-gray-500 dark:text-slate-400 shadow-sm">
                                    Submission deadline has passed
                                </div>
                            )}

                            {isSubmitted && (
                                <button
                                    onClick={handleViewSubmission}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Submission
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="my-8 border-gray-100 dark:border-slate-800" />

                {/* Instructions Section */}
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Instructions</h3>
                    <div className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {assignment.instructions || 'No instructions provided.'}
                    </div>
                </div>

                {/* Reference Files Section */}
                {((assignment as any).fileUrls?.length > 0 || (assignment.files && assignment.files.length > 0)) && (
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Reference Files
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Handle Array of String URLs (fileUrls) */}
                            {((assignment as any).fileUrls || []).map((url: string, idx: number) => {
                                const fileName = url.split('/').pop()?.split('?')[0] || `Reference_File_${idx + 1}`;
                                return (
                                    <div
                                        key={`url-${idx}`}
                                        className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 text-indigo-500">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={fileName}>
                                                    {fileName}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                                    Document
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-4 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={url}
                                                download
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Handle Array of FileMetaData Objects */}
                            {(assignment.files || []).map((file, idx) => (
                                <div
                                    key={`meta-${idx}`}
                                    className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 text-indigo-500">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={file.fileName}>
                                                {file.fileName}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                                {formatFileSize(file.fileSize)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(file as any).fileUrl && (
                                            <>
                                                <a
                                                    href={(file as any).fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="View File"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <a
                                                    href={(file as any).fileUrl}
                                                    download
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="Download File"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
