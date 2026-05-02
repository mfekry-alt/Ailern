import { useEffect, useRef, useState, memo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

// Set up the worker correctly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFThumbnailProps {
    url: string;
    className?: string;
}

export const PDFThumbnail = memo(function PDFThumbnail({ url, className = "" }: PDFThumbnailProps) {
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
                // 1. Fetch the PDF data manually (often better for CORS handling)
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();

                if (!isMounted) return;

                // 2. Load the PDF from the ArrayBuffer
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    disableRange: true,
                    disableStream: true,
                });
                
                const pdf = await loadingTask.promise;

                if (!isMounted) return;

                // 3. Load first page
                const page = await pdf.getPage(1);
                
                if (!isMounted) return;

                // Ultimate high-quality rendering (4x super-sampling)
                const scale = 4.0; 
                const viewport = page.getViewport({ scale });
                
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d', { 
                    alpha: false,
                    willReadFrequently: false 
                });
                if (!context) return;

                // Disable smoothing for razor-sharp edges
                context.imageSmoothingEnabled = false;

                // Set internal resolution to the ultra-high scale
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Keep display size responsive
                canvas.style.width = "100%";
                canvas.style.height = "100%";

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    canvas: canvas,
                    intent: 'print', // Use highest fidelity rendering path
                };

                await page.render(renderContext).promise;
                if (isMounted) setLoading(false);
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
            <div
                className={`flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800 ${className}`}
            >
                <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden />
            </div>
        );
    }

    return (
        <div className={`relative flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
        </div>
    );
});
