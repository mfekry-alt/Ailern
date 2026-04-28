import { useState, useMemo } from 'react';
import { Download, FileIcon, Music, Image, ZoomIn, ZoomOut, FileText, Archive } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function getFileIcon(name: string, type?: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return Image;
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return Music;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive;
    if (['txt', 'md', 'csv', 'json', 'xml'].includes(ext)) return FileText;
    return FileIcon;
}

function ImageViewer({ url, name }: { url: string; name: string }) {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="relative w-full h-full overflow-auto flex items-center justify-center bg-neutral-900 p-4 custom-scrollbar">
            <img
                src={url}
                alt={name}
                className={cn(
                    "transition-transform duration-300 ease-out object-contain shadow-2xl rounded-lg",
                    isZoomed ? "scale-[2.5] cursor-zoom-out" : "scale-100 cursor-zoom-in max-h-full max-w-full"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
                draggable={false}
            />
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

function AudioPlayer({ url, name }: { url: string; name: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-zinc-950 p-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col items-center max-w-md w-full text-center">
                <div className="h-24 w-24 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <Music className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                    {name}
                </h3>
                <audio src={url} controls className="w-full mt-4 accent-blue-500" />
            </div>
        </div>
    );
}

function DownloadCard({ file }: { file: { url: string; name: string; size?: number } }) {
    const Icon = getFileIcon(file.name);

    const triggerDownload = () => {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-zinc-950 p-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col items-center max-w-sm w-full text-center transition-all duration-300 hover:shadow-md">
                <div className="h-24 w-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Icon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {file.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 font-medium">
                    {formatSize(file.size)}
                </p>
                <Button className="w-full flex items-center justify-center gap-2" onClick={triggerDownload}>
                    <Download className="h-5 w-5" />
                    Download File
                </Button>
            </div>
        </div>
    );
}

export function GenericFileViewer() {
    const { currentFile } = useViewerStore();

    if (!currentFile) return null;

    const ext = useMemo(() => currentFile.name.split('.').pop()?.toLowerCase() || '', [currentFile.name]);

    if (currentFile.type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return <ImageViewer url={currentFile.url} name={currentFile.name} />;
    }

    if (currentFile.type === 'audio' || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
        return <AudioPlayer url={currentFile.url} name={currentFile.name} />;
    }

    return <DownloadCard file={currentFile} />;
}
