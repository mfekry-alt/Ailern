/**
 * NotificationToast
 *
 * Renders a stacked, animated floating toast container.
 * Each toast:
 *  - Slides in from the right (desktop) / top-center (mobile)
 *  - Displays a type-specific icon and color scheme
 *  - Auto-dismisses after 2 seconds with a fade-out animation
 *  - Up to 3 toasts are visible simultaneously
 */

import { useEffect, useRef, useState } from 'react';
import {
    BookOpen,
    CheckCircle2,
    Clock,
    FileQuestion,
    FolderOpen,
    Sparkles,
    Trash2,
    ClipboardList,
} from 'lucide-react';
import { NotificationType } from '@/api/signalr/notificationHub';
import { useNotificationStore, type ToastNotification } from './store';

// ─── Per-type visual config ────────────────────────────────────────────────────

interface TypeConfig {
    Icon: React.ElementType;
    /** Tailwind gradient/bg classes for the icon badge */
    iconBg: string;
    /** Icon colour */
    iconColor: string;
    /** Left accent bar colour */
    accent: string;
    /** Subtle background tint */
    tint: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
    [NotificationType.NewAssignmentAdded]: {
        Icon: ClipboardList,
        iconBg: 'bg-indigo-500/15',
        iconColor: 'text-indigo-400',
        accent: 'bg-indigo-500',
        tint: 'dark:bg-indigo-950/30',
    },
    [NotificationType.CourseMaterialsUpdated]: {
        Icon: FolderOpen,
        iconBg: 'bg-blue-500/15',
        iconColor: 'text-blue-400',
        accent: 'bg-blue-500',
        tint: 'dark:bg-blue-950/30',
    },
    [NotificationType.NewQuizAdded]: {
        Icon: FileQuestion,
        iconBg: 'bg-orange-500/15',
        iconColor: 'text-orange-400',
        accent: 'bg-orange-500',
        tint: 'dark:bg-orange-950/30',
    },
    [NotificationType.AttemptReviewed]: {
        Icon: CheckCircle2,
        iconBg: 'bg-emerald-500/15',
        iconColor: 'text-emerald-400',
        accent: 'bg-emerald-500',
        tint: 'dark:bg-emerald-950/30',
    },
    [NotificationType.DeadlineReached]: {
        Icon: Clock,
        iconBg: 'bg-red-500/15',
        iconColor: 'text-red-400',
        accent: 'bg-red-500',
        tint: 'dark:bg-red-950/30',
    },
    [NotificationType.AiQuestionGenerationFinished]: {
        Icon: Sparkles,
        iconBg: 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20',
        iconColor: 'text-cyan-400',
        accent: 'bg-gradient-to-b from-cyan-500 to-purple-500',
        tint: 'dark:bg-purple-950/30',
    },
    [NotificationType.CourseRemovedByAdmin]: {
        Icon: Trash2,
        iconBg: 'bg-red-900/30',
        iconColor: 'text-red-400',
        accent: 'bg-red-600',
        tint: 'dark:bg-slate-800/60',
    },
};

const DISPLAY_MS = 2000;
const FADE_MS    = 400;

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: ToastNotification }) {
    const dismissToast = useNotificationStore(s => s.dismissToast);
    const [phase, setPhase] = useState<'entering' | 'visible' | 'leaving'>('entering');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG[NotificationType.NewAssignmentAdded];
    const { Icon } = cfg;

    useEffect(() => {
        // entering → visible after one paint
        const enterTimer = requestAnimationFrame(() => setPhase('visible'));

        // start leave after DISPLAY_MS
        timerRef.current = setTimeout(() => {
            setPhase('leaving');
            // remove from DOM after fade finishes
            setTimeout(() => dismissToast(toast.id), FADE_MS);
        }, DISPLAY_MS);

        return () => {
            cancelAnimationFrame(enterTimer);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [toast.id, dismissToast]);

    const translateClass =
        phase === 'entering'
            ? 'translate-x-full opacity-0 sm:translate-x-full'
            : phase === 'leaving'
            ? 'translate-x-full opacity-0 sm:translate-x-full'
            : 'translate-x-0 opacity-100';

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{ transition: `transform ${FADE_MS}ms cubic-bezier(.22,1,.36,1), opacity ${FADE_MS}ms ease` }}
            className={`relative flex items-start gap-3 w-full max-w-[360px] rounded-2xl overflow-hidden
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                border border-gray-200/60 dark:border-slate-700/50
                shadow-[0_24px_48px_-8px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_48px_-8px_rgba(0,0,0,0.55)]
                pointer-events-auto cursor-default select-none
                ${cfg.tint} ${translateClass}`}
            onClick={() => {
                setPhase('leaving');
                setTimeout(() => dismissToast(toast.id), FADE_MS);
            }}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent} rounded-l-2xl`} />

            {/* Content */}
            <div className="flex items-start gap-3 px-4 py-3.5 pl-5 w-full">
                {/* Icon badge */}
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5 ${cfg.iconBg}`}>
                    <Icon className={`w-[18px] h-[18px] ${cfg.iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug truncate">
                        {toast.title}
                    </p>
                    {toast.message && (
                        <p className="text-[11.5px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {toast.message}
                        </p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-1 font-medium tracking-wide uppercase">
                        Now
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-[2px] ${cfg.accent} rounded-full`}
                style={{
                    animation: phase === 'visible' ? `notif-progress ${DISPLAY_MS}ms linear forwards` : 'none',
                    width: '100%',
                }}
            />
        </div>
    );
}

// ─── Container ────────────────────────────────────────────────────────────────

export function NotificationToastContainer() {
    const toastQueue = useNotificationStore(s => s.toastQueue);

    if (toastQueue.length === 0) return null;

    return (
        <>
            {/* Keyframe injection */}
            <style>{`
                @keyframes notif-progress {
                    from { transform: scaleX(1); transform-origin: left; }
                    to   { transform: scaleX(0); transform-origin: left; }
                }
            `}</style>

            {/* Portal-like fixed container */}
            <div
                aria-label="Notifications"
                className={`
                    fixed z-[9999] flex flex-col gap-2.5 pointer-events-none
                    /* Mobile: top-center */
                    top-4 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-[360px]
                    /* Desktop: top-right, no centering transform */
                    sm:left-auto sm:right-5 sm:translate-x-0 sm:w-auto
                `}
            >
                {toastQueue.map(toast => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </div>
        </>
    );
}
