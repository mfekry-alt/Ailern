import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Clock, Flag, Grid3x3,
    Loader2, Send, CheckCircle2, AlertTriangle, ShieldAlert, Timer
} from 'lucide-react';
import { getQuiz } from '@/api/services/quiz.service';
import {
    startOrResumeQuizAttempt,
    getAttemptQuestions,
    saveAttemptProgress,
    submitQuizAttempt,
    type QuestionAttempt as ApiQuestionAttempt
} from '@/api/services/attempts.service';

interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Written';
    options?: { id: string; text: string; optionNumber?: number }[];
    points?: number;
    // 💡 حقول الاستجابة القادمة من السيرفر
    studentOptionNumber?: number | null;
    studentBooleanAnswer?: string | null;
    studentWrittenAnswer?: string | null;
}

interface LocalAnswer {
    questionId: string;
    value: string | number;
    type: 'MCQ' | 'TrueFalse' | 'Written';
}

export const QuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // --- States ---
    const [quizDetail, setQuizDetail] = useState<{ id: string, title: string, description?: string, attemptTimeLimit?: number } | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<LocalAnswer[]>([]);
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const answersRef = useRef(answers);
    const attemptIdRef = useRef(attemptId);

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

    const formatAnswersForBackend = (currentAnswers: any[]): { answers: ApiQuestionAttempt[] } => {
        return {
            answers: currentAnswers.map(ans => {
                const question = questions.find(q => q.id === ans.questionId);
                const value = ans.value || ans.answer || ans.selectedOptions?.[0];

                return {
                    questionId: ans.questionId,
                    optionNumber: question?.type === 'MCQ' ? Number(value) : null,
                    booleanAnswer: question?.type === 'TrueFalse' ? String(value) : null,
                    writtenAnswer: question?.type === 'Written' ? String(value) : null,
                };
            })
        };
    };

    // --- Initialization ---
    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) {
                setError('No quiz ID provided');
                setIsLoading(false);
                return;
            }

            try {
                const quiz = await getQuiz(id);
                setQuizDetail({ id: quiz.id, title: quiz.title, description: quiz.description, attemptTimeLimit: quiz.attemptTimeLimit });

                const attempt = await startOrResumeQuizAttempt(id);
                setAttemptId(attempt.id);

                const attemptQuestions = await getAttemptQuestions(attempt.id);

                if (attemptQuestions.length > 0) {
                    setQuestions(attemptQuestions as Question[]);

                    // 💡 هنا بنسحب إجابات السيرفر ونعبي الـ State عشان تظهر فوراً
                    const preFilledAnswers: LocalAnswer[] = attemptQuestions.map((q: any) => {
                        let val: string | number | undefined = undefined;
                        if (q.type === 'MCQ' && q.studentOptionNumber != null) val = q.studentOptionNumber;
                        if (q.type === 'TrueFalse' && q.studentBooleanAnswer != null) val = q.studentBooleanAnswer;
                        if (q.type === 'Written' && q.studentWrittenAnswer != null) val = q.studentWrittenAnswer;

                        return val !== undefined ? { questionId: q.id, value: val, type: q.type } : null;
                    }).filter(Boolean) as LocalAnswer[];

                    if (preFilledAnswers.length > 0) {
                        setAnswers(preFilledAnswers);
                    }

                } else {
                    setError('No questions available for this attempt.');
                    return;
                }

                // Timer calculation
                const startString = attempt.startAt.endsWith('Z') ? attempt.startAt : `${attempt.startAt}Z`;
                const serverStartTime = new Date(startString).getTime();
                const localNow = new Date().getTime();
                let elapsedSeconds = Math.floor((localNow - serverStartTime) / 1000);
                if (elapsedSeconds < 0) elapsedSeconds = 0;

                const totalAllowedSeconds = (quiz.attemptTimeLimit || 30) * 60;
                const remaining = totalAllowedSeconds - elapsedSeconds;
                setTimeRemaining(remaining > 0 ? remaining : totalAllowedSeconds);

            } catch (err) {
                console.error('Quiz loading error:', err);
                setError('Failed to establish exam connection.');
            } finally {
                setIsLoading(false);
            }
        };
        loadQuiz();
    }, [id]);

    const autoSubmit = async () => {
        const currentAttemptId = attemptIdRef.current;
        const currentAnswers = answersRef.current;
        if (!currentAttemptId) return;

        setIsSubmitting(true);
        try {
            const payload = formatAnswersForBackend(currentAnswers);
            await saveAttemptProgress(currentAttemptId, payload); // Save first
            await submitQuizAttempt(currentAttemptId);            // Submit without payload
            navigate(`/student/quizzes/${id}/result/${currentAttemptId}`);
        } catch (err) {
            navigate(`/student/quizzes/${id}/result/${currentAttemptId}`);
        }
    };

    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || isSubmitting) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(interval);
                    autoSubmit();
                    return 0;
                }
                return prev !== null ? prev - 1 : null;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeRemaining, isSubmitting]);

    useEffect(() => {
        if (!attemptId || answers.length === 0) return;
        const autoSave = setInterval(async () => {
            setIsSaving(true);
            try {
                await saveAttemptProgress(attemptId, formatAnswersForBackend(answers));
            } catch (err) {
                console.error('Auto-save error');
            } finally {
                setIsSaving(false);
            }
        }, 30000);
        return () => clearInterval(autoSave);
    }, [answers, attemptId]);

    const handleAnswerChange = (value: string | number) => {
        if (!currentQuestion) return;
        setAnswers(prev => {
            const idx = prev.findIndex(a => a.questionId === currentQuestion.id);
            const entry: LocalAnswer = { questionId: currentQuestion.id, value, type: currentQuestion.type };
            if (idx > -1) {
                const updated = [...prev];
                updated[idx] = entry;
                return updated;
            }
            return [...prev, entry];
        });
    };

    const toggleFlag = () => {
        if (!currentQuestion) return;
        setFlaggedQuestions(prev =>
            prev.includes(currentQuestion.id) ? prev.filter(qId => qId !== currentQuestion.id) : [...prev, currentQuestion.id]
        );
    };

    const handleManualSubmit = async () => {
        if (!attemptId) return;
        if (!window.confirm("Are you sure you want to finish and submit your quiz?")) return;

        setIsSubmitting(true);
        try {
            const payload = formatAnswersForBackend(answers);
            await saveAttemptProgress(attemptId, payload); // Save first
            await submitQuizAttempt(attemptId);            // Submit without payload
            navigate(`/student/quizzes/${id}/result/${attemptId}`);
        } catch (err) {
            console.error('Submit failed:', err);
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const totalAnswered = answers.length;
    const progressPercent = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

    const getQuestionStatus = (questionId: string) => {
        if (flaggedQuestions.includes(questionId)) return 'flagged';
        return answers.find(a => a.questionId === questionId) ? 'answered' : 'remaining';
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500 w-16 h-16 mb-4" />
            <p className="text-indigo-300 font-bold tracking-widest uppercase animate-pulse">Initializing Exam Environment...</p>
        </div>
    );

    if (error || !currentQuestion) return (
        <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-4">
            <div className="bg-slate-900/80 border border-red-500/20 p-10 rounded-[3rem] text-center max-w-lg backdrop-blur-xl">
                <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
                <p className="text-slate-400 mb-8">{error || 'Session is no longer valid.'}</p>
                <button onClick={() => navigate(-1)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-gray-200 transition-all w-full">Return to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col font-sans">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-[#0f1423]/90 backdrop-blur-xl border-b border-slate-800/80 h-20 px-6 sm:px-10 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 font-black text-xl text-white">A</div>
                    <span className="text-xl font-black tracking-tight hidden sm:block">Ailern Exam</span>
                </div>
                <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border-2 transition-all ${timeRemaining !== null && timeRemaining < 120 ? 'border-red-500/50 bg-red-500/10 animate-pulse' : 'border-slate-700/50 bg-slate-800/50'}`}>
                    <Clock className={`w-5 h-5 ${timeRemaining !== null && timeRemaining < 120 ? 'text-red-500' : 'text-indigo-400'}`} />
                    <span className={`text-xl font-black font-mono ${timeRemaining !== null && timeRemaining < 120 ? 'text-red-500' : 'text-white'}`}>
                        {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                    </span>
                </div>
            </header>

            <div className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                <main className="space-y-6">
                    {/* Progress Header */}
                    <div className="bg-[#151a2d]/80 backdrop-blur-md border border-slate-800/80 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-white line-clamp-1">{quizDetail?.title}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Question {currentQuestionIndex + 1} of {questions.length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{totalAnswered} Answered</span>
                                </div>
                            </div>
                            <button onClick={toggleFlag} className={`p-4 rounded-2xl border-2 transition-all ${flaggedQuestions.includes(currentQuestion.id) ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                <Flag className={`w-6 h-6 ${flaggedQuestions.includes(currentQuestion.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden border border-slate-700/30">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="bg-[#151a2d]/80 backdrop-blur-md border border-slate-800/80 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative min-h-[450px] animate-in fade-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <span className="px-4 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQuestion.type}</span>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mark: {currentQuestion.points} pts</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 leading-relaxed">{currentQuestion.text}</h2>

                        <div className="grid gap-4">
                            {currentQuestion.type === 'Written' ? (
                                <textarea
                                    className="w-full p-6 bg-[#0a0f1d] border-2 border-slate-700/50 rounded-3xl text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[250px] transition-all text-lg"
                                    placeholder="Write your answer here..."
                                    value={answers.find(a => a.questionId === currentQuestion.id)?.value || ''}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                />
                            ) : currentQuestion.type === 'TrueFalse' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {['True', 'False'].map(opt => {
                                        const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.value === opt;
                                        return (
                                            <button key={opt} onClick={() => handleAnswerChange(opt)} className={`p-6 rounded-[2rem] border-2 font-bold text-xl transition-all flex items-center justify-between ${isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-xl' : 'border-slate-800 bg-[#0a0f1d] text-slate-400 hover:border-slate-600'}`}>
                                                <span>{opt}</span>
                                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                currentQuestion.options?.map(opt => {
                                    const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.value === opt.optionNumber;
                                    return (
                                        <button key={opt.id} onClick={() => handleAnswerChange(opt.optionNumber!)} className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all text-left group ${isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-lg' : 'border-slate-800 bg-[#0a0f1d] text-slate-400 hover:border-slate-600'}`}>
                                            <span className="text-lg font-bold pr-4">{opt.text}</span>
                                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="flex justify-between items-center bg-[#151a2d]/50 p-4 rounded-[2rem] border border-slate-800/40">
                        <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(v => v - 1)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-all disabled:opacity-20 flex items-center gap-2">
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/80 px-4 py-2 rounded-xl">
                            {isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing</> : <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-Saved</>}
                        </div>
                        {currentQuestionIndex === questions.length - 1 ? (
                            <button onClick={handleManualSubmit} disabled={isSubmitting} className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} SUBMIT EXAM
                            </button>
                        ) : (
                            <button onClick={() => setCurrentQuestionIndex(v => v + 1)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center gap-2">
                                NEXT QUESTION <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="space-y-6">
                    <div className="bg-[#151a2d]/80 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl lg:sticky lg:top-28">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Grid3x3 className="w-4 h-4 text-indigo-500" /> Exam Map</h3>
                            <span className="text-[10px] font-black bg-slate-900 px-2 py-1 rounded-md text-slate-400">{totalAnswered}/{questions.length}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => {
                                const status = getQuestionStatus(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-all relative ${currentQuestionIndex === idx
                                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 scale-110 z-10'
                                                : status === 'answered'
                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                                    : status === 'flagged'
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                                                        : 'bg-[#0a0f1d] text-slate-600 border border-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        {idx + 1}
                                        {status === 'flagged' && currentQuestionIndex !== idx && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#151a2d]"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Current
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-md bg-indigo-500/20 border border-indigo-500/40"></div> Answered
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-md bg-red-500/20 border border-red-500/40"></div> Flagged
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};