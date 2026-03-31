import { useEffect, useState, useCallback } from 'react';
import { Play, Lock, Calendar, Zap, AlertCircle, Clock, FileText, History, Timer, Loader2 } from 'lucide-react';
import type { GetQuizDto } from '@/types/api.types';
import type { StartAttemptResponse } from '@/api/services/attempts.service';

interface QuizCardProps {
    quiz: GetQuizDto;
    onStartQuiz: (quizId: string) => void;
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

    // Use studentAttemptCount from API (new field), fallback to submissionsCount
    const completedAttempts = quiz.studentAttemptCount ?? (quiz.submissionsCount || 0);
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
        <div className={`group flex flex-col bg-[#111628] rounded-[1.5rem] border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden
            ${isDisabled ? 'border-slate-800/80 opacity-95' : 'border-slate-700 hover:border-purple-500/50'}
        `}>

            {/* Header Area */}
            <div className="p-6 pb-4 border-b border-slate-800/50 relative">
                {!isDisabled && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                )}
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
                            {quiz.title}
                        </h3>
                        {quiz.courseName && (
                            <p className="text-xs font-semibold text-slate-400 mt-1 truncate">{quiz.courseName}</p>
                        )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap border ${status.badgeBg}`}>
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {status.label}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    {status.dateStatus}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 space-y-5">
                {/* Description */}
                {quiz.description && (
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4">
                        {quiz.description}
                    </p>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Available From</p>
                        <p className="text-sm font-bold text-white truncate">{formatDate(availableFrom)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Available Until</p>
                        <p className="text-sm font-bold text-white truncate">{formatDate(availableUntil)}</p>
                    </div>
                </div>

                {/* Stats Grid (Updated Layout) */}
                <div className="flex justify-between items-center py-4 px-2 border-t border-slate-800/80 mt-2">

                    {/* Metric 1: Questions */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{questionCount}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Questions</p>
                        </div>
                    </div>

                    {/* Metric 2: Attempts */}
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${completedAttempts > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            <History className={`w-5 h-5 ${completedAttempts > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">
                                {completedAttempts} <span className="text-sm text-slate-500">/ {quiz.maximumAttempts}</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Attempts</p>
                        </div>
                    </div>

                    {/* Metric 3: Duration */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Timer className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">
                                {duration > 0 ? duration : '∞'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                {duration > 0 ? 'Mins' : 'Duration'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Actions / Footer */}
            <div className="p-4 sm:p-6 bg-slate-900/30 border-t border-slate-800/50 flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="flex-1 relative group/tooltip">
                    <button
                        disabled={isDisabled}
                        onClick={() => onStartQuiz(quiz.id)}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${!isDisabled
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                {!isDisabled ? 'Start Quiz...' : 'Start Quiz'}
                            </>
                        )}
                    </button>

                    {/* Tooltip for disable reason */}
                    {disableReason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-white text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            {disableReason}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-slate-950"></div>
                        </div>
                    )}
                </div>

                {canShowAttempts && (
                    <button
                        onClick={() => onViewAttempts?.(quiz.id)}
                        className="py-3 px-6 rounded-xl font-bold text-sm transition-all bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 active:scale-95 shadow-sm whitespace-nowrap"
                        title="View all attempts"
                    >
                        History
                    </button>
                )}
            </div>
        </div>
    );
};