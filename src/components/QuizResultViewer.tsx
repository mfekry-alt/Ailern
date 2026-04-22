import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Trophy, CheckCircle2, XCircle, FileText, MessageSquare } from 'lucide-react';
import { attemptsService } from '@/api/services';
import type { AttemptResult } from '@/api/services/attempts.service';
import type { AnswerDto } from '@/types/api.types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const QuizResultViewer = () => {
    const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();

    const [result, setResult] = useState<AttemptResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResult = async () => {
            if (!attemptId || !quizId) {
                setError('Missing quiz or attempt ID');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const resultData = await attemptsService.getAttemptResult(attemptId);
                setResult(resultData);
            } catch (err) {
                console.error('Failed to load result:', err);
                setError('Failed to load quiz results. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadResult();
    }, [attemptId, quizId]);

    const answers: AnswerDto[] = useMemo(() => {
        if (!result?.raw?.answers) return [];
        return [...result.raw.answers].sort((a, b) => a.order - b.order);
    }, [result]);

    const totalQuestions = answers.length;
    const correctQuestions = answers.filter((a) => a.score >= a.maxScore && a.maxScore > 0).length;
    const percentage = result
        ? (result.totalScore > 0 ? (result.score / result.totalScore) * 100 : 0)
        : 0;

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">{error || 'Failed to load results'}</p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans pb-20">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate(`/quizzes/${quizId}/attempts`)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:block">Back to Attempts</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" /> Attempt Result
                    </h1>
                    <div className="w-8 sm:w-32"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/10 p-8 sm:p-10">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />
                        <div className="relative z-10">
                            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-3">Final Score</p>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-6xl sm:text-7xl font-black text-white leading-none">{result.score}</span>
                                <span className="text-2xl sm:text-3xl font-bold text-blue-200">/ {result.totalScore}</span>
                            </div>
                            <p className="text-blue-100 font-medium text-lg">{percentage.toFixed(1)}%</p>
                            <div className="mt-6 w-full bg-black/20 h-3 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-300 to-green-300 rounded-full"
                                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Questions</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{totalQuestions}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Correct</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{correctQuestions}</p>
                        </div>
                        <div className="col-span-2 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Attempt Status</p>
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{result.status}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-3">
                    <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-700/50 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Answer Review</h2>
                    </div>

                    {answers.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem]">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-500 dark:text-slate-400 font-medium">No answers returned for this attempt.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {answers.map((answer) => {
                                const isCorrect = answer.maxScore > 0 && answer.score >= answer.maxScore;
                                return (
                                    <div
                                        key={`${answer.order}-${answer.questionText}`}
                                        className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-5 sm:p-6 shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                                                        Question {answer.order}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-600">
                                                        {answer.type}
                                                    </span>
                                                </div>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{answer.questionText}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{answer.score} / {answer.maxScore}</p>
                                                <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                    isCorrect
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                                                }`}>
                                                    {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {isCorrect ? 'Correct' : 'Needs Review'}
                                                </div>
                                            </div>
                                        </div>

                                        {answer.options && answer.options.length > 0 && (
                                            <div className="space-y-3">
                                                {answer.options
                                                    .slice()
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((option) => {
                                                        const optionState = option.isSelected
                                                            ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                                                            : option.isCorrect
                                                                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                                                                : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40';

                                                        return (
                                                            <div key={`${answer.order}-${option.order}`} className={`rounded-xl border px-4 py-3 ${optionState}`}>
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{option.optionText}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        {option.isCorrect && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                                                                Correct
                                                                            </span>
                                                                        )}
                                                                        {option.isSelected && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                                                                Your choice
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {answer.type === 'Written' && (
                                            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Your Answer</p>
                                                <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                                                    {answer.answer?.trim() ? answer.answer : 'No answer submitted.'}
                                                </p>
                                            </div>
                                        )}

                                        {answer.feedback && (
                                            <div className="mt-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 p-4">
                                                <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" /> Instructor Feedback
                                                </p>
                                                <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">{answer.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-center border-t border-gray-200 dark:border-slate-700/50">
                    <button
                        onClick={() => navigate(`/quizzes/${quizId}/attempts`)}
                        className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold transition-colors shadow-sm text-sm"
                    >
                        Back to Attempts
                    </button>
                </div>
            </main>
        </div>
    );
};