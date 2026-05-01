import React from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { VideoPlayer } from './VideoPlayer';
import { PDFReader } from './PDFReader';
import { GenericFileViewer } from './GenericFileViewer';
import { Button } from '@/components/ui/Button';

interface PremiumViewerProps {
    onBack?: () => void;
    className?: string;
}

export function PremiumViewer({ onBack, className }: PremiumViewerProps) {
    const { currentFile, status, error } = useViewerStore();

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

    return (
        <div className={`flex flex-col h-full w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm ${className || ''}`}>
            {/* Top Bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onBack} 
                            className="rounded-full h-10 w-10 p-0 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[400px] md:max-w-2xl tracking-tight">
                        {currentFile.name}
                    </h2>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-black overflow-hidden">
                {status === 'loading' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-black/50 backdrop-blur-sm transition-all">
                        <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
                        <span className="text-sm font-medium text-slate-600 dark:text-zinc-300">Loading viewer...</span>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
                        <AlertCircle className="h-12 w-12 text-danger-500 mb-4 opacity-80" />
                        <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Failed to load content</div>
                        <div className="text-sm text-slate-500 dark:text-zinc-400 max-w-md text-center">{error}</div>
                    </div>
                )}

                <div className="absolute inset-0 h-full w-full">
                    {currentFile.type === 'video' && <VideoPlayer />}
                    {currentFile.type === 'pdf' && <PDFReader />}
                    {currentFile.type === 'other' && <GenericFileViewer />}
                </div>
            </div>
        </div>
    );
}
