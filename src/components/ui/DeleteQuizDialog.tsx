import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

export interface DeleteQuizDialogProps {
    open: boolean;
    quizTitle: string;
    onClose: () => void;
    onConfirm: () => void;
    isPending?: boolean;
}

export function DeleteQuizDialog({ open, quizTitle, onClose, onConfirm, isPending = false }: DeleteQuizDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) onClose();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, isPending, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="delete-quiz-title" aria-describedby="delete-quiz-desc">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                aria-label="Close dialog"
                disabled={isPending}
                onClick={() => !isPending && onClose()}
            />
            <div className="relative w-full max-w-[440px] overflow-hidden rounded-[2.5rem] border border-gray-200/80 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute right-6 top-6">
                    <button
                        type="button"
                        onClick={() => !isPending && onClose()}
                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label="Cancel"
                        disabled={isPending}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-red-50/50 via-white to-rose-50/20 px-10 pb-8 pt-12 dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-red-100 bg-red-50 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 animate-in slide-in-from-top-4 duration-500">
                        <AlertTriangle className="h-10 w-10 text-red-500" strokeWidth={2.25} />
                    </div>
                    <h2 id="delete-quiz-title" className="text-center text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                        Delete this quiz?
                    </h2>
                    <p id="delete-quiz-desc" className="text-center text-sm font-semibold leading-relaxed text-gray-600 dark:text-slate-400">
                        <span className="font-bold text-gray-900 dark:text-white">&ldquo;{quizTitle || 'Untitled quiz'}&rdquo;</span>
                        {' '}will be permanently removed. This cannot be undone and may delete related questions and student data.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 p-8 sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-700 disabled:opacity-70 dark:shadow-red-900/40 sm:w-auto active:scale-95 group"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting…
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 group-hover:-rotate-12 transition-transform" />
                                Delete quiz
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
