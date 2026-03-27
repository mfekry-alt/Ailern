import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Award, ChevronRight, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { getQuizAttempts, getStudentAnswers, type StartAttemptResponse, type StudentAnswer } from '@/api/services/attempts.service';
import type { GetQuizDto } from '@/types/api.types';

export const QuizAttemptsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [unansweredCounts, setUnansweredCounts] = useState<Record<string, number>>({});

    // Fetch quiz details
    const { data: quiz, isLoading: quizLoading } = useQuery({
        queryKey: ['quiz', id],
        queryFn: async () => {
            const res = await api.get(`/Quizzes/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
    });

    // Fetch attempts
    const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
        queryKey: ['quiz-attempts', id],
        queryFn: () => getQuizAttempts(id!),
        enabled: !!id,
    });

    // Load unanswered questions for each submitted attempt
    useEffect(() => {
        const loadUnansweredCounts = async () => {
            if (!quiz?.questions || !attempts.length) return;

            const totalQuestions = quiz.questions.length;
            const counts: Record<string, number> = {};

            for (const attempt of attempts) {
                const attemptId = attempt.id || attempt.attemptId;
                const isSubmitted = attempt.status === 'Submitted' || attempt.status === 'Graded';

                if (isSubmitted && attemptId) {
                    try {
                        const studentAnswers = await getStudentAnswers(attemptId);
                        const answeredQuestionsCount = studentAnswers.filter(a => {
                            // Count as answered if has any of these properties
                            return a.studentAnswer && a.studentAnswer.trim() !== '';
                        }).length;
                        counts[attemptId] = totalQuestions - answeredQuestionsCount;
                    } catch (error) {
                        console.error(`Failed to fetch answers for attempt ${attemptId}:`, error);
                        // Fallback: show 0 if we can't fetch
                        counts[attemptId] = 0;
                    }
                }
            }

            setUnansweredCounts(counts);
        };

        loadUnansweredCounts();
    }, [quiz, attempts]);

    const isLoading = quizLoading || attemptsLoading;

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        // إضافة Z لضمان قراءة التوقيت بشكل صحيح كـ UTC
        const safeDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        const date = new Date(safeDateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get score percentage safely
    const getScorePercentage = (attempt: StartAttemptResponse) => {
        // إذا كان السيرفر لا يرسل totalMarks أو كانت null
        if (!attempt.totalMarks || attempt.totalMarks === 0) {
            return attempt.score ? attempt.score : 0;
        }
        return Math.round(((attempt.score ?? 0) / attempt.totalMarks) * 100);
    };

    // Get status badge color
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Submitted':
            case 'Graded':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
            case 'InProgress':
            case 'In-Progress':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/50';
            default:
                return 'bg-slate-500/20 text-slate-400 border border-slate-500/50';
        }
    };

    // Get status icon
    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'Submitted':
            case 'Graded':
                return '✓';
            case 'InProgress':
            case 'In-Progress':
                return '◐';
            default:
                return '◯';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading attempts...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 p-8 bg-slate-950 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {quiz?.title || 'Quiz'} - All Attempts
                        </h1>
                        <p className="text-slate-400">
                            Review your quiz attempts and performance history
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                {attempts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-2">Total Attempts</p>
                            <p className="text-3xl font-bold text-white">{attempts.length}</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-2">Best Score</p>
                            <p className="text-3xl font-bold text-emerald-400">
                                {Math.max(0, ...attempts.map(a => getScorePercentage(a)))}%
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-2">Average Score</p>
                            <p className="text-3xl font-bold text-blue-400">
                                {Math.round(attempts.reduce((sum, a) => sum + getScorePercentage(a), 0) / (attempts.length || 1))}%
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-2">Submitted</p>
                            <p className="text-3xl font-bold text-indigo-400">
                                {attempts.filter(a => a.status === 'Submitted' || a.status === 'Graded').length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Attempts List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white px-2">Attempt History</h2>

                    {attempts.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                            <p className="text-slate-400 mb-4">No attempts yet</p>
                            <button
                                onClick={() => navigate(`/quizzes/${id}/attempt`)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Take Quiz
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attempts.map((attempt, index) => {
                                const scorePercentage = getScorePercentage(attempt);
                                const isSubmitted = attempt.status === 'Submitted' || attempt.status === 'Graded';
                                const attemptId = attempt.id || attempt.attemptId;

                                return (
                                    <div
                                        key={attemptId}
                                        onClick={() => {
                                            // التوجيه الصحيح بناءً على حالة المحاولة
                                            if (!isSubmitted) {
                                                navigate(`/quizzes/${id}/attempt`); // استكمال الامتحان
                                            } else {
                                                navigate(`/quizzes/${id}/attempt/${attemptId}`); // عرض النتيجة
                                            }
                                        }}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer group"
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-1">
                                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-slate-300">
                                                        #{attempts.length - index}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Score</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-2xl font-bold text-white">{scorePercentage}%</p>
                                                    {attempt.totalMarks ? (
                                                        <p className="text-sm text-slate-400">
                                                            ({attempt.score}/{attempt.totalMarks})
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="col-span-3">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Date Taken
                                                </p>
                                                <p className="text-sm text-slate-200">
                                                    {formatDate((attempt as any).startAt || attempt.startedAt)}                                                </p>
                                            </div>

                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Time Spent
                                                </p>
                                                <p className="text-sm text-slate-200">
                                                    {attempt.duration ? `${Math.round(attempt.duration / 60)} min` : 'N/A'}
                                                </p>
                                            </div>

                                            <div className="col-span-2">
                                                <p className={`text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1 ${getStatusColor(attempt.status)}`}>
                                                    <span>{getStatusIcon(attempt.status)}</span>
                                                    {attempt.status || 'InProgress'}
                                                </p>
                                            </div>

                                            <div className="col-span-2 flex justify-end">
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                            </div>
                                        </div>

                                        {isSubmitted && (
                                            <div className="mt-4 space-y-3">
                                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${scorePercentage >= 80
                                                            ? 'bg-emerald-500'
                                                            : scorePercentage >= 60
                                                                ? 'bg-blue-500'
                                                                : 'bg-amber-500'
                                                            }`}
                                                        style={{ width: `${scorePercentage}%` }}
                                                    ></div>
                                                </div>

                                                {/* Show unanswered questions if available */}
                                                {unansweredCounts[attemptId] !== undefined && (
                                                    <div className="flex items-center gap-2 pt-2">
                                                        {unansweredCounts[attemptId] > 0 ? (
                                                            <>
                                                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                                                <p className="text-xs text-amber-400 font-medium">
                                                                    {unansweredCounts[attemptId]} question{unansweredCounts[attemptId] !== 1 ? 's' : ''} not answered
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-emerald-400">✓</span>
                                                                <p className="text-xs text-emerald-400 font-medium">
                                                                    All questions answered
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 justify-center pt-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors border border-slate-700"
                    >
                        Back to Quizzes
                    </button>
                    {attempts.length > 0 && attempts.some(a => a.status === 'InProgress' || a.status === 'In-Progress') && (
                        <button
                            onClick={() => navigate(`/quizzes/${id}/attempt`)}
                            className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Resume Quiz
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
};