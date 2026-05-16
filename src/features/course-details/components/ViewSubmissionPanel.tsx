import { X, Calendar, FileText, MessageSquare, Download, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { GetMySubmissionDto, GetAssignmentDto } from '../types';
import { useMemo, useEffect } from 'react';
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

    // Implement scroll locking when the panel is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const isLate = submission?.isLate ?? false;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[85vh] animate-scale-up">
                <div className="p-6 sm:p-8 shrink-0 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Your Submission
                            </h3>
                            {submission && !isLoading && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isLate ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-emerald-100 text-emerald-600 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                                    {isLate ? 'Late' : 'On Time'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="px-6 sm:px-8 pb-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-100 dark:border-red-500/20">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Failed to load submission</p>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">Please close and try again later.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
                                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-32 bg-gray-100 dark:bg-slate-800/50 rounded-[2rem]" />
                            <div className="h-24 bg-gray-100 dark:bg-slate-800/50 rounded-[2rem]" />
                        </div>
                    ) : submission ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Submission Date Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#21A9FF] shrink-0 shadow-inner border border-blue-100/50 dark:border-blue-500/20">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                        Submitted At
                                    </p>
                                    <p className="text-[15px] font-black text-slate-800 dark:text-white">
                                        {formatDateTime(submission.submissionDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Files Section */}
                            <div className="space-y-4">
                                {submission.filesUrls && submission.filesUrls.length > 0 ? (
                                    <div className="space-y-3">
                                        {submission.filesUrls.map((file: any, idx: number) => (
                                            <div
                                                key={file.id || idx}
                                                className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-[1.5rem] border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center shadow-inner shrink-0 text-[#21A9FF] border border-gray-100/50 dark:border-slate-800">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                                            {file.fileName || 'Untitled File'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
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
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-400 hover:text-[#21A9FF] hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:scale-105"
                                                                title="View File"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </a>
                                                            <a
                                                                href={file.fileUrl}
                                                                download
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-400 hover:text-[#21A9FF] hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:scale-105"
                                                                title="Download File"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            No files uploaded
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Feedback Section */}
                            {submission.feedback && (
                                <div className="p-6 bg-blue-50/50 dark:bg-[#21A9FF]/5 border border-blue-100/50 dark:border-blue-500/10 rounded-[2rem] space-y-3 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-2 text-[#21A9FF]">
                                        <MessageSquare className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Instructor Feedback</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed pl-7">
                                        {submission.feedback}
                                    </p>
                                    {submission.grade !== undefined && submission.grade !== null && (
                                        <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-500/10 pl-7">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grade</span>
                                                <span className="text-lg font-black text-[#21A9FF]">
                                                    {submission.grade}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {canDelete && onDelete && (
                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={() => onDelete(submission.submissionId)}
                                        disabled={isDeleting}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                        {isDeleting ? 'Deleting...' : 'Delete Submission'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                No submission data found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
