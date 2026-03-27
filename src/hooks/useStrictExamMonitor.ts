import { useState, useEffect, useRef, useCallback } from 'react';

export interface Violation {
    type: 'tab-switch' | 'fullscreen-exit' | 'blur' | 'context-menu';
    timestamp: Date;
    message: string;
}

export interface UseStrictExamMonitorReturn {
    violationCount: number;
    showViolationModal: boolean;
    isFullscreen: boolean;
    violations: Violation[];
    requestFullscreen: () => Promise<void>;
    handleViolationAck: () => void;
    setupExamMonitoring: (containerElement: HTMLElement | null) => void;
    cleanupMonitoring: () => void;
    hasAutoSubmitted: boolean;
}

/**
 * useStrictExamMonitor Hook
 * 
 * Enforces strict exam security by:
 * - Detecting tab switches and minimizations
 * - Enforcing fullscreen mode
 * - Preventing right-click, text selection, copy/paste
 * - Implementing 3-strike violation rule (auto-submit on 3rd violation)
 * 
 * Usage:
 * const { violationCount, showViolationModal, ... } = useStrictExamMonitor();
 * 
 * Setup:
 * 1. Call requestFullscreen() before exam starts (show FullscreenPrompt)
 * 2. Call setupExamMonitoring(quizContainerElement) once accepted
 * 3. Call cleanupMonitoring() on unmount
 * 4. When violationCount reaches 3, auto-submit and lock exam
 */
export const useStrictExamMonitor = (onAutoSubmit?: () => void): UseStrictExamMonitorReturn => {
    const [violationCount, setViolationCount] = useState(0);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [currentViolation, setCurrentViolation] = useState<{ number: number; reason: string } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
    const [isInGracePeriod, setIsInGracePeriod] = useState(true);

    const monitiorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const graceperiodTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const lastViolationTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLElement | null>(null);

    // Debounce violations - max 1 per second to prevent spam
    // Also skip if in grace period (first 3 seconds after fullscreen)
    const canRecordViolation = useCallback((): boolean => {
        if (isInGracePeriod) {
            return false; // Ignore violations during grace period
        }
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 1000) {
            return false;
        }
        lastViolationTimeRef.current = now;
        return true;
    }, [isInGracePeriod]);

    // Record a violation
    const recordViolation = useCallback(
        (type: Violation['type'], message: string) => {
            if (!canRecordViolation()) return;

            const newViolation: Violation = {
                type,
                timestamp: new Date(),
                message,
            };

            setViolations((prev) => [...prev, newViolation]);
            const newCount = violationCount + 1;
            setViolationCount(newCount);

            // Show violation modal but not the 3rd one (we auto-submit instead)
            if (newCount < 3) {
                setCurrentViolation({ number: newCount, reason: message });
                setShowViolationModal(true);
            } else {
                // 3rd violation - auto-submit
                console.warn('[Exam] 3rd violation detected - AUTO-SUBMITTING exam');
                setHasAutoSubmitted(true);
                if (onAutoSubmit) {
                    setTimeout(() => onAutoSubmit(), 500);
                }
            }
        },
        [violationCount, canRecordViolation, onAutoSubmit]
    );

    // Request fullscreen mode
    const requestFullscreen = useCallback(async (): Promise<void> => {
        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
                setIsFullscreen(true);
                console.log('[Exam] Fullscreen mode activated');
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
                setIsFullscreen(true);
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
                setIsFullscreen(true);
            }
        } catch (error) {
            console.error('[Exam] Failed to request fullscreen:', error);
            throw error;
        }
    }, []);

    // Handle fullscreen change
    const handleFullscreenChange = useCallback(() => {
        const isCurrentlyFullscreen =
            !!(document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement);

        if (!isCurrentlyFullscreen && isFullscreen && !hasAutoSubmitted) {
            // User exited fullscreen intentionally
            recordViolation('fullscreen-exit', 'Exited fullscreen mode during exam');
        }

        setIsFullscreen(isCurrentlyFullscreen);
    }, [isFullscreen, hasAutoSubmitted, recordViolation]);

    // Handle tab/window visibility change (tab switch)
    const handleVisibilityChange = useCallback(() => {
        if (document.hidden && !hasAutoSubmitted) {
            recordViolation('tab-switch', 'Switched to another tab or minimized window');
        }
    }, [hasAutoSubmitted, recordViolation]);

    // Handle window blur (alt-tab, minimize, etc)
    const handleBlur = useCallback(() => {
        if (!hasAutoSubmitted) {
            // Small delay to distinguish from tab-switch
            setTimeout(() => {
                if (document.hidden || !document.hasFocus()) {
                    recordViolation('blur', 'Window lost focus (Alt+Tab or minimize)');
                }
            }, 100);
        }
    }, [hasAutoSubmitted, recordViolation]);

    // Prevent right-click (context menu)
    const handleContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
        recordViolation('context-menu', 'Attempted to use context menu (right-click)');
        return false;
    }, [recordViolation]);

    // Prevent text selection
    const handleSelectStart = useCallback((e: Event) => {
        if (containerRef.current && containerRef.current.contains(e.target as Node)) {
            (e as any).preventDefault?.();
        }
    }, []);

    // Prevent copy/cut/paste via keyboard
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z
        if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'z'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }, []);

    // Prevent copy event
    const handleCopy = useCallback((e: Event) => {
        e.preventDefault();
        return false;
    }, []);

    // Prevent cut event
    const handleCut = useCallback((e: Event) => {
        e.preventDefault();
        return false;
    }, []);

    // Prevent paste event
    const handlePaste = useCallback((e: Event) => {
        e.preventDefault();
        return false;
    }, []);

    // Prevent drag and drop
    const handleDragStart = useCallback((e: DragEvent) => {
        e.preventDefault();
        return false;
    }, []);

    // Setup monitoring on container
    const setupExamMonitoring = useCallback((element: HTMLElement | null) => {
        containerRef.current = element;

        if (!element) return;

        // Start 3-second grace period to ignore violations from fullscreen entry
        console.log('[Exam] Grace period: ignoring violations for 3 seconds');
        if (graceperiodTimeoutRef.current) clearTimeout(graceperiodTimeoutRef.current);
        graceperiodTimeoutRef.current = setTimeout(() => {
            setIsInGracePeriod(false);
            console.log('[Exam] Grace period ended - strict monitoring now active');
        }, 3000);

        // Global events (document-level)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);

        // Container-specific events
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('contextmenu', handleContextMenu);

        console.log('[Exam] Strict monitoring active');
    }, [
        handleVisibilityChange,
        handleFullscreenChange,
        handleBlur,
        handleContextMenu,
        handleSelectStart,
        handleKeyDown,
        handleCopy,
        handleCut,
        handlePaste,
        handleDragStart,
    ]);

    // Cleanup monitoring
    const cleanupMonitoring = useCallback(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('paste', handlePaste);

        if (containerRef.current) {
            containerRef.current.removeEventListener('dragstart', handleDragStart);
            containerRef.current.removeEventListener('contextmenu', handleContextMenu);
        }

        if (monitiorTimeoutRef.current) {
            clearTimeout(monitiorTimeoutRef.current);
        }
        if (graceperiodTimeoutRef.current) {
            clearTimeout(graceperiodTimeoutRef.current);
        }

        console.log('[Exam] Monitoring cleaned up');
    }, [
        handleVisibilityChange,
        handleFullscreenChange,
        handleBlur,
        handleContextMenu,
        handleSelectStart,
        handleKeyDown,
        handleCopy,
        handleCut,
        handlePaste,
        handleDragStart,
    ]);

    // Acknowledge violation modal
    const handleViolationAck = useCallback(() => {
        setShowViolationModal(false);
        setCurrentViolation(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupMonitoring();
        };
    }, [cleanupMonitoring]);

    return {
        violationCount,
        showViolationModal,
        isFullscreen,
        violations,
        requestFullscreen,
        handleViolationAck,
        setupExamMonitoring,
        cleanupMonitoring,
        hasAutoSubmitted,
    };
};
