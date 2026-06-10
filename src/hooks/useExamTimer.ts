import { useState, useEffect, useRef, useCallback } from 'react';
import { syncAttemptTime } from '@/api/services/attempts.service';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseExamTimerOptions {
    /** UTC ISO-8601 string — the moment the attempt ends */
    attemptEndDate: string;
    /** Attempt ID for periodic sync calls */
    attemptId: string;
    /** Called once when the timer reaches zero */
    onExpire?: () => void;
    /** Interval (ms) for the NTP sync. Default: 30 000 (30 s) */
    syncIntervalMs?: number;
    /** Disable the hook (e.g. while loading or submitting) */
    disabled?: boolean;
}

export interface UseExamTimerReturn {
    /** Remaining time in whole seconds (≥ 0) */
    remainingSeconds: number;
    /** Pre-formatted "MM:SS" string */
    formattedTime: string;
    /** True when remaining time has reached zero */
    isExpired: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalize a possibly-missing-Z date string to UTC */
const toUtcMs = (dateStr: string): number => {
    const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    return new Date(normalized).getTime();
};

/** Format seconds → "MM:SS" */
const fmtTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * useExamTimer — Drift-proof countdown timer.
 *
 * ✅  Computes remaining time as `endTime - Date.now() + offset`
 *     (never decrements a variable).
 * ✅  Re-calculates on `visibilitychange` and `focus` events
 *     so sleep / tab-switch / minimize cannot cause drift.
 * ✅  Periodically calls the `/sync` endpoint (NTP-style)
 *     to detect client clock manipulation and recalibrate.
 */
export function useExamTimer({
    attemptEndDate,
    attemptId,
    onExpire,
    syncIntervalMs = 30_000,
    disabled = false,
}: UseExamTimerOptions): UseExamTimerReturn {

    // ── Mutable refs ────────────────────────────────────────────────────
    const endTimeMsRef = useRef<number>(toUtcMs(attemptEndDate));
    const clockOffsetRef = useRef<number>(0);   // serverTime - clientTime
    const expiredRef = useRef(false);
    const onExpireRef = useRef(onExpire);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    // ── State exposed to the component ──────────────────────────────────
    const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
        const ms = endTimeMsRef.current - Date.now();
        return Math.max(0, Math.floor(ms / 1000));
    });

    // Derived
    const isExpired = remainingSeconds <= 0;
    const formattedTime = fmtTime(remainingSeconds);

    // ── Core recalculation ──────────────────────────────────────────────
    const recalc = useCallback(() => {
        if (disabled) return;

        // remaining = endTime − (now − offset)
        //           = endTime − now + offset
        const nowMs = Date.now();
        const remaining = endTimeMsRef.current - nowMs + clockOffsetRef.current;
        const secs = Math.max(0, Math.floor(remaining / 1000));
        setRemainingSeconds(secs);

        if (secs <= 0 && !expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
        }
    }, [disabled]);

    // ── 1 Hz display tick (only triggers recalc, never decrements) ──────
    useEffect(() => {
        if (disabled) return;
        // Recalc immediately
        recalc();
        const id = setInterval(recalc, 1_000);
        return () => clearInterval(id);
    }, [recalc, disabled]);

    // ── Visibility / focus listeners ────────────────────────────────────
    useEffect(() => {
        if (disabled) return;

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') recalc();
        };
        const handleFocus = () => recalc();

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
        };
    }, [recalc, disabled]);

    // ── Periodic NTP sync ───────────────────────────────────────────────
    useEffect(() => {
        if (disabled || !attemptId) return;

        let cancelled = false;

        const doSync = async () => {
            try {
                const beforeMs = Date.now();
                const syncData = await syncAttemptTime(attemptId);
                const afterMs = Date.now();

                if (cancelled) return;

                // Round-trip latency estimation (NTP simplified)
                const rtt = afterMs - beforeMs;
                const serverNowMs = toUtcMs(syncData.serverTime) + rtt / 2;
                const clientNowMs = afterMs;

                // Update offset
                clockOffsetRef.current = serverNowMs - clientNowMs;

                // Update end time from server-authoritative value
                endTimeMsRef.current = toUtcMs(syncData.attemptEndTime);

                // Force immediate recalc
                recalc();
            } catch {
                // Sync failure is non-fatal; timer continues with last known offset
                console.warn('[useExamTimer] sync failed — continuing with current offset');
            }
        };

        // Initial sync after a short delay (let the UI settle)
        const initialTimeout = setTimeout(doSync, 2_000);

        // Periodic sync
        const syncInterval = setInterval(doSync, syncIntervalMs);

        return () => {
            cancelled = true;
            clearTimeout(initialTimeout);
            clearInterval(syncInterval);
        };
    }, [attemptId, syncIntervalMs, disabled, recalc]);

    // ── Update endTime when the prop changes ────────────────────────────
    useEffect(() => {
        endTimeMsRef.current = toUtcMs(attemptEndDate);
        expiredRef.current = false;
        recalc();
    }, [attemptEndDate, recalc]);

    return { remainingSeconds, formattedTime, isExpired };
}
