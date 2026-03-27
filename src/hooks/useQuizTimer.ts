import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseQuizTimerReturn {
    timeRemaining: number;
    formattedTime: string;
    isWarning: boolean;
    isPaused: boolean;
    hasExpired: boolean;
    pause: () => void;
    resume: () => void;
    formatTime: (seconds: number) => string;
}

/**
 * useQuizTimer Hook
 * 
 * Provides accurate quiz timer that survives page refresh/reconnect.
 * Timer is calculated based on server-provided start time, not local state.
 * 
 * Usage:
 * const { timeRemaining, formattedTime, isWarning, ... } = useQuizTimer({
 *   attemptStartTime: '2026-03-27T10:00:00Z', // ISO string from API
 *   timeLimit: 45,                             // in minutes
 *   onTimeExpired: () => submitExam(),
 * });
 * 
 * Key Features:
 * - Survives page refresh (uses server timestamps)
 * - Auto-expire when time hits 00:00
 * - Warnings at 5min, 1min, 30sec
 * - Pause/Resume capability
 */

interface UseQuizTimerProps {
    attemptStartTime: string; // ISO format from API
    timeLimit: number; // in minutes
    onTimeExpired?: () => void;
}

export const useQuizTimer = (props: UseQuizTimerProps | null): UseQuizTimerReturn => {
    // State declarations - MUST be called unconditionally, before any returns
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isWarning, setIsWarning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasExpired, setHasExpired] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const onTimeExpiredRef = useRef<(() => void) | undefined>(undefined);

    // Format seconds to MM:SS
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Pause timer
    const pause = useCallback(() => {
        setIsPaused(true);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, []);

    // Resume timer
    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    // Calculate remaining time based on server timestamps
    const calculateTimeRemaining = useCallback((): number => {
        if (!props) {
            return 0;
        }
        try {
            const { attemptStartTime, timeLimit } = props;
            if (!attemptStartTime || !timeLimit) return 0;

            const startTime = new Date(attemptStartTime).getTime();
            const now = Date.now();
            const elapsedMs = now - startTime;
            const totalMs = timeLimit * 60 * 1000;
            const remainingMs = totalMs - elapsedMs;
            const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
            return remainingSeconds;
        } catch (error) {
            console.error('[Timer] Error calculating remaining time:', error);
            return props ? props.timeLimit * 60 : 0;
        }
    }, [props]);

    // Initialize timer and start countdown
    useEffect(() => {
        if (!props) {
            return;
        }

        // Initial calculation
        const initial = calculateTimeRemaining();
        setTimeRemaining(initial);

        // Check warning thresholds
        if (initial <= 30) {
            setIsWarning(true);
        } else if (initial <= 60) {
            setIsWarning(true);
        } else if (initial <= 300) {
            setIsWarning(true);
        } else {
            setIsWarning(false);
        }

        // Return to allow dependencies to settle
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [props, calculateTimeRemaining]);

    // Update onTimeExpiredRef to always have latest callback (if props exist)
    useEffect(() => {
        if (props) {
            onTimeExpiredRef.current = props.onTimeExpired;
        }
    }, [props]);

    // Timer countdown loop
    useEffect(() => {
        if (!props || isPaused || hasExpired) {
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining((prevTime) => {
                // Recalculate from server time to handle refresh
                const newTime = calculateTimeRemaining();

                if (newTime <= 0 && !hasExpired) {
                    setHasExpired(true);
                    console.log('[Timer] Time expired - triggering auto-submit');

                    // Call auto-submit callback
                    if (onTimeExpiredRef.current) {
                        onTimeExpiredRef.current();
                    }

                    return 0;
                }

                // Check warning thresholds (5min, 1min, 30 sec)
                if (newTime === 300 || newTime === 60 || newTime === 30 || newTime === 10) {
                    setIsWarning(true);
                    console.log(`[Timer] Warning threshold: ${newTime}s remaining`);
                } else if (newTime > 300) {
                    setIsWarning(false);
                }

                return newTime;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [props, calculateTimeRemaining, isPaused, hasExpired]);

    // If no props, return idle state
    if (!props) {
        return {
            timeRemaining: 0,
            formattedTime: '00:00',
            isWarning: false,
            isPaused: true,
            hasExpired: false,
            pause,
            resume,
            formatTime,
        };
    }

    return {
        timeRemaining,
        formattedTime: formatTime(timeRemaining),
        isWarning,
        isPaused,
        hasExpired,
        pause,
        resume,
        formatTime,
    };
};
