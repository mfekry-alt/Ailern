import { memo } from 'react';

import { useNavigate } from 'react-router-dom';

import { FileText, Download, Eye, Film, Image, Archive, File } from 'lucide-react';

import type { SectionFileDto } from '../types';



interface FileItemProps {

    file: SectionFileDto;

    courseId: string;

    disabled?: boolean;

}



const formatFileSize = (bytes: number): string => {

    if (bytes === 0) return '0 B';

    if (bytes < 1024) return bytes + ' B';

    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';

    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';

};



const getFileIcon = (contentType: string) => {

    if (contentType.includes('video')) return Film;

    if (contentType.includes('image')) return Image;

    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('archive'))

        return Archive;

    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text'))

        return FileText;

    return File;

};



export const FileItem = memo(({ file, courseId, disabled }: FileItemProps) => {

    const navigate = useNavigate();

    const isVideo = file.contentType.includes('video');

    const Icon = getFileIcon(file.contentType);



    const handleView = () => {

        if (disabled) return;

        if (isVideo) {

            navigate(

                `/courses/${courseId}/video/${file.id}?url=${encodeURIComponent(file.fileUrl)}`

            );

        } else {

            window.open(file.fileUrl, '_blank', 'noopener,noreferrer');

        }

    };



    const handleDownload = () => {

        if (disabled || isVideo) return;

        const link = document.createElement('a');

        link.href = file.fileUrl;

        link.download = file.fileName;

        link.target = '_blank';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

    };



    return (

        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600 transition-all group">

            <div className="flex items-center gap-3 flex-1 min-w-0">

                <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 text-blue-500 dark:text-blue-400">

                    <Icon className="w-4.5 h-4.5" />

                </div>

                <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">

                        {file.fileName}

                    </p>

                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">

                        {formatFileSize(file.fileSize)}

                    </p>

                </div>

            </div>



            <div className="flex items-center gap-2 shrink-0 ml-3">

                <button

                    onClick={handleView}

                    disabled={disabled}

                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                >

                    <Eye className="w-3.5 h-3.5" />

                    View

                </button>



                {!isVideo && (

                    <button

                        onClick={handleDownload}

                        disabled={disabled}

                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                    >

                        <Download className="w-3.5 h-3.5" />

                        Download

                    </button>

                )}

            </div>

        </div>

    );

});



FileItem.displayName = 'FileItem';

