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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="delete-quiz-title" aria-describedby="delete-quiz-desc">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                aria-label="Close dialog"
                disabled={isPending}
                onClick={() => !isPending && onClose()}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-600/60 dark:bg-slate-900 dark:shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute right-4 top-4">
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

                <div className="border-b border-gray-100 bg-gradient-to-br from-red-50 via-white to-amber-50/30 px-6 pb-6 pt-8 dark:border-slate-700/80 dark:from-red-950/40 dark:via-slate-900 dark:to-slate-900">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner shadow-red-200/50 dark:bg-red-500/15 dark:text-red-400 dark:shadow-none">
                        <AlertTriangle className="h-7 w-7" strokeWidth={2.25} />
                    </div>
                    <h2 id="delete-quiz-title" className="text-center text-xl font-black tracking-tight text-gray-900 dark:text-white">
                        Delete this quiz?
                    </h2>
                    <p id="delete-quiz-desc" className="mt-3 text-center text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                        <span className="font-semibold text-gray-900 dark:text-slate-200">&ldquo;{quizTitle || 'Untitled quiz'}&rdquo;</span>
                        {' '}will be permanently removed. This cannot be undone and may delete related questions and student data.
                    </p>
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-700 hover:to-rose-700 disabled:opacity-70 dark:shadow-red-900/40 sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting…
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
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
