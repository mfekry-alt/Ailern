import { X, Calendar, FileText, MessageSquare, Download, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { GetMySubmissionDto, GetAssignmentDto } from '../types';
import { useMemo } from 'react';
import { formatDateTime, parseUtcDate } from '@/utils/dateFormat';

interface ViewSubmissionPanelProps {
    open: boolean;
    onClose: () => void;
    submission: GetMySubmissionDto | null;
    isLoading: boolean;
    assignment?: GetAssignmentDto | null;
    onDelete?: (submissionId: number) => void;
    isDeleting?: boolean;
    error?: Error | null;
}

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const ViewSubmissionPanel = ({ open, onClose, submission, isLoading, assignment, onDelete, isDeleting, error }: ViewSubmissionPanelProps) => {
    const canDelete = useMemo(() => {
        if (!submission || !assignment) return false;
        if (submission.feedback) return false;
        const now = new Date();
        const dueDate = parseUtcDate(assignment.dueDate);
        return (dueDate && now < dueDate) || assignment.allowLateSubmission === true;
    }, [submission, assignment]);

    const isLate = submission?.isLate ?? false;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[85vh] animate-scale-up">
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Your Submission
                            </h3>
                            {submission && !isLoading && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${isLate ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                                    {isLate ? 'Late Submission' : 'On Time'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                            <p className="font-semibold text-gray-900 dark:text-white">Failed to load submission</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Please close and try again later.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                            <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                            <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                        </div>
                    ) : submission ? (
                        <>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Calendar className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                        Submitted At
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDateTime(submission.submissionDate)}
                                    </p>
                                </div>
                            </div>

                            {submission.filesUrls && submission.filesUrls.length > 0 ? (
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        Files ({submission.filesUrls.length})
                                    </p>
                                    <div className="space-y-2">
                                        {submission.filesUrls.map((file, idx) => (
                                            <div
                                                key={file.id || idx}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 text-blue-500">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {file.fileName || 'Untitled File'}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 uppercase">
                                                            {file.fileType || 'Document'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                                    {file.fileUrl && (
                                                        <>
                                                            <a
                                                                href={file.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                                                title="View File"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </a>
                                                            <a
                                                                href={file.fileUrl}
                                                                download
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
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
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-center">
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                        No files uploaded
                                    </p>
                                </div>
                            )}

                            {!submission.feedback && (
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-center">
                                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                        Your submission has not been reviewed yet.
                                    </p>
                                </div>
                            )}

                            {submission.feedback && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
                                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Instructor Feedback
                                    </p>
                                    <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                                        {submission.feedback}
                                    </p>
                                    {submission.grade !== undefined && submission.grade !== null && (
                                        <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-500/20">
                                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                                Grade: {submission.grade}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {canDelete && onDelete && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={() => onDelete(submission.submissionId)}
                                        disabled={isDeleting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                        {isDeleting ? 'Deleting...' : 'Delete Submission'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                            No submission data found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
