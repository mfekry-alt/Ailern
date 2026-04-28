import { useEffect, useState, useCallback } from 'react';
import { Play, Lock, Calendar, Zap, AlertCircle, Clock, FileText, History, Timer, Loader2 } from 'lucide-react';
import type { GetQuizDto } from '@/types/api.types';
import type { StartAttemptResponse } from '@/api/services/attempts.service';

interface QuizCardProps {
    quiz: GetQuizDto;
    onStartQuiz: (quizId: string, resume?: boolean) => void;
    onViewAttempts?: (quizId: string) => void;
    isLoading?: boolean;
    attempts?: StartAttemptResponse[];
    parseServerDate?: (dateString?: string) => Date;
}

export const QuizCard = ({ quiz, onStartQuiz, onViewAttempts, isLoading = false, attempts = [], parseServerDate }: QuizCardProps) => {

    // Fallback date parser if not provided
    const defaultParseDate = (dateString?: string): Date => {
        if (!dateString) return new Date();
        const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(normalizedDate);
    };

    // Use the provided parser or fallback to default
    const parser = parseServerDate || defaultParseDate;

    const [isAvailable, setIsAvailable] = useState(false);

    // دالة لفحص الحالة الحالية
    const checkAvailability = useCallback(() => {
        const now = new Date();
        const from = quiz.availableFrom ? parser(quiz.availableFrom) : null;
        const until = quiz.availableUntil ? parser(quiz.availableUntil) : null;

        // متاح لو مفيش تواريخ، أو لو الوقت الحالي بين البداية والنهاية
        if (!from && !until) {
            setIsAvailable(true);
        } else if (from && until) {
            setIsAvailable(now >= from && now <= until);
        } else if (from) {
            setIsAvailable(now >= from);
        } else if (until) {
            setIsAvailable(now <= until);
        }
    }, [quiz.availableFrom, quiz.availableUntil, parser]);

    useEffect(() => {
        checkAvailability(); // فحص أول ما الكارت يظهر

        // عمل Timer يشتغل كل ثانية لو الكويز لسه "Upcoming"
        const timer = setInterval(() => {
            const now = new Date();
            const from = quiz.availableFrom ? parser(quiz.availableFrom) : null;

            if (from && now >= from) {
                checkAvailability();
                clearInterval(timer); // وقف التايمر أول ما يفتح
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz.availableFrom, checkAvailability, parser]);

    const now = new Date();
    const availableFrom = quiz.availableFrom ? parser(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? parser(quiz.availableUntil) : null;

    // Use studentAttemptCount from API (number of completed attempts by this student)
    const completedAttempts = quiz.studentAttemptCount ?? 0;
    const remainingAttempts = quiz.maximumAttempts - completedAttempts;

    // Get question count and duration from quiz data
    const questionCount = quiz.questionsCount || 0;
    const duration = (quiz as any).attemptTimeLimit || 0; // Use 'any' if attemptTimeLimit isn't in GetQuizDto yet

    // Calculate status
    const isNotStarted = availableFrom && now < availableFrom;
    const isExpired = availableUntil && now > availableUntil;
    const isNoAvailableFrom = !availableFrom;
    const isNotPublished = quiz.status !== 'Published';
    const isExhausted = remainingAttempts <= 0;
    const isOpen = availableFrom && availableUntil && now >= availableFrom && now <= availableUntil;
    const canShowAttempts = completedAttempts > 0;

    // Calculate time differences with better precision
    const getTimeDifference = () => {
        if (isOpen && availableUntil) {
            const diffMs = availableUntil.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) return { value: diffMins, unit: 'min', plural: diffMins !== 1 ? 's' : '' };
            if (diffHours <= 48) return { value: diffHours, unit: 'hour', plural: diffHours !== 1 ? 's' : '' };
            return { value: diffDays, unit: 'day', plural: diffDays !== 1 ? 's' : '' };
        }

        if (isNotStarted && availableFrom) {
            const diffMs = availableFrom.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) return { value: diffMins, unit: 'min', plural: diffMins !== 1 ? 's' : '' };
            if (diffHours <= 48) return { value: diffHours, unit: 'hour', plural: diffHours !== 1 ? 's' : '' };
            return { value: diffDays, unit: 'day', plural: diffDays !== 1 ? 's' : '' };
        }

        if (isExpired && availableUntil) {
            const diffMs = now.getTime() - availableUntil.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return { value: diffDays, unit: 'day', plural: diffDays !== 1 ? 's' : '' };
        }

        return null;
    };

    const timeDiff = getTimeDifference();

    // Determine status badge colors
    const getStatus = () => {
        if (isNotPublished) return {
            label: quiz.status === 'Draft' ? 'Draft' : 'Not Published',
            badgeBg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            dateStatus: `${quiz.status}`,
            icon: FileText
        };
        if (isNoAvailableFrom) return {
            label: 'Closed',
            badgeBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
            dateStatus: 'No availability date set',
            icon: AlertCircle
        };
        if (isNotStarted) return {
            label: 'Upcoming',
            badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
            dateStatus: `Opens in ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural}`,
            icon: Calendar
        };
        if (isExpired) return {
            label: 'Closed',
            badgeBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
            dateStatus: `Closed ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural} ago`,
            icon: AlertCircle
        };
        if (isExhausted) return {
            label: 'Exhausted',
            badgeBg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            dateStatus: 'No attempts left',
            icon: Lock
        };
        return {
            label: 'Open',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            dateStatus: `Closes in ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural}`,
            icon: Zap
        };
    };

    const status = getStatus();
    const StatusIcon = status.icon;
    const hasActiveAttempt = Boolean(quiz.hasActiveAttempt);

    // Determine if button should be disabled
    // نعتمد على isAvailable اللي بتتحكم في التايمر عشان الزرار يفتح لوحده
    const isDisabled = !isAvailable || isNotPublished || isExhausted || isLoading;

    // Get disable reason for tooltip
    const getDisableReason = () => {
        if (isNotPublished) return 'Quiz is not published yet';
        if (isNoAvailableFrom) return 'Quiz availability date not set';
        if (isNotStarted) return `Available from ${availableFrom?.toLocaleDateString()}`;
        if (isExpired) return `Expired on ${availableUntil?.toLocaleDateString()}`;
        if (isExhausted) return `No attempts remaining (Max: ${quiz.maximumAttempts})`;
        return null;
    };

    const disableReason = getDisableReason();

    // Format date
    const formatDate = (date: Date | null) => {
        if (!date) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className={`group flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden
            ${isDisabled ? 'border-gray-200 dark:border-slate-800/80 opacity-90' : 'border-gray-100 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-500/30'}
        `}>

            {/* Subtle top accent line */}
            {!isDisabled && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-70" />
            )}

            {/* Header Area */}
            <div className="p-5 pb-3 relative">
                <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-[#21A9FF] transition-colors tracking-tight">
                            {quiz.title}
                        </h3>
                        {quiz.courseName && (
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 truncate uppercase tracking-widest">{quiz.courseName}</p>
                        )}
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 whitespace-nowrap border shadow-sm ${status.badgeBg}`}>
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {status.label}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    {status.dateStatus}
                </div>
            </div>

            {/* Content Area */}
            <div className="px-5 pb-2 flex-1 space-y-4">
                {/* Description */}
                {quiz.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">
                        {quiz.description}
                    </p>
                )}

                {/* Enhanced Metrics Box */}
                <div className="flex bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center py-3 border-r border-gray-100 dark:border-slate-700/50">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Questions</span>
                        <span className="text-xl font-black text-[#21A9FF]">{questionCount}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-3 border-r border-gray-100 dark:border-slate-700/50">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Attempts</span>
                        <span className={`text-xl font-black ${completedAttempts > 0 ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {completedAttempts} <span className="text-[11px] text-slate-400">/ {quiz.maximumAttempts}</span>
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-3">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            {duration > 0 ? 'Mins' : 'Duration'}
                        </span>
                        <span className="text-xl font-black text-amber-500">{duration > 0 ? duration : '∞'}</span>
                    </div>
                </div>

                {/* Enhanced Concise Dates */}
                <div className="space-y-2 mt-4 pb-2">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/40 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex items-center gap-2">
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] shrink-0">From:</span>
                            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{formatDate(availableFrom)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-50/40 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20">
                        <Clock className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                        <div className="min-w-0 flex items-center gap-2">
                            <span className="text-[11px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-[0.15em] shrink-0">Until:</span>
                            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{formatDate(availableUntil)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions / Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-2 shrink-0 bg-gray-50/50 dark:bg-slate-900/20">
                <div className="flex-1 relative group/tooltip">
                    <button
                        disabled={isDisabled}
                        onClick={() => onStartQuiz(quiz.id, hasActiveAttempt)}
                        className={`w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!isDisabled
                            ? hasActiveAttempt
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                {!isDisabled ? (hasActiveAttempt ? 'Resume Quiz' : 'Start Quiz') : (hasActiveAttempt ? 'Resume Quiz' : 'Start Quiz')}
                            </>
                        )}
                    </button>

                    {/* Tooltip for disable reason */}
                    {disableReason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] px-4 py-2.5 bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-bold text-white text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                            {disableReason}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-slate-900 dark:border-t-slate-950" />
                        </div>
                    )}
                </div>

                {canShowAttempts && (
                    <button
                        onClick={() => onViewAttempts?.(quiz.id)}
                        className="py-3 px-5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-white border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/30 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95 shadow-sm whitespace-nowrap"
                        title="View all attempts"
                    >
                        History
                    </button>
                )}
            </div>
        </div>
    );
};