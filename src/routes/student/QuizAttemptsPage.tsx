import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, History, CalendarClock, Trophy, BarChart3, BookCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsForQuiz } from '@/api/services/attempts.service';
import type { AttemptMetaData, GetAttemptsByQuizIdDto } from '@/types/api.types';

export const QuizAttemptsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: attemptsDto, isLoading } = useQuery<GetAttemptsByQuizIdDto | null>({
        queryKey: ['quiz-attempts', id],
        queryFn: () => getMyAttemptsForQuiz(id!),
        enabled: !!id,
    });

    const attempts = attemptsDto?.attempts ?? [];

    // --- Helpers ---
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const safeDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(safeDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const totalPoints = Number(attemptsDto?.totalPoints) || 100;
    const quizAvailableUntil = attemptsDto?.availableUntil;
    const showResultOnClose = attemptsDto?.showResultOnClose === true;

    const isAfterQuizClose = (availableUntil?: string) => {
        if (!availableUntil) return false;
        const normalized = availableUntil.endsWith('Z') || availableUntil.includes('+')
            ? availableUntil
            : `${availableUntil}Z`;
        return Date.now() >= new Date(normalized).getTime();
    };
    const quizClosed = isAfterQuizClose(quizAvailableUntil);

    const canRevealScore = (attempt: AttemptMetaData) => {
        const reviewed = String(attempt.status).toLowerCase() === 'reviewed';
        return isAfterQuizClose(quizAvailableUntil) && (reviewed || showResultOnClose);
    };

    const getScorePercentage = (attempt: AttemptMetaData): number => {
        if (attempt.score == null || !totalPoints) return 0;
        return Math.round((attempt.score / totalPoints) * 100);
    };

    const getStatusStyle = (status?: string) => {
        const s = String(status || '').toLowerCase().replace('-', '');
        if (s === 'submitted' || s === 'reviewed') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        if (s === 'inprogress') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-slate-400 font-semibold uppercase tracking-widest animate-pulse">Loading attempt history...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 font-sans pb-20">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-11 h-11 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                {attemptsDto?.quizTitle || 'Quiz Attempt History'}
                            </h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Track your quiz submissions and score release status
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {attemptsDto && (
                    <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 sm:p-6 rounded-2xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1 flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" /> Available From
                                </p>
                                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatDate(attemptsDto.availableFrom)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1 flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" /> Available Until
                                </p>
                                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatDate(attemptsDto.availableUntil)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1 flex items-center gap-1">
                                    <BookCheck className="w-3 h-3" /> Total Points
                                </p>
                                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{attemptsDto.totalPoints}</p>
                            </div>
                        </div>
                        {!attemptsDto.showResultOnClose && (
                            <p className="mt-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                Results will appear only after your attempt is manually reviewed by your instructor.
                            </p>
                        )}
                    </div>
                )}

                {attempts.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                            <p className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-500 mb-1">Total Attempts</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{attempts.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                            <p className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
                                <Trophy className="w-3 h-3" /> Highest Score
                            </p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {Math.max(0, ...attempts.map(a => getScorePercentage(a)))}%
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                            <p className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Avg Score
                            </p>
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                {attempts.length > 0 ? Math.round(attempts.reduce((sum: number, a: AttemptMetaData) => sum + getScorePercentage(a), 0) / attempts.length) : 0}%
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                            <p className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-500 mb-1">Status</p>
                            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{attempts.some(a => String(a.status).toLowerCase().includes('progress')) ? 'Active' : 'Done'}</p>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    {attempts.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/20 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-500 font-bold">
                            No logs found for this quiz.
                        </div>
                    ) : (
                        attempts.map((attempt, idx) => {
                            const score = getScorePercentage(attempt);
                            const status = String(attempt.status);
                            const normalizedStatus = status.toLowerCase();
                            const isFinished = normalizedStatus === 'submitted' || normalizedStatus === 'reviewed';
                            const isReviewed = normalizedStatus === 'reviewed';
                            const revealScore = canRevealScore(attempt);
                            const scoreHidden = attempt.score == null && !revealScore;
                            const scorePending = attempt.score == null && revealScore;
                            const canViewAnswers = quizClosed && isFinished && (showResultOnClose || isReviewed);

                            return (
                                <div
                                    key={attempt.id}
                                    className="group bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 sm:p-6 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        <div className="flex items-center gap-4 lg:border-r lg:border-gray-200 dark:lg:border-slate-700 lg:pr-8">
                                            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 flex items-center justify-center font-black text-blue-600 dark:text-blue-400">
                                                #{attempt.attemptNumber}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(status)}`}>
                                                {status}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Score</p>
                                                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white text-right">
                                                    {attempt.score != null
                                                        ? `${attempt.score} / ${totalPoints} (${score}%)`
                                                        : '---'}
                                                </p>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${score >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                    style={{ width: attempt.score != null ? `${score}%` : '0%' }}
                                                />
                                            </div>
                                            {scoreHidden && (
                                                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                    Score hidden until quiz closes and attempt is reviewed or results are released on close.
                                                </p>
                                            )}
                                            {scorePending && (
                                                <p className="mt-2 text-xs font-semibold text-gray-600 dark:text-slate-400">
                                                    Score will appear once grading is available.
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 lg:gap-5 lg:pl-8 min-w-[170px]">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1">Started</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{formatDate(attempt.startAt)}</p>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!canViewAnswers) return;
                                                        navigate(`/quizzes/${id}/attempt/${attempt.id}/result`);
                                                    }}
                                                    disabled={!canViewAnswers}
                                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                                        canViewAnswers
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Show answers
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};