import { useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Submit Assignment
                            </h3>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 line-clamp-1">
                                {assignmentTitle}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isPending}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                    {success ? (
                        <SubmissionSuccessMessage
                            onClose={handleManualClose}
                        />
                    ) : (
                        <>
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                                    Upload Files
                                </label>
                                <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group cursor-pointer text-center">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFilesChange(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isPending}
                                    />
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        Click or drag files here
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        Any file type • Max 10MB per file
                                    </p>
                                </div>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-900 dark:text-white flex justify-between">
                                        Attached Files
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">
                                            {selectedFiles.length}
                                        </span>
                                    </label>
                                    <div className="space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 text-blue-500">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    disabled={isPending}
                                                    className="ml-3 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!success && (
                    <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-[2rem] flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
                        <button
                            onClick={handleClose}
                            disabled={isPending}
                            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || selectedFiles.length === 0}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isPending ? 'Uploading...' : 'Submit Assignment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
