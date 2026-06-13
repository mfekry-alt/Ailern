import { useState } from 'react';
import { useUpdateQuizStatus } from '@/features/quizzes/api';
import { CheckCircle2, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    quizId: string;
    courseId: string;
    /** Raw status from API (Draft | Published | Scheduled, etc.) */
    status: string;
    className?: string;
};

/**
 * Premium Draft / Published selector for instructor quiz cards.
 */
export function QuizStatusSelect({ quizId, courseId, status, className = '' }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const mutation = useUpdateQuizStatus(courseId);
    
    const effective: 'Draft' | 'Published' = status === 'Published' ? 'Published' : 'Draft';
    const isBusy = mutation.isPending && mutation.variables?.quizId === quizId;
    const isPublished = effective === 'Published';

    const handleUpdate = (next: 'Draft' | 'Published') => {
        if (next === effective) {
            setIsOpen(false);
            return;
        }
        
        mutation.mutate(
            { quizId, status: next },
            {
                onSuccess: () => {
                    toast.success(next === 'Published' ? 'Quiz published successfully.' : 'Quiz set to draft.');
                    setIsOpen(false);
                },
                onError: (error: any) => {
                    const message = error?.response?.data?.message || error?.message || 'Failed to update status.';
                    toast.error(message);
                    setIsOpen(false);
                },
            }
        );
    };

    const theme = isPublished
        ? {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-200 dark:border-emerald-500/30',
            text: 'text-emerald-700 dark:text-emerald-400',
            iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            dot: 'bg-emerald-500',
            Icon: CheckCircle2
        }
        : {
            bg: 'bg-slate-50 dark:bg-slate-800/60',
            border: 'border-slate-200 dark:border-slate-700',
            text: 'text-slate-600 dark:text-slate-300',
            iconBg: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
            dot: 'bg-slate-400',
            Icon: FileText
        };

    const StatusIcon = theme.Icon;

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                disabled={isBusy || !courseId}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300
                    ${theme.bg} ${theme.border} ${theme.text}
                    focus:outline-none focus:ring-4 focus:ring-indigo-500/10
                    ${isBusy ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                `}
            >
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${theme.iconBg}`}>
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StatusIcon className="w-3.5 h-3.5" />}
                </div>
                
                <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-left">
                    {effective}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${isBusy ? 'animate-pulse' : ''}`} />
                    <ChevronDown className={`w-3.5 h-3.5 opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => handleUpdate('Draft')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
                                effective === 'Draft' 
                                    ? 'bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400' 
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Draft
                            {effective === 'Draft' && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                        </button>
                        <button
                            onClick={() => handleUpdate('Published')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
                                effective === 'Published' 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Published
                            {effective === 'Published' && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
