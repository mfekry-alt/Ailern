import { useState, useRef, useEffect } from 'react';
import { X, Download, FileText, AlertTriangle, Music } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type { SectionFileDto } from '../types';

type Category = 'pdf' | 'image' | 'video' | 'audio' | 'doc' | 'other';

const getCategory = (contentType: string, fileName: string): Category => {
    const ct = contentType.toLowerCase();
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (ct === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (ct.startsWith('image/')) return 'image';
    if (ct.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (ct.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return 'audio';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(ext) ||
        ct.includes('msword') || ct.includes('spreadsheet') || ct.includes('presentation') ||
        ct.includes('officedocument') || ct === 'text/plain' || ct === 'text/csv') return 'doc';
    return 'other';
};

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMimeForVideo = (contentType: string, fileName: string): string => {
    const ct = contentType.toLowerCase();
    if (ct.startsWith('video/')) return ct;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg',
        mov: 'video/mp4', avi: 'video/mp4', mkv: 'video/webm',
    };
    return map[ext || ''] || 'video/mp4';
};

function VideoPlayer({ src, type, name }: { src: string; type: string; name: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const videoEl = document.createElement('video-js');
        videoEl.classList.add('vjs-big-play-centered', 'vjs-theme-custom');
        containerRef.current.appendChild(videoEl);

        playerRef.current = videojs(videoEl, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            controlBar: {
                volumePanel: { inline: false },
                pictureInPictureToggle: true,
            },
            sources: [{ src, type: getMimeForVideo(type, name) }],
        });

        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [src, type, name]);

    return <div ref={containerRef} className="w-full max-w-5xl" />;
}

function GoogleDocsViewer({ url, name }: { url: string; name: string }) {
    const [iframeError, setIframeError] = useState(false);
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

    if (iframeError) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-5 max-w-md w-full text-center">
                <FileText className="w-12 h-12 text-gray-400" />
                <p className="text-white font-bold text-lg">{name}</p>
                <p className="text-gray-400 text-sm">Could not load preview. Try downloading the file instead.</p>
                <a href={url} download={name} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md">
                    <Download className="w-5 h-5" /> Download File
                </a>
            </div>
        );
    }

    return (
        <iframe
            src={viewerUrl}
            title={name}
            onError={() => setIframeError(true)}
            className="w-full h-full min-h-[60vh] rounded-xl border border-gray-800 bg-white"
        />
    );
}

interface FileViewerModalProps {
    file: SectionFileDto | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FileViewerModal({ file, isOpen, onClose }: FileViewerModalProps) {
    const [videoKey, setVideoKey] = useState(0);

    useEffect(() => {
        if (isOpen && file) {
            setVideoKey((k) => k + 1);
        }
    }, [isOpen, file?.id]);

    if (!isOpen || !file) return null;

    const category = getCategory(file.contentType, file.fileName);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-gray-950 w-full max-w-6xl rounded-[2rem] shadow-2xl border border-gray-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold text-white truncate">{file.fileName}</h1>
                        <p className="text-[11px] text-gray-400 font-medium">
                            {file.contentType.split('/').pop()?.toUpperCase()}
                            {file.fileSize > 0 && ` · ${formatSize(file.fileSize)}`}
                        </p>
                    </div>
                    <a
                        href={file.fileUrl}
                        download={file.fileName}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
                    >
                        <Download className="w-4 h-4" /> Download
                    </a>
                </header>

                {/* Preview area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-gray-950">
                    {category === 'pdf' && (
                        <iframe
                            src={file.fileUrl}
                            title={file.fileName}
                            className="w-full h-full min-h-[60vh] rounded-xl border border-gray-800 bg-white"
                        />
                    )}

                    {category === 'image' && (
                        <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl"
                        />
                    )}

                    {category === 'video' && (
                        <div key={videoKey} className="w-full flex justify-center">
                            <VideoPlayer src={file.fileUrl} type={file.contentType} name={file.fileName} />
                        </div>
                    )}

                    {category === 'audio' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 max-w-lg w-full">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg">
                                <Music className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-white font-bold text-lg text-center truncate w-full">{file.fileName}</p>
                            <audio src={file.fileUrl} controls autoPlay className="w-full">
                                Your browser does not support the audio tag.
                            </audio>
                        </div>
                    )}

                    {category === 'doc' && (
                        <GoogleDocsViewer url={file.fileUrl} name={file.fileName} />
                    )}

                    {category === 'other' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-5 max-w-md w-full text-center">
                            <FileText className="w-12 h-12 text-gray-400" />
                            <p className="text-white font-bold text-lg">{file.fileName}</p>
                            <p className="text-gray-400 text-sm">
                                This file type cannot be previewed. Download it to view.
                            </p>
                            <a
                                href={file.fileUrl}
                                download={file.fileName}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                <Download className="w-5 h-5" /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
