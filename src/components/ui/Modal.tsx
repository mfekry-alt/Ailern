import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    compact?: boolean;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
};

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = '2xl', compact = false }: ModalProps) => {
    useLockBodyScroll(isOpen);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0 ${
                            compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
                        }`}>
                            <div>
                                <h2 className={`font-black text-slate-900 dark:text-white tracking-tight leading-none ${
                                    compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                                }`}>{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`flex items-center justify-center rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-90 ${
                                    compact ? 'w-10 h-10' : 'w-12 h-12'
                                }`}
                            >
                                <X className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={`flex-1 overflow-y-auto custom-scrollbar overscroll-contain ${
                            compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
                        }`}>
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className={`border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 ${
                                compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
                            }`}>
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
