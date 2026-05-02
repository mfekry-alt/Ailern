import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
    Upload,
    FileText,
    File as FileIcon,
    X,
    Trash2,
    Eye,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Loader2,
    FilePieChart,
    Plus,
    FileBadge,
    Database,
    Search,
    BrainCircuit,
    RotateCcw,
    AlertTriangle,
} from 'lucide-react';
import { PDFThumbnail } from '@/components/PDFThumbnail';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
    aiResourcesService,
    parseAiResourceUploadStatus,
    type AiResourceUploadStatus,
} from '@/api/services/ai-resources.service';
import { handleApiError } from '@/api/client';
import { parseAiResourceStatus, type AiResourceLiveStatus } from '@/api/signalr/aiResourcesHub';
import { useAiResourcesHub } from '@/hooks/useAiResourcesHub';

// --- Interfaces ---

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
    course: any;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    url?: string;
    /** From API `UploadStatus`; defaults to Completed when omitted (legacy APIs). */
    uploadStatus: AiResourceUploadStatus;
    /** From API `AIStatus` and/or SignalR hub `StatusUpdated` */
    aiProcessingStatus?: AiResourceLiveStatus;
}

// --- Helpers ---

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileIcon className="w-8 h-8 text-blue-500" />;
    if (['ppt', 'pptx'].includes(ext || '')) return <FileBadge className="w-8 h-8 text-orange-500" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
};

type LiveStatusPresentation = { badge: string; message: string; badgeClass: string };

const STATUS_PRESENTATION: Record<AiResourceLiveStatus, LiveStatusPresentation> = {
    Pending: {
        badge: 'Queued',
        message: 'Waiting in queue…',
        badgeClass:
            'border border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100',
    },
    Processing: {
        badge: 'Processing',
        message: 'Analyzing content…',
        badgeClass:
            'border border-violet-200 bg-violet-100 text-violet-950 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-100',
    },
    Completed: {
        badge: 'Ready',
        message: 'Ready to use',
        badgeClass:
            'border border-emerald-200 bg-emerald-100 text-emerald-950 dark:border-emerald-800/55 dark:bg-emerald-950/40 dark:text-emerald-100',
    },
    Failed: {
        badge: 'Failed',
        message: 'Processing failed — retry',
        badgeClass:
            'border border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100',
    },
};

const UNKNOWN_STATUS_PRESENTATION: LiveStatusPresentation = {
    badge: 'Unknown',
    message: 'Status will appear shortly after upload.',
    badgeClass:
        'border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
};

const UPLOAD_STATUS_PRESENTATION: Record<
    AiResourceUploadStatus,
    {
        badge: string;
        /** Shown under badges when upload finished (muted); AI copy follows when applicable */
        detail?: string;
        /** When upload not complete */
        message: string;
        badgeClass: string;
    }
> = {
    Completed: {
        badge: 'Uploaded',
        detail: 'Saved to your course — ready for AI processing.',
        message: '',
        badgeClass:
            'gap-1 border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800/55 dark:bg-emerald-950/40 dark:text-emerald-50',
    },
    Pending: {
        badge: 'Upload in progress',
        message:
            'Your file is still transferring or waiting to be confirmed. Keep this tab open until it finishes.',
        badgeClass:
            'gap-1 border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-50',
    },
    Failed: {
        badge: 'Upload failed',
        message:
            'The file never reached storage (network error, rejected transfer, or confirmation failed). Remove this entry and try again.',
        badgeClass:
            'gap-1 border border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-50',
    },
};

function MaterialsOverviewStats({ files }: { files: UploadedFile[] }) {
    const uploadedCount = files.filter((f) => f.uploadStatus === 'Completed').length;
    const readyCount = files.filter(
        (f) => f.uploadStatus === 'Completed' && f.aiProcessingStatus === 'Completed'
    ).length;
    const uploadPendingCount = files.filter((f) => f.uploadStatus === 'Pending').length;
    const uploadFailedCount = files.filter((f) => f.uploadStatus === 'Failed').length;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
                <div className="flex items-baseline gap-1.5">
                    <dt className="text-slate-500 dark:text-slate-400">Materials</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{files.length}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <dt className="text-slate-500 dark:text-slate-400">Uploaded</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{uploadedCount}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <dt className="text-slate-500 dark:text-slate-400">AI ready</dt>
                    <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{readyCount}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <dt className="text-slate-500 dark:text-slate-400">Storage</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatFileSize(totalBytes)}
                    </dd>
                </div>
            </dl>
            {(uploadPendingCount > 0 || uploadFailedCount > 0) && (
                <p className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                    {uploadPendingCount > 0 && (
                        <span className="mr-3">
                            <span className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                {uploadPendingCount}
                            </span>{' '}
                            {uploadPendingCount === 1 ? 'file still uploading' : 'files still uploading'}
                        </span>
                    )}
                    {uploadFailedCount > 0 && (
                        <span>
                            <span className="font-semibold text-red-700 dark:text-red-400 tabular-nums">
                                {uploadFailedCount}
                            </span>{' '}
                            {uploadFailedCount === 1 ? 'upload failed' : 'uploads failed'}
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}

/** Compact upload + AI chips for file cards (no second full-height status list) */
function FileIngestStatusChips({
    file,
    onRetryFailed,
}: {
    file: UploadedFile;
    onRetryFailed: (file: UploadedFile) => void | Promise<void>;
}) {
    const upload = file.uploadStatus;
    const uploadPres = UPLOAD_STATUS_PRESENTATION[upload];
    const aiStatus = file.aiProcessingStatus;
    const aiPres: LiveStatusPresentation =
        aiStatus != null ? STATUS_PRESENTATION[aiStatus] : UNKNOWN_STATUS_PRESENTATION;

    const uploadComplete = upload === 'Completed';
    const uploadFailed = upload === 'Failed';
    const uploadPending = upload === 'Pending';
    const aiProcessing = uploadComplete && aiStatus === 'Processing';
    const needsRetry = uploadFailed || (uploadComplete && aiStatus === 'Failed');

    let hint = '';
    if (uploadPending || uploadFailed) hint = uploadPres.message;
    else if (uploadComplete) hint = aiPres.message;

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1">
                {aiProcessing && (
                    <Loader2
                        className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-600 dark:text-violet-400"
                        aria-hidden
                    />
                )}
                <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-tight ${uploadPres.badgeClass}`}
                >
                    {uploadComplete && <CheckCircle2 className="mr-0.5 h-3 w-3 shrink-0 opacity-90" aria-hidden />}
                    {uploadPending && (
                        <Loader2
                            className="mr-0.5 h-3 w-3 shrink-0 animate-spin text-amber-700 dark:text-amber-300"
                            aria-hidden
                        />
                    )}
                    {uploadFailed && <AlertCircle className="mr-0.5 h-3 w-3 shrink-0" aria-hidden />}
                    {uploadPres.badge}
                </span>
                {uploadComplete && (
                    <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${aiPres.badgeClass}`}
                    >
                        {aiPres.badge}
                    </span>
                )}
                {needsRetry && (
                    <button
                        type="button"
                        onClick={() => void onRetryFailed(file)}
                        className="inline-flex items-center gap-0.5 rounded-md border border-red-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-red-800 hover:bg-red-50 dark:border-red-900/55 dark:bg-slate-950 dark:text-red-200 dark:hover:bg-red-950/35"
                    >
                        <RotateCcw className="h-3 w-3 shrink-0" aria-hidden />
                        Retry
                    </button>
                )}
            </div>
            {hint ? (
                <p className="line-clamp-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400" title={hint}>
                    {hint}
                </p>
            ) : null}
            {aiProcessing && (
                <div className="relative h-0.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950/80">
                    <div className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-violet-600 dark:bg-violet-400 motion-safe:animate-ai-progress-slide" />
                </div>
            )}
        </div>
    );
}

export const CourseAIAssistantTab = () => {
    const { courseId } = useOutletContext<CourseContext>();

    // --- State ---
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [failedUploads, setFailedUploads] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = useCallback(async () => {
        if (!courseId) return;
        try {
            const response = await aiResourcesService.getAiResources(courseId);
            if (response.success && response.data) {
                setUploadedFiles((prev) => {
                    const prevById = new Map(
                        prev.map((f) => [
                            f.id,
                            { ai: f.aiProcessingStatus, upload: f.uploadStatus },
                        ])
                    );
                    return response.data!.map((item: any) => {
                        const id = String(item.id ?? item.Id ?? item.fileId ?? '');
                        const prevSnap = prevById.get(id);
                        const uploadStatus =
                            parseAiResourceUploadStatus(item.uploadStatus ?? item.UploadStatus) ??
                            prevSnap?.upload ??
                            'Completed';
                        const fromApi = parseAiResourceStatus(
                            item.aiStatus ?? item.AIStatus ?? item.aiProcessingStatus ?? item.processingStatus
                        );
                        const sizeRaw = item.fileSize ?? item.FileSize ?? item.size ?? 0;
                        const size =
                            typeof sizeRaw === 'number' ? sizeRaw : Number.parseFloat(String(sizeRaw)) || 0;
                        return {
                            id,
                            name: item.fileName ?? item.FileName ?? item.name ?? 'Unnamed File',
                            size,
                            type:
                                item.contentType ??
                                item.ContentType ??
                                item.type ??
                                'application/octet-stream',
                            uploadDate: item.createdAt ?? item.uploadDate ?? new Date().toISOString(),
                            url: item.fileUrl ?? item.FileUrl ?? item.url,
                            uploadStatus,
                            aiProcessingStatus: fromApi ?? prevSnap?.ai,
                        };
                    });
                });
            }
        } catch (error) {
            console.error('Failed to fetch AI resources:', error);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    const hubEnabled = uploadedFiles.length > 0;

    useAiResourcesHub(
        useCallback((fileId, status) => {
            setUploadedFiles((prev) => {
                const next = prev.map((f) =>
                    f.id === fileId ? { ...f, aiProcessingStatus: status } : f
                );
                if (status === 'Completed' && prev.some((f) => f.id === fileId)) {
                    toast.success('AI processing finished', {
                        description: 'A material is ready for the assistant.',
                    });
                }
                if (status === 'Failed' && prev.some((f) => f.id === fileId)) {
                    toast.error('AI processing failed', {
                        description: 'Check the file format or try uploading again.',
                    });
                }
                return next;
            });
        }, []),
        hubEnabled
    );

    // --- Effects ---
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // --- Handlers ---

    const validateFile = (file: File) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'text/plain'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.ppt') && !file.name.endsWith('.pptx')) {
            return 'Unsupported file type. Please upload PDF, DOCX, or PPT.';
        }
        if (file.size > maxSize) {
            return 'File too large. Maximum size is 10MB.';
        }
        return null;
    };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileList = Array.from(files);
        const validFiles: File[] = [];
        const newUploadingEntries: UploadingFile[] = [];

        fileList.forEach(file => {
            const error = validateFile(file);
            if (error) {
                toast.error(error, { description: file.name });
                return;
            }
            validFiles.push(file);

            const uploadId = Math.random().toString(36).substring(7);
            newUploadingEntries.push({
                id: uploadId,
                file,
                progress: 0,
                status: 'uploading'
            });
        });

        if (validFiles.length === 0) return;

        setUploadingFiles(prev => [...prev, ...newUploadingEntries]);

        try {
            // 1. Generate Upload URLs
            const response = await aiResourcesService.generateUploadUrls(courseId, {
                Files: validFiles.map(f => ({
                    FileName: f.name,
                    FileSize: f.size,
                    ContentType: f.type || 'application/octet-stream'
                }))
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to generate upload URLs');
            }

            const presignedData = response.data;
            const successFileIds: string[] = [];
            const failedFileNames: string[] = [];
            const allFileIds: string[] = [];

            // 2. Upload Files to S3 in parallel using Promise.allSettled
            const uploadPromises = validFiles.map(async (file, index) => {
                const entry = newUploadingEntries[index];
                const { presignedUrl, fileId } = presignedData[index];
                const contentType = file.type || 'application/octet-stream';

                allFileIds.push(fileId);

                try {
                    await aiResourcesService.uploadToS3(presignedUrl, file, contentType, (progress) => {
                        setUploadingFiles(prev => prev.map(f =>
                            f.id === entry.id ? { ...f, progress } : f
                        ));
                    });

                    setUploadingFiles(prev => prev.map(f =>
                        f.id === entry.id ? { ...f, status: 'completed', id: fileId } : f
                    ));
                    successFileIds.push(fileId);
                } catch (error) {
                    setUploadingFiles(prev => prev.map(f =>
                        f.id === entry.id ? { ...f, status: 'error', error: 'Upload failed' } : f
                    ));
                    failedFileNames.push(file.name);
                }
            });

            await Promise.allSettled(uploadPromises);

            // 3. Auto-confirm uploads
            // We always call the confirm endpoint so the backend can finalize or clean up,
            // but we ONLY pass the IDs of the files that successfully uploaded.
            if (allFileIds.length > 0) {
                try {
                    await aiResourcesService.confirmUploads(courseId, successFileIds);
                    if (successFileIds.length > 0) {
                        toast.success(`${successFileIds.length} file(s) uploaded successfully`, {
                            description:
                                'Files are saved. AI ingestion runs in the background—you will see live status updates.',
                        });
                    }
                    await fetchFiles();
                    setUploadedFiles((prev) =>
                        prev.map((f) =>
                            successFileIds.includes(f.id)
                                ? {
                                      ...f,
                                      uploadStatus: 'Completed',
                                      aiProcessingStatus: f.aiProcessingStatus ?? 'Pending',
                                  }
                                : f
                        )
                    );
                    setUploadingFiles(prev => prev.filter(f => f.status === 'error'));
                } catch (confirmError) {
                    const apiError = handleApiError(confirmError);
                    toast.error('Confirmation failed', { description: apiError.message });
                }
            }

            // 4. Show failed files
            if (failedFileNames.length > 0) {
                setFailedUploads(failedFileNames);
            }

        } catch (error) {
            const apiError = handleApiError(error);
            toast.error('Upload Process Failed', { description: apiError.message });
            setUploadingFiles(prev => prev.map(f =>
                newUploadingEntries.some(ne => ne.id === f.id) ? { ...f, status: 'error' } : f
            ));
        }
    }, [courseId, fetchFiles]);

    const retryUpload = async (failedFile: UploadingFile) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== failedFile.id));
        handleFiles([failedFile.file]);
    };

    const cancelUpload = (id: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== id));
        toast.info('Upload cancelled');
    };

    const deleteFile = async (id: string, name: string) => {
        try {
            await aiResourcesService.deleteResource(courseId, id);
            setUploadedFiles(prev => prev.filter(f => f.id !== id));
            toast.success('File deleted', { description: name });
        } catch (error) {
            const apiError = handleApiError(error);
            toast.error('Failed to delete file', { description: apiError.message });
        }
    };

    /** Remove failed ingestion record so the instructor can upload again (no backend retry endpoint). */
    const retryFailedAiResource = useCallback(
        async (file: UploadedFile) => {
            try {
                await aiResourcesService.deleteResource(courseId, file.id);
                setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
                toast.message('Removed failed material', {
                    description: 'Upload the same file again from the upload area.',
                });
                fileInputRef.current?.click();
            } catch (error) {
                const apiError = handleApiError(error);
                toast.error('Could not remove file', { description: apiError.message });
            }
        },
        [courseId]
    );

    // --- Drag and Drop Logic ---

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const filteredFiles = uploadedFiles.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mx-auto max-w-7xl space-y-5 px-1 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:px-0">

            {/* Compact header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <Sparkles className="h-3 w-3" />
                    AI Powered
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white xl:text-3xl">
                        AI Exam{' '}
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            Assistant
                        </span>
                    </h1>
                </div>
                <p className="max-w-3xl text-sm leading-snug text-slate-500 dark:text-slate-400">
                    Manage course materials here—uploads stay compact on the side while your library stays front and center.
                    SignalR updates each card live.
                </p>
            </header>

            {/* Toolbar: overview + search + quick add */}
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/90 bg-gradient-to-r from-white via-indigo-50/50 to-violet-50/60 p-3 dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/40 dark:to-violet-950/30 md:flex-row md:items-center md:gap-4 md:p-4">
                {hubEnabled ? (
                    <MaterialsOverviewStats files={uploadedFiles} />
                ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Add files to see counts and AI readiness at a glance.
                    </p>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search materials…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-transparent bg-white/80 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800/90 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-violet-600"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition hover:opacity-95 active:scale-[0.98]"
                    >
                        <Plus className="h-4 w-4" aria-hidden />
                        Add files
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
                {/* Materials — first so instructors see files without scrolling */}
                <section className="order-1 min-h-0 space-y-4 xl:col-span-8">
                    {uploadedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
                            <Database className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">No materials yet</h3>
                            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                Upload PDFs, Word docs, or slides using Add files or the panel on the right.
                            </p>
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-black text-white hover:bg-indigo-700"
                            >
                                <Upload className="mr-2 inline h-4 w-4" />
                                Upload materials
                            </Button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-center dark:border-slate-800 dark:bg-slate-900/60">
                            <Search className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
                            <p className="font-semibold text-slate-600 dark:text-slate-300">No match for &quot;{searchQuery}&quot;</p>
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="mt-3 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="grid max-h-none grid-cols-1 gap-3 sm:grid-cols-2 xl:max-h-[min(70vh,calc(100vh-12rem))] xl:grid-cols-3 xl:overflow-y-auto xl:pr-1 xl:[scrollbar-gutter:stable]">
                            {filteredFiles.map((file, idx) => {
                                const aiActive =
                                    file.uploadStatus === 'Completed' &&
                                    file.aiProcessingStatus === 'Processing';
                                return (
                                    <div
                                        key={file.id}
                                        className={`relative flex flex-col rounded-2xl border bg-white p-3 transition-colors dark:bg-slate-900/70 ${
                                            aiActive
                                                ? 'motion-safe:animate-ai-processing-ring border-violet-300 dark:border-violet-600/60'
                                                : 'border-slate-200 hover:border-indigo-300/70 dark:border-slate-800 dark:hover:border-indigo-500/35'
                                        } animate-in zoom-in-95`}
                                        style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                                    >
                                        <div className="relative mb-3 h-32 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.15] dark:opacity-20">
                                                {getFileIcon(file.name)}
                                            </div>
                                            <div className="absolute inset-0 p-2">
                                                <div className="h-full w-full overflow-hidden rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                                                    {file.url && file.name.toLowerCase().endsWith('.pdf') ? (
                                                        <PDFThumbnail url={file.url} className="h-full w-full" />
                                                    ) : (
                                                        <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
                                                            <div className="rounded-lg bg-indigo-50/80 p-4 dark:bg-indigo-500/10">
                                                                {getFileIcon(file.name)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute right-2 top-2 z-10 flex gap-1">
                                                <button
                                                    type="button"
                                                    title="Preview"
                                                    aria-label="Preview file"
                                                    disabled={!file.url}
                                                    onClick={() => file.url && window.open(file.url, '_blank')}
                                                    className="rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-600 shadow-sm hover:bg-white hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-300 dark:hover:text-indigo-400"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    aria-label="Delete material"
                                                    onClick={() => deleteFile(file.id, file.name)}
                                                    className="rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800/95 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h3
                                            className="line-clamp-2 text-sm font-bold leading-tight text-slate-900 dark:text-white"
                                            title={file.name}
                                        >
                                            {file.name}
                                        </h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                            <span className="flex items-center gap-1 normal-case">
                                                <FilePieChart className="h-3 w-3" />
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                        <FileIngestStatusChips file={file} onRetryFailed={retryFailedAiResource} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Compact upload sidebar */}
                <aside className="order-2 space-y-4 xl:sticky xl:top-4 xl:col-span-4">
                    <Card className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50">
                        <CardContent className="p-0">
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className={`flex min-h-[13rem] cursor-pointer flex-col items-center justify-center gap-5 px-6 py-10 text-center transition-colors sm:min-h-[15rem] sm:py-12 ${
                                    isDragging ? 'bg-indigo-50/90 dark:bg-indigo-500/15' : ''
                                }`}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div
                                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform sm:h-[4.5rem] sm:w-[4.5rem] ${
                                        isDragging
                                            ? 'scale-105 bg-indigo-600 text-white shadow-indigo-500/25'
                                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-200'
                                    }`}
                                >
                                    <Upload className={`h-8 w-8 sm:h-9 sm:w-9 ${isDragging ? 'animate-bounce' : ''}`} />
                                </div>
                                <div className="max-w-[17rem] space-y-2">
                                    <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                                        Upload materials
                                    </p>
                                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Drag and drop files here, or click to browse.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                                        {['PDF', 'DOCX', 'PPT'].map((type) => (
                                            <span
                                                key={type}
                                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Max 10MB per file
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {uploadingFiles.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Uploading ({uploadingFiles.length})
                                </h3>
                                {uploadingFiles.some((f) => f.status === 'uploading') && (
                                    <span className="text-[10px] font-bold uppercase text-indigo-500">Active</span>
                                )}
                            </div>
                            <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                    style={{
                                        width: `${uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length}%`,
                                    }}
                                />
                            </div>
                            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {uploadingFiles.map((file) => (
                                    <li
                                        key={file.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <div
                                                    className={`shrink-0 rounded-lg p-1.5 ${
                                                        file.status === 'completed'
                                                            ? 'bg-emerald-100 dark:bg-emerald-500/15'
                                                            : file.status === 'error'
                                                              ? 'bg-red-100 dark:bg-red-500/15'
                                                              : 'bg-indigo-100 dark:bg-indigo-500/15'
                                                    }`}
                                                >
                                                    {file.status === 'completed' ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                    ) : file.status === 'error' ? (
                                                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                                    ) : (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {file.file.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {formatFileSize(file.file.size)} · {file.progress}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-0.5">
                                                {file.status === 'error' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => retryUpload(file)}
                                                        className="rounded-md p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                                        title="Retry"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => cancelUpload(file.id)}
                                                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                    title="Cancel"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div
                                                className={`h-full rounded-full ${
                                                    file.status === 'completed'
                                                        ? 'bg-emerald-500'
                                                        : file.status === 'error'
                                                          ? 'bg-red-500'
                                                          : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            {/* AI Assistant Context Footer */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/25 md:p-8">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                        <BrainCircuit className="w-12 h-12 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h3 className="text-xl font-black md:text-2xl">Ready to generate?</h3>
                        <p className="text-indigo-100 font-medium">
                            Once your materials are uploaded, you can head to the Quizzes or Assignments tab to start generating smart assessments powered by this data.
                        </p>
                    </div>
                    <Link
                        to={`/instructor/courses/${courseId}/manage/quizzes`}
                        className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl shadow-black/10 hover:shadow-white/20 transition-all hover:-translate-y-1 active:scale-95 text-center"
                    >
                        Go to Quizzes
                    </Link>
                </div>
            </div>

            {/* Failed Uploads Modal */}
            {failedUploads.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">Upload Failed</h3>
                            <p className="text-sm font-medium text-rose-500 dark:text-rose-400/80">
                                {failedUploads.length} file{failedUploads.length > 1 ? 's' : ''} could not be uploaded.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <ul className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {failedUploads.map((name, i) => (
                                    <li key={i} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                        <span className="truncate" title={name}>{name}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => setFailedUploads([])}
                                className="w-full py-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-black transition-all"
                            >
                                OK, I understand
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
