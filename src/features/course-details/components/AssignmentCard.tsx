import { memo, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Upload,
    CheckCircle,
    AlertCircle,
    Eye,
    Trash2,
    Loader2,
} from 'lucide-react';
import type { GetAssignmentDto } from '../types';
import { formatDate, parseUtcDate } from '@/utils/dateFormat';

interface AssignmentCardProps {
    assignment: GetAssignmentDto;
    hasSubmission: boolean;
    hasFeedback: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onViewSubmission: () => void;
}

export const AssignmentCard = memo(
    ({
        assignment,
        hasSubmission,
        hasFeedback,
        isSubmitting,
        onSubmit,
        onViewSubmission,
    }: AssignmentCardProps) => {
        const { courseId } = useParams();
        const navigate = useNavigate();

        const status = useMemo(() => {
            const now = new Date();
            const due = parseUtcDate(assignment.dueDate);
            if (hasSubmission) return 'submitted';
            if (due && due.getTime() < now.getTime()) return 'late';
            return 'pending';
        }, [assignment.dueDate, hasSubmission]);

        const canSubmit = useMemo(() => {
            const now = new Date();
            const dueDate = parseUtcDate(assignment.dueDate);
            return (dueDate && now < dueDate) || assignment.allowLateSubmission === true;
        }, [assignment.dueDate, assignment.allowLateSubmission]);

        const isLate = status === 'late';
        const isSubmitted = status === 'submitted';

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

        return (
            <div 
                onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}`)}
                className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeConfig.style}`}
                            >
                                <BadgeIcon className="w-3.5 h-3.5" />
                                {badgeConfig.label}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {assignment.title}
                        </h3>

                        {assignment.instructions && (
                            <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                                {assignment.instructions}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                            <div
                                className={`flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 ${
                                    isLate
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-slate-300'
                                }`}
                            >
                                <Calendar
                                    className={`w-4 h-4 ${
                                        isLate ? 'text-red-500' : 'text-blue-500'
                                    }`}
                                />
                                Due: {formatDate(assignment.dueDate)}
                            </div>

                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                                    assignment.allowLateSubmission
                                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                }`}
                            >
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
                    </div>

                    <div className="shrink-0 w-full sm:w-44 flex flex-col gap-2">
                        {!isSubmitted && canSubmit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmit();
                                }}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        )}
                        
                        {!isSubmitted && !canSubmit && (
                            <div className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700 text-center text-sm font-medium py-2.5 rounded-xl text-gray-500 dark:text-slate-400">
                                Submission deadline has passed
                            </div>
                        )}

                        {isSubmitted && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewSubmission();
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Submission
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

AssignmentCard.displayName = 'AssignmentCard';
