import { Play, Lock, Calendar, Zap, AlertCircle, Clock, FileText, CheckCircle2, History } from 'lucide-react';
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
    const isNoAvailableFrom = !availableFrom;
    const isNotPublished = quiz.status !== 'Published';
    const isExhausted = remainingAttempts <= 0;
    const isOpen = availableFrom && availableUntil && now >= availableFrom && now <= availableUntil;
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
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className={`group flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden
            ${isDisabled ? 'border-gray-200 dark:border-slate-700/50 opacity-95' : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50'}
        `}>

            {/* Header Area */}
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700/50 relative">
                {!isDisabled && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                )}
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {quiz.title}
                    </h3>
                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap border ${status.badgeBg}`}>
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {status.label}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 mt-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    {status.dateStatus}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 space-y-5">
                {/* Description */}
                {quiz.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-4">
                        {quiz.description}
                    </p>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider mb-1">Available From</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{formatDate(availableFrom)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider mb-1">Available Until</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{formatDate(availableUntil)}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-slate-700/50 pt-5">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-1.5">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{questionCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Questions</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${completedAttempts > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                            <History className={`w-4 h-4 ${completedAttempts > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">
                            {completedAttempts} <span className="text-sm text-gray-400">/ {quiz.maximumAttempts}</span>
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Attempts</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-1.5">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{completedAttempts}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Completed</p>
                    </div>
                </div>
            </div>

            {/* Actions / Footer */}
            <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="flex-1 relative group/tooltip">
                    <button
                        onClick={() => !isDisabled && onStartQuiz(quiz.id)}
                        disabled={isDisabled}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm 
                            ${isDisabled
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-200 dark:border-slate-700'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/25 hover:-translate-y-0.5 active:scale-95'
                            }`}
                    >
                        <Play className="w-4 h-4" />
                        {isLoading ? 'Starting...' : 'Start Quiz'}
                    </button>

                    {/* Tooltip for disable reason */}
                    {disableReason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-gray-900 dark:bg-slate-950 border border-gray-800 dark:border-slate-700 rounded-lg text-xs font-medium text-white text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            {disableReason}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-gray-900 dark:border-t-slate-950"></div>
                        </div>
                    )}
                </div>

                {canShowAttempts && (
                    <button
                        onClick={() => onViewAttempts?.(quiz.id)}
                        className="py-3 px-6 rounded-xl font-bold text-sm transition-all bg-white dark:bg-slate-800 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 shadow-sm whitespace-nowrap"
                        title="View all attempts"
                    >
                        History
                    </button>
                )}
            </div>
        </div>
    );
};