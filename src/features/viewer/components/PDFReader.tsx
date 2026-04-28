import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize, CheckCircle } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function PDFReader() {
    const { currentFile, completed, saveProgress, loadSavedProgress, markCompleted, setStatus } = useViewerStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [isRendering, setIsRendering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pageInput, setPageInput] = useState('1');

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentFile) return;
        const savedPage = Math.max(1, Math.floor(loadSavedProgress(currentFile.id)));
        setPageNumber(savedPage || 1);
        setPageInput(String(savedPage || 1));
        setIsLoading(true);
        setScale(1.2);

        const loadPDF = async () => {
            try {
                setStatus('loading');
                const loadingTask = pdfjsLib.getDocument(currentFile.url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setIsLoading(false);
                setStatus('ready');
            } catch (error) {
                console.error('Error loading PDF:', error);
                setIsLoading(false);
                setStatus('error', 'Failed to load PDF document.');
            }
        };

        loadPDF();

        return () => {
            setPdfDoc(null);
        };
    }, [currentFile, setStatus, loadSavedProgress]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderPage = async (num: number) => {
            setIsRendering(true);
            try {
                const page = await pdfDoc.getPage(num);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    canvas: canvas,
                };

                await page.render(renderContext).promise;
                saveProgress(num);
                setPageInput(String(num));
                if (num >= totalPages && totalPages > 0) markCompleted();
            } catch (error) {
                console.error('Error rendering page:', error);
            } finally {
                setIsRendering(false);
            }
        };

        renderPage(pageNumber);
    }, [pdfDoc, pageNumber, scale, saveProgress, totalPages, markCompleted]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
                e.preventDefault();
                setPageNumber(p => Math.min(p + 1, totalPages || p));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                setPageNumber(p => Math.max(p - 1, 1));
            } else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                setScale(s => Math.min(s + 0.2, 3));
            } else if (e.key === '-') {
                e.preventDefault();
                setScale(s => Math.max(s - 0.2, 0.5));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalPages]);

    // Ctrl + wheel zoom
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) setScale(s => Math.min(s + 0.1, 3));
                else setScale(s => Math.max(s - 0.1, 0.5));
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    // Fullscreen sync
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const goToPage = (n: number) => {
        if (isLoading || isRendering) return;
        setPageNumber(Math.max(1, Math.min(n, totalPages || 1)));
    };

    const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const val = parseInt(pageInput, 10);
        if (!Number.isFinite(val)) return;
        goToPage(val);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch { /* ignore */ }
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-slate-100 dark:bg-zinc-950/80 relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 w-12 text-center tabular-nums">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= 3}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    {completed && (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Completed
                        </div>
                    )}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                        <Button variant="ghost" size="sm" onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="h-8 px-2">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-2 gap-1.5">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onKeyDown={handlePageInputSubmit}
                                className="w-10 h-7 text-sm text-center bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-zinc-200 tabular-nums"
                            />
                            <span className="text-xs text-slate-500 dark:text-zinc-400 select-none">/ {totalPages || '-'}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= totalPages} className="h-8 px-2">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </div>

            {/* Document Area */}
            <div className="flex-1 overflow-auto p-4 flex justify-center items-start custom-scrollbar relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-100 dark:bg-zinc-950/80">
                        <div className="w-48 h-64 bg-white dark:bg-zinc-900 rounded-lg shadow-lg animate-pulse" />
                        <div className="mt-4 h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                )}
                <div className={cn(
                    "relative shadow-xl transition-all duration-300 ease-in-out bg-white",
                    isRendering ? "opacity-50" : "opacity-100"
                )}>
                    <canvas ref={canvasRef} className="max-w-full" />
                </div>
            </div>
        </div>
    );
}
