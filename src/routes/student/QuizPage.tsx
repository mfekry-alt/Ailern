import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Clock, Flag, Grid3x3,
    Loader2, Send, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { getQuiz } from '@/api/services/quiz.service';
import {
    startQuizAttempt,
    getAttemptQuestions,
    saveAttemptProgress,
    submitQuizAttempt,
    buildSaveAnswerEntries,
    type AttemptQuestion,
} from '@/api/services/attempts.service';

// ─── Local state types ─────────────────────────────────────────────────────

interface LocalAnswer {
    questionId: string;
    optionId: string | null;
    writtenAnswer: string | null;
}

export const QuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<LocalAnswer[]>([]);
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const answersRef = useRef(answers);
    const questionsRef = useRef(questions);
    const attemptIdRef = useRef(attemptId);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

    // ── Initialization ─────────────────────────────────────────────────────

    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) { setError('No quiz ID provided'); setIsLoading(false); return; }

            try {
                const quiz = await getQuiz(id);
                setQuizTitle(quiz.title);

                const attempt = await startQuizAttempt(id);
                setAttemptId(attempt.id);

                const attemptQuestions = await getAttemptQuestions(attempt.id);
                if (attemptQuestions.length === 0) { setError('No questions available for this attempt.'); return; }

                setQuestions(attemptQuestions);

                const preFilledAnswers: LocalAnswer[] = attemptQuestions
                    .filter(q => q.selectedOptionId || q.writtenAnswer)
                    .map(q => ({
                        questionId: q.id,
                        optionId: q.selectedOptionId || null,
                        writtenAnswer: q.writtenAnswer || null,
                    }));
                if (preFilledAnswers.length > 0) setAnswers(preFilledAnswers);

                // Timer: server returns attemptEndDate — remaining = endDate - now
                const endDateStr = attempt.attemptEndDate;
                if (endDateStr) {
                    const normalized = endDateStr.endsWith('Z') || endDateStr.includes('+') ? endDateStr : endDateStr + 'Z';
                    const endMs = new Date(normalized).getTime();
                    const nowMs = Date.now();
                    const remaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));
                    setTimeRemaining(remaining);
                } else {
                    const fallbackMinutes = quiz.attemptTimeLimit || 30;
                    setTimeRemaining(fallbackMinutes * 60);
                }
            } catch (err) {
                console.error('Quiz loading error:', err);
                setError('Failed to establish exam connection.');
            } finally {
                setIsLoading(false);
            }
        };
        loadQuiz();
    }, [id]);

    // ── Auto-submit on timer expiry ────────────────────────────────────────

    const doSubmit = useCallback(async (showResult = true) => {
        const aid = attemptIdRef.current;
        if (!aid) return;

        setIsSubmitting(true);
        try {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length > 0) await saveAttemptProgress(aid, entries);
            await submitQuizAttempt(aid);
            if (showResult) navigate(`/student/quizzes/${id}/result/${aid}`);
        } catch {
            if (showResult) navigate(`/student/quizzes/${id}/result/${aid}`);
        }
    }, [id, navigate]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || isSubmitting) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(interval);
                    doSubmit();
                    return 0;
                }
                return prev !== null ? prev - 1 : null;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeRemaining, isSubmitting, doSubmit]);

    // Auto-save every 40s; only POST when at least one question has a saveable answer (no empty body)
    useEffect(() => {
        if (!attemptId) return;
        const autoSave = setInterval(async () => {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length === 0) return;
            setIsSaving(true);
            try {
                await saveAttemptProgress(attemptId, entries);
            } catch {
                /* silent */
            } finally {
                setIsSaving(false);
            }
        }, 40_000);
        return () => clearInterval(autoSave);
    }, [attemptId]);

    // ── Answer handling ────────────────────────────────────────────────────

    const currentQ = questions[currentIndex];

    const handleSelectOption = (optionId: string) => {
        if (!currentQ) return;
        setAnswers(prev => {
            const idx = prev.findIndex(a => a.questionId === currentQ.id);
            const entry: LocalAnswer = { questionId: currentQ.id, optionId, writtenAnswer: null };
            if (idx > -1) { const u = [...prev]; u[idx] = entry; return u; }
            return [...prev, entry];
        });
    };

    const handleWrittenAnswer = (text: string) => {
        if (!currentQ) return;
        setAnswers(prev => {
            const idx = prev.findIndex(a => a.questionId === currentQ.id);
            const entry: LocalAnswer = { questionId: currentQ.id, optionId: null, writtenAnswer: text };
            if (idx > -1) { const u = [...prev]; u[idx] = entry; return u; }
            return [...prev, entry];
        });
    };

    const toggleFlag = () => {
        if (!currentQ) return;
        setFlagged(prev => {
            const n = new Set(prev);
            n.has(currentQ.id) ? n.delete(currentQ.id) : n.add(currentQ.id);
            return n;
        });
    };

    const handleManualSubmit = async () => {
        if (!attemptId || !window.confirm('Are you sure you want to finish and submit your quiz?')) return;
        await doSubmit(true);
    };

    // ── Helpers ────────────────────────────────────────────────────────────

    const getSelectedOptionId = (qId: string) => answers.find(a => a.questionId === qId)?.optionId ?? null;
    const getWrittenValue = (qId: string) => answers.find(a => a.questionId === qId)?.writtenAnswer ?? '';
    const isAnswered = (qId: string) => {
        const a = answers.find(ans => ans.questionId === qId);
        return a ? !!(a.optionId || a.writtenAnswer) : false;
    };

    const totalAnswered = answers.filter(a => a.optionId || a.writtenAnswer).length;
    const progressPercent = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getStatus = (qId: string) => {
        if (flagged.has(qId)) return 'flagged';
        return isAnswered(qId) ? 'answered' : 'remaining';
    };

    // ── Render ─────────────────────────────────────────────────────────────

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500 w-16 h-16 mb-4" />
            <p className="text-indigo-300 font-bold tracking-widest uppercase animate-pulse">Initializing Exam Environment...</p>
        </div>
    );

    if (error || !currentQ) return (
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
                                <h1 className="text-2xl font-black text-white line-clamp-1">{quizTitle}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Question {currentIndex + 1} of {questions.length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{totalAnswered} Answered</span>
                                </div>
                            </div>
                            <button onClick={toggleFlag} className={`p-4 rounded-2xl border-2 transition-all ${flagged.has(currentQ.id) ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                <Flag className={`w-6 h-6 ${flagged.has(currentQ.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden border border-slate-700/30">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="bg-[#151a2d]/80 backdrop-blur-md border border-slate-800/80 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative min-h-[450px] animate-in fade-in zoom-in-95 duration-500" key={currentQ.id}>
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                        <div className="flex items-center gap-3 mb-8">
                            <span className="px-4 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQ.type}</span>
                            {currentQ.instructions && <span className="text-slate-500 text-xs italic">{currentQ.instructions}</span>}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 leading-relaxed">{currentQ.question}</h2>

                        <div className="grid gap-4">
                            {currentQ.type === 'Written' ? (
                                <textarea
                                    className="w-full p-6 bg-[#0a0f1d] border-2 border-slate-700/50 rounded-3xl text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[250px] transition-all text-lg"
                                    placeholder="Write your answer here..."
                                    value={getWrittenValue(currentQ.id)}
                                    onChange={(e) => handleWrittenAnswer(e.target.value)}
                                />
                            ) : currentQ.type === 'TrueFalse' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentQ.options.map(opt => {
                                        const selected = getSelectedOptionId(currentQ.id) === opt.optionId;
                                        return (
                                            <button key={opt.optionId} onClick={() => handleSelectOption(opt.optionId)} className={`p-6 rounded-[2rem] border-2 font-bold text-xl transition-all flex items-center justify-between ${selected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-xl' : 'border-slate-800 bg-[#0a0f1d] text-slate-400 hover:border-slate-600'}`}>
                                                <span>{opt.option}</span>
                                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                currentQ.options.map(opt => {
                                    const selected = getSelectedOptionId(currentQ.id) === opt.optionId;
                                    return (
                                        <button key={opt.optionId} onClick={() => handleSelectOption(opt.optionId)} className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all text-left group ${selected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-lg' : 'border-slate-800 bg-[#0a0f1d] text-slate-400 hover:border-slate-600'}`}>
                                            <span className="text-lg font-bold pr-4">{opt.option}</span>
                                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}`}>
                                                {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="flex justify-between items-center bg-[#151a2d]/50 p-4 rounded-[2rem] border border-slate-800/40">
                        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(v => v - 1)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-all disabled:opacity-20 flex items-center gap-2">
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/80 px-4 py-2 rounded-xl">
                            {isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing</> : <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-Saved</>}
                        </div>
                        {currentIndex === questions.length - 1 ? (
                            <button onClick={handleManualSubmit} disabled={isSubmitting} className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} SUBMIT EXAM
                            </button>
                        ) : (
                            <button onClick={() => setCurrentIndex(v => v + 1)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center gap-2">
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
                                const status = getStatus(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-all relative ${
                                            currentIndex === idx
                                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 scale-110 z-10'
                                                : status === 'answered'
                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                                    : status === 'flagged'
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                                                        : 'bg-[#0a0f1d] text-slate-600 border border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {idx + 1}
                                        {status === 'flagged' && currentIndex !== idx && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#151a2d]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-full bg-indigo-600" /> Current
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-md bg-indigo-500/20 border border-indigo-500/40" /> Answered
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <div className="w-3 h-3 rounded-md bg-red-500/20 border border-red-500/40" /> Flagged
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
