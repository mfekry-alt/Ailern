import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X, Trash2, Info, AlertCircle, type LucideIcon } from 'lucide-react';

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onClose: () => void;
    onConfirm: () => void;
    isPending?: boolean;
    variant?: 'danger' | 'warning' | 'info';
    icon?: LucideIcon;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmText,
    cancelText = 'Cancel',
    onClose,
    onConfirm,
    isPending = false,
    variant = 'danger',
    icon: Icon
}: ConfirmDialogProps) {
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

    const variantStyles = {
        danger: {
            bg: 'from-red-50/50 via-white to-rose-50/20 dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900',
            iconContainer: 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20',
            icon: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-500/30 dark:shadow-red-900/40',
            defaultIcon: AlertTriangle,
            defaultConfirmText: 'Delete'
        },
        warning: {
            bg: 'from-amber-50/50 via-white to-orange-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900',
            iconContainer: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20',
            icon: 'text-amber-500',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30 dark:shadow-amber-900/40',
            defaultIcon: AlertCircle,
            defaultConfirmText: 'Confirm'
        },
        info: {
            bg: 'from-blue-50/50 via-white to-indigo-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900',
            iconContainer: 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20',
            icon: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 dark:shadow-blue-900/40',
            defaultIcon: Info,
            defaultConfirmText: 'Continue'
        }
    };

    const currentStyles = variantStyles[variant];
    const EffectiveIcon = Icon || currentStyles.defaultIcon;
    const effectiveConfirmText = confirmText || currentStyles.defaultConfirmText;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
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

                <div className={`bg-gradient-to-br ${currentStyles.bg} px-10 pb-8 pt-12`}>
                    <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-2 ${currentStyles.iconContainer} shadow-sm animate-in slide-in-from-top-4 duration-500`}>
                        <EffectiveIcon className={`h-10 w-10 ${currentStyles.icon}`} strokeWidth={2.25} />
                    </div>
                    <h2 className="text-center text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                        {title}
                    </h2>
                    <div className="text-center text-sm font-semibold leading-relaxed text-gray-600 dark:text-slate-400">
                        {description}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 p-8 sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className={`inline-flex w-full items-center justify-center gap-2.5 rounded-2xl ${currentStyles.button} px-8 py-4 text-sm font-black text-white shadow-lg transition-all disabled:opacity-70 sm:w-auto active:scale-95 group`}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing…
                            </>
                        ) : (
                            <>
                                {variant === 'danger' && <Trash2 className="h-4 w-4 group-hover:-rotate-12 transition-transform" />}
                                {effectiveConfirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
