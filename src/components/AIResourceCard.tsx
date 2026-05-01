import { memo } from 'react';
import { Check, FileText, File as FileIcon, Clock, HardDrive } from 'lucide-react';
import { PDFThumbnail } from './PDFThumbnail';
import { clsx } from 'clsx';

export interface AiFileDto {
    id: string;
    fileName: string;
    fileUrl: string;
    contentType: string;
    fileSize: number;
    createdAt?: string;
}

interface AIResourceCardProps {
    file: AiFileDto;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export const AIResourceCard = memo(function AIResourceCard({ file, isSelected, onToggle }: AIResourceCardProps) {
    const isPDF = file.contentType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
    
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (date?: string) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div
            onClick={() => onToggle(file.id)}
            className={clsx(
                "group relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col",
                isSelected 
                    ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5 translate-y-[-2px]" 
                    : "border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600 hover:shadow-md"
            )}
        >
            {/* Selection Badge */}
            <div className={clsx(
                "absolute top-3 right-3 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                isSelected ? "bg-blue-500 text-white scale-100" : "bg-gray-200/50 dark:bg-slate-700/50 text-transparent scale-0"
            )}>
                <Check className="w-4 h-4 stroke-[3]" />
            </div>

            {/* Preview Section */}
            <div className="aspect-[4/3] w-full bg-gray-50 dark:bg-slate-900/50 relative overflow-hidden">
                {isPDF ? (
                    <PDFThumbnail url={file.fileUrl} className="w-full h-full" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transform group-hover:scale-110 transition-transform duration-500">
                            <FileIcon className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                )}
                
                {/* File Type Overlay (Matches Screenshot) */}
                <div className="absolute bottom-2 left-2 z-20">
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight text-gray-700 dark:text-gray-300">
                        {file.contentType.split('/')[1] || (isPDF ? 'PDF' : 'FILE')}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 leading-tight tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {file.fileName}
                </h4>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        <HardDrive className="w-3 h-3" />
                        {formatSize(file.fileSize)}
                    </div>
                    {file.createdAt && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                <Clock className="w-3 h-3" />
                                {formatDate(file.createdAt)}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Glow Effect on Hover */}
            <div className={clsx(
                "absolute inset-0 pointer-events-none transition-opacity duration-500",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-10"
            )}>
                <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected && prevProps.file.id === nextProps.file.id;
});
