import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    ChevronRight,
    Loader2,
    Clock,
    CheckCircle2,
    BarChart3,
    Trophy,
    History,
    Eye,
    Play,
    RotateCcw,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsForQuiz, getAttemptResult } from '@/api/services/attempts.service';
import { quizService } from '@/api/services';
import type { AttemptMetaData, GetAttemptsByQuizIdDto, AttemptStatus } from '@/types/api.types';

const getStatusInfo = (status: AttemptStatus | 'Processing') => {
    switch (status) {
        case 'Reviewed':
        case 'Graded':
            return { label: 'Reviewed', color: 'emerald', icon: CheckCircle2 };
        case 'Submitted':
            return { label: 'Submitted', color: 'blue', icon: CheckCircle2 };
        case 'InProgress':
            return { label: 'In Progress', color: 'orange', icon: Clock };
        case 'Processing':
            return { label: 'Processing with AI...', color: 'violet', icon: Loader2 };
        default:
            return { label: status, color: 'gray', icon: Clock };
    }
};

export const QuizAttemptsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [checkingAttemptId, setCheckingAttemptId] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const [activeAIGradingId, setActiveAIGradingId] = useState<string | null>(() => {
        return localStorage.getItem(`ai-grading-${id}`) || null;
    });

    const [aiGradedIds, setAiGradedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(`ai-graded-${id}`) || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (!activeAIGradingId) {
            localStorage.removeItem(`ai-grading-${id}`);
            return;
        }

        localStorage.setItem(`ai-grading-${id}`, activeAIGradingId);
        let cancelled = false;

        const runAIGrading = async () => {
            try {
                const { triggerAIGrading } = await import('@/features/ai-grading/api/ai-grading.service');
                await triggerAIGrading(activeAIGradingId);

                if (cancelled) return;
                setActiveAIGradingId(null);
                setAiGradedIds(prev => {
                    const next = Array.from(new Set([...prev, activeAIGradingId]));
                    localStorage.setItem(`ai-graded-${id}`, JSON.stringify(next));
                    return next;
                });
                toast.success("AI has successfully evaluated this attempt 🎉");
                navigate(`/quizzes/${id}/attempt/${activeAIGradingId}/ai-result`);
            } catch (err) {
                if (cancelled) return;
                console.error('AI grading failed:', err);
                toast.error("AI grading failed. Please try again.");
                setActiveAIGradingId(null);
            }
        };

        runAIGrading();
        return () => { cancelled = true; };
    }, [activeAIGradingId, id, navigate]);

    useEffect(() => {
        localStorage.setItem(`ai-graded-${id}`, JSON.stringify(aiGradedIds));
    }, [aiGradedIds, id]);

    const hasAIGradedAttempt = aiGradedIds.length > 0;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => {
                setAlertMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleViewAttemptResult = async (attemptId: string) => {
        try {
            setCheckingAttemptId(attemptId);
            setAlertMessage(null);
            await getAttemptResult(attemptId);
            navigate(`/quizzes/${id}/attempt/${attemptId}`);
        } catch (err: any) {
            console.error('Failed to load result:', err);
            const apiMessage = err.response?.data?.message || err.message;
            setAlertMessage(apiMessage || 'Failed to load quiz results. Please try again.');
        } finally {
            setCheckingAttemptId(null);
        }
    };



    const { data: attemptsDto, isLoading } = useQuery<GetAttemptsByQuizIdDto | null>({
        queryKey: ['quiz-attempts', id],
        queryFn: () => getMyAttemptsForQuiz(id!),
        enabled: !!id,
    });

    const { data: quizData } = useQuery({
        queryKey: ['quiz-detail', id],
        queryFn: () => quizService.getQuiz(id!),
        enabled: !!id,
    });

    const attempts = attemptsDto?.attempts ?? [];

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        const safeDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(safeDate).toLocaleString('en-US', {
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
        if (!availableUntil) return true;
        const normalized =
            availableUntil.endsWith('Z') || availableUntil.includes('+')
                ? availableUntil
                : `${availableUntil}Z`;
        return Date.now() >= new Date(normalized).getTime();
    };

    const quizClosed = isAfterQuizClose(quizAvailableUntil);

    const canRevealScore = (attempt: AttemptMetaData) => {
        const statusLower = String(attempt.status).toLowerCase();
        const reviewed = statusLower === 'reviewed' || statusLower === 'graded';
        return quizClosed && (reviewed || showResultOnClose);
    };

    const getScorePercentage = (attempt: AttemptMetaData): number => {
        if (attempt.score == null || !totalPoints) return 0;
        return Math.round((attempt.score / totalPoints) * 100);
    };

    const stats = useMemo(() => {
        const reviewedCount = attempts.filter(a => a.status === 'Reviewed' || a.status === 'Graded').length;
        const submittedCount = attempts.filter(a => a.status === 'Submitted').length;
        const inProgressCount = attempts.filter(a => a.status === 'InProgress').length;
        const highestScore = attempts.length > 0
            ? Math.max(0, ...attempts.map(a => getScorePercentage(a)))
            : 0;

        return [
            { label: 'Total Attempts', value: attempts.length, icon: History, color: 'blue' },
            { label: 'Graded', value: reviewedCount, icon: CheckCircle2, color: 'emerald' },
            { label: 'Highest Score', value: `${highestScore}%`, icon: Trophy, color: 'orange' },
        ];
    }, [attempts]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#21A9FF]/30 border-t-[#21A9FF] rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading quiz attempts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            {alertMessage && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-4 bg-[#FDF2F2] dark:bg-[#1E293B] border border-[#FBD5D5] dark:border-red-900/50 px-8 py-4.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-xl w-[90vw] md:w-auto">
                    <div className="w-6 h-6 rounded-full bg-[#E02424] flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white font-extrabold text-sm leading-none select-none">!</span>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-extrabold text-[#1F2937] dark:text-white text-center flex-1 leading-snug">
                        {alertMessage}
                    </p>
                </div>
            )}
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <button
                        onClick={() => quizData?.courseId
                            ? navigate(`/courses/${quizData.courseId}/quizzes`)
                            : navigate(-1)
                        }
                        className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">My Quiz Attempts</h1>
                        {attemptsDto && (
                            <p className="text-[#21A9FF] mt-0.5 text-sm sm:text-base font-bold truncate max-w-md mx-auto sm:mx-0">{attemptsDto.quizTitle}</p>
                        )}
                    </div>
                </div>

                {/* AI Grading Hint */}
                {activeAIGradingId && (
                    <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl p-3 flex items-center justify-center gap-2 text-violet-700 dark:text-violet-400 text-[11px] sm:text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="text-center">AI grading may take a few moments. You’ll be notified once it’s ready.</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute left-0 top-0 w-1 h-full ${stat.color === 'blue' ? 'bg-[#21A9FF]' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                            <div>
                                <p className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.color === 'blue' ? 'bg-[#21A9FF]/10 text-[#21A9FF]' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                        'bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                                }`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quiz Info Summary */}
                {attemptsDto && (
                    <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Available From</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatDate(attemptsDto.availableFrom)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Available Until</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatDate(attemptsDto.availableUntil)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Points</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{attemptsDto.totalPoints}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attempts List */}
                {attempts.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <History className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No attempts yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-2">Start your first attempt to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attempts.map((attempt) => {
                            const isAIGraded = aiGradedIds.includes(attempt.id);
                            const effectiveStatus = activeAIGradingId === attempt.id ? 'Processing' :
                                isAIGraded ? 'Graded' :
                                    attempt.status;
                            const isProcessing = effectiveStatus === 'Processing';

                            const score = getScorePercentage(attempt);
                            const revealScore = canRevealScore({ ...attempt, status: effectiveStatus as AttemptStatus });
                            const info = getStatusInfo(attempt.status);
                            const isInProgress = attempt.status === 'InProgress';

                            return (
                                <div
                                    key={attempt.id}
                                    className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${effectiveStatus === 'Reviewed' || effectiveStatus === 'Graded'
                                            ? 'border-emerald-200/60 dark:border-emerald-700/30'
                                            : effectiveStatus === 'Processing'
                                                ? 'border-violet-300 dark:border-violet-500/50 shadow-violet-100 dark:shadow-violet-900/20'
                                                : effectiveStatus === 'Submitted'
                                                    ? 'border-blue-200/60 dark:border-blue-700/30'
                                                    : 'border-gray-200 dark:border-slate-700/50'
                                        }`}
                                >
                                    {/* Left: Attempt Info */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1 min-w-0 text-center sm:text-left">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${effectiveStatus === 'Reviewed' || effectiveStatus === 'Graded'
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                : effectiveStatus === 'Processing'
                                                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                                                    : effectiveStatus === 'Submitted'
                                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                                        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                            }`}>
                                            {attempt.attemptNumber}
                                        </div>
                                        <div className="min-w-0 w-full">
                                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">Attempt #{attempt.attemptNumber}</h4>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${effectiveStatus === 'Reviewed' || effectiveStatus === 'Graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                                                            effectiveStatus === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                                                                effectiveStatus === 'Processing' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' :
                                                                    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                                                        }`}>
                                                        <info.icon className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} /> {info.label}
                                                    </span>
                                                    {isAIGraded && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-100 to-fuchsia-100 text-fuchsia-700 dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-500/30">
                                                            <Sparkles className="w-2.5 h-2.5" /> AI Graded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                                                <Clock className="w-3 h-3" /> Started: {formatDate(attempt.startAt)}
                                            </p>
                                            {revealScore && attempt.score !== null && (
                                                <div className="mt-2.5 flex justify-center sm:justify-start">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 uppercase tracking-wider shadow-sm">
                                                        Score: {attempt.score}/{totalPoints} ({score}%)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-row sm:flex-nowrap items-center justify-center sm:justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700/50 pt-4 md:pt-0 md:pl-5 shrink-0 w-full md:w-auto">
                                        {isInProgress ? (
                                            <button
                                                onClick={() => navigate(`/quizzes/${id}/attempt`, { state: { resume: true } })}
                                                className="flex-1 sm:flex-none px-5 py-3 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white active:scale-95"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                Resume
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <>
                                                {}
                                                {isProcessing && (
                                                    <button
                                                        disabled
                                                        className="flex-1 sm:flex-none px-5 py-3 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 cursor-not-allowed"
                                                    >
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        AI is grading...
                                                    </button>
                                                )}
                                                {isAIGraded && !isProcessing && (
                                                    <button
                                                        onClick={() => navigate(`/quizzes/${id}/attempt/${attempt.id}/ai-result`)}
                                                        className="flex-1 sm:flex-none px-5 py-3 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 hover:from-violet-200 hover:to-fuchsia-200 text-fuchsia-700 dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:hover:from-violet-500/30 dark:hover:to-fuchsia-500/30 dark:text-fuchsia-400 active:scale-95"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        AI Result
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleViewAttemptResult(attempt.id)}
                                                    disabled={isProcessing || !!activeAIGradingId || !quizClosed || checkingAttemptId !== null}
                                                    className={`flex-1 sm:flex-none px-5 py-3 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                                                            isProcessing || !!activeAIGradingId || !quizClosed
                                                            ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                                                            : effectiveStatus === 'Reviewed' || effectiveStatus === 'Graded'
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                                                : 'bg-[#21A9FF] hover:bg-[#0094F2] text-white active:scale-95'
                                                        } ${checkingAttemptId !== null ? 'opacity-80 cursor-wait' : ''}`}
                                                    title={!quizClosed ? "Details will be available after the quiz deadline" : undefined}
                                                >
                                                    {checkingAttemptId === attempt.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                    {checkingAttemptId === attempt.id
                                                        ? 'Checking...'
                                                        : effectiveStatus === 'Reviewed' || effectiveStatus === 'Graded'
                                                            ? 'View Result'
                                                            : 'View Details'}
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};