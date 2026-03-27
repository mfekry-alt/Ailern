import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid3x3, GripVertical } from 'lucide-react';
import { quizService, attemptsService } from '@/api/services';
import { useStrictExamMonitor } from '@/hooks/useStrictExamMonitor';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { ViolationWarningModal } from '@/components/ViolationWarningModal';
import { FullscreenPrompt } from '@/components/FullscreenPrompt';

interface Question {
    id: string;
    question: string;  // Changed from 'text' to 'question'
    type: 'MCQ' | 'TrueFalse' | 'Written';
    instructions?: string;
    options?: { option: string; optionNumber: number }[];  // Changed from { id, text } to { option, optionNumber }
    points?: number;
    writtenAnswer?: string;
    booleanAnswer?: boolean;
    optionNumber?: number;
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
    attemptTimeLimit?: number;
}

/**
 * QuizAttemptViewer Component
 * 
 * Complete exam interface with:
 * - Strict exam security (tab monitoring, fullscreen, etc)
 * - Accurate timer (survives refresh)
 * - All question types (MCQ, TrueFalse, Written)
 * - Auto-save every 30 seconds
 * - Question navigator with status indicators
 * - Flag/unflag questions
 * - Secure submission
 * - Auto-submit on violations or timeout
 */
export const QuizAttemptViewer = () => {
    const { id: quizId, attemptId: attemptIdFromUrl } = useParams<{ id: string, attemptId?: string }>();
    const navigate = useNavigate();

    // Core quiz state
    const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuestionAttempt[]>([]);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);

    // Timer properties state - must be declared with other useState
    const [timerProps, setTimerProps] = useState<{
        attemptStartTime: string;
        timeLimit: number;
    } | null>(null);

    // Refs
    const quizContainerRef = useRef<HTMLDivElement>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Auto-submit handler - must be defined before using in hooks
    const handleAutoSubmit = useCallback(async () => {
        if (!attemptId || submitted) return;

        console.log('[Quiz] Auto-submitting exam due to violation or timeout');
        setIsSubmitting(true);

        try {
            await attemptsService.submitQuizAttempt(attemptId, { answers });
            setSubmitted(true);
            localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(answers));

            setTimeout(() => {
                navigate(`/quizzes/${quizId}/attempt/${attemptId}/result`);
            }, 2000);
        } catch (err) {
            console.error('[Quiz] Auto-submit failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    }, [attemptId, submitted, answers, quizId, navigate]);

    // Exam security hook
    const examMonitor = useStrictExamMonitor(handleAutoSubmit);

    // Memoize timer props to prevent unnecessary re-renders of useQuizTimer
    const memoizedTimerProps = useMemo(
        () =>
            timerProps
                ? {
                    attemptStartTime: timerProps.attemptStartTime,
                    timeLimit: timerProps.timeLimit,
                    onTimeExpired: handleAutoSubmit,
                }
                : null,
        [timerProps, handleAutoSubmit]
    );

    // Always call the timer hook - pass null values if not ready yet
    const timer = useQuizTimer(memoizedTimerProps);

    // Initialize quiz and attempt
    useEffect(() => {
        if (!quizId) {
            setError('No quiz ID provided');
            setIsLoading(false);
            return;
        }

        const loadQuiz = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // SAFETY: Ensure we're in the right route
                console.log('[Quiz] ===== QUIZ ATTEMPT PAGE LOADED =====');
                console.log('[Quiz] URL Params: quizId=', quizId, ', attemptIdFromUrl=', attemptIdFromUrl);

                // Step 1: Get quiz details
                console.log('[Quiz] Fetching quiz...');
                const quiz = await quizService.getQuiz(quizId);
                setQuizDetail({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    attemptTimeLimit: 60,
                });

                // Step 2: Determine which attempt to use
                // If attemptIdFromUrl exists, we're in REVIEW MODE (viewing a past attempt)
                let currentAttemptId: string | null = null;

                if (attemptIdFromUrl) {
                    console.log('[Quiz] ===== REVIEW MODE: Viewing past attempt =====');
                    console.log('[Quiz] Viewing past attempt:', attemptIdFromUrl);
                    currentAttemptId = attemptIdFromUrl;
                    // Don't show fullscreen or timer in review mode
                    setShowFullscreenPrompt(false);
                    // Skip timer setup for past attempts
                } else {
                    console.log('[Quiz] ===== NEW ATTEMPT MODE =====');
                    // NEW ATTEMPT MODE: Get open attempts or create new one
                    console.log('[Quiz] Checking for open attempts...');
                    let openAttempts: any[] = [];
                    try {
                        openAttempts = await (attemptsService as any).getStudentOpenAttempts?.(quizId) ?? [];
                        console.log('[Quiz] Found', openAttempts.length, 'open attempts');
                    } catch (e) {
                        console.warn('[Quiz] Could not fetch open attempts:', e);
                    }

                    let attempt;
                    if (openAttempts.length > 0) {
                        // Resume existing attempt (must be InProgress, not Submitted)
                        attempt = openAttempts[0];
                        console.log('[Quiz] Resuming existing attempt:', attempt.id || attempt.attemptId, 'Status:', attempt.status);

                        // Safety check: don't use submitted attempts
                        if (attempt.status === 'Submitted' || attempt.isSubmitted) {
                            console.warn('[Quiz] WARNING: Attempt is already submitted, creating new attempt instead');
                            throw new Error('Attempt already submitted. Creating new attempt.');
                        }
                    } else {
                        // Try to create new attempt
                        console.log('[Quiz] Creating new attempt...');
                        try {
                            attempt = await attemptsService.startQuizAttempt(quizId);
                            console.log('[Quiz] Attempt created:', attempt.id || attempt.attemptId);
                        } catch (createErr: any) {
                            // If creation fails due to in-progress attempt, fetch open attempts again
                            if (createErr.response?.status === 400 && createErr.response?.data?.message?.includes('In-Progress')) {
                                console.log('[Quiz] Attempt creation failed - retrying to fetch open attempts...');
                                try {
                                    const retryAttempts = await (attemptsService as any).getStudentOpenAttempts?.(quizId) ?? [];
                                    if (retryAttempts.length > 0) {
                                        attempt = retryAttempts[0];
                                        console.log('[Quiz] Found open attempt on retry:', attempt.id || attempt.attemptId);
                                    } else {
                                        throw createErr; // Re-throw original error if no attempts found
                                    }
                                } catch (retryErr) {
                                    throw createErr; // Throw original error
                                }
                            } else {
                                throw createErr;
                            }
                        }
                    }

                    // Extract the correct attempt ID from either 'id' or 'attemptId' property
                    currentAttemptId = attempt.id || attempt.attemptId;
                    if (!currentAttemptId) {
                        throw new Error('Failed to get valid attempt ID from server response');
                    }

                    // Setup timer based on attempt start time (only for new/active attempts)
                    setTimerProps({
                        attemptStartTime: attempt.startedAt,
                        timeLimit: attempt.timeLimit || 60,
                    });
                }

                setAttemptId(currentAttemptId);

                // Step 3: Fetch questions for this attempt
                console.log('[Quiz] Fetching questions for attempt:', currentAttemptId);
                const questionsData = await attemptsService.getAttemptQuestions(currentAttemptId);
                console.log('[Quiz] Questions fetched:', questionsData?.length || 0, 'questions');

                if (!questionsData || questionsData.length === 0) {
                    console.warn('[Quiz] WARNING: No questions returned for attempt', currentAttemptId);
                    setError('This quiz has no questions available. Please contact your instructor.');
                } else {
                    setQuestions(questionsData);
                    console.log('[Quiz] Quiz loaded successfully with', questionsData.length, ' questions');
                }
            } catch (err: any) {
                console.error('[Quiz] Error loading quiz:', err);
                console.error('[Quiz] Error response:', err.response?.data);
                // Provide more specific error messages
                if (err.response?.status === 403) {
                    setError('You have reached the maximum number of attempts allowed for this quiz.');
                } else if (err.response?.status === 400) {
                    setError('This attempt is no longer available or has expired.');
                } else {
                    setError(`Failed to load quiz: ${err.message || 'Please try again.'}`);
                }
            } finally {
                setIsLoading(false);
                console.log('[Quiz] ===== LOAD COMPLETE =====');
            }
        };

        loadQuiz();
    }, [quizId, attemptIdFromUrl]);

    // Setup exam monitoring when fullscreen is entered
    useEffect(() => {
        if (!showFullscreenPrompt && quizContainerRef.current) {
            examMonitor.setupExamMonitoring(quizContainerRef.current);

            return () => {
                examMonitor.cleanupMonitoring();
            };
        }
    }, [showFullscreenPrompt, examMonitor]);

    // Auto-save answers every 30 seconds
    useEffect(() => {
        if (!attemptId || submitted || showFullscreenPrompt) {
            return;
        }

        // Initial save after 30 seconds
        autoSaveIntervalRef.current = setInterval(() => {
            if (answers.length > 0) {
                console.log('[Quiz] Auto-saving progress...');
                attemptsService
                    .saveAttemptProgress(attemptId, { answers })
                    .catch((err) => console.error('[Quiz] Auto-save failed:', err));
            }
        }, 30000);

        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [attemptId, answers, submitted, showFullscreenPrompt]);

    // Handle fullscreen entry
    const handleFullscreenEntered = () => {
        setShowFullscreenPrompt(false);
        console.log('[Quiz] Fullscreen entered, exam security active');
    };

    // Handle fullscreen cancel
    const handleFullscreenCancel = () => {
        setError('Fullscreen mode is required to take this quiz.');
        navigate('/quizzes');
    };

    // Manual submit
    const handleSubmit = async () => {
        if (!attemptId || submitted || isSubmitting || attemptIdFromUrl) return;

        setIsSubmitting(true);
        try {
            console.log('[Quiz] Submitting quiz...');
            await attemptsService.submitQuizAttempt(attemptId, { answers });
            localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(answers));
            setSubmitted(true);

            setTimeout(() => {
                navigate(`/quizzes/${quizId}/attempt/${attemptId}/result`);
            }, 1000);
        } catch (err) {
            console.error('[Quiz] Submit failed:', err);
            setError('Failed to submit quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Answer handlers
    const handleAnswerChange = (value: string | string[]) => {
        // Disable answer changes in review mode
        if (attemptIdFromUrl) {
            console.log('[Quiz] Review mode: cannot edit answers');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        setAnswers((prev) => {
            const existingIndex = prev.findIndex((a) => a.questionId === currentQuestion.id);

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...(typeof value === 'string'
                        ? { answer: value }
                        : { selectedOptions: value }),
                };
                return updated;
            } else {
                return [
                    ...prev,
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
        // Disable flagging in review mode
        if (attemptIdFromUrl) {
            console.log('[Quiz] Review mode: cannot flag questions');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        setFlaggedQuestions((prev) =>
            prev.includes(currentQuestion.id)
                ? prev.filter((id) => id !== currentQuestion.id)
                : [...prev, currentQuestion.id]
        );
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(Math.max(0, Math.min(index, questions.length - 1)));
    };

    const getQuestionStatus = (questionId: string) => {
        if (flaggedQuestions.includes(questionId)) return 'flagged';
        const answer = answers.find((a) => a.questionId === questionId);
        if (answer && (answer.answer || answer.selectedOptions?.length)) return 'answered';
        return 'remaining';
    };

    // Loading/Error screens
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <svg
                            className="w-12 h-12 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-slate-400">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    // Fullscreen prompt
    if (showFullscreenPrompt) {
        return (
            <FullscreenPrompt
                onFullscreenEntered={handleFullscreenEntered}
                onCancel={handleFullscreenCancel}
            />
        );
    }

    // Success screen
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
                    <p className="text-slate-500 text-sm">Redirecting to results...</p>
                </div>
            </div>
        );
    }

    if (!questions.length || currentQuestionIndex >= questions.length) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-slate-400 mb-6">No questions available</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const totalAnswered = answers.filter((a) => a.answer || a.selectedOptions?.length).length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col" ref={quizContainerRef}>
            {/* Violation Modal */}
            <ViolationWarningModal
                isOpen={examMonitor.showViolationModal}
                violationNumber={
                    examMonitor.violationCount <= 3
                        ? (examMonitor.violationCount as 1 | 2 | 3)
                        : 3
                }
                reason={
                    (examMonitor.violations && examMonitor.violations.length > 0)
                        ? examMonitor.violations[examMonitor.violations.length - 1]?.message
                        : 'Security violation detected'
                }
                onAcknowledge={examMonitor.handleViolationAck}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 flex justify-between items-center px-6 h-16 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-extrabold text-indigo-400">EduPulse LMS</span>
                    {attemptIdFromUrl && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full uppercase tracking-widest">
                            Review Mode
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    {/* Violations indicator - only show in active mode */}
                    {!attemptIdFromUrl && (
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((num) => (
                                <div
                                    key={num}
                                    className={`w-2 h-2 rounded-full ${num <= examMonitor.violationCount
                                        ? 'bg-red-500'
                                        : 'bg-slate-600'
                                        }`}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1">
                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 w-full overflow-y-auto">
                    {/* Quiz Header & Timer */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
                        <div>
                            <h1 className="text-2xl font-extrabold text-white">{quizDetail?.title}</h1>
                            <p className="text-slate-400 text-sm mt-1">{quizDetail?.description}</p>
                        </div>
                        {timer && (
                            <div
                                className={`flex items-center gap-4 px-5 py-3 rounded-xl border ${timer.isWarning
                                    ? 'bg-red-500/20 border-red-500/40'
                                    : 'bg-slate-700/50 border-slate-600'
                                    }`}
                            >
                                <Clock className={`w-5 h-5 ${timer.isWarning ? 'text-red-400' : 'text-slate-400'}`} />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Time Remaining
                                    </span>
                                    <span
                                        className={`text-xl font-mono font-bold ${timer.isWarning ? 'text-red-400' : 'text-white'
                                            }`}
                                    >
                                        {timer.formattedTime}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 bg-slate-800/50 backdrop-blur border border-slate-700/50 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-slate-300">Quiz Progress</h4>
                            <span className="text-sm font-bold text-indigo-400">
                                {totalAnswered} / {totalQuestions} Answered
                            </span>
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
                        {/* Question Display */}
                        <div className="lg:col-span-8">
                            {/* Question Card */}
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-8 rounded-2xl relative overflow-hidden mb-6">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-widest">
                                        Question {currentQuestionIndex + 1} •{' '}
                                        {currentQuestion.type}
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                        Points: {currentQuestion.points || 1}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-8 leading-relaxed">
                                    {currentQuestion.question}
                                </h3>

                                {/* MCQ */}
                                {currentQuestion.type === 'MCQ' && (
                                    <div className="space-y-3">
                                        {currentQuestion.options?.map((option, idx) => {
                                            const currentAnswer = answers.find(
                                                (a) => a.questionId === currentQuestion.id
                                            );
                                            const optionNumber = option.optionNumber;
                                            const optionText = option.option;
                                            const isSelected = currentAnswer?.selectedOptions?.includes(
                                                String(optionNumber)
                                            );

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
                                                        value={String(optionNumber)}
                                                        onChange={(e) =>
                                                            handleAnswerChange([e.target.value])
                                                        }
                                                        disabled={!!attemptIdFromUrl}
                                                        className="w-5 h-5"
                                                    />
                                                    <span className="ml-4 text-slate-300">
                                                        {optionText}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* True/False */}
                                {currentQuestion.type === 'TrueFalse' && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleAnswerChange('True')}
                                            disabled={!!attemptIdFromUrl}
                                            className={`flex-1 py-4 px-6 rounded-xl border font-bold transition-all ${attemptIdFromUrl
                                                ? 'opacity-50 cursor-not-allowed'
                                                : answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'True'
                                                    ? 'border-2 border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                    : 'border-slate-600 text-slate-300 hover:border-indigo-500'
                                                }`}
                                        >
                                            ✓ True
                                        </button>
                                        <button
                                            onClick={() => handleAnswerChange('False')}
                                            disabled={!!attemptIdFromUrl}
                                            className={`flex-1 py-4 px-6 rounded-xl border font-bold transition-all ${attemptIdFromUrl
                                                ? 'opacity-50 cursor-not-allowed'
                                                : answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'False'
                                                    ? 'border-2 border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                    : 'border-slate-600 text-slate-300 hover:border-indigo-500'
                                                }`}
                                        >
                                            ✗ False
                                        </button>
                                    </div>
                                )}

                                {/* Written/Essay */}
                                {currentQuestion.type === 'Written' && (
                                    <div>
                                        <textarea
                                            value={
                                                answers.find(
                                                    (a) => a.questionId === currentQuestion.id
                                                )?.answer || ''
                                            }
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            placeholder="Enter your detailed response here..."
                                            disabled={!!attemptIdFromUrl}
                                            rows={6}
                                            className={`w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none transition-all ${attemptIdFromUrl ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <span className="text-xs text-slate-400">
                                                Word count:{' '}
                                                {(
                                                    answers.find(
                                                        (a) => a.questionId === currentQuestion.id
                                                    )?.answer || ''
                                                )
                                                    .split(/\s+/)
                                                    .filter(Boolean).length}{' '}
                                                / 1000
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>

                                <button
                                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="lg:col-span-4 flex flex-col gap-6">
                            {/* Question Navigator */}
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl sticky top-20">
                                <div className="flex items-center gap-2 mb-6">
                                    <Grid3x3 className="w-5 h-5 text-indigo-400" />
                                    <h4 className="font-bold text-white">Question Navigator</h4>
                                </div>

                                <div className="grid grid-cols-5 gap-3 mb-8">
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

                                <div className="border-t border-slate-700 pt-6 space-y-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-indigo-500"></div> Answered
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></div>
                                        Remaining
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-red-500"></div> Flagged
                                    </div>
                                </div>
                            </div>

                            {/* Flag Button */}
                            <button
                                onClick={toggleFlag}
                                disabled={!!attemptIdFromUrl}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${attemptIdFromUrl
                                    ? 'bg-slate-700 text-slate-400 border border-slate-600 opacity-50 cursor-not-allowed'
                                    : flaggedQuestions.includes(currentQuestion.id)
                                        ? 'bg-red-500/20 text-red-400 border border-red-500'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-red-500 hover:text-red-400'
                                    }`}
                            >
                                <Flag className="w-4 h-4" />
                                {attemptIdFromUrl
                                    ? 'Cannot flag in review mode'
                                    : flaggedQuestions.includes(currentQuestion.id)
                                        ? 'Flagged'
                                        : 'Flag Question'}
                            </button>

                            {/* Submit Button */}
                            {attemptIdFromUrl ? (
                                <button
                                    onClick={() => navigate('/quizzes')}
                                    className="w-full py-5 rounded-2xl bg-slate-700 text-slate-300 font-black text-lg uppercase tracking-widest hover:bg-slate-600 transition-all shadow-lg active:scale-95"
                                >
                                    Back to Quiz List
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || examMonitor.hasAutoSubmitted}
                                    className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black text-lg uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                </button>
                            )}
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
};
