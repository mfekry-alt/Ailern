/**
 * File Viewer Switch - Renders appropriate viewer based on content type
 * - Video: PlyrVideoPlayer (unchanged)
 * - PDF & Word: DocumentViewer using PDF.js
 */
import { useState, useEffect } from 'react';
import { File, Loader2 } from 'lucide-react';
import PlyrVideoPlayer from './PlyrVideoPlayer';
import DocumentViewer from './DocumentViewer';

interface FileViewerSwitchProps {
    fileUrl: string;
    fileName: string;
    contentType: string;
    onDownload?: () => void;
    /** Callback for video progress updates (current time in seconds, immediate flag) */
    onVideoProgress?: (currentTime: number, immediate?: boolean) => void;
    /** Callback for document page changes (current page, total pages) */
    onDocumentPageChange?: (currentPage: number, totalPages: number) => void;
    /** Initial video playback position in seconds */
    initialVideoTime?: number;
    /** Initial document page to display (1-indexed) */
    initialDocumentPage?: number;
}

type ViewerType = 'video' | 'document' | 'unknown';


// Unknown File Viewer - Shows download option
const UnknownFileViewer = ({ fileName, onDownload }: { fileName: string; onDownload?: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-2xl p-8">
        <div className="w-20 h-20 bg-gray-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <File className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{fileName}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
            This file type cannot be previewed directly. Please download the file to view it.
        </p>
        {onDownload && (
            <button
                onClick={onDownload}
                className="flex items-center gap-2 px-6 py-3 bg-[#21A9FF] hover:bg-[#1a8fd4] 
                         text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#21A9FF]/20"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
            </button>
        )}
    </div>
);

export const FileViewerSwitch = ({
    fileUrl,
    fileName,
    contentType,
    onDownload,
    onVideoProgress,
    onDocumentPageChange,
    initialVideoTime,
    initialDocumentPage,
}: FileViewerSwitchProps) => {
    const [viewerType, setViewerType] = useState<ViewerType>('unknown');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const detectType = (): ViewerType => {
            const type = contentType.toLowerCase();
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            
            // Video files - use existing PlyrVideoPlayer (unchanged)
            if (type.includes('video') || ext.match(/mp4|webm|ogg|mov/)) return 'video';
            
            // PDF and Word documents - use DocumentViewer with PDF.js
            if (type.includes('pdf') || ext === 'pdf' || 
                type.includes('word') || ext.match(/doc|docx/)) return 'document';
            
            return 'unknown';
        };

        setViewerType(detectType());
        setLoading(false);
    }, [contentType, fileName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-2xl">
                <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin" />
            </div>
        );
    }

    switch (viewerType) {
        case 'video':
            return (
                <PlyrVideoPlayer
                    src={fileUrl}
                    title={fileName}
                    onDownload={onDownload}
                    onProgress={onVideoProgress}
                    initialTime={initialVideoTime}
                />
            );

        case 'document':
            return (
                <DocumentViewer
                    fileUrl={fileUrl}
                    fileName={fileName}
                    contentType={contentType}
                    onDownload={onDownload}
                    onPageChange={onDocumentPageChange}
                    initialPage={initialDocumentPage}
                />
            );

        default:
            return <UnknownFileViewer fileName={fileName} onDownload={onDownload} />;
    }
};

export default FileViewerSwitch;
