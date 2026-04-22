import { useUpdateQuizStatus } from '@/features/quizzes/api';
import { CheckCircle2, ChevronDown, FileText } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    quizId: string;
    courseId: string;
    /** Raw status from API (Draft | Published | Scheduled, etc.) */
    status: string;
    className?: string;
};

/**
 * Draft / Published selector for instructor quiz cards - uses PUT .../update-status.
 */
export function QuizStatusSelect({ quizId, courseId, status, className = '' }: Props) {
    const mutation = useUpdateQuizStatus(courseId);
    const effective: 'Draft' | 'Published' = status === 'Published' ? 'Published' : 'Draft';
    const rowBusy = mutation.isPending && mutation.variables?.quizId === quizId;
    const isPublished = effective === 'Published';

    const statusTheme = isPublished
        ? {
            shell: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-500/25 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15',
            iconWrap: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
            Icon: CheckCircle2,
        }
        : {
            shell: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:ring-purple-500/25 dark:border-slate-600/70 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800',
            iconWrap: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200',
            Icon: FileText,
        };

    const StatusIcon = statusTheme.Icon;

    return (
        <div className={`relative w-full max-w-[11.5rem] ${className}`}>
            <label className="sr-only">Quiz status</label>
            <select
                aria-label="Quiz status"
                value={effective}
                disabled={rowBusy || !courseId}
                onChange={(e) => {
                    const next = e.target.value as 'Draft' | 'Published';
                    if (next === effective) return;
                    mutation.mutate(
                        { quizId, status: next },
                        {
                            onSuccess: () => {
                                toast.success(next === 'Published' ? 'Quiz published.' : 'Quiz set to draft.');
                            },
                            onError: () => {
                                toast.error('Could not update quiz status. Please try again.');
                            },
                        }
                    );
                }}
                className={`
                    relative w-full cursor-pointer appearance-none rounded-xl border py-2.5 pl-10 pr-9 text-left text-xs font-semibold
                    transition-colors duration-200 focus:outline-none focus:ring-4
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${statusTheme.shell}
                `}
            >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
            </select>
            <div className={`pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg ${statusTheme.iconWrap}`}>
                <StatusIcon className="h-3.5 w-3.5" />
            </div>
            <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {rowBusy ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                ) : (
                    <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </div>
        </div>
    );
}
