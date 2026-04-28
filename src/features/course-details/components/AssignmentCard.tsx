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
                style: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
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
            className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl flex flex-col group hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-500 transition-all overflow-hidden cursor-pointer"
        >
            {/* Card header */}
            <div className="p-5 pb-0 flex justify-between items-start">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm ${badgeConfig.style}`}
                >
                    <BadgeIcon className="w-3.5 h-3.5" />
                    {badgeConfig.label}
                </span>
            </div>

            {/* Card body */}
            <div className="p-5 flex-1 flex flex-col">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-[#21A9FF] transition-colors leading-tight">{assignment.title}</h4>

                {/* Meta info */}
                <div className="mt-auto space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="font-semibold">Due:</span>
                        <span className="truncate">{formatDate(assignment.dueDate)}</span>
                        {isLate && (
                            <span className="ml-1 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">Past Due</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Card footer / Actions */}
            <div className="border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/40 mt-auto">
                {!isSubmitted && canSubmit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSubmit();
                        }}
                        disabled={isSubmitting}
                        className="w-full py-3.5 flex items-center justify-center gap-2 text-[#21A9FF] hover:bg-blue-50 dark:hover:bg-blue-500/10 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Work'}
                    </button>
                )}
                
                {!isSubmitted && !canSubmit && (
                    <div className="w-full py-3.5 flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest bg-gray-50/50 dark:bg-slate-900/20 cursor-not-allowed">
                        <AlertCircle className="w-4 h-4" />
                        Closed
                    </div>
                )}

                {isSubmitted && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewSubmission();
                        }}
                        className="w-full py-3.5 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <Eye className="w-4 h-4" />
                        View Submission
                    </button>
                )}
            </div>
        </div>
    );
});

AssignmentCard.displayName = 'AssignmentCard';
