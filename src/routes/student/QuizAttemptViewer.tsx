import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QUERY_KEYS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid3x3, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { quizService, attemptsService } from '@/api/services';
import { toast } from 'sonner';
import {
    useStrictExamMonitor,
    type UseStrictExamMonitorReturn,
} from '@/hooks/useStrictExamMonitor';
import { ViolationWarningModal } from '@/components/ViolationWarningModal';
import { FullscreenPrompt } from '@/components/FullscreenPrompt';
import { buildSaveAnswerEntries, type AttemptQuestion } from '@/api/services/attempts.service';

const ENABLE_STRICT_MONITOR = false;

interface LocalAnswer {
    questionId: string;
    optionId: string | null;
    writtenAnswer: string | null;
}

interface QuizDetail {
    id: string;
    title: string;
    description?: string;
    attemptTimeLimit?: number;
}

export const QuizAttemptViewer = () => {
    const queryClient = useQueryClient();
    const { id: quizId, attemptId: attemptIdFromUrl } = useParams<{ id: string, attemptId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as { resume?: boolean; courseId?: string } | null) ?? null;
    const shouldResume = Boolean(state?.resume);
    const returnPath = state?.courseId ? `/courses/${state.courseId}/quizzes` : '/courses';

    // --- Core quiz state ---
    const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
    const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<LocalAnswer[]>([]);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // --- UI state ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(ENABLE_STRICT_MONITOR);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // --- Refs ---
    const quizContainerRef = useRef<HTMLDivElement>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const answersRef = useRef(answers);
    const questionsRef = useRef(questions);
    const attemptIdRef = useRef(attemptId);

    // 🛡️ درع الحماية لمنع تكرار الريكويست في React Strict Mode
    const hasStartedInitialization = useRef(false);

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

    const isReviewMode = !!attemptIdFromUrl;


    // --- Submit Logic ---
    const handleAutoSubmit = useCallback(async () => {
        if (submitted || isReviewMode) return;
        toast.info('Time is up. Your attempt was auto-submitted.');
        navigate(returnPath, { replace: true });
    }, [submitted, navigate, isReviewMode, returnPath]);

    const strictExamMonitor = useStrictExamMonitor(handleAutoSubmit);
    const noOpExamMonitor = useMemo<UseStrictExamMonitorReturn>(
        () => ({
            violationCount: 0, showViolationModal: false, isFullscreen: true, violations: [],
            requestFullscreen: async () => { }, handleViolationAck: () => { }, setupExamMonitoring: () => { },
            cleanupMonitoring: () => { }, hasAutoSubmitted: false,
        }), []
    );
    const examMonitor = ENABLE_STRICT_MONITOR ? strictExamMonitor : noOpExamMonitor;

    // --- Initialization ---
    useEffect(() => {
        if (!quizId) {
            setError('No quiz ID provided');
            setIsLoading(false);
            return;
        }

        // 🛡️ السحر هنا: لو الكود اشتغل قبل كده، اعمل return فوراً ومتبعتش حاجة للسيرفر
        if (hasStartedInitialization.current) {
            return;
        }
        hasStartedInitialization.current = true;

        const loadQuiz = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const quiz = await quizService.getQuiz(quizId);
                setQuizDetail({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    attemptTimeLimit: quiz.attemptTimeLimit || 30,
                });

                let currentAttemptId = attemptIdFromUrl;

                if (currentAttemptId) {
                    setShowFullscreenPrompt(false);
                } else {
                    if (shouldResume) {
                        const attemptsDto = await attemptsService.getMyAttemptsForQuiz(quizId);
                        const activeAttempt = (attemptsDto?.attempts ?? [])
                            .filter((a) => String(a.status).toLowerCase() === 'inprogress')
                            .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

                        currentAttemptId = activeAttempt?.id ?? null;
                        if (!currentAttemptId) {
                            throw new Error('No active attempt found to resume.');
                        }

                        const endDateStr = activeAttempt.attemptEndTime;
                        if (endDateStr) {
                            const normalized = endDateStr.endsWith('Z') || endDateStr.includes('+') ? endDateStr : endDateStr + 'Z';
                            const endMs = new Date(normalized).getTime();
                            const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
                            setTimeRemaining(remaining);
                        } else {
                            setTimeRemaining((quiz.attemptTimeLimit || 30) * 60);
                        }
                    } else {
                        const attempt = await attemptsService.startQuizAttempt(quizId);
                        currentAttemptId = attempt.id;
                        if (!currentAttemptId) throw new Error('Failed to get valid attempt ID from server response');

                        const endDateStr = attempt.attemptEndDate;
                        if (endDateStr) {
                            const normalized = endDateStr.endsWith('Z') || endDateStr.includes('+') ? endDateStr : endDateStr + 'Z';
                            const endMs = new Date(normalized).getTime();
                            const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
                            setTimeRemaining(remaining);
                        } else {
                            setTimeRemaining((quiz.attemptTimeLimit || 30) * 60);
                        }
                    }
                }

                setAttemptId(currentAttemptId);

                const questionsData = await attemptsService.getAttemptQuestions(currentAttemptId);
                if (!questionsData || questionsData.length === 0) {
                    setError('This quiz has no questions available.');
                } else {
                    setQuestions(questionsData);

                    const preFilledAnswers: LocalAnswer[] = questionsData
                        .filter(q => q.selectedOptionId || q.writtenAnswer)
                        .map(q => ({
                            questionId: q.id,
                            optionId: q.selectedOptionId || null,
                            writtenAnswer: q.writtenAnswer || null,
                        }));
                    if (preFilledAnswers.length > 0) setAnswers(preFilledAnswers);
                }
            } catch (err: any) {
                if (err.response?.status === 403) setError('You have reached the maximum number of attempts allowed.');
                else if (err.response?.status === 400) setError('This attempt is no longer available or has expired.');
                else setError(`Failed to load quiz: ${err.message || 'Please try again.'}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuiz();

        // 🚫 تم حذف دالة الـ return () => cleanup من هنا لضمان عمل الحماية مع React Strict Mode
    }, [quizId, attemptIdFromUrl]);

    // --- Timer Tick Effect ---
    useEffect(() => {
        if (timeRemaining === null || isSubmitting || isReviewMode) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev !== null && prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev !== null ? prev - 1 : null;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining, isSubmitting, isReviewMode, handleAutoSubmit]);

    // --- Auto-Save Progress ---
    useEffect(() => {
        if (!attemptId || submitted || showFullscreenPrompt || isReviewMode) return;

        autoSaveIntervalRef.current = setInterval(() => {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length > 0) {
                attemptsService.saveAttemptProgress(attemptId, entries).catch(console.error);
            }
        }, 40_000);

        return () => {
            if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
        };
    }, [attemptId, submitted, showFullscreenPrompt, isReviewMode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleFullscreenEntered = () => setShowFullscreenPrompt(false);
    const handleFullscreenCancel = () => {
        setError('Fullscreen mode is required to take this quiz.');
        navigate('/courses');
    };

    const handleManualSubmit = async () => {
        if (!attemptId || submitted || isSubmitting || isReviewMode) return;

        setShowSubmitConfirm(false);
        setIsSubmitting(true);
        try {
            const entries = buildSaveAnswerEntries(questionsRef.current, answers);
            if (entries.length > 0) {
                await attemptsService.saveAttemptProgress(attemptId, entries);
            }
            await attemptsService.submitQuizAttempt(attemptId);
            toast.success('Quiz submitted successfully.');
            if (state?.courseId) {
                const cid = String(state.courseId);
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE_QUIZZES(cid) });
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE_SECTIONS(cid) });
            }
            navigate(returnPath, { replace: true });
        } catch (err) {
            toast.error('Failed to submit quiz. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectOption = (optId: string) => {
        if (isReviewMode) return;
        const q = questions[currentQuestionIndex];
        if (!q) return;
        setAnswers(prev => {
            const idx = prev.findIndex(a => a.questionId === q.id);
            const entry: LocalAnswer = { questionId: q.id, optionId: optId, writtenAnswer: null };
            if (idx > -1) { const u = [...prev]; u[idx] = entry; return u; }
            return [...prev, entry];
        });
    };

    const handleWrittenChange = (text: string) => {
        if (isReviewMode) return;
        const q = questions[currentQuestionIndex];
        if (!q) return;
        setAnswers(prev => {
            const idx = prev.findIndex(a => a.questionId === q.id);
            const entry: LocalAnswer = { questionId: q.id, optionId: null, writtenAnswer: text };
            if (idx > -1) { const u = [...prev]; u[idx] = entry; return u; }
            return [...prev, entry];
        });
    };

    const toggleFlag = () => {
        if (isReviewMode) return;
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
        if (answer && (answer.optionId || answer.writtenAnswer)) return 'answered';
        return 'remaining';
    };

    // --- Render States ---
    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">Preparing Exam Environment...</p>
            </div>
        </div>
    );

    if (error || !questions.length) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-[2rem] max-w-md text-center shadow-xl backdrop-blur-sm">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-gray-500 dark:text-slate-400 font-medium mb-8">{error || 'No questions available.'}</p>
                <button onClick={() => navigate('/courses')} className="w-full px-6 py-3.5 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                    Back to Quizzes
                </button>
            </div>
        </div>
    );

    if (showFullscreenPrompt) {
        return <FullscreenPrompt onFullscreenEntered={handleFullscreenEntered} onCancel={handleFullscreenCancel} />;
    }

    if (submitted) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 p-10 rounded-[3rem] max-w-md text-center shadow-xl backdrop-blur-sm animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Submitted!</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-6 font-medium">Your answers have been saved successfully.</p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to results...
                </div>
            </div>
        </div>
    );

    const currentQuestion = questions[currentQuestionIndex];
    const totalAnswered = answers.filter((a) => a.optionId || a.writtenAnswer).length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
    const unansweredCount = totalQuestions - totalAnswered;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300" ref={quizContainerRef}>
            {showSubmitConfirm && !isReviewMode && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-white p-6 shadow-2xl dark:bg-slate-900">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Submit your quiz?</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                            Please confirm before submitting. You will not be able to continue this attempt afterward.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleManualSubmit}
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-black text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
                            >
                                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ViolationWarningModal
                isOpen={examMonitor.showViolationModal}
                violationNumber={examMonitor.violationCount <= 3 ? (examMonitor.violationCount as 1 | 2 | 3) : 3}
                reason={(examMonitor.violations && examMonitor.violations.length > 0) ? examMonitor.violations[examMonitor.violations.length - 1]?.message : 'Security violation detected'}
                onAcknowledge={examMonitor.handleViolationAck}
            />

            {/* Top Review Mode Banner */}
            {isReviewMode && unansweredCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-4 sm:px-8 py-3 flex items-center justify-center gap-3 shadow-sm z-40">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="text-amber-800 dark:text-amber-400 font-bold text-sm">
                        {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} were left unanswered in this attempt.
                    </span>
                </div>
            )}

            {/* --- Top Navbar --- */}
            {!isReviewMode && (
                <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-slate-800 h-20 px-6 sm:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">

                    </div>

                    <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border-2 transition-all ${timeRemaining !== null && timeRemaining < 300 ? 'border-red-500/50 bg-red-50 dark:bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse' : 'border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50'}`}>
                        <Clock className={`w-5 h-5 ${timeRemaining !== null && timeRemaining < 300 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`} />
                        <span className={`text-xl font-black font-mono tracking-wider ${timeRemaining !== null && timeRemaining < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                        </span>
                    </div>
                </header>
            )}

            <div className="flex flex-col lg:flex-row flex-1 max-w-[1920px] mx-auto w-full gap-8 p-4 sm:p-8">

                {/* --- Left Column: Question Area --- */}
                <main className="flex-1 flex flex-col gap-6 w-full max-w-4xl">
                    {/* Header Card */}
                    <div className="mb-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">{quizDetail?.title}</h1>
                        <div className="flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-slate-400 mb-3">
                            <span>Progress</span>
                            <span className="text-blue-600 dark:text-blue-400">{totalAnswered} of {totalQuestions} answered</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-gray-300 dark:border-slate-700/50">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 p-8 sm:p-12 rounded-[2.5rem] shadow-lg relative overflow-hidden min-h-[400px]">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>

                        <div className="flex justify-between items-start mb-8">
                            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-black rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <span className="text-gray-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
                                {currentQuestion.mark} Pts
                            </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-10 leading-relaxed">
                            {currentQuestion.question}
                        </h3>

                        {/* Options Area */}
                        <div className="grid gap-4">
                            {currentQuestion.type === 'MCQ' && (
                                <div className="space-y-4">
                                    {currentQuestion.options.map((opt) => {
                                        const selectedId = answers.find(a => a.questionId === currentQuestion.id)?.optionId;
                                        const isSelected = selectedId === opt.optionId;

                                        return (
                                            <button
                                                key={opt.optionId}
                                                onClick={() => handleSelectOption(opt.optionId)}
                                                disabled={isReviewMode}
                                                className={`w-full flex items-center p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all text-left ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/80'
                                                    } ${isReviewMode ? 'pointer-events-none opacity-90' : ''}`}
                                            >
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                                <span className={`ml-4 text-base sm:text-lg font-bold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                    {opt.option}
                                                </span>
                                                {isReviewMode && isSelected && (
                                                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-md">
                                                        Your Answer
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'TrueFalse' && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {currentQuestion.options.map((opt) => {
                                        const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.optionId === opt.optionId;
                                        return (
                                            <button
                                                key={opt.optionId}
                                                onClick={() => handleSelectOption(opt.optionId)}
                                                disabled={isReviewMode}
                                                className={`relative flex-1 py-6 px-6 rounded-2xl border-2 font-black text-lg transition-all flex items-center justify-between ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/80'
                                                    } ${isReviewMode ? 'cursor-default opacity-90' : ''}`}
                                            >
                                                <span>{opt.option}</span>
                                                <div className="flex items-center gap-3">
                                                    {isReviewMode && isSelected && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-md">
                                                            Your Answer
                                                        </span>
                                                    )}
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'Written' && (
                                <div>
                                    <textarea
                                        value={answers.find(a => a.questionId === currentQuestion.id)?.writtenAnswer || ''}
                                        onChange={(e) => handleWrittenChange(e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        disabled={isReviewMode}
                                        rows={8}
                                        className={`w-full bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-3xl p-6 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all text-lg custom-scrollbar ${isReviewMode ? 'opacity-90 cursor-default' : ''}`}
                                    />
                                    {!isReviewMode && (
                                        <div className="mt-3 flex justify-end text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                                            Words: {(answers.find(a => a.questionId === currentQuestion.id)?.writtenAnswer || '').split(/\s+/).filter(Boolean).length}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="flex items-center justify-between mt-2">
                        <button
                            onClick={() => goToQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>

                        {!isReviewMode && (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={isSubmitting || examMonitor.hasAutoSubmitted}
                                className="hidden sm:flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finish Exam'}
                            </button>
                        )}

                        {isReviewMode ? (
                            <button onClick={() => navigate(-1)} className="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700">
                                Exit Review
                            </button>
                        ) : (
                            <button
                                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Submit Button */}
                    {!isReviewMode && (
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            disabled={isSubmitting || examMonitor.hasAutoSubmitted}
                            className="sm:hidden w-full mt-4 flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finish Exam'}
                        </button>
                    )}
                </main>

                {/* --- Right Column: Sidebar (Navigator) --- */}
                <aside className="w-full lg:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-28">

                    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <Grid3x3 className="w-5 h-5 text-blue-500" /> Exam Map
                            </h4>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => {
                                const status = getQuestionStatus(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => goToQuestion(idx)}
                                        className={`aspect-square flex items-center justify-center rounded-xl font-black text-sm transition-all relative
                                            ${idx === currentQuestionIndex
                                                ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/30 scale-110 z-10'
                                                : status === 'answered'
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                                                    : status === 'flagged'
                                                        ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400'
                                                        : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-500 border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'
                                            }
                                        `}
                                    >
                                        {idx + 1}
                                        {status === 'flagged' && idx !== currentQuestionIndex && (
                                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/50"></div> Answered
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50"></div> Flagged
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">
                                <div className="w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700"></div> Unanswered
                            </div>
                        </div>
                    </div>

                    {!isReviewMode && (
                        <button
                            onClick={toggleFlag}
                            className={`w-full py-4.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 shadow-sm
                                ${flaggedQuestions.includes(currentQuestion.id)
                                    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                    : 'bg-white dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                                }`}
                        >
                            <Flag className={`w-5 h-5 ${flaggedQuestions.includes(currentQuestion.id) ? 'fill-current' : ''}`} />
                            {flaggedQuestions.includes(currentQuestion.id) ? 'Remove Flag' : 'Flag Question'}
                        </button>
                    )}
                </aside>
            </div>
        </div>
    );
};