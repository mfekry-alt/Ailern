/**
 * useCourseProgress Hook - Optimized Course Progress Tracking
 *
 * Robust progress tracking system with intelligent throttling and duplicate prevention.
 *
 * Features:
 * - Video: Throttled updates every 20-30 seconds during playback
 * - Document: Save every 3-5 page changes OR after inactivity
 * - Immediate save on: pause, video end, file switch, page close
 * - Inactivity detection (5s idle)
 * - Duplicate payload prevention
 * - sendBeacon fallback for page unload
 * - visibilitychange handler for tab switching
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStudentCourseProgress } from '@/api/services/course.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateStudentCourseProgressCommand } from '@/types/api.types';

export type FileType = 'video' | 'document' | 'unknown';

export interface ProgressState {
    lastWatchedTime: number | null;
    lastPageNumber: number | null;
    lastOpenedFileId: string | null;
}

export interface UseCourseProgressOptions {
    courseId: number;
    enabled?: boolean;
    /** Video throttle interval in ms (default: 25000ms = 25s) */
    videoThrottleMs?: number;
    /** Document: save after this many page changes (default: 3) */
    documentPageBatchSize?: number;
    /** Document: save after idle time in ms (default: 3000ms) */
    documentIdleMs?: number;
    /** Inactivity timeout in ms (default: 5000ms) */
    inactivityTimeoutMs?: number;
}

export interface UseCourseProgressReturn {
    /** Update progress for the current file */
    updateProgress: (state: Partial<ProgressState>, fileType: FileType, immediate?: boolean) => void;
    /** Immediately save progress */
    saveProgressImmediate: () => Promise<void>;
    /** Get current progress state */
    getCurrentProgress: () => ProgressState;
    /** Check if there are unsaved changes */
    hasUnsavedChanges: () => boolean;
    /** Update the active file ID (saves previous file progress before switching) */
    setActiveFileId: (fileId: string, fileType: FileType) => void;
    /** Mark user as active (resets inactivity timer) */
    markActive: () => void;
    /** Whether a progress update is currently in flight */
    isUpdating: boolean;
    /** Last error from progress update */
    lastError: Error | null;
}

/** Throttle helper - executes at most once per wait period */
const createThrottler = (waitMs: number) => {
    let lastExecution = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingExecution = false;

    return {
        throttle: (callback: () => void) => {
            const now = Date.now();
            const timeSinceLast = now - lastExecution;

            if (timeSinceLast >= waitMs) {
                // Execute immediately
                lastExecution = now;
                callback();
                pendingExecution = false;
            } else if (!pendingExecution) {
                // Schedule for later
                pendingExecution = true;
                const delay = waitMs - timeSinceLast;
                timeoutId = setTimeout(() => {
                    lastExecution = Date.now();
                    callback();
                    pendingExecution = false;
                    timeoutId = null;
                }, delay);
            }
        },
        flush: () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (pendingExecution) {
                lastExecution = Date.now();
                pendingExecution = false;
            }
        },
        cancel: () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            pendingExecution = false;
        },
    };
};

/**
 * Hook for tracking and saving course progress
 */
export const useCourseProgress = (options: UseCourseProgressOptions): UseCourseProgressReturn => {
    const {
        courseId,
        enabled = true,
        videoThrottleMs = 25000,
        documentPageBatchSize = 3,
        documentIdleMs = 3000,
        inactivityTimeoutMs = 5000,
    } = options;
    const queryClient = useQueryClient();

    // Store config in refs to prevent dependency changes on parent re-renders
    const videoThrottleMsRef = useRef(videoThrottleMs);
    videoThrottleMsRef.current = videoThrottleMs;
    const documentPageBatchSizeRef = useRef(documentPageBatchSize);
    documentPageBatchSizeRef.current = documentPageBatchSize;
    const documentIdleMsRef = useRef(documentIdleMs);
    documentIdleMsRef.current = documentIdleMs;
    const inactivityTimeoutMsRef = useRef(inactivityTimeoutMs);
    inactivityTimeoutMsRef.current = inactivityTimeoutMs;
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;
    const courseIdRef = useRef(courseId);
    courseIdRef.current = courseId;

    // Current progress state (using ref to avoid re-renders on frequent updates)
    const progressRef = useRef<ProgressState>({
        lastWatchedTime: null,
        lastPageNumber: null,
        lastOpenedFileId: null,
    });

    // Track if there are unsaved changes
    const hasUnsavedChangesRef = useRef(false);

    // Track last saved state to avoid duplicate saves
    const lastSavedRef = useRef<ProgressState>({
        lastWatchedTime: null,
        lastPageNumber: null,
        lastOpenedFileId: null,
    });

    // Track the exact payload last sent to API for deduplication
    const lastSentPayloadRef = useRef<UpdateStudentCourseProgressCommand | null>(null);

    // Track current file type for proper null handling
    const currentFileTypeRef = useRef<FileType>('unknown');

    // Document page change counter for batching
    const pageChangeCountRef = useRef(0);
    const lastSavedPageRef = useRef<number | null>(null);

    // Inactivity detection
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInactiveRef = useRef(false);

    // Throttlers - recreate when throttleMs changes significantly
    const videoThrottler = useRef(createThrottler(videoThrottleMsRef.current));

    // Document idle debouncer
    const documentIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Progress mutation - using ref for stable callback reference
    const progressMutation = useMutation({
        mutationFn: async (body: UpdateStudentCourseProgressCommand) => {
            if (!enabled || courseId <= 0) return;
            await updateStudentCourseProgress(courseId, body);
        },
        onSuccess: (_data, variables) => {
            // Store the exact payload that was successfully sent
            lastSentPayloadRef.current = { ...variables };

            // Update last saved state
            lastSavedRef.current = { ...progressRef.current };
            lastSavedPageRef.current = progressRef.current.lastPageNumber;
            pageChangeCountRef.current = 0;
            hasUnsavedChangesRef.current = false;

            // Invalidate my-learning query
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.MY_LEARNING,
            });
        },
        onError: (error: Error) => {
            console.error('[useCourseProgress] Failed to save progress:', error);
        },
        retry: 2,
        retryDelay: 1000,
    });

    // Store mutate function and isPending in refs to avoid unstable dependencies
    const mutateRef = useRef(progressMutation.mutate);
    mutateRef.current = progressMutation.mutate;
    const mutateAsyncRef = useRef(progressMutation.mutateAsync);
    mutateAsyncRef.current = progressMutation.mutateAsync;
    const isPendingRef = useRef(progressMutation.isPending);
    isPendingRef.current = progressMutation.isPending;

    /**
     * Check if current payload is different from last saved
     */
    const hasPayloadChanged = useCallback((): boolean => {
        const current = progressRef.current;
        const lastSaved = lastSavedRef.current;

        const watchedTimeChanged = current.lastWatchedTime !== lastSaved.lastWatchedTime;
        const pageChanged = current.lastPageNumber !== lastSaved.lastPageNumber;
        const fileChanged = current.lastOpenedFileId !== lastSaved.lastOpenedFileId;

        return watchedTimeChanged || pageChanged || fileChanged;
    }, []);

    /**
     * Build the request body based on file type
     */
    const buildRequestBody = useCallback((): UpdateStudentCourseProgressCommand => {
        const current = progressRef.current;
        const fileType = currentFileTypeRef.current;

        if (fileType === 'video') {
            // Ensure lastWatchedTime is an integer (not floating point)
            const timeInSeconds = current.lastWatchedTime != null
                ? Math.floor(current.lastWatchedTime)
                : 0;
            return {
                lastWatchedTime: timeInSeconds,
                lastPageNumber: undefined,
                lastOpenedFileId: current.lastOpenedFileId,
            };
        } else if (fileType === 'document') {
            return {
                lastWatchedTime: undefined,
                lastPageNumber: current.lastPageNumber ?? 1,
                lastOpenedFileId: current.lastOpenedFileId,
            };
        }

        return {
            lastWatchedTime: current.lastWatchedTime != null
                ? Math.floor(current.lastWatchedTime)
                : undefined,
            lastPageNumber: current.lastPageNumber ?? undefined,
            lastOpenedFileId: current.lastOpenedFileId,
        };
    }, []);

    /**
     * Execute the progress save (checks for duplicates and in-flight requests)
     */
    const executeSave = useCallback(() => {
        const body = buildRequestBody();

        // Don't save if no file is open
        if (!body.lastOpenedFileId) return;

        // Don't save if a request is already in progress
        if (isPendingRef.current) {
            console.log('[useCourseProgress] Request already in progress, skipping duplicate');
            return;
        }

        // Don't save if payload is identical to last sent payload
        const lastSent = lastSentPayloadRef.current;
        if (lastSent &&
            body.lastWatchedTime === lastSent.lastWatchedTime &&
            body.lastPageNumber === lastSent.lastPageNumber &&
            body.lastOpenedFileId === lastSent.lastOpenedFileId) {
            console.log('[useCourseProgress] Payload identical to last sent, skipping duplicate');
            return;
        }

        // Don't save if internal state hasn't changed
        if (!hasPayloadChanged()) return;

        // Use ref to avoid dependency on progressMutation
        mutateRef.current(body);
    }, [buildRequestBody, hasPayloadChanged]);

    /**
     * Reset inactivity timer
     */
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        isInactiveRef.current = false;

        inactivityTimerRef.current = setTimeout(() => {
            isInactiveRef.current = true;
            // Save progress on inactivity
            if (hasUnsavedChangesRef.current && currentFileTypeRef.current === 'document') {
                executeSave();
            }
        }, inactivityTimeoutMsRef.current);
    }, [executeSave]);

    /**
     * Mark user as active (call this on user interactions)
     */
    const markActive = useCallback(() => {
        resetInactivityTimer();
    }, []);

    /**
     * Schedule document save after idle time
     */
    const scheduleDocumentIdleSave = useCallback(() => {
        if (documentIdleTimerRef.current) {
            clearTimeout(documentIdleTimerRef.current);
        }
        documentIdleTimerRef.current = setTimeout(() => {
            if (hasUnsavedChangesRef.current) {
                executeSave();
            }
        }, documentIdleMsRef.current);
    }, [executeSave]);

    /**
     * Update progress with throttling/batching based on file type
     */
    const updateProgress = useCallback(
        (state: Partial<ProgressState>, fileType: FileType, immediate = false) => {
            // Update current file type
            currentFileTypeRef.current = fileType;

            // Update progress state
            if (state.lastWatchedTime !== undefined) {
                progressRef.current.lastWatchedTime = state.lastWatchedTime;
            }
            if (state.lastPageNumber !== undefined) {
                progressRef.current.lastPageNumber = state.lastPageNumber;
            }
            if (state.lastOpenedFileId !== undefined) {
                progressRef.current.lastOpenedFileId = state.lastOpenedFileId;
            }

            hasUnsavedChangesRef.current = true;
            resetInactivityTimer();

            // Handle immediate saves (pause, video end, etc.)
            if (immediate) {
                videoThrottler.current.flush();
                if (documentIdleTimerRef.current) {
                    clearTimeout(documentIdleTimerRef.current);
                }
                executeSave();
                return;
            }

            // Throttle based on file type
            if (fileType === 'video') {
                // Video: throttle to every 20-30 seconds
                videoThrottler.current.throttle(executeSave);
            } else if (fileType === 'document') {
                // Document: batch by page count OR idle time
                const currentPage = progressRef.current.lastPageNumber;
                const lastSavedPage = lastSavedPageRef.current;

                if (currentPage !== lastSavedPage) {
                    pageChangeCountRef.current++;
                }

                // Save every N page changes
                if (pageChangeCountRef.current >= documentPageBatchSizeRef.current) {
                    if (documentIdleTimerRef.current) {
                        clearTimeout(documentIdleTimerRef.current);
                    }
                    executeSave();
                } else {
                    // Or save after idle time
                    scheduleDocumentIdleSave();
                }
            }
        },
        [executeSave, resetInactivityTimer, scheduleDocumentIdleSave]
    );

    /**
     * Immediately save progress
     */
    const saveProgressImmediate = useCallback(async (): Promise<void> => {
        // Cancel any pending throttled updates
        videoThrottler.current.cancel();
        if (documentIdleTimerRef.current) {
            clearTimeout(documentIdleTimerRef.current);
        }

        // Don't save if no file is open
        if (!progressRef.current.lastOpenedFileId) return;

        // Don't save if a request is already in progress
        if (isPendingRef.current) {
            console.log('[useCourseProgress] Request already in progress, skipping immediate save');
            return;
        }

        const body = buildRequestBody();

        // Don't save if payload is identical to last sent payload
        const lastSent = lastSentPayloadRef.current;
        if (lastSent &&
            body.lastWatchedTime === lastSent.lastWatchedTime &&
            body.lastPageNumber === lastSent.lastPageNumber &&
            body.lastOpenedFileId === lastSent.lastOpenedFileId) {
            console.log('[useCourseProgress] Payload identical to last sent, skipping immediate save');
            return;
        }

        // Check if there are actual changes to save
        if (!hasPayloadChanged()) return;

        try {
            // Use ref to avoid dependency on progressMutation
            await mutateAsyncRef.current(body);
        } catch (error) {
            console.error('[useCourseProgress] Immediate save failed:', error);
            throw error;
        }
    }, [hasPayloadChanged, buildRequestBody]);

    /**
     * Get current progress state
     */
    const getCurrentProgress = useCallback((): ProgressState => {
        return { ...progressRef.current };
    }, []);

    /**
     * Check if there are unsaved changes
     */
    const hasUnsavedChanges = useCallback((): boolean => {
        return hasUnsavedChangesRef.current;
    }, []);

    /**
     * Set the active file ID (saves previous file progress before switching)
     */
    const setActiveFileId = useCallback(
        (fileId: string, fileType: FileType) => {
            const previousFileId = progressRef.current.lastOpenedFileId;

            // If switching files, save progress of current file first
            if (previousFileId && previousFileId !== fileId && hasUnsavedChangesRef.current) {
                videoThrottler.current.cancel();
                if (documentIdleTimerRef.current) {
                    clearTimeout(documentIdleTimerRef.current);
                }
                executeSave();
            }

            // Update file type and ID
            currentFileTypeRef.current = fileType;
            progressRef.current.lastOpenedFileId = fileId;

            // Reset progress values based on new file type
            if (fileType === 'video') {
                progressRef.current.lastWatchedTime = 0;
                progressRef.current.lastPageNumber = null;
            } else if (fileType === 'document') {
                progressRef.current.lastWatchedTime = null;
                progressRef.current.lastPageNumber = 1;
                pageChangeCountRef.current = 0;
                lastSavedPageRef.current = null;
            }

            hasUnsavedChangesRef.current = false;
            lastSavedRef.current = { ...progressRef.current };
        },
        [executeSave]
    );

    // Handle page unload / navigation away
    useEffect(() => {
        if (!enabledRef.current) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChangesRef.current) {
                // Cancel pending updates
                videoThrottler.current.cancel();
                if (documentIdleTimerRef.current) {
                    clearTimeout(documentIdleTimerRef.current);
                }

                // Use sendBeacon as best-effort fallback
                const body = buildRequestBody();
                if (body.lastOpenedFileId) {
                    try {
                        const beaconData = JSON.stringify(body);
                        const endpoint = `/api/Courses/${courseId}/progress`;
                        navigator.sendBeacon?.(endpoint, beaconData);
                    } catch {
                        // Silent fail
                    }
                }

                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Tab is being hidden - save progress
                if (hasUnsavedChangesRef.current) {
                    videoThrottler.current.cancel();
                    if (documentIdleTimerRef.current) {
                        clearTimeout(documentIdleTimerRef.current);
                    }
                    // Try to save immediately
                    saveProgressImmediate().catch(() => {
                        // Silent fail
                    });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Setup inactivity timer
        resetInactivityTimer();

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (documentIdleTimerRef.current) {
                clearTimeout(documentIdleTimerRef.current);
            }
            // Save any pending progress on unmount
            if (hasUnsavedChangesRef.current) {
                saveProgressImmediate().catch(() => {
                    // Silent fail on unmount
                });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stable return object to prevent unnecessary re-renders in consuming components
    const returnValue = useMemo(() => ({
        updateProgress,
        saveProgressImmediate,
        getCurrentProgress,
        hasUnsavedChanges,
        setActiveFileId,
        markActive,
        isUpdating: progressMutation.isPending,
        lastError: progressMutation.error,
    }), [
        updateProgress,
        saveProgressImmediate,
        getCurrentProgress,
        hasUnsavedChanges,
        setActiveFileId,
        markActive,
        progressMutation.isPending,
        progressMutation.error,
    ]);

    return returnValue;
};

export default useCourseProgress;
