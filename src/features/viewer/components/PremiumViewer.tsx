import { ArrowLeft, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { VideoPlayer } from './VideoPlayer';
import { PDFReader } from './PDFReader';
import { GenericFileViewer } from './GenericFileViewer';
import { Button } from '@/components/ui/Button';

interface PremiumViewerProps {
    onBack?: () => void;
    className?: string;
}

const typeBadge: Record<string, { label: string; color: string }> = {
    video: { label: 'Video', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
    pdf: { label: 'PDF', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
    image: { label: 'Image', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
    audio: { label: 'Audio', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
    other: { label: 'File', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400' },
};

export function PremiumViewer({ onBack, className }: PremiumViewerProps) {
    const { currentFile, status, error, completed, setFile } = useViewerStore();

    if (!currentFile) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">No file selected.</p>
                </div>
            </div>
        );
    }

    const badge = typeBadge[currentFile.type] || typeBadge.other;

    const handleRetry = () => {
        setFile(currentFile);
    };

    return (
        <div className={`flex flex-col h-full w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm ${className || ''}`}>
            {/* Top Bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-sm z-20">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="rounded-full h-9 w-9 p-0 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                        {currentFile.name}
                    </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                    {completed && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                            Completed
                        </span>
                    )}
                    <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full ${badge.color}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-black overflow-hidden">
                {status === 'loading' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-100/60 dark:bg-black/60 backdrop-blur-sm transition-all">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-md animate-pulse" />
                                <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-blue-500" />
                            </div>
                            <div className="space-y-2 text-center">
                                <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-700 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-700 rounded animate-pulse mx-auto" />
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-7 w-7 text-red-500" />
                            </div>
                            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Failed to load content</div>
                            <div className="text-sm text-slate-500 dark:text-zinc-400 mb-6">{error || 'Something went wrong while loading this file.'}</div>
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleRetry}>
                                <RotateCw className="h-4 w-4" />
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                <div className="absolute inset-0 h-full w-full">
                    {currentFile.type === 'video' && <VideoPlayer />}
                    {currentFile.type === 'pdf' && <PDFReader />}
                    {(currentFile.type === 'image' || currentFile.type === 'audio' || currentFile.type === 'other') && <GenericFileViewer />}
                </div>
            </div>
        </div>
    );
}
