/**
 * ReportContentModal
 * 
 * A modern modal dialog for students to report inappropriate course materials.
 * Integrates with the backend POST /api/Sections/{id}/material/{materialId}/reports API.
 * Features animated open/close, dropdown, loading states, and accessibility.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, ChevronDown, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useReportMaterial } from '@/hooks/useContentReports';
import { ALL_REPORT_TYPES, REPORT_TYPE_LABELS, type ReportType } from '@/types/api.types';

interface ReportContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    materialName?: string;
    sectionId: string;
    materialId: string;
}

export const ReportContentModal = ({
    isOpen,
    onClose,
    materialName,
    sectionId,
    materialId,
}: ReportContentModalProps) => {
    const [reason, setReason] = useState<ReportType | ''>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const reportMutation = useReportMaterial();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setReason('');
            setIsDropdownOpen(false);
            setHasAttemptedSubmit(false);
            reportMutation.reset();
        }
    }, [isOpen]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !reportMutation.isPending) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, reportMutation.isPending, onClose]);

    const handleSubmit = async () => {
        setHasAttemptedSubmit(true);
        if (reason === '') return;
        if (!sectionId || !materialId) {
            toast.error('Unable to submit report: Missing section or material ID.');
            return;
        }

        reportMutation.mutate(
            {
                sectionId,
                materialId,
                data: {
                    reportType: reason,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Your report has been submitted and will be reviewed by an administrator.');
                    onClose();
                },
                onError: (error: any) => {
                    let message = error?.response?.data?.message || error?.message || 'Failed to submit report. Please try again.';
                    if (message.includes('has already been submitted')) {
                        message = 'You have already reported this material.';
                    }
                    toast.error(message);
                },
            }
        );
    };

    const isReasonInvalid = hasAttemptedSubmit && reason === '';
    const isSubmitting = reportMutation.isPending;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => !isSubmitting && onClose()}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h2 id="report-modal-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Report Content
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => !isSubmitting && onClose()}
                                disabled={isSubmitting}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar overscroll-contain space-y-5">
                            {/* Description */}
                            <div className="flex items-start gap-3 p-4 bg-amber-50/70 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl">
                                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                                    Help us keep AiLern safe by reporting content that violates our guidelines.
                                </p>
                            </div>

                            {/* Material Info */}
                            {materialName && (
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Reporting Material
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {materialName}
                                    </p>
                                </div>
                            )}

                            {/* Reason Dropdown */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Reason for Report <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        disabled={isSubmitting}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all
                                            ${isReasonInvalid
                                                ? 'border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 text-red-900 dark:text-red-300'
                                                : reason !== ''
                                                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                                            }
                                            hover:border-blue-300 dark:hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="listbox"
                                        id="report-reason-select"
                                    >
                                        <span className={reason !== '' ? '' : 'opacity-60'}>
                                            {reason !== '' ? REPORT_TYPE_LABELS[reason] : 'Select a reason...'}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${reason !== '' ? 'text-slate-400' : 'text-slate-300'}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto custom-scrollbar"
                                                role="listbox"
                                                aria-labelledby="report-reason-select"
                                            >
                                                {ALL_REPORT_TYPES.map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={reason === type}
                                                        onClick={() => {
                                                            setReason(type);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors
                                                            ${reason === type
                                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                            }
                                                            first:rounded-t-xl last:rounded-b-xl`}
                                                    >
                                                        {REPORT_TYPE_LABELS[type]}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {isReasonInvalid && (
                                        <p className="mt-2 text-xs font-semibold text-red-500 dark:text-red-400">
                                            Please select a reason for your report.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4" />
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
