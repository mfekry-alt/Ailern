import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    ArrowLeft,
    ChevronRight,
    Loader2,
    History,
    CalendarClock,
    Trophy,
    BarChart3,
    BookCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsForQuiz } from '@/api/services/attempts.service';
import type { AttemptMetaData, GetAttemptsByQuizIdDto } from '@/types/api.types';

export const QuizAttemptsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const { data: attemptsDto, isLoading } = useQuery<GetAttemptsByQuizIdDto | null>({
        queryKey: ['quiz-attempts', id],
        queryFn: () => getMyAttemptsForQuiz(id!),
        enabled: !!id,
    });

    const attempts = attemptsDto?.attempts ?? [];

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const safeDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(safeDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const totalPoints = Number(attemptsDto?.totalPoints) || 100;
    const quizAvailableUntil = attemptsDto?.availableUntil;
    const showResultOnClose = attemptsDto?.showResultOnClose === true;

    const isAfterQuizClose = (availableUntil?: string) => {
        if (!availableUntil) return false;
        const normalized =
            availableUntil.endsWith('Z') || availableUntil.includes('+')
                ? availableUntil
                : `${availableUntil}Z`;

        return Date.now() >= new Date(normalized).getTime();
    };

    const quizClosed = isAfterQuizClose(quizAvailableUntil);

    const canRevealScore = (attempt: AttemptMetaData) => {
        const reviewed = String(attempt.status).toLowerCase() === 'reviewed';
        return quizClosed && (reviewed || showResultOnClose);
    };

    const getScorePercentage = (attempt: AttemptMetaData): number => {
        if (attempt.score == null || !totalPoints) return 0;
        return Math.round((attempt.score / totalPoints) * 100);
    };

    const getStatusStyle = (status?: string) => {
        const s = String(status || '').toLowerCase().replace('-', '');
        if (s === 'submitted' || s === 'reviewed')
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        if (s === 'inprogress')
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-slate-400 font-semibold uppercase tracking-widest animate-pulse">
                    Loading attempt history...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 pb-20">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-11 h-11 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:text-gray-900 dark:hover:text-white transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {attemptsDto?.quizTitle || 'Quiz Attempt History'}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Track your attempts
                        </p>
                    </div>
                </div>

                {/* Summary */}
                {attemptsDto && (
                    <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border bg-gray-50 dark:bg-slate-900/40">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" /> Available From
                                </p>
                                <p className="font-bold">{formatDate(attemptsDto.availableFrom)}</p>
                            </div>

                            <div className="p-4 rounded-xl border bg-gray-50 dark:bg-slate-900/40">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" /> Available Until
                                </p>
                                <p className="font-bold">{formatDate(attemptsDto.availableUntil)}</p>
                            </div>

                            <div className="p-4 rounded-xl border bg-gray-50 dark:bg-slate-900/40">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <BookCheck className="w-3 h-3" /> Total Points
                                </p>
                                <p className="font-bold">{attemptsDto.totalPoints}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                {attempts.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat title="Total Attempts" value={attempts.length} />
                        <Stat
                            title="Highest Score"
                            value={`${Math.max(0, ...attempts.map(a => getScorePercentage(a)))}%`}
                        />
                        <Stat
                            title="Avg Score"
                            value={`${Math.round(
                                attempts.reduce((s, a) => s + getScorePercentage(a), 0) /
                                attempts.length
                            )}%`}
                        />
                        <Stat
                            title="Status"
                            value={
                                attempts.some(a =>
                                    String(a.status).toLowerCase().includes('progress')
                                )
                                    ? 'Active'
                                    : 'Done'
                            }
                        />
                    </div>
                )}

                {/* Attempts List */}
                <div className="space-y-4">
                    {attempts.length === 0 ? (
                        <div className="text-center py-20 border rounded-2xl">
                            No attempts found.
                        </div>
                    ) : (
                        attempts.map((attempt) => {
                            const score = getScorePercentage(attempt);
                            const revealScore = canRevealScore(attempt);

                            return (
                                <div
                                    key={attempt.id}
                                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500">Score</p>
                                            <p className="text-xl font-bold">
                                                {attempt.score != null && revealScore
                                                    ? `${attempt.score}/${totalPoints} (${score}%)`
                                                    : '---'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                navigate(`/quizzes/${id}/attempt/${attempt.id}`)
                                            }
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            Details
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-sm mt-2 text-gray-500 dark:text-slate-400">
                                        {formatDate(attempt.startAt)}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const Stat = ({ title, value }: { title: string; value: any }) => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-xl text-center shadow-sm">
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);