import { useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { SubmissionSuccessMessage } from './SubmissionSuccessMessage';

interface SubmitAssignmentModalProps {
    open: boolean;
    onClose: () => void;
    assignmentTitle: string;
    onSubmit: (files: File[]) => Promise<void>;
    isPending: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const SubmitAssignmentModal = ({
    open,
    onClose,
    assignmentTitle,
    onSubmit,
    isPending,
}: SubmitAssignmentModalProps) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFilesChange = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;
            setError('');
            const newFiles = Array.from(fileList);
            setSelectedFiles((prev) => [...prev, ...newFiles]);
        },
        []
    );

    const removeFile = useCallback((index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setError('');
    }, []);

    // Auto-close after success delay (no animation)
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess(false);
            setSelectedFiles([]);
            onClose();
        }, 2500); // 2.5 seconds delay

        return () => clearTimeout(timer);
    }, [success, onClose]);

    const handleManualClose = useCallback(() => {
        setSuccess(false);
        setSelectedFiles([]);
        onClose();
    }, [onClose]);

    // Implement scroll locking when the modal is open
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

    const handleSubmit = useCallback(async () => {
        if (selectedFiles.length === 0) {
            setError('Please attach at least one file.');
            return;
        }
        setError('');
        try {
            await onSubmit(selectedFiles);
            setSuccess(true);
        } catch (err: any) {
            setError(err?.message || 'Failed to submit. Please try again.');
        }
    }, [selectedFiles, onSubmit]);

    const handleClose = useCallback(() => {
        if (isPending) return;
        setSelectedFiles([]);
        setError('');
        setSuccess(false);
        onClose();
    }, [isPending, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="p-6 sm:p-8 shrink-0 relative">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Submit Assignment
                            </h3>
                            <button className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 hover:underline">
                                Why ?
                            </button>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isPending}
                            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all hover:bg-gray-100 disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="px-6 sm:px-8 py-2 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {success ? (
                        <SubmissionSuccessMessage
                            onClose={handleManualClose}
                        />
                    ) : (
                        <div className="space-y-8 py-2">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                    Upload Files
                                </label>
                                <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] p-10 hover:border-[#21A9FF] dark:hover:border-[#21A9FF] hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all group cursor-pointer text-center bg-gray-50/50 dark:bg-slate-900/30">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFilesChange(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isPending}
                                    />
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 text-[#21A9FF] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm border border-gray-100 dark:border-slate-700">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                        Click or drag files here
                                    </p>
                                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                                        Any file type • Max 10MB per file
                                    </p>
                                </div>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center justify-between">
                                        Attached Files
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">
                                            {selectedFiles.length}
                                        </span>
                                    </label>
                                    <div className="space-y-3">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-[1.5rem] border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center shadow-inner shrink-0 text-[#21A9FF] border border-gray-100/50 dark:border-slate-800">
                                                        <FileText className="w-7 h-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[15px] font-black text-slate-800 dark:text-white truncate">
                                                            {file.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                                            <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-wider rounded-lg">
                                                                New Attached
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    disabled={isPending}
                                                    className="ml-4 w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!success && (
                    <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-4 justify-end shrink-0">
                        <button
                            onClick={handleClose}
                            disabled={isPending}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || selectedFiles.length === 0}
                            className="w-full sm:w-auto px-10 py-3.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest flex items-center justify-center gap-2 group active:scale-95"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                            )}
                            {isPending ? 'Uploading...' : 'Submit Assignment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
