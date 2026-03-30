import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, Trophy, RotateCcw, Lock } from 'lucide-react';
import { attemptsService, quizService } from '@/api/services';
import type { AttemptResult, StudentAnswer } from '@/api/services/attempts.service';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const QuizResultViewer = () => {
    const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();

    const [result, setResult] = useState<AttemptResult | null>(null);
    const [answers, setAnswers] = useState<StudentAnswer[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<any>(null);
    const [attemptsCount, setAttemptsCount] = useState<number>(0);

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

                // جلب كل البيانات المطلوبة في نفس الوقت لتسريع التحميل
                const [resultData, questionsData, quizData, allAttempts] = await Promise.all([
                    attemptsService.getAttemptResult(attemptId),
                    attemptsService.getAttemptQuestions(attemptId),
                    quizService.getQuiz(quizId),
                    attemptsService.getQuizAttempts(quizId)
                ]);

                setResult(resultData);
                setQuestions(questionsData || []);
                setQuiz(quizData);
                setAttemptsCount(allAttempts.length);

                // لو السيرفر بيرجع الـ answers مع الـ result، ممكن تسيفها هنا
                // setAnswers(resultData.answers || []); 

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
                        onClick={() => navigate('/quizzes')}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }


    const isGraded = String(result.status).toLowerCase() === 'graded';
    const isAttemptsFull = attemptsCount >= (quiz?.maximumAttempts || 1);
    const showResultOnClose = quiz?.showResultOnClose === true;

    const canShowScore = isGraded || (isAttemptsFull && showResultOnClose);

    const displayedAnswers = showFlaggedOnly ? answers.filter((a) => (a as any).isFlagged) : answers;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const pendingCount = answers.filter((a) => a.isCorrect === undefined || a.isCorrect === null).length;

    const percentage = result.percentage !== undefined && result.percentage !== null
        ? result.percentage
        : result.totalScore > 0 ? (result.score / result.totalScore) * 100 : 0;

    const getGrade = () => {
        if (percentage >= 90) return { letter: 'A', color: 'text-emerald-500' };
        if (percentage >= 80) return { letter: 'B', color: 'text-blue-500' };
        if (percentage >= 70) return { letter: 'C', color: 'text-yellow-500' };
        if (percentage >= 60) return { letter: 'D', color: 'text-orange-500' };
        return { letter: 'F', color: 'text-red-500' };
    };

    const gradeInfo = getGrade();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:block">Back to Quizzes</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" /> Quiz Results
                    </h1>
                    <div className="w-8 sm:w-32"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">

                {/* 🔒 إما أن نعرض النتيجة أو رسالة الإخفاء */}
                {canShowScore ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Score Card */}
                        <div className="lg:col-span-2 relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/10 p-8 sm:p-10">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 text-center sm:text-left">
                                <div>
                                    <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-3 flex items-center justify-center sm:justify-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-300" /> Final Score
                                    </p>
                                    <div className="flex items-baseline justify-center sm:justify-start gap-2 mb-2">
                                        <span className="text-7xl sm:text-8xl font-black text-white leading-none tracking-tight">{result.score}</span>
                                        <span className="text-2xl sm:text-3xl font-bold text-blue-200">/ {result.totalScore}</span>
                                    </div>
                                    <p className="text-blue-100 font-medium text-lg">{percentage.toFixed(1)}% Correct</p>
                                </div>
                                <div className="w-full sm:w-1/2 max-w-[240px]">
                                    <div className="flex justify-between text-xs font-bold text-blue-100 mb-2">
                                        <span>Progress</span>
                                        <span>{percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-gradient-to-r from-blue-300 to-green-300 rounded-full relative" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grade & Details Cards */}
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Letter Grade</p>
                                    <p className={`text-5xl font-black ${gradeInfo.color}`}>{gradeInfo.letter}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 ${gradeInfo.color}`}>
                                    <Trophy className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                                    <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Correct</p>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-500">{correctCount}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                                    <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
                                    <p className="text-2xl sm:text-3xl font-black text-amber-500">{pendingCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-inner">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                            <Lock className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Score is Hidden</h2>
                        <p className="text-gray-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
                            Your final score will be revealed once the quiz is fully graded or you have exhausted all your attempts. You can still review your submitted answers below.
                        </p>
                    </div>
                )}

                {/* Answer Review Section */}
                <div className="space-y-6 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Answer Review</h2>
                        </div>
                    </div>

                    {questions.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem]">
                            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-500 dark:text-slate-400 font-medium">No questions available for review at this time.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((question, idx) => (
                                <div key={question.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 overflow-hidden hover:border-blue-300 dark:hover:border-slate-500 transition-colors shadow-sm">
                                    <div className="mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                                                Question {idx + 1} of {questions.length}
                                            </span>
                                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-gray-200 dark:border-slate-600">
                                                {question.type || 'MCQ'}
                                            </span>
                                        </div>
                                        <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">{question.text}</p>
                                    </div>

                                    {/* Options (MCQ & TrueFalse) */}
                                    {question.options && question.options.length > 0 && (
                                        <div className="space-y-3">
                                            {question.options.map((option: any, optIdx: number) => {
                                                // 💡 التحقق مما إذا كانت هذه هي الإجابة التي اختارها الطالب
                                                const isSelected =
                                                    (question.type === 'MCQ' && option.optionNumber === question.studentOptionNumber) ||
                                                    (question.type === 'TrueFalse' && option.text === String(question.studentBooleanAnswer));

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isSelected
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md'
                                                                : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800'
                                                            }`}
                                                    >
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold shadow-sm ${isSelected
                                                                ? 'bg-blue-600 text-white border-blue-700'
                                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                                                            }`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}>
                                                            {option.text}
                                                        </span>

                                                        {/* علامة توضح أن هذه هي إجابته */}
                                                        {isSelected && (
                                                            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-md">
                                                                Your Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Written Answer */}
                                    {question.type === 'Written' && (
                                        <div className="mt-4 p-5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Your Answer:</p>
                                            <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                                                {question.studentWrittenAnswer || <span className="italic text-gray-400">No answer provided.</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center border-t border-gray-200 dark:border-slate-700/50">
                    <button onClick={() => navigate('/quizzes')} className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold transition-colors shadow-sm text-sm">
                        Back to Quizzes
                    </button>
                    {!isAttemptsFull && (
                        <button onClick={() => navigate(`/quizzes/${quizId}/attempt`)} className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Try Again
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};