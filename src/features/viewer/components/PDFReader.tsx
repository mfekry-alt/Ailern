import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { useViewerStore } from '../store/useViewerStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Setup worker
// Using URL constructor for Vite compatibility
const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function PDFReader() {
    const { currentFile, progress, setProgress, setStatus } = useViewerStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState(progress > 0 ? progress : 1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [isRendering, setIsRendering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentFile) return;

        const loadPDF = async () => {
            try {
                setStatus('loading');
                const loadingTask = pdfjsLib.getDocument(currentFile.url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setStatus('ready');
            } catch (error) {
                console.error("Error loading PDF:", error);
                setStatus('error', 'Failed to load PDF document.');
            }
        };

        loadPDF();
    }, [currentFile, setStatus]);

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
                    viewport: viewport
                };

                await page.render(renderContext).promise;
                setProgress(num);
            } catch (error) {
                console.error("Error rendering page:", error);
            } finally {
                setIsRendering(false);
            }
        };

        renderPage(pageNumber);
    }, [pdfDoc, pageNumber, scale, setProgress]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPrevPage();
            } else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                handleZoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageNumber, totalPages]);

    const goToPrevPage = () => {
        if (pageNumber <= 1 || isRendering) return;
        setPageNumber(prev => prev - 1);
    };

    const goToNextPage = () => {
        if (pageNumber >= totalPages || isRendering) return;
        setPageNumber(prev => prev + 1);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-slate-100 dark:bg-zinc-950/80">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= 3}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={goToPrevPage} 
                            disabled={pageNumber <= 1}
                            className="h-8 px-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 px-3 select-none">
                            Page {pageNumber} of {totalPages || '-'}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={goToNextPage} 
                            disabled={pageNumber >= totalPages}
                            className="h-8 px-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </div>

            {/* Document Area */}
            <div className="flex-1 overflow-auto p-4 flex justify-center items-start custom-scrollbar">
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
