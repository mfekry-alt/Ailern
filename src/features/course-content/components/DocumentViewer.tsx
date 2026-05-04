/**
 * Document Viewer - Enhanced PDF.js based custom viewer with multi-page scroll support
 * Features:
 * - Multi-page continuous scroll rendering
 * - Scroll-based page tracking with IntersectionObserver
 * - Smooth navigation with scroll-to-page
 * - Zoom with maintained scroll position
 * - Responsive page fitting
 * - Auto-hide controls when idle
 */
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
    ChevronLeft, 
    ChevronRight, 
    ZoomIn, 
    ZoomOut, 
    Maximize, 
    Minimize,
    Download,
    FileText,
    Loader2,
    AlertCircle,
    RotateCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

// Set up PDF.js worker from local public folder (copied from node_modules)
// This avoids CDN issues and CORS problems
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface DocumentViewerProps {
    fileUrl: string;
    fileName: string;
    contentType: string;
    onDownload?: () => void;
    convertedPdfUrl?: string;
    /** Callback for page navigation (for progress tracking) */
    onPageChange?: (currentPage: number, totalPages: number) => void;
    /** Initial page to display (1-indexed) */
    initialPage?: number;
}

type DocumentType = 'pdf' | 'word' | 'unknown';

interface PageViewport {
    width: number;
    height: number;
}

interface PageData {
    viewport: PageViewport;
    renderTask: pdfjsLib.RenderTask | null;
}

export const DocumentViewer = ({
    fileUrl,
    fileName,
    contentType,
    onDownload,
    convertedPdfUrl,
    onPageChange,
    initialPage = 1,
}: DocumentViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const zoomAnchorRef = useRef<{ page: number; offsetRatio: number } | null>(null);
    const isNavigatingRef = useRef(false);
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
    const hasResumedRef = useRef(false);
    
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(initialPage);
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [documentType, setDocumentType] = useState<DocumentType>('pdf');
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [fetchProgress, setFetchProgress] = useState<number>(0);
    const [useFallback, setUseFallback] = useState<boolean>(false);
    const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
    const [pageViewports, setPageViewports] = useState<Map<number, PageViewport>>(new Map());
    
    // Use refs for values that don't need to trigger re-renders but are needed in callbacks
    const visiblePagesRef = useRef<Set<number>>(new Set());
    const pendingRerenderRef = useRef(false);
    const scaleRef = useRef(scale);
    const rotationRef = useRef(rotation);
    const renderedPagesRef = useRef(renderedPages);
    
    const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    
    const renderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());
    const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Detect document type
    useEffect(() => {
        const type = contentType.toLowerCase();
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        
        if (type.includes('pdf') || ext === 'pdf') {
            setDocumentType('pdf');
        } else if (type.includes('word') || ext.match(/doc|docx/)) {
            setDocumentType('word');
        } else {
            setDocumentType('unknown');
        }
    }, [contentType, fileName]);

    const effectiveUrl = convertedPdfUrl || fileUrl;
    
    // Fetch PDF as ArrayBuffer
    useEffect(() => {
        if (!effectiveUrl) {
            setError('No document URL provided');
            setLoading(false);
            return;
        }

        setPdfData(null);
        setPdfDocument(null);
        setError(null);
        setLoading(true);
        setFetchProgress(0);
        setPageNumber(1);
        setNumPages(0);
        setRenderedPages(new Set());
        visiblePagesRef.current = new Set();
        setPageViewports(new Map());

        let isCancelled = false;

        const fetchPdf = async () => {
            try {
                const response = await fetch(effectiveUrl, {
                    method: 'GET',
                    headers: { 'Range': 'bytes=0-' },
                    mode: 'cors',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }

                const contentLength = response.headers.get('content-length');
                const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Unable to read response body');
                }

                const chunks: Uint8Array[] = [];
                let receivedBytes = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    receivedBytes += value.length;
                    if (totalBytes > 0) {
                        const progress = Math.round((receivedBytes / totalBytes) * 100);
                        setFetchProgress(progress);
                    }
                }

                const allChunks = new Uint8Array(receivedBytes);
                let position = 0;
                for (const chunk of chunks) {
                    allChunks.set(chunk, position);
                    position += chunk.length;
                }

                if (!isCancelled) {
                    setPdfData(allChunks);
                }
            } catch (err) {
                if (isCancelled) return;
                console.error('Error fetching PDF:', err);
                let errorMsg = 'Failed to fetch PDF';
                if (err instanceof Error) {
                    if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
                        errorMsg = 'Unable to load PDF due to network restrictions.';
                    } else {
                        errorMsg = err.message;
                    }
                }
                setError(errorMsg);
                setLoading(false);
                setUseFallback(true);
            }
        };

        fetchPdf();
        return () => { isCancelled = true; };
    }, [effectiveUrl]);

    // Fullscreen change detection
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    // Store onPageChange in a ref to avoid triggering effect when callback reference changes
    const onPageChangeRef = useRef(onPageChange);
    onPageChangeRef.current = onPageChange;

    // Notify parent of page changes for progress tracking
    // Only trigger when pageNumber actually changes, not when callback reference changes
    const prevPageNumberRef = useRef(pageNumber);
    useEffect(() => {
        if (onPageChangeRef.current && numPages > 0 && pageNumber !== prevPageNumberRef.current) {
            prevPageNumberRef.current = pageNumber;
            onPageChangeRef.current(pageNumber, numPages);
        }
    }, [pageNumber, numPages]);

    // Keep refs in sync with state for use in callbacks
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);
    
    useEffect(() => {
        rotationRef.current = rotation;
    }, [rotation]);
    
    useEffect(() => {
        renderedPagesRef.current = renderedPages;
    }, [renderedPages]);

    // Load PDF document (only when pdfData changes, not rotation)
    useEffect(() => {
        if (!pdfData) return;

        let isCancelled = false;
        let currentLoadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                const loadingTask = pdfjsLib.getDocument({
                    data: pdfData,
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/standard_fonts/',
                    useSystemFonts: true,
                });
                
                currentLoadingTask = loadingTask;
                loadingTaskRef.current = loadingTask;

                const pdf = await loadingTask.promise;
                
                if (isCancelled) {
                    pdf.destroy();
                    return;
                }
                
                setPdfDocument(pdf);
                setNumPages(pdf.numPages);
                setPageNumber(initialPage);
                setLoading(false);
                
                // Pre-calculate page viewports for all pages (at scale 1, rotation 0)
                // Rotation is applied at render time, not stored in viewports
                const viewports = new Map<number, PageViewport>();
                for (let i = 1; i <= pdf.numPages; i++) {
                    try {
                        const page = await pdf.getPage(i);
                        // Always get viewport at 0 rotation for base dimensions
                        // Rotation will be applied dynamically during rendering
                        const viewport = page.getViewport({ scale: 1, rotation: 0 });
                        viewports.set(i, { width: viewport.width, height: viewport.height });
                        page.cleanup();
                    } catch (err) {
                        viewports.set(i, { width: 800, height: 1000 });
                    }
                }
                setPageViewports(viewports);
                
            } catch (err) {
                if (isCancelled) return;
                setError(err instanceof Error ? err.message : 'Failed to load PDF');
                setLoading(false);
                setUseFallback(true);
            }
        };

        loadPdf();

        return () => {
            isCancelled = true;
            if (currentLoadingTask && !currentLoadingTask.destroyed) {
                currentLoadingTask.destroy();
            }
        };
    }, [pdfData]); // Removed rotation from deps - only reload when PDF data changes

    // Reset resume flag when initialPage prop changes (allows re-navigation)
    useEffect(() => {
        hasResumedRef.current = false;
    }, [initialPage]);

    // Scroll to initial page after document is loaded and pages are rendered
    // Only runs ONCE per initialPage change (guarded by hasResumedRef)
    useEffect(() => {
        if (hasResumedRef.current) return;
        if (!loading && numPages > 0 && initialPage >= 1 && initialPage <= numPages) {
            hasResumedRef.current = true;
            // Small delay to ensure pages are rendered before scrolling
            const timeout = setTimeout(() => {
                scrollToPage(initialPage);
            }, 150);
            return () => clearTimeout(timeout);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, numPages, initialPage]); // scrollToPage is stable, omit to avoid lint error

    // Calculate fit-to-width scale
    const getFitToWidthScale = useCallback(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return scale;
        
        const containerWidth = scrollContainer.clientWidth - 48; // 24px padding on each side
        const firstPage = pageViewports.get(1);
        if (!firstPage) return scale;
        
        // Calculate scale to fit container width with some margin
        const baseScale = (containerWidth - 40) / firstPage.width;
        return Math.max(0.5, Math.min(baseScale, 3));
    }, [pageViewports, scale]);

    // Get current effective scale
    const getEffectiveScale = useCallback(() => {
        return scale;
    }, [scale]);

    // Render a specific page with explicit scale and rotation parameters
    const renderPage = useCallback(async (pageNum: number, renderScale: number, renderRotation: number) => {
        if (!pdfDocument) return;
        
        const canvas = document.getElementById(`pdf-page-canvas-${pageNum}`) as HTMLCanvasElement;
        if (!canvas) return;

        // Cancel existing render task for this page
        const existingTask = renderTasksRef.current.get(pageNum);
        if (existingTask) {
            try { await existingTask.cancel(); } catch {}
        }

        try {
            const page = await pdfDocument.getPage(pageNum);
            
            const viewport = page.getViewport({ scale: renderScale, rotation: renderRotation });

            const context = canvas.getContext('2d');
            if (!context) return;

            const pixelRatio = window.devicePixelRatio || 1;
            canvas.width = viewport.width * pixelRatio;
            canvas.height = viewport.height * pixelRatio;
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            // Clear canvas before rendering
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
            };

            const renderTask = page.render(renderContext);
            renderTasksRef.current.set(pageNum, renderTask);

            await renderTask.promise;
            
            // Use functional update to avoid dependency on renderedPages
            setRenderedPages(prev => {
                if (prev.has(pageNum)) return prev;
                return new Set([...prev, pageNum]);
            });
            renderTasksRef.current.delete(pageNum);
            page.cleanup();
        } catch (err) {
            if (err instanceof Error && !err.message.includes('cancelled')) {
                console.error(`Error rendering page ${pageNum}:`, err);
            }
            renderTasksRef.current.delete(pageNum);
        }
    }, [pdfDocument]);

    // Set up IntersectionObserver for scroll tracking
    useEffect(() => {
        if (!scrollContainerRef.current || numPages === 0) return;

        const options = {
            root: scrollContainerRef.current,
            rootMargin: '-10% 0px -60% 0px',
            threshold: 0,
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            if (isNavigatingRef.current) return;

            entries.forEach(entry => {
                const pageNum = parseInt(entry.target.getAttribute('data-page-num') || '0', 10);
                if (pageNum === 0) return;

                if (entry.isIntersecting) {
                    visiblePagesRef.current.add(pageNum);
                    // Render page when it becomes visible with CURRENT scale/rotation from refs
                    // This prevents stale closure issues
                    if (!renderedPagesRef.current.has(pageNum)) {
                        renderPage(pageNum, scaleRef.current, rotationRef.current);
                    }
                    // Update current page number based on most visible page
                    if (!isNavigatingRef.current) {
                        setPageNumber(pageNum);
                    }
                } else {
                    visiblePagesRef.current.delete(pageNum);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, options);
        intersectionObserverRef.current = observer;

        // Observe all page containers
        pageRefs.current.forEach((el) => {
            observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    }, [numPages]); // Removed renderPage and renderedPages from deps

    // Register page element ref
    const setPageRef = useCallback((el: HTMLDivElement | null, pageNum: number) => {
        if (el) {
            pageRefs.current.set(pageNum, el);
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.observe(el);
            }
        } else {
            const existingEl = pageRefs.current.get(pageNum);
            if (existingEl && intersectionObserverRef.current) {
                intersectionObserverRef.current.unobserve(existingEl);
            }
            pageRefs.current.delete(pageNum);
        }
    }, []);

    // Preload and render ALL pages when PDF is ready
    useEffect(() => {
        if (!pdfDocument || pageViewports.size === 0) return;
        
        // Render all pages in sequence with a small delay between each
        // to avoid blocking the UI thread
        const renderQueue: number[] = [];
        for (let i = 1; i <= numPages; i++) {
            renderQueue.push(i);
        }
        
        const renderNextBatch = async () => {
            const batchSize = 3; // Render 3 pages at a time
            const batch = renderQueue.splice(0, batchSize);
            
            if (batch.length === 0) return;
            
            // Render batch concurrently with current scale and rotation
            await Promise.all(batch.map(pageNum => renderPage(pageNum, scale, rotation)));
            
            // Schedule next batch
            if (renderQueue.length > 0) {
                requestAnimationFrame(renderNextBatch);
            }
        };
        
        // Start rendering
        renderNextBatch();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfDocument, pageViewports.size, numPages]); // Only run when PDF is first loaded

    // Handle scale changes - re-render all already-rendered pages
    useEffect(() => {
        if (!pdfDocument || pendingRerenderRef.current) return;
        
        pendingRerenderRef.current = true;
        
        // Clear rendered pages to trigger re-render at new scale
        const previouslyRendered = Array.from(renderedPages);
        setRenderedPages(new Set());
        
        // Re-render pages after a short delay to allow state update
        setTimeout(() => {
            // Get current scale value at render time
            previouslyRendered.forEach(pageNum => {
                renderPage(pageNum, scale, rotation);
            });
            pendingRerenderRef.current = false;
        }, 50);
        
        return () => {
            pendingRerenderRef.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scale]); // Only respond to scale changes

    // Handle rotation changes - re-render all pages with new rotation
    useEffect(() => {
        if (!pdfDocument || pendingRerenderRef.current || rotation === 0 && renderedPages.size === 0) return;
        
        pendingRerenderRef.current = true;
        
        // Store which pages were rendered before rotation
        const pagesToRender = Array.from({ length: numPages }, (_, i) => i + 1);
        
        // Clear rendered pages to trigger re-render at new rotation
        setRenderedPages(new Set());
        
        // Re-render all pages with new rotation after DOM updates
        requestAnimationFrame(() => {
            // Render in batches to avoid blocking UI
            const renderBatch = (startIdx: number) => {
                const batch = pagesToRender.slice(startIdx, startIdx + 3);
                if (batch.length === 0) {
                    pendingRerenderRef.current = false;
                    return;
                }
                
                Promise.all(batch.map(pageNum => renderPage(pageNum, scale, rotation)))
                    .then(() => {
                        if (startIdx + 3 < pagesToRender.length) {
                            requestAnimationFrame(() => renderBatch(startIdx + 3));
                        } else {
                            pendingRerenderRef.current = false;
                        }
                    });
            };
            
            renderBatch(0);
        });
        
        return () => {
            pendingRerenderRef.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rotation]); // Only respond to rotation changes

    // Smooth scroll to page
    const scrollToPage = useCallback((targetPage: number) => {
        const pageEl = pageRefs.current.get(targetPage);
        const scrollContainer = scrollContainerRef.current;
        if (!pageEl || !scrollContainer) return;

        isNavigatingRef.current = true;
        
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Clear navigation flag after scroll animation
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            isNavigatingRef.current = false;
        }, 500);
    }, []);

    // Page navigation
    const goToPrevPage = useCallback(() => {
        if (pageNumber > 1) {
            const target = pageNumber - 1;
            setPageNumber(target);
            scrollToPage(target);
        }
    }, [pageNumber, scrollToPage]);

    const goToNextPage = useCallback(() => {
        if (pageNumber < numPages) {
            const target = pageNumber + 1;
            setPageNumber(target);
            scrollToPage(target);
        }
    }, [pageNumber, numPages, scrollToPage]);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= numPages) {
            setPageNumber(page);
            scrollToPage(page);
        }
    }, [numPages, scrollToPage]);

    // Calculate optimal zoom anchor point for smooth zooming
    const calculateZoomAnchor = useCallback(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || numPages === 0) return null;

        const containerRect = scrollContainer.getBoundingClientRect();
        const containerCenterY = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
        
        // Find the page at the center of the viewport
        let centerPage = 1;
        let minDistance = Infinity;
        
        pageRefs.current.forEach((el, pageNum) => {
            const rect = el.getBoundingClientRect();
            const elTop = rect.top - containerRect.top + scrollContainer.scrollTop;
            const elCenter = elTop + rect.height / 2;
            const distance = Math.abs(elCenter - containerCenterY);
            
            if (distance < minDistance) {
                minDistance = distance;
                centerPage = pageNum;
            }
        });
        
        const pageEl = pageRefs.current.get(centerPage);
        if (!pageEl) return null;
        
        const pageRect = pageEl.getBoundingClientRect();
        const pageTop = pageRect.top - containerRect.top + scrollContainer.scrollTop;
        const offsetFromPageTop = containerCenterY - pageTop;
        const offsetRatio = offsetFromPageTop / pageRect.height;
        
        return { page: centerPage, offsetRatio: Math.max(0, Math.min(1, offsetRatio)) };
    }, [numPages]);

    // Zoom controls with improved viewport-centered zoom
    const zoomIn = useCallback(() => {
        const anchor = calculateZoomAnchor();
        if (anchor) {
            zoomAnchorRef.current = anchor;
        }

        setScale(prev => Math.min(prev + 0.2, 3));
    }, [calculateZoomAnchor]);

    const zoomOut = useCallback(() => {
        const anchor = calculateZoomAnchor();
        if (anchor) {
            zoomAnchorRef.current = anchor;
        }

        setScale(prev => Math.max(prev - 0.2, 0.5));
    }, [calculateZoomAnchor]);

    const resetZoom = useCallback(() => {
        setScale(1.0);
    }, []);

    // Restore scroll position after zoom with improved accuracy
    useEffect(() => {
        if (!zoomAnchorRef.current) return;
        
        const { page, offsetRatio } = zoomAnchorRef.current;
        
        // Wait for DOM to update after scale change
        requestAnimationFrame(() => {
            const pageEl = pageRefs.current.get(page);
            const scrollContainer = scrollContainerRef.current;
            
            if (pageEl && scrollContainer) {
                const pageRect = pageEl.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                
                // Calculate the new position to maintain the same relative view
                const targetScrollTop = scrollContainer.scrollTop + 
                    (pageRect.top - containerRect.top) + 
                    (pageRect.height * offsetRatio) - 
                    (scrollContainer.clientHeight / 2);
                
                scrollContainer.scrollTop = Math.max(0, targetScrollTop);
            }
            
            zoomAnchorRef.current = null;
        });
    }, [scale]); // Only depend on scale, not pageViewports

    // Rotation
    const rotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(async () => {
        const container = containerRef.current;
        if (!container) return;

        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    }, []);

    // Page input handler
    const handlePageInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            const page = parseInt(target.value, 10);
            if (!isNaN(page)) {
                goToPage(page);
            }
            target.blur();
        }
    }, [goToPage]);

    // Force download using fetch + blob + object URL (avoids opening in browser)
    const handleForceDownload = useCallback(async () => {
        const url = convertedPdfUrl || fileUrl;
        if (!url) return;

        try {
            // Fetch the file as blob
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: try direct link with download attribute
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [fileUrl, convertedPdfUrl, fileName]);

    // Calculate page dimensions for rendering (handles rotation by swapping w/h when needed)
    const getPageDimensions = useCallback((pageNum: number) => {
        const viewport = pageViewports.get(pageNum);
        if (!viewport) return { width: 800, height: 1000 };
        
        const effectiveScale = getEffectiveScale();
        const isRotated90or270 = rotation === 90 || rotation === 270;
        
        // When rotated 90 or 270 degrees, swap width and height
        if (isRotated90or270) {
            return {
                width: viewport.height * effectiveScale,
                height: viewport.width * effectiveScale,
            };
        }
        
        return {
            width: viewport.width * effectiveScale,
            height: viewport.height * effectiveScale,
        };
    }, [pageViewports, getEffectiveScale, rotation]);

    // Render loading state
    if (loading && !error && !pdfData) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-2xl">
                <Loader2 className="w-10 h-10 text-[#21A9FF] animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {fetchProgress > 0 ? `Downloading PDF... ${fetchProgress}%` : 'Loading document...'}
                </p>
                {fetchProgress > 0 && fetchProgress < 100 && (
                    <div className="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="h-full bg-[#21A9FF] transition-all duration-300"
                            style={{ width: `${fetchProgress}%` }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-2xl p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 text-center mb-4">{error}</p>
                <button
                    onClick={handleForceDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-[#21A9FF] text-white rounded-lg hover:bg-[#1a8fd4] transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download File
                </button>
            </div>
        );
    }

    // For Word documents without conversion
    if (documentType === 'word' && !convertedPdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 rounded-2xl p-8">
                <FileText className="w-16 h-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Word Document
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                    This document needs to be converted to PDF for viewing.
                </p>
                <button
                    onClick={handleForceDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-[#21A9FF] hover:bg-[#1a8fd4] 
                             text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#21A9FF]/20"
                >
                    <Download className="w-5 h-5" />
                    Download Document
                </button>
            </div>
        );
    }

    // Fallback iframe mode
    if (useFallback) {
        return (
            <div className="w-full h-full flex flex-col">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <span className="font-medium">Note:</span> Using browser's built-in PDF viewer. 
                        <button 
                            onClick={handleForceDownload}
                            className="ml-2 underline hover:text-yellow-900 dark:hover:text-yellow-100"
                        >
                            Download for better experience
                        </button>
                    </p>
                </div>
                <iframe
                    src={effectiveUrl}
                    className="flex-1 w-full border-0"
                    title={fileName}
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-hidden flex flex-col"
        >
            {/* Top Controls Bar - Fixed at top */}
            <div
                ref={controlsRef}
                className="flex-none z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
            >
                <div className="flex items-center justify-between px-4 py-4">
                    {/* Left: Document Info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                            <FileText className="w-4 h-4 text-white" />
                            <span className="text-sm text-white font-medium truncate max-w-[150px] sm:max-w-xs lg:max-w-md">
                                {fileName}
                            </span>
                        </div>
                    </div>

                    {/* Center: Page Navigation */}
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                        <button
                            onClick={goToPrevPage}
                            disabled={pageNumber <= 1}
                            className="p-1.5 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1 px-2">
                            <input
                                type="text"
                                value={pageNumber}
                                onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                                onKeyDown={handlePageInput}
                                className="w-12 h-7 text-center text-sm bg-white/20 text-white rounded 
                                         focus:outline-none focus:ring-2 focus:ring-[#21A9FF]"
                            />
                            <span className="text-white/70 text-sm">/ {numPages}</span>
                        </div>

                        <button
                            onClick={goToNextPage}
                            disabled={pageNumber >= numPages}
                            className="p-1.5 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                            <button
                                onClick={zoomOut}
                                disabled={scale <= 0.5}
                                className="p-1.5 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-40"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-white w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button
                                onClick={zoomIn}
                                disabled={scale >= 3}
                                className="p-1.5 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-40"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Rotate */}
                        <button
                            onClick={rotate}
                            className="hidden sm:flex p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                            title="Rotate"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                            onClick={handleForceDownload}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* PDF Content - Multi-page scrollable container */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-200 dark:bg-slate-900 scroll-smooth"
            >
                <div className="flex flex-col items-center py-6 px-4 space-y-4 min-h-full">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                        const dimensions = getPageDimensions(pageNum);
                        const isRendered = renderedPages.has(pageNum);
                        const isCurrent = pageNum === pageNumber;
                        
                        return (
                            <div
                                key={pageNum}
                                ref={(el) => setPageRef(el, pageNum)}
                                data-page-num={pageNum}
                                className={`relative transition-all duration-300 ${
                                    isCurrent ? 'ring-2 ring-[#21A9FF] ring-offset-2 ring-offset-gray-200 dark:ring-offset-slate-900' : ''
                                }`}
                                style={{ 
                                    width: dimensions.width,
                                    height: dimensions.height,
                                }}
                            >
                                {/* Page number indicator */}
                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block">
                                    <span className={`text-sm font-medium ${
                                        isCurrent 
                                            ? 'text-[#21A9FF]' 
                                            : 'text-gray-400 dark:text-gray-600'
                                    }`}>
                                        {pageNum}
                                    </span>
                                </div>
                                
                                {/* Canvas for rendering */}
                                <canvas
                                    id={`pdf-page-canvas-${pageNum}`}
                                    className="bg-white shadow-lg block"
                                    style={{
                                        width: dimensions.width,
                                        height: dimensions.height,
                                    }}
                                />
                                
                                {/* Loading placeholder for non-rendered pages */}
                                {!isRendered && (
                                    <div 
                                        className="absolute inset-0 bg-gray-100 dark:bg-slate-800 shadow-lg flex items-center justify-center"
                                        style={{
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        }}
                                    >
                                        <Loader2 className="w-6 h-6 text-[#21A9FF] animate-spin" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* Bottom padding */}
                    <div className="h-8" />
                </div>
            </div>

            {/* Floating Navigation Controls - Right side */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                <button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className="hidden lg:flex p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm 
                             text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous Page"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
                <button
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="hidden lg:flex p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm 
                             text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next Page"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>

            {/* Bottom Page Navigation - Visible on mobile */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4 px-4 py-4">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full disabled:opacity-40"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-white font-medium">
                        {pageNumber} / {numPages}
                    </span>

                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full disabled:opacity-40"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DocumentViewer;
