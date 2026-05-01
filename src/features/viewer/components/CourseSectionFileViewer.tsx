/**
 * Course Section File Viewer — split panel, custom PDF (pdfjs + canvas) and custom video (no native controls).
 * Styling: inline styles + CSS variables only. Icons: inline SVG paths only.
 */
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

/* Worker must match the installed `pdfjs-dist` major version. For v3.11.174 specifically:
 * pdfjsLib.GlobalWorkerOptions.workerSrc =
 *   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 * (use only with pdfjs-dist@3.11.x) */
const PDF_WORKER_SRC = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

/* ——— Types ——— */

export type FileItem = {
    id: string;
    name: string;
    type: 'pdf' | 'video';
    url: string;
    size: string;
    duration?: string;
};

export type Section = {
    id: number;
    title: string;
    files: FileItem[];
};

const shellStyle: CSSProperties = {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    minHeight: 0,
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
};

/* ——— Small helpers ——— */

function formatTime(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${m}:${pad(s)}`;
}

/* ——— Icons (inline <path> only) ——— */

const iconSize = 20;

function IconPlay() {
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M8 5.14v13.72L19 12L8 5.14Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconPause() {
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z" fill="currentColor" />
        </svg>
    );
}

function IconVolume() {
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3 9v6h4l5 4V5L7 9H3Zm14.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconMute() {
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03V17l1.1-1.1c.66-.7 1.4-1.4 1.4-2.9zM16.5 4.5L3 18l-1-1L15.5 3.5l1 1z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconFullscreen() {
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3 3h6v2H5v4H3V3Zm12 0h6v6h-2V5h-4V3ZM3 15h2v4h4v2H3v-6Zm14 0h6v6h-6v-2h4v-4Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconChevLeft() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15.5 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}

function IconChevRight() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M8.5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}

function IconDownload() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M12 3v10m0 0l4-4m-4 4L8 9M4 20h16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
            />
        </svg>
    );
}

function IconClose() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function IconSpinner() {
    return (
        <svg
            width={40}
            height={40}
            viewBox="0 0 24 24"
            style={{ animation: 'courseViewerSpin 0.8s linear infinite' }}
            aria-hidden
        >
            <style>{`@keyframes courseViewerSpin { to { transform: rotate(360deg); } }`}</style>
            <path
                d="M12 2a10 10 0 0 0-10 10"
                stroke="var(--color-text-secondary)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ——— NavBar ——— */

type NavBarProps = {
    onPrev: () => void;
    onNext: () => void;
    label: string;
    prevDisabled: boolean;
    nextDisabled: boolean;
};

function NavBar({ onPrev, onNext, label, prevDisabled, nextDisabled }: NavBarProps) {
    const dis = (d: boolean): CSSProperties =>
        d
            ? { opacity: 0.35, cursor: 'not-allowed' as const, pointerEvents: 'none' as const }
            : {};

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '10px 12px',
                borderTop: '1px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
            }}
        >
            <button
                type="button"
                onClick={onPrev}
                disabled={prevDisabled}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border-secondary)',
                    background: 'var(--color-background-tertiary)',
                    color: 'var(--color-text-primary)',
                    cursor: prevDisabled ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    ...dis(prevDisabled),
                }}
            >
                <span style={{ display: 'inline-flex' }}><IconChevLeft /></span>
                Previous
            </button>
            <span
                style={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    minWidth: 100,
                    textAlign: 'center',
                }}
            >
                {label}
            </span>
            <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border-secondary)',
                    background: 'var(--color-background-tertiary)',
                    color: 'var(--color-text-primary)',
                    cursor: nextDisabled ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    ...dis(nextDisabled),
                }}
            >
                Next
                <span style={{ display: 'inline-flex' }}><IconChevRight /></span>
            </button>
        </div>
    );
}

/* ——— PDFViewer ——— */

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

type PDFViewerProps = {
    file: FileItem;
    onPrev: () => void;
    onNext: () => void;
    currentIndex: number;
    total: number;
};

function PDFViewer({ file, onPrev, onNext, currentIndex, total }: PDFViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [isRendering, setIsRendering] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        setPageNumber(1);
        setZoom(100);
        setLoadError(null);
        setPdfDoc(null);
        setTotalPages(0);

        let cancelled = false;
        let loaded: pdfjsLib.PDFDocumentProxy | null = null;
        const load = async () => {
            try {
                const task = pdfjsLib.getDocument({ url: file.url, withCredentials: false });
                const pdf = await task.promise;
                if (cancelled) {
                    await pdf.destroy();
                    return;
                }
                loaded = pdf;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
            } catch {
                if (!cancelled) setLoadError('Failed to load PDF.');
            }
        };
        void load();
        return () => {
            cancelled = true;
            if (loaded) {
                void loaded.destroy();
            }
        };
    }, [file.id, file.url]);

    const renderTaskRef = useRef<ReturnType<pdfjsLib.PDFPageProxy['render']> | null>(null);

    useLayoutEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const run = async () => {
            setIsRendering(true);
            try {
                renderTaskRef.current?.cancel();
                const page = await pdfDoc.getPage(pageNumber);
                const scale = zoom / 100;
                const viewport = page.getViewport({ scale });
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const renderContext = { canvasContext: context, viewport, canvas };
                const task = page.render(renderContext);
                renderTaskRef.current = task;
                await task.promise;
            } catch {
                /* render cancelled or page missing */
            } finally {
                setIsRendering(false);
                renderTaskRef.current = null;
            }
        };
        void run();
        return () => {
            try {
                renderTaskRef.current?.cancel();
            } catch {
                /* noop */
            }
            renderTaskRef.current = null;
        };
    }, [pdfDoc, pageNumber, zoom, file.id]);

    const canPrevPage = pageNumber > 1;
    const canNextPage = totalPages > 0 && pageNumber < totalPages;

    const setZoomClamped = (z: number) => {
        const n = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
        const stepped = Math.round((n - ZOOM_MIN) / ZOOM_STEP) * ZOOM_STEP + ZOOM_MIN;
        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped)));
    };

    const navPrevDisabled = currentIndex <= 0;
    const navNextDisabled = currentIndex < 0 || currentIndex >= total - 1;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    background: 'var(--color-background-secondary)',
                }}
            >
                <button
                    type="button"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={!canPrevPage}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-secondary)',
                        background: 'var(--color-background-tertiary)',
                        color: 'var(--color-text-primary)',
                        cursor: canPrevPage ? 'pointer' : 'not-allowed',
                        ...(canPrevPage ? {} : { opacity: 0.35, pointerEvents: 'none' }),
                    }}
                >
                    ‹
                </button>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {totalPages > 0 ? (
                        <>
                            {pageNumber} / {totalPages}
                        </>
                    ) : (
                        '— / —'
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => setPageNumber((p) => Math.min(totalPages || p, p + 1))}
                    disabled={!canNextPage}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-secondary)',
                        background: 'var(--color-background-tertiary)',
                        color: 'var(--color-text-primary)',
                        cursor: canNextPage ? 'pointer' : 'not-allowed',
                        ...(canNextPage ? {} : { opacity: 0.35, pointerEvents: 'none' }),
                    }}
                >
                    ›
                </button>
                <span style={{ width: 1, height: 20, background: 'var(--color-border-tertiary)', margin: '0 4px' }} />
                <button
                    type="button"
                    onClick={() => setZoomClamped(zoom - ZOOM_STEP)}
                    disabled={zoom <= ZOOM_MIN}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-secondary)',
                        background: 'var(--color-background-tertiary)',
                        color: 'var(--color-text-primary)',
                        cursor: zoom > ZOOM_MIN ? 'pointer' : 'not-allowed',
                        ...(zoom > ZOOM_MIN ? {} : { opacity: 0.35, pointerEvents: 'none' }),
                    }}
                >
                    −
                </button>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', minWidth: 52, textAlign: 'center' }}>
                    {zoom}%
                </span>
                <button
                    type="button"
                    onClick={() => setZoomClamped(zoom + ZOOM_STEP)}
                    disabled={zoom >= ZOOM_MAX}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-secondary)',
                        background: 'var(--color-background-tertiary)',
                        color: 'var(--color-text-primary)',
                        cursor: zoom < ZOOM_MAX ? 'pointer' : 'not-allowed',
                        ...(zoom < ZOOM_MAX ? {} : { opacity: 0.35, pointerEvents: 'none' }),
                    }}
                >
                    +
                </button>
                <a
                    href={file.url}
                    download
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-info)',
                        color: 'var(--color-text-info)',
                        background: 'var(--color-background-info)',
                        textDecoration: 'none',
                        fontSize: 13,
                    }}
                >
                    <IconDownload />
                    Download
                </a>
            </div>

            <div
                style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: 16,
                    background: 'var(--color-background-tertiary)',
                }}
            >
                {loadError && (
                    <div style={{ color: 'var(--color-text-secondary)', padding: 16 }}>{loadError}</div>
                )}
                {!loadError && (
                    <div style={{ position: 'relative' }}>
                        {isRendering && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2,
                                }}
                            >
                                <IconSpinner />
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            style={{
                                display: 'block',
                                maxWidth: '100%',
                                height: 'auto',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                            }}
                        />
                    </div>
                )}
            </div>

            <NavBar
                onPrev={onPrev}
                onNext={onNext}
                label={total > 0 ? `File ${currentIndex + 1} of ${total}` : 'File 0 of 0'}
                prevDisabled={navPrevDisabled}
                nextDisabled={navNextDisabled}
            />
        </div>
    );
}

/* ——— VideoPlayer ——— */

type VideoPlayerProps = {
    file: FileItem;
    onPrev: () => void;
    onNext: () => void;
    currentIndex: number;
    total: number;
};

function VideoPlayer({ file, onPrev, onNext, currentIndex, total }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrubRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isWaiting, setIsWaiting] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [scrubDragging, setScrubDragging] = useState(false);

    const clearHide = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    };

    const scheduleHide = useCallback(() => {
        clearHide();
        if (!isPlaying) return;
        hideTimerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 2500);
    }, [isPlaying]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        v.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsWaiting(true);
        setShowControls(true);
    }, [file.id, file.url]);

    useEffect(() => {
        if (isPlaying) scheduleHide();
        else {
            clearHide();
            setShowControls(true);
        }
        return () => clearHide();
    }, [isPlaying, scheduleHide]);

    const onMouseMoveOnShell = () => {
        setShowControls(true);
        if (isPlaying) scheduleHide();
    };

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) void v.play();
        else v.pause();
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
    };

    const onVolumeInput = (e: ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current;
        if (!v) return;
        const vol = Number(e.target.value);
        v.volume = vol;
        v.muted = vol === 0;
    };

    const seekFromRatio = useCallback((ratio: number) => {
        const v = videoRef.current;
        if (!v || !Number.isFinite(duration) || duration <= 0) return;
        v.currentTime = Math.min(duration, Math.max(0, ratio * duration));
    }, [duration]);

    const onScrubMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setScrubDragging(true);
        const rect = scrubRef.current?.getBoundingClientRect();
        if (rect) seekFromRatio((e.clientX - rect.left) / rect.width);
    };

    useEffect(() => {
        if (!scrubDragging) return;
        const onMove = (e: MouseEvent) => {
            const rect = scrubRef.current?.getBoundingClientRect();
            if (!rect) return;
            seekFromRatio((e.clientX - rect.left) / rect.width);
        };
        const onUp = () => setScrubDragging(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [scrubDragging, seekFromRatio]);

    const goFullscreen = () => {
        const v = videoRef.current;
        if (!v) return;
        void v.requestFullscreen().catch(() => {
            /* ignore */
        });
    };

    const progress = duration > 0 ? currentTime / duration : 0;
    const navPrevDisabled = currentIndex <= 0;
    const navNextDisabled = currentIndex < 0 || currentIndex >= total - 1;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
            }}
        >
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#000',
                    position: 'relative',
                }}
                onMouseMove={onMouseMoveOnShell}
            >
                <video
                    ref={videoRef}
                    src={file.url}
                    playsInline
                    style={{
                        width: '100%',
                        flex: 1,
                        minHeight: 200,
                        objectFit: 'contain',
                        background: '#000',
                    }}
                    onTimeUpdate={(e) => {
                        if (!scrubDragging) setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onDurationChange={(e) => {
                        setDuration(e.currentTarget.duration || 0);
                    }}
                    onEnded={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }}
                    onWaiting={() => setIsWaiting(true)}
                    onCanPlay={() => setIsWaiting(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onVolumeChange={(e) => {
                        setVolume(e.currentTarget.volume);
                        setIsMuted(e.currentTarget.muted);
                    }}
                />
                {isWaiting && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '42%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div style={{ filter: 'brightness(2)' }}>
                            <IconSpinner />
                        </div>
                    </div>
                )}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: 12,
                        background: 'rgba(15,15,18,0.97)',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        pointerEvents: showControls ? 'auto' : 'none',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 10,
                        }}
                    >
                        <div
                            ref={scrubRef}
                            onMouseDown={onScrubMouseDown}
                            style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background: 'rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${progress * 100}%`,
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.75)',
                                }}
                            />
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={togglePlay}
                            style={{
                                color: 'rgba(255,255,255,0.92)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            {isPlaying ? <IconPause /> : <IconPlay />}
                        </button>
                        <button
                            type="button"
                            onClick={toggleMute}
                            style={{
                                color: 'rgba(255,255,255,0.92)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            {isMuted || volume === 0 ? <IconMute /> : <IconVolume />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={onVolumeInput}
                            style={{ width: 100, accentColor: 'rgba(255,255,255,0.8)' }}
                        />
                        <button
                            type="button"
                            onClick={goFullscreen}
                            style={{
                                color: 'rgba(255,255,255,0.92)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            <IconFullscreen />
                        </button>
                        <a
                            href={file.url}
                            download
                            style={{
                                color: 'rgba(200,220,255,0.95)',
                                fontSize: 13,
                                marginLeft: 'auto',
                            }}
                        >
                            Download
                        </a>
                    </div>
                </div>
            </div>

            <NavBar
                onPrev={onPrev}
                onNext={onNext}
                label={total > 0 ? `File ${currentIndex + 1} of ${total}` : 'File 0 of 0'}
                prevDisabled={navPrevDisabled}
                nextDisabled={navNextDisabled}
            />
        </div>
    );
}

/* ——— FileViewerPanel ——— */

type FileViewerPanelProps = {
    file: FileItem;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    currentIndex: number;
    total: number;
};

function FileViewerPanel({ file, onClose, onPrev, onNext, currentIndex, total }: FileViewerPanelProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                flex: 1,
                background: 'var(--color-background-primary)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    background: 'var(--color-background-secondary)',
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: 15,
                            color: 'var(--color-text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {file.name}
                    </div>
                </div>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'var(--color-background-info)',
                        color: 'var(--color-text-info)',
                        border: '1px solid var(--color-border-info)',
                    }}
                >
                    {file.type}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{file.size}</span>
                {file.type === 'video' && file.duration && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{file.duration}</span>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid var(--color-border-tertiary)',
                        background: 'var(--color-background-tertiary)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                    }}
                >
                    <IconClose />
                </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {file.type === 'pdf' ? (
                    <PDFViewer
                        file={file}
                        onPrev={onPrev}
                        onNext={onNext}
                        currentIndex={currentIndex}
                        total={total}
                    />
                ) : (
                    <VideoPlayer
                        file={file}
                        onPrev={onPrev}
                        onNext={onNext}
                        currentIndex={currentIndex}
                        total={total}
                    />
                )}
            </div>
        </div>
    );
}

/* ——— SectionList ——— */

type SectionListProps = {
    sections: Section[];
    activeFile: FileItem | null;
    onSelectFile: (f: FileItem) => void;
    width: number;
};

function SectionList({ sections, activeFile, onSelectFile, width }: SectionListProps) {
    const [open, setOpen] = useState<Record<number, boolean>>(() => {
        const o: Record<number, boolean> = {};
        for (const s of sections) o[s.id] = true;
        return o;
    });

    return (
        <div
            style={{
                width,
                minWidth: width,
                maxWidth: width,
                height: '100%',
                overflow: 'auto',
                borderRight: '1px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
            }}
        >
            {sections.map((sec) => (
                <div
                    key={sec.id}
                    style={{
                        borderBottom: '1px solid var(--color-border-tertiary)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setOpen((p) => ({ ...p, [sec.id]: !p[sec.id] }))}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 14px',
                            background: 'var(--color-background-tertiary)',
                            color: 'var(--color-text-primary)',
                            fontWeight: 600,
                            fontSize: 14,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        {sec.title}
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{open[sec.id] ? '▼' : '▶'}</span>
                    </button>
                    {open[sec.id] && (
                        <div>
                            {sec.files.map((f) => {
                                const active = activeFile?.id === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => onSelectFile(f)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '10px 14px 10px 22px',
                                            border: 'none',
                                            borderTop: '1px solid var(--color-border-tertiary)',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            background: active
                                                ? 'var(--color-background-info)'
                                                : 'var(--color-background-primary)',
                                            color: active
                                                ? 'var(--color-text-info)'
                                                : 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {f.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/* ——— CourseViewer (root) ——— */

export type CourseViewerProps = {
    sections: Section[];
};

export function CourseViewer({ sections }: CourseViewerProps) {
    const allFiles = useMemo(() => sections.flatMap((s) => s.files), [sections]);

    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [leftWidth, setLeftWidth] = useState(300);
    const dragRef = useRef(false);
    const startXRef = useRef(0);
    const startWRef = useRef(300);

    const didAutoSelect = useRef(false);
    useEffect(() => {
        didAutoSelect.current = false;
    }, [sections]);

    useEffect(() => {
        if (didAutoSelect.current) return;
        if (allFiles.length) {
            setActiveFile(allFiles[0] ?? null);
            didAutoSelect.current = true;
        }
    }, [allFiles]);

    const currentIndex = activeFile ? allFiles.findIndex((f) => f.id === activeFile.id) : -1;
    const total = allFiles.length;

    const onPrev = useCallback(() => {
        if (currentIndex <= 0) return;
        setActiveFile(allFiles[currentIndex - 1] ?? null);
    }, [allFiles, currentIndex]);

    const onNext = useCallback(() => {
        if (currentIndex < 0 || currentIndex >= allFiles.length - 1) return;
        setActiveFile(allFiles[currentIndex + 1] ?? null);
    }, [allFiles, currentIndex]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragRef.current) return;
            const delta = e.clientX - startXRef.current;
            const w = startWRef.current + delta;
            setLeftWidth(Math.min(480, Math.max(220, w)));
        };
        const onUp = () => {
            dragRef.current = false;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    return (
        <div style={shellStyle}>
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                }}
            >
                <SectionList
                    width={leftWidth}
                    sections={sections}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                />
                <div
                    onMouseDown={(e) => {
                        e.preventDefault();
                        dragRef.current = true;
                        startXRef.current = e.clientX;
                        startWRef.current = leftWidth;
                    }}
                    style={{
                        width: 6,
                        cursor: 'col-resize',
                        flexShrink: 0,
                        background: 'var(--color-border-tertiary)',
                    }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {activeFile ? (
                        <FileViewerPanel
                            file={activeFile}
                            onClose={() => setActiveFile(null)}
                            onPrev={onPrev}
                            onNext={onNext}
                            currentIndex={currentIndex}
                            total={total}
                        />
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-tertiary)',
                                fontSize: 15,
                            }}
                        >
                            Select a file
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
