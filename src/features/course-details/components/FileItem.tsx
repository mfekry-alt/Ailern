import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Film, Image, Archive, File, ExternalLink } from 'lucide-react';
import type { SectionFileDto } from '../types';
import { FileViewerModal } from './FileViewerModal';

interface FileItemProps {
    file: SectionFileDto;
    courseId?: string;
    disabled?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (contentType: string) => {
    if (contentType.toLowerCase().includes('video')) return Film;
    if (contentType.toLowerCase().includes('image')) return Image;
    if (
        contentType.toLowerCase().includes('zip') ||
        contentType.toLowerCase().includes('rar') ||
        contentType.toLowerCase().includes('archive')
    )
        return Archive;
    if (
        contentType.toLowerCase().includes('pdf') ||
        contentType.toLowerCase().includes('document') ||
        contentType.toLowerCase().includes('text')
    )
        return FileText;
    return File;
};

export const FileItem = memo(({ file, courseId, disabled }: FileItemProps) => {
    const navigate = useNavigate();
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const isVideo = file.contentType.toLowerCase().includes('video');
    const Icon = getFileIcon(file.contentType);

    const handleView = () => {
        if (disabled) return;
        if (isVideo && courseId) {
            navigate(
                `/courses/${courseId}/video/${encodeURIComponent(file.id)}?url=${encodeURIComponent(file.fileUrl)}`
            );
            return;
        }
        setIsViewerOpen(true);
    };

    const handleDownload = () => {
        if (disabled) return;
        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800/60 rounded-[1.25rem] border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:hover:shadow-none transition-all duration-300 gap-4 sm:gap-0">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                            isVideo
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-100 dark:border-amber-500/20 group-hover:bg-amber-100 group-hover:border-amber-200'
                                : 'bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-50 dark:border-indigo-500/20 group-hover:bg-indigo-50 group-hover:border-indigo-100'
                        }`}
                    >
                        <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate tracking-tight">
                                {file.fileName}
                            </p>
                            {isVideo && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                                    Video
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                                {formatFileSize(file.fileSize)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-wider opacity-90">
                                Ready to Learn
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:ml-4 self-end sm:self-auto w-full sm:w-auto">
                    <button
                        onClick={handleView}
                        disabled={disabled}
                        className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-2 text-xs font-black rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group/btn"
                    >
                        {isVideo ? <Film className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isVideo ? 'Watch' : 'View'}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={disabled}
                        className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all duration-300 disabled:opacity-50 active:scale-90"
                        title="Download Material"
                        type="button"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <FileViewerModal file={file} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
        </>
    );
});

FileItem.displayName = 'FileItem';
