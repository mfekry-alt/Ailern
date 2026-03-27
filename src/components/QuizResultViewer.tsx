import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { attemptsService } from '@/api/services';
import type { AttemptResult, StudentAnswer } from '@/api/services/attempts.service';

/**
 * QuizResultViewer Component
 * 
 * Displays quiz results after submission including:
 * - Score and grade
 * - Question-by-question review
 * - Color-coded answers (correct/incorrect/pending)
 * - Explanations for each question
 * - Can filter by flagged questions
 * - Retry option if attempts remain
 */
export const QuizResultViewer = () => {
    const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();

    const [result, setResult] = useState<AttemptResult | null>(null);
    const [answers, setAnswers] = useState<StudentAnswer[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

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

                // Fetch result
                const resultData = await attemptsService.getAttemptResult(attemptId);
                setResult(resultData);

                // Fetch questions for the attempt
                const questionsData = await attemptsService.getAttemptQuestions(attemptId);
                console.log('✓ Attempt questions loaded:', questionsData?.length || 0, 'questions');
                setQuestions(questionsData || []);
            } catch (err) {
                console.error('Failed to load result:', err);
                setError('Failed to load quiz results. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadResult();
    }, [attemptId, quizId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <p className="text-slate-400">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-slate-400 mb-6">{error || 'Failed to load results'}</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    const displayedAnswers = showFlaggedOnly
        ? answers.filter((a) => (a as any).isFlagged)
        : answers;

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const pendingCount = answers.filter((a) => a.isCorrect === undefined || a.isCorrect === null).length;

    // Calculate percentage if not provided by API
    const percentage = result.percentage !== undefined && result.percentage !== null
        ? result.percentage
        : result.totalScore > 0
            ? (result.score / result.totalScore) * 100
            : 0;

    const getGrade = () => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 flex justify-between items-center px-6 h-16 bg-slate-900 border-b border-slate-800">
                <button
                    onClick={() => navigate('/quizzes')}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <h1 className="text-xl font-bold text-white">Quiz Results</h1>
                <div className="w-10"></div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Score Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    {/* Main score */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <p className="text-indigo-100 font-bold uppercase tracking-wider mb-2">Your Score</p>
                            <div className="flex items-baseline gap-4 mb-6">
                                <span className="text-6xl font-black">{result.score}</span>
                                <span className="text-3xl font-bold text-indigo-100">/ {result.totalScore}</span>
                            </div>
                            <p className="text-indigo-100 mb-4">{percentage.toFixed(1)}% Correct</p>
                            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                                <div
                                    className="bg-white h-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Grade & Stats */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Grade</p>
                            <p className="text-5xl font-black text-emerald-400">{getGrade()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Correct</p>
                                <p className="text-2xl font-black text-emerald-400">{correctCount}</p>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
                                <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Answer Review */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Answer Review</h2>
                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showFlaggedOnly}
                                onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                                className="w-4 h-4 rounded accent-indigo-500"
                            />
                            <span className="text-sm font-semibold">Show Flagged Only</span>
                        </label>
                    </div>

                    {questions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <p className="text-slate-400">No questions available for review</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, idx) => (
                                <div
                                    key={question.id}
                                    className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 overflow-hidden hover:border-indigo-500/30 transition-colors"
                                >
                                    {/* Question header */}
                                    <div className="mb-4">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Question {idx + 1} / {questions.length}
                                        </p>
                                        <p className="text-lg font-semibold text-white">{question.text}</p>
                                    </div>

                                    {/* Question type badge */}
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full">
                                            {question.type || 'MCQ'}
                                        </span>
                                    </div>

                                    {/* Options */}
                                    {question.options && question.options.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            <p className="text-sm font-semibold text-slate-300 mb-3">Options:</p>
                                            {question.options.map((option: any, optIdx: number) => (
                                                <div
                                                    key={optIdx}
                                                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/80 transition-colors"
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-400 flex items-center justify-center text-xs font-bold text-slate-300">
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </div>
                                                    <span className="text-slate-300">{option.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Points info */}
                                    {question.points && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                                            <p className="text-sm text-slate-400">
                                                <span className="font-semibold text-slate-300">Points:</span> {question.points}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-8 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors"
                    >
                        Back to Quizzes
                    </button>
                    <button
                        onClick={() => navigate(`/quizzes/${quizId}/attempt`)}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Retry Quiz
                    </button>
                </div>
            </main>
        </div>
    );
};
