import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid3x3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { quizService, attemptsService } from '@/api/services';
import {
    useStrictExamMonitor,
    type UseStrictExamMonitorReturn,
} from '@/hooks/useStrictExamMonitor';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { ViolationWarningModal } from '@/components/ViolationWarningModal';
import { FullscreenPrompt } from '@/components/FullscreenPrompt';

// Set to true to re-enable strict exam monitoring.
const ENABLE_STRICT_MONITOR = false;

interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    instructions?: string;
    options?: { id: string; text: string }[];
    points?: number;
    writtenAnswer?: string;
    booleanAnswer?: boolean;
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
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(ENABLE_STRICT_MONITOR);

    const [timerProps, setTimerProps] = useState<{
        attemptStartTime: string;
        timeLimit: number;
    } | null>(null);

    const quizContainerRef = useRef<HTMLDivElement>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleAutoSubmit = useCallback(async () => {
        if (!attemptId || submitted || isLoading || questions.length === 0) return;

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
    }, [attemptId, submitted, isLoading, questions.length, answers, quizId, navigate]);

    const strictExamMonitor = useStrictExamMonitor(handleAutoSubmit);
    const noOpExamMonitor = useMemo<UseStrictExamMonitorReturn>(
        () => ({
            violationCount: 0, showViolationModal: false, isFullscreen: true, violations: [],
            requestFullscreen: async () => { }, handleViolationAck: () => { }, setupExamMonitoring: () => { },
            cleanupMonitoring: () => { }, hasAutoSubmitted: false,
        }), []
    );
    const examMonitor = ENABLE_STRICT_MONITOR ? strictExamMonitor : noOpExamMonitor;

    const memoizedTimerProps = useMemo(
        () => timerProps ? { attemptStartTime: timerProps.attemptStartTime, timeLimit: timerProps.timeLimit, onTimeExpired: handleAutoSubmit } : null,
        [timerProps, handleAutoSubmit]
    );

    const timer = useQuizTimer(memoizedTimerProps);

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

                const quiz = await quizService.getQuiz(quizId);
                setQuizDetail({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    attemptTimeLimit: 60,
                });

                let currentAttemptId: string | null = null;

                if (attemptIdFromUrl) {
                    currentAttemptId = attemptIdFromUrl;
                    setShowFullscreenPrompt(false);
                } else {
                    const attempt = await attemptsService.startOrResumeQuizAttempt(quizId);
                    currentAttemptId = attempt.id;
                    if (!currentAttemptId) throw new Error('Failed to get valid attempt ID from server response');

                    const startTime = new Date(attempt.startAt).getTime();
                    const now = Date.now();
                    const elapsedMs = now - startTime;
                    const timeLimit = quizDetail?.attemptTimeLimit || 60;
                    const totalMs = timeLimit * 60 * 1000;
                    const remainingSeconds = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));

                    setTimerProps({
                        attemptStartTime: attempt.startAt,
                        timeLimit: timeLimit,
                    });

                    if (remainingSeconds <= 0) {
                        handleAutoSubmit();
                    }
                }

                setAttemptId(currentAttemptId);

                const questionsData = await attemptsService.getAttemptQuestions(currentAttemptId);
                if (!questionsData || questionsData.length === 0) {
                    setError('This quiz has no questions available. Please contact your instructor.');
                } else {
                    setQuestions(questionsData);
                }
            } catch (err: any) {
                if (err.response?.status === 403) {
                    setError('You have reached the maximum number of attempts allowed for this quiz.');
                } else if (err.response?.status === 400) {
                    setError('This attempt is no longer available or has expired.');
                } else {
                    setError(`Failed to load quiz: ${err.message || 'Please try again.'}`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadQuiz();
    }, [quizId, attemptIdFromUrl]);

    useEffect(() => {
        if (!showFullscreenPrompt && quizContainerRef.current) {
            examMonitor.setupExamMonitoring(quizContainerRef.current);
            return () => examMonitor.cleanupMonitoring();
        }
    }, [showFullscreenPrompt, examMonitor]);

    useEffect(() => {
        if (!attemptId || submitted || showFullscreenPrompt) return;

        autoSaveIntervalRef.current = setInterval(() => {
            if (answers.length > 0) {
                attemptsService.saveAttemptProgress(attemptId, { answers }).catch(console.error);
            }
        }, 30000);

        return () => {
            if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
        };
    }, [attemptId, answers, submitted, showFullscreenPrompt]);

    const handleFullscreenEntered = () => setShowFullscreenPrompt(false);
    const handleFullscreenCancel = () => {
        setError('Fullscreen mode is required to take this quiz.');
        navigate('/quizzes');
    };

    const handleSubmit = async () => {
        if (!attemptId || submitted || isSubmitting || attemptIdFromUrl) return;

        setIsSubmitting(true);
        try {
            await attemptsService.submitQuizAttempt(attemptId, { answers });
            localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(answers));
            setSubmitted(true);

            setTimeout(() => navigate(`/quizzes/${quizId}/attempt/${attemptId}/result`), 1000);
        } catch (err) {
            setError('Failed to submit quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAnswerChange = (value: string | string[]) => {
        if (attemptIdFromUrl) return;

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        setAnswers((prev) => {
            const existingIndex = prev.findIndex((a) => a.questionId === currentQuestion.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...(typeof value === 'string' ? { answer: value } : { selectedOptions: value }),
                };
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        questionId: currentQuestion.id,
                        ...(typeof value === 'string' ? { answer: value } : { selectedOptions: value }),
                    },
                ];
            }
        });
    };

    const toggleFlag = () => {
        if (attemptIdFromUrl) return;
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Preparing your exam...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-medium mb-6">{error}</p>
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

    if (showFullscreenPrompt) {
        return <FullscreenPrompt onFullscreenEntered={handleFullscreenEntered} onCancel={handleFullscreenCancel} />;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 p-10 rounded-3xl max-w-md text-center shadow-xl backdrop-blur-sm animate-in zoom-in">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Submitted!</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Your answers have been saved successfully.</p>
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                        Redirecting to results...
                    </div>
                </div>
            </div>
        );
    }

    if (!questions.length || currentQuestionIndex >= questions.length) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-slate-400 mb-6">No questions available</p>
                    <button onClick={() => navigate('/quizzes')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Back to Quizzes</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const totalAnswered = answers.filter((a) => a.answer || a.selectedOptions?.length).length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
    const unansweredCount = totalQuestions - totalAnswered;
    const isReviewMode = !!attemptIdFromUrl;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300" ref={quizContainerRef}>

            <ViolationWarningModal
                isOpen={examMonitor.showViolationModal}
                violationNumber={examMonitor.violationCount <= 3 ? (examMonitor.violationCount as 1 | 2 | 3) : 3}
                reason={(examMonitor.violations && examMonitor.violations.length > 0) ? examMonitor.violations[examMonitor.violations.length - 1]?.message : 'Security violation detected'}
                onAcknowledge={examMonitor.handleViolationAck}
            />


            {isReviewMode && unansweredCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-4 sm:px-8 py-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="text-amber-800 dark:text-amber-400 font-medium text-sm">
                        {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} were left unanswered in this attempt.
                    </span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row flex-1 max-w-[1920px] mx-auto w-full">

                {/* Main Question Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">

                        {/* Progress Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">{quizDetail?.title}</h1>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                                <span>Progress</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{totalAnswered} of {totalQuestions} answered</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 p-6 sm:p-8 rounded-[2rem] shadow-sm mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>

                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider border border-blue-100 dark:border-blue-500/20">
                                    Question {currentQuestionIndex + 1}
                                </span>
                                <span className="text-gray-500 dark:text-slate-400 text-sm font-semibold bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                    {currentQuestion.points || 1} Pts
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-8 leading-relaxed">
                                {currentQuestion.text}
                            </h3>

                            {/* MCQ Options */}
                            {currentQuestion.type === 'MCQ' && (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((option, idx) => {
                                        const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
                                        const optionId = option.id || String(idx);
                                        const isSelected = currentAnswer?.selectedOptions?.includes(optionId);

                                        return (
                                            <label
                                                key={idx}
                                                className={`flex items-center p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                                                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                    } ${isReviewMode ? 'pointer-events-none' : ''}`}
                                            >
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`q${currentQuestion.id}`}
                                                    value={optionId}
                                                    onChange={(e) => handleAnswerChange([e.target.value])}
                                                    disabled={isReviewMode}
                                                    className="hidden"
                                                />
                                                <span className={`ml-4 text-sm sm:text-base font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                    {option.text}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* True/False Options */}
                            {currentQuestion.type === 'TrueFalse' && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => handleAnswerChange('True')}
                                        disabled={isReviewMode}
                                        className={`flex-1 py-5 px-6 rounded-2xl border-2 font-bold text-lg transition-all flex items-center justify-center gap-3 ${answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'True'
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-slate-500'
                                            } ${isReviewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        True
                                    </button>
                                    <button
                                        onClick={() => handleAnswerChange('False')}
                                        disabled={isReviewMode}
                                        className={`flex-1 py-5 px-6 rounded-2xl border-2 font-bold text-lg transition-all flex items-center justify-center gap-3 ${answers.find((a) => a.questionId === currentQuestion.id)?.answer === 'False'
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-slate-500'
                                            } ${isReviewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        False
                                    </button>
                                </div>
                            )}

                            {/* Written Option */}
                            {currentQuestion.type === 'Written' && (
                                <div>
                                    <textarea
                                        value={answers.find((a) => a.questionId === currentQuestion.id)?.answer || ''}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        disabled={isReviewMode}
                                        rows={8}
                                        className={`w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all text-base ${isReviewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                    <div className="mt-3 flex justify-end text-xs font-medium text-gray-500 dark:text-slate-400">
                                        Words: {answers.find((a) => a.questionId === currentQuestion.id)?.answer?.split(/\s+/).filter(Boolean).length || 0} / 1000
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" /> Previous
                            </button>

                            <button
                                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-blue-500/20"
                            >
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar (Navigator) */}
                <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col shrink-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Grid3x3 className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Question Matrix</h4>
                        </div>

                        <div className="grid grid-cols-5 gap-2.5 mb-8">
                            {questions.map((q, idx) => {
                                const status = getQuestionStatus(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => goToQuestion(idx)}
                                        className={`aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all relative
                                            ${idx === currentQuestionIndex ? 'ring-4 ring-blue-500/30 border-blue-500' : ''}
                                            ${status === 'answered' ? 'bg-blue-600 text-white border-blue-600'
                                                : status === 'flagged' ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'}
                                            border-2
                                        `}
                                    >
                                        {idx + 1}
                                        {status === 'flagged' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-blue-600"></div> Answered
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600"></div> Unanswered
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-500/20 border-2 border-red-300 dark:border-red-500/30 relative"><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span></div> Flagged
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            onClick={toggleFlag}
                            disabled={isReviewMode}
                            className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 
                                ${isReviewMode ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-transparent cursor-not-allowed'
                                    : flaggedQuestions.includes(currentQuestion.id)
                                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                        : 'bg-white dark:bg-transparent text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-500'
                                }`}
                        >
                            <Flag className={`w-4 h-4 ${flaggedQuestions.includes(currentQuestion.id) ? 'fill-current' : ''}`} />
                            {isReviewMode ? 'Cannot flag' : flaggedQuestions.includes(currentQuestion.id) ? 'Unflag Question' : 'Flag Question'}
                        </button>

                        {isReviewMode ? (
                            <button onClick={() => navigate('/quizzes')} className="w-full py-4 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700">
                                Exit Review
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || examMonitor.hasAutoSubmitted}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
                            >
                                {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                            </button>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};