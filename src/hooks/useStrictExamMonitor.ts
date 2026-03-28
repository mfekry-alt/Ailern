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

// 🌟 MAGIC TOGGLE: Set to 'true' for final production/presentation, 'false' for easy development
const IS_STRICT_MODE_ENABLED = false;

/**
 * useStrictExamMonitor Hook
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

    const canRecordViolation = useCallback((): boolean => {
        if (!IS_STRICT_MODE_ENABLED || isInGracePeriod) return false;

        const now = Date.now();
        if (now - lastViolationTimeRef.current < 1000) return false;

        lastViolationTimeRef.current = now;
        return true;
    }, [isInGracePeriod]);

    const recordViolation = useCallback(
        (type: Violation['type'], message: string) => {
            if (!IS_STRICT_MODE_ENABLED) {
                console.log(`[Exam Relaxed Mode] Ignored violation: ${type} - ${message}`);
                return;
            }

            if (!canRecordViolation()) return;

            const newViolation: Violation = { type, timestamp: new Date(), message };
            setViolations((prev) => [...prev, newViolation]);

            const newCount = violationCount + 1;
            setViolationCount(newCount);

            if (newCount < 3) {
                setCurrentViolation({ number: newCount, reason: message });
                setShowViolationModal(true);
            } else {
                console.warn('[Exam] 3rd violation detected - AUTO-SUBMITTING exam');
                setHasAutoSubmitted(true);
                if (onAutoSubmit) setTimeout(() => onAutoSubmit(), 500);
            }
        },
        [violationCount, canRecordViolation, onAutoSubmit]
    );

    const requestFullscreen = useCallback(async (): Promise<void> => {
        if (!IS_STRICT_MODE_ENABLED) {
            console.log('[Exam Relaxed Mode] Bypassing actual fullscreen request');
            setIsFullscreen(true);
            return Promise.resolve();
        }

        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            }
            setIsFullscreen(true);
            console.log('[Exam] Fullscreen mode activated');
        } catch (error) {
            console.error('[Exam] Failed to request fullscreen:', error);
            throw error;
        }
    }, []);

    const handleFullscreenChange = useCallback(() => {
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement
        );

        if (!isCurrentlyFullscreen && isFullscreen && !hasAutoSubmitted) {
            recordViolation('fullscreen-exit', 'Exited fullscreen mode during exam');
        }
        setIsFullscreen(isCurrentlyFullscreen);
    }, [isFullscreen, hasAutoSubmitted, recordViolation]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden && !hasAutoSubmitted) {
            recordViolation('tab-switch', 'Switched to another tab or minimized window');
        }
    }, [hasAutoSubmitted, recordViolation]);

    const handleBlur = useCallback(() => {
        if (!hasAutoSubmitted) {
            setTimeout(() => {
                if (document.hidden || !document.hasFocus()) {
                    recordViolation('blur', 'Window lost focus (Alt+Tab or minimize)');
                }
            }, 100);
        }
    }, [hasAutoSubmitted, recordViolation]);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        if (!IS_STRICT_MODE_ENABLED) return true;
        e.preventDefault();
        recordViolation('context-menu', 'Attempted to use context menu (right-click)');
        return false;
    }, [recordViolation]);

    const handleSelectStart = useCallback((e: Event) => {
        if (!IS_STRICT_MODE_ENABLED) return;
        if (containerRef.current && containerRef.current.contains(e.target as Node)) {
            (e as any).preventDefault?.();
        }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!IS_STRICT_MODE_ENABLED) return;
        if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'z'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }, []);

    const handleCopy = useCallback((e: Event) => {
        if (!IS_STRICT_MODE_ENABLED) return true;
        e.preventDefault();
        return false;
    }, []);

    const handleCut = useCallback((e: Event) => {
        if (!IS_STRICT_MODE_ENABLED) return true;
        e.preventDefault();
        return false;
    }, []);

    const handlePaste = useCallback((e: Event) => {
        if (!IS_STRICT_MODE_ENABLED) return true;
        e.preventDefault();
        return false;
    }, []);

    const handleDragStart = useCallback((e: DragEvent) => {
        if (!IS_STRICT_MODE_ENABLED) return true;
        e.preventDefault();
        return false;
    }, []);

    const setupExamMonitoring = useCallback((element: HTMLElement | null) => {
        containerRef.current = element;
        if (!element) return;

        if (!IS_STRICT_MODE_ENABLED) {
            console.log('[Exam] Relaxed monitoring active (Strict protections bypassed)');
            return;
        }

        console.log('[Exam] Grace period: ignoring violations for 3 seconds');
        if (graceperiodTimeoutRef.current) clearTimeout(graceperiodTimeoutRef.current);
        graceperiodTimeoutRef.current = setTimeout(() => {
            setIsInGracePeriod(false);
            console.log('[Exam] Grace period ended - strict monitoring now active');
        }, 3000);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);

        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('contextmenu', handleContextMenu);

        console.log('[Exam] Strict monitoring active');
    }, [
        handleVisibilityChange, handleFullscreenChange, handleBlur,
        handleContextMenu, handleSelectStart, handleKeyDown,
        handleCopy, handleCut, handlePaste, handleDragStart,
    ]);

    const cleanupMonitoring = useCallback(() => {
        if (!IS_STRICT_MODE_ENABLED) return;

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

        if (monitiorTimeoutRef.current) clearTimeout(monitiorTimeoutRef.current);
        if (graceperiodTimeoutRef.current) clearTimeout(graceperiodTimeoutRef.current);

        console.log('[Exam] Monitoring cleaned up');
    }, [
        handleVisibilityChange, handleFullscreenChange, handleBlur,
        handleContextMenu, handleSelectStart, handleKeyDown,
        handleCopy, handleCut, handlePaste, handleDragStart,
    ]);

    const handleViolationAck = useCallback(() => {
        setShowViolationModal(false);
        setCurrentViolation(null);
    }, []);

    useEffect(() => {
        return () => cleanupMonitoring();
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