import { Play, Lock, Calendar, Zap, AlertCircle, Clock } from 'lucide-react';
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

/**
 * QuizCard Component
 * 
 * Displays individual quiz info with:
 * - Availability dates (Available From / Until)
 * - Remaining attempts calculation
 * - Status badge
 * - Start/Resume button with smart disable logic
 * - Conditional disable reasons via tooltip
 * - Real-time date-based status (Open, Closed, Not Yet Available)
 * - Proper timezone handling
 */
export const QuizCard = ({ quiz, onStartQuiz, onViewAttempts, isLoading = false, attempts = [], parseServerDate }: QuizCardProps) => {
    // Fallback date parser if not provided
    const defaultParseDate = (dateString?: string): Date => {
        if (!dateString) return new Date();
        const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(normalizedDate);
    };

    const parser = parseServerDate || defaultParseDate;
    const now = new Date();
    const availableFrom = quiz.availableFrom ? parser(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? parser(quiz.availableUntil) : null;

    // Count completed (submitted) attempts from API data
    const submittedAttempts = attempts.filter(a => a.status === 'Submitted').length;
    const completedAttempts = submittedAttempts > 0 ? submittedAttempts : (quiz.submissionsCount || 0);
    const remainingAttempts = quiz.maximumAttempts - completedAttempts;

    // Get question count from quiz data
    const questionCount = quiz.questionsCount || 0;

    // Calculate status
    const isNotStarted = availableFrom && now < availableFrom;
    const isExpired = availableUntil && now > availableUntil;
    const isNoAvailableFrom = !availableFrom; // If availableFrom doesn't exist, treat as closed
    const isNotPublished = quiz.status !== 'Published';
    const isExhausted = remainingAttempts <= 0;
    const isOpen = availableFrom && availableUntil && now >= availableFrom && now <= availableUntil;
    // Determine if solutions should be shown (when attempted more than once)
    const canShowAttempts = completedAttempts > 0;

    // Calculate time differences
    const getTimeDifference = () => {
        if (isOpen && availableUntil) {
            const diffMs = availableUntil.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            if (diffDays > 0 && diffDays <= 1) {
                return { value: diffHours, unit: 'hour', plural: diffHours !== 1 ? 's' : '' };
            }
            return { value: diffDays, unit: 'day', plural: diffDays !== 1 ? 's' : '' };
        }

        if (isNotStarted && availableFrom) {
            const diffMs = availableFrom.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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

    // Determine status badge
    const getStatus = () => {
        if (isNotPublished) return {
            label: quiz.status === 'Draft' ? 'Draft' : 'Not Published',
            color: 'bg-slate-600 text-white',
            dateStatus: `${quiz.status}`,
            icon: null
        };
        if (isNoAvailableFrom) return {
            label: 'Closed',
            color: 'bg-red-600 text-white',
            dateStatus: 'No availability date set',
            icon: AlertCircle
        };
        if (isNotStarted) return {
            label: 'Not Available',
            color: 'bg-slate-600 text-white',
            dateStatus: `Opens in ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural}`,
            icon: Calendar
        };
        if (isExpired) return {
            label: 'Closed',
            color: 'bg-red-600 text-white',
            dateStatus: `Closed ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural} ago`,
            icon: AlertCircle
        };
        if (isExhausted) return {
            label: 'Exhausted',
            color: 'bg-orange-600 text-white',
            dateStatus: 'No attempts left',
            icon: Lock
        };
        return {
            label: 'Open',
            color: 'bg-emerald-600 text-white',
            dateStatus: `Closes in ${timeDiff?.value} ${timeDiff?.unit}${timeDiff?.plural}`,
            icon: Zap
        };
    };

    const status = getStatus();
    const StatusIcon = status.icon;

    // Determine if button should be disabled
    const isDisabled = isNotStarted || isExpired || isNotPublished || isExhausted || isNoAvailableFrom || isLoading;

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
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={`group rounded-2xl border transition-all overflow-hidden ${isDisabled
                ? 'border-slate-700 bg-slate-900/50'
                : 'border-slate-700 bg-slate-900 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
                }`}
        >
            {/* Header with status badge */}
            <div className="relative p-6 bg-gradient-to-r from-slate-800 to-slate-900">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-xl font-bold text-white flex-1 line-clamp-2">
                        {quiz.title}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap ${status.color}`}>
                        {StatusIcon && <StatusIcon className="w-4 h-4" />}
                        {status.label}
                    </div>
                </div>
                {quiz.description && (
                    <p className="text-sm text-slate-300 line-clamp-2">{quiz.description}</p>
                )}
                {/* Date status indicator */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{status.dateStatus}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Availability dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-400 uppercase tracking-wider font-bold text-xs mb-2">Available From</p>
                        <p className="text-slate-200 font-semibold">
                            {formatDate(availableFrom)}
                        </p>
                        {!isNotStarted && availableFrom && (
                            <p className={`text-xs mt-1 ${now < availableFrom ? 'text-yellow-400' : 'text-slate-500'}`}>
                                {now >= availableFrom ? '✓ Started' : `In ${Math.ceil((availableFrom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`}
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-slate-400 uppercase tracking-wider font-bold text-xs mb-2">Available Until</p>
                        <p className="text-slate-200 font-semibold">
                            {formatDate(availableUntil)}
                        </p>
                        {availableUntil && (
                            <p className={`text-xs mt-1 ${isExpired ? 'text-red-400' : isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {isExpired
                                    ? `✗ Closed`
                                    : isOpen
                                        ? `✓ Open (${Math.ceil((availableUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days left)`
                                        : 'Not started'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quiz stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700">
                    <div className="text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Questions</p>
                        <p className="text-2xl font-black text-indigo-400">{questionCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Attempts</p>
                        <p className={`text-2xl font-black ${completedAttempts > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {completedAttempts}/{quiz.maximumAttempts}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Completed</p>
                        <p className="text-2xl font-black text-slate-400">{completedAttempts}</p>
                    </div>
                </div>
            </div>

            {/* Footer with buttons */}
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
                <div className="flex-1 relative group/tooltip">
                    <button
                        onClick={() => !isDisabled && onStartQuiz(quiz.id)}
                        disabled={isDisabled}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isDisabled
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 active:scale-95'
                            }`}
                    >
                        <Play className="w-4 h-4" />
                        {isLoading ? 'Starting...' : 'Start/Resume'}
                    </button>

                    {/* Tooltip for disable reason */}
                    {disableReason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                            {disableReason}
                        </div>
                    )}
                </div>
                {canShowAttempts && (
                    <button
                        onClick={() => onViewAttempts?.(quiz.id)}
                        className="py-3 px-4 rounded-lg font-bold transition-all bg-slate-700 text-white hover:bg-slate-600 active:scale-95"
                        title="View all attempts"
                    >
                        Attempts ({completedAttempts})
                    </button>
                )}
            </div>
        </div>
    );
};
