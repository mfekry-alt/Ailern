import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid3x3 } from 'lucide-react';
import { quizService, attemptsService } from '@/api/services';

/**
 * QuizPage Component
 * Displays quiz questions and handles student quiz attempts
 * Features:
 * - API-based questions loading
 * - Real-time progress tracking
 * - Question navigation with flagging
 * - Auto-save to localStorage
 * - Timer countdown
 */

interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    options?: { id: string; text: string }[];
    points?: number;
}

interface QuestionAttempt {
    questionId: string;
    answer?: string;
    selectedOptions?: string[];
}

interface QuizDetail {
    id: string;
    title: string;
    description?: string;
}

export const QuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuestionAttempt[]>([]);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(24 * 60 + 18);
    const [submitted, setSubmitted] = useState(false);
    const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // Initialize quiz
    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) {
                setError('No quiz ID provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Step 1: Fetch quiz details
                console.log('[Quiz] Fetching quiz details...');
                const quiz = await quizService.getQuiz(id);
                setQuizDetail({
                    id: quiz.id,
                    title: quiz.title || 'Quiz',
                    description: quiz.description,
                });
                console.log('[Quiz] Quiz details loaded:', quiz.title);

                // Step 2: Start a quiz attempt
                console.log('[Quiz] Starting quiz attempt...');
                const attempt = await attemptsService.startQuizAttempt(id);
                setAttemptId(attempt.attemptId);
                console.log('[Quiz] Attempt started with ID:', attempt.attemptId);

                // Step 3: Fetch questions for this attempt
                console.log('[Quiz] Fetching attempt questions...');
                const attemptQuestions = await attemptsService.getAttemptQuestions(attempt.attemptId);
                console.log('[Quiz] Loaded', attemptQuestions.length, 'questions');

                if (attemptQuestions.length > 0) {
                    setQuestions(attemptQuestions);
                } else {
                    setError('No questions available for this quiz attempt');
                }
            } catch (err) {
                console.error('Failed to load quiz:', err);
                setError('Failed to load quiz. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadQuiz();
    }, [id]);

    // Timer effect
    useEffect(() => {
        if (submitted) return;
        const interval = setInterval(() => {
            setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const totalAnswered = answers.filter((a) => a.answer || a.selectedOptions?.length).length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

    const handleAnswerChange = (value: string | string[]) => {
        if (!currentQuestion) return;

        setAnswers((prevAnswers) => {
            const existingIndex = prevAnswers.findIndex((a) => a.questionId === currentQuestion.id);

            if (existingIndex > -1) {
                const updated = [...prevAnswers];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...(typeof value === 'string'
                        ? { answer: value }
                        : { selectedOptions: value }),
                };
                return updated;
            } else {
                return [
                    ...prevAnswers,
                    {
                        questionId: currentQuestion.id,
                        ...(typeof value === 'string'
                            ? { answer: value }
                            : { selectedOptions: value }),
                    },
                ];
            }
        });
    };

    const toggleFlag = () => {
        if (!currentQuestion) return;
        setFlaggedQuestions((prev) =>
            prev.includes(currentQuestion.id)
                ? prev.filter((id) => id !== currentQuestion.id)
                : [...prev, currentQuestion.id]
        );
    };

    const handleSubmit = async () => {
        if (!attemptId) {
            setError('No active attempt. Please refresh and try again.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Save locally
            localStorage.setItem(`quiz_${id}_answers`, JSON.stringify(answers));

            // Submit attempt to backend
            console.log('[Quiz] Submitting attempt...');
            await attemptsService.submitQuizAttempt(attemptId, { answers });
            console.log('[Quiz] Attempt submitted successfully');

            setSubmitted(true);
        } catch (err) {
            console.error('Submit failed:', err);
            setError('Failed to submit quiz. Your answers have been saved locally.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const getQuestionStatus = (questionId: string) => {
        if (flaggedQuestions.includes(questionId)) return 'flagged';
        const answer = answers.find((a) => a.questionId === questionId);
        if (answer && (answer.answer || answer.selectedOptions?.length)) return 'answered';
        return 'remaining';
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Quiz Submitted!</h2>
                    <p className="text-slate-400 mb-8">Your quiz has been submitted successfully.</p>
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-400">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error || !currentQuestion || questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-slate-400 mb-6">{error || 'No questions available for this quiz.'}</p>
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

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-extrabold text-indigo-400">EduPulse LMS</span>
                </div>
                <div className="flex items-center gap-6">
                    <button className="text-slate-400 hover:text-slate-200 p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <button className="text-slate-400 hover:text-slate-200 p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 w-full">
                    {/* Quiz Header & Timer */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
                        <div>
                            <h1 className="text-2xl font-extrabold text-white">{quizDetail?.title || 'Quiz'}</h1>
                            <p className="text-slate-400 text-sm mt-1">{quizDetail?.description || ''}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-red-500/20 px-5 py-3 rounded-xl border border-red-500/40">
                            <Clock className="w-5 h-5 text-red-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Remaining Time</span>
                                <span className="text-xl font-mono font-bold text-white">{formatTime(timeRemaining)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 bg-slate-800/50 backdrop-blur border border-slate-700/50 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-slate-300">Quiz Progress</h4>
                            <span className="text-sm font-bold text-indigo-400">{totalAnswered} / {totalQuestions} Answered</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: Questions */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Question Card */}
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-8 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-widest">
                                        Question {currentQuestionIndex + 1} • {currentQuestion.type}
                                    </span>
                                    <span className="text-slate-400 text-xs">Points: {currentQuestion.points || 1}</span>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-8 leading-relaxed">
                                    {currentQuestion.text}
                                </h3>

                                {currentQuestion.type === 'MCQ' && (
                                    <div className="space-y-3">
                                        {currentQuestion.options?.map((option, idx) => {
                                            const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
                                            const optionId = typeof option === 'string' ? String(idx) : (option.id ?? String(idx));
                                            const optionText = typeof option === 'string' ? option : option.text;
                                            const isSelected = currentAnswer?.selectedOptions?.includes(optionId);
                                            return (
                                                <label
                                                    key={idx}
                                                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                                        ? 'border-2 border-indigo-500 bg-indigo-500/10'
                                                        : 'border-slate-600 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`q${currentQuestion.id}`}
                                                        value={optionId}
                                                        onChange={(e) => handleAnswerChange([e.target.value])}
                                                        className="w-5 h-5"
                                                    />
                                                    <span className="ml-4 text-slate-300">{optionText}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentQuestion.type === 'TrueFalse' && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleAnswerChange('True')}
                                            className={`flex-1 py-4 px-6 rounded-xl border font-bold transition-all ${answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'True'
                                                ? 'border-2 border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                : 'border-slate-600 text-slate-300 hover:border-indigo-500'
                                                }`}
                                        >
                                            ✓ True
                                        </button>
                                        <button
                                            onClick={() => handleAnswerChange('False')}
                                            className={`flex-1 py-4 px-6 rounded-xl border font-bold transition-all ${answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'False'
                                                ? 'border-2 border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                : 'border-slate-600 text-slate-300 hover:border-indigo-500'
                                                }`}
                                        >
                                            ✗ False
                                        </button>
                                    </div>
                                )}

                                {currentQuestion.type === 'Written' && (
                                    <div>
                                        <textarea
                                            value={answers.find((a) => a.questionId === currentQuestion.id)?.answer || ''}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            placeholder="Enter your detailed response here..."
                                            rows={6}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none transition-all"
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <span className="text-xs text-slate-400">
                                                Word count: {(answers.find((a) => a.questionId === currentQuestion.id)?.answer || '').split(/\s+/).filter(Boolean).length} / 500
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>

                                <button
                                    onClick={() => goToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Navigator */}
                        <aside className="lg:col-span-4 flex flex-col gap-6">
                            {/* Question Navigator */}
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl">
                                <div className="flex items-center gap-2 mb-6">
                                    <Grid3x3 className="w-5 h-5 text-indigo-400" />
                                    <h4 className="font-bold text-white">Question Navigator</h4>
                                </div>

                                <div className="grid grid-cols-5 gap-3">
                                    {questions.map((q, idx) => {
                                        const status = getQuestionStatus(q.id);
                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => goToQuestion(idx)}
                                                className={`aspect-square flex items-center justify-center rounded-lg font-bold text-sm transition-all relative ${idx === currentQuestionIndex
                                                    ? 'border-2 border-indigo-500 text-indigo-300 ring-4 ring-indigo-500/20'
                                                    : status === 'answered'
                                                        ? 'bg-indigo-500 text-white'
                                                        : status === 'flagged'
                                                            ? 'bg-red-500/20 border border-red-500 text-red-400'
                                                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                                                    }`}
                                            >
                                                {idx + 1}
                                                {status === 'flagged' && (
                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 border-t border-slate-700 pt-6 space-y-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-indigo-500"></div> Answered
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div> Remaining
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-red-500"></div> Flagged
                                    </div>
                                </div>
                            </div>

                            {/* Flag Question */}
                            <button
                                onClick={toggleFlag}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${flaggedQuestions.includes(currentQuestion.id)
                                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-red-500 hover:text-red-400'
                                    }`}
                            >
                                <Flag className="w-4 h-4" />
                                {flaggedQuestions.includes(currentQuestion.id) ? 'Flagged' : 'Flag Question'}
                            </button>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black text-lg uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
};



