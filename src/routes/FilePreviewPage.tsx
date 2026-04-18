import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, AlertTriangle, Music } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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
            autoplay: true,
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
            className="w-full h-[calc(100vh-80px)] rounded-xl border border-gray-800 bg-white"
        />
    );
}

export const FilePreviewPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const url = params.get('url') || '';
    const name = params.get('name') || 'File';
    const type = params.get('type') || 'application/octet-stream';
    const size = Number(params.get('size') || 0);
    const category = getCategory(type, name);

    if (!url) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-2xl text-center shadow-xl border border-gray-200 dark:border-slate-700">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No file to preview</h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">The file URL is missing.</p>
                    <button onClick={() => navigate(-1)} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800 px-4 py-3 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-bold text-white truncate">{name}</h1>
                    <p className="text-[11px] text-gray-400 font-medium">
                        {type.split('/').pop()?.toUpperCase()}
                        {size > 0 && ` · ${formatSize(size)}`}
                    </p>
                </div>
                <a
                    href={url}
                    download={name}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
                >
                    <Download className="w-4 h-4" /> Download
                </a>
            </header>

            {/* Preview area */}
            <div className="flex-1 flex items-center justify-center p-4">
                {category === 'pdf' && (
                    <iframe
                        src={url}
                        title={name}
                        className="w-full h-[calc(100vh-80px)] rounded-xl border border-gray-800 bg-white"
                    />
                )}

                {category === 'image' && (
                    <img
                        src={url}
                        alt={name}
                        className="max-w-full max-h-[calc(100vh-100px)] rounded-xl object-contain shadow-2xl"
                    />
                )}

                {category === 'video' && (
                    <VideoPlayer src={url} type={type} name={name} />
                )}

                {category === 'audio' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 max-w-lg w-full">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg">
                            <Music className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-white font-bold text-lg text-center truncate w-full">{name}</p>
                        <audio src={url} controls autoPlay className="w-full">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                )}

                {category === 'doc' && (
                    <GoogleDocsViewer url={url} name={name} />
                )}

                {category === 'other' && (
                    <GoogleDocsViewer url={url} name={name} />
                )}
            </div>
        </div>
    );
};
