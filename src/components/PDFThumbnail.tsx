import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

// Initialize the worker using the locally bundled file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFThumbnailProps {
    url: string;
    className?: string;
}

export const PDFThumbnail = ({ url, className = "" }: PDFThumbnailProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const renderThumbnail = async () => {
            if (!url) return;
            setLoading(true);
            setError(false);

            try {
                const loadingTask = pdfjsLib.getDocument(url);
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;

                const page = await pdf.getPage(1);
                const pixelRatio = window.devicePixelRatio || 1;
                const viewport = page.getViewport({ scale: 3.0 * pixelRatio }); // Maximum quality scale

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                // Set canvas size based on high-quality viewport for maximum resolution
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvas,
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
                
                if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error rendering PDF thumbnail:', err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        renderThumbnail();

        return () => {
            isMounted = false;
        };
    }, [url]);

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-500/5 ${className}`}>
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Preview Failed</span>
            </div>
        );
    }

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 z-10 animate-pulse">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Generating...</span>
                </div>
            )}
            
            <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            />

            {!loading && !error && (
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent dark:from-slate-900/20 pointer-events-none" />
            )}
        </div>
    );
};
