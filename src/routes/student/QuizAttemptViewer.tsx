import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import {
    ChevronLeft, ChevronRight, Clock, Flag, Grid3x3,
    Loader2, Send, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { getQuiz } from '@/api/services/quiz.service';
import {
    startQuizAttempt,
    getAttemptQuestions,
    saveAttemptProgress,
    submitQuizAttempt,
    getMyAttemptsForQuiz,
    buildSaveAnswerEntries,
    type AttemptQuestion,
} from '@/api/services/attempts.service';
import { QnARenderer } from '@/features/qna/components/QnARenderer';
import { useExamTimer } from '@/hooks/useExamTimer';
import { ExamAnswerEditor } from '@/components/ui/ExamAnswerEditor';
import { AnswerPreviewer } from '@/components/ui/AnswerPreviewer';

// ─── Local state types ─────────────────────────────────────────────────────

interface LocalAnswer {
    questionId: string;
    optionId: string | null;
    writtenAnswer: string | null;
}

export const QuizAttemptViewer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation();
    const state = (location.state as { resume?: boolean; courseId?: string } | null) ?? null;
    const shouldResume = Boolean(state?.resume);
    const returnPath = state?.courseId ? `/courses/${state.courseId}/quizzes` : '/courses';

    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<LocalAnswer[]>([]);
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [endDateStr, setEndDateStr] = useState<string | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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

                let currentAttemptId: string | null = null;
                let localEndDateStr: string | null = null;

                if (shouldResume) {
                    const attemptsDto = await getMyAttemptsForQuiz(id);
                    const activeAttempt = (attemptsDto?.attempts ?? [])
                        .filter((a) => String(a.status).toLowerCase() === 'inprogress')
                        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

                    currentAttemptId = activeAttempt?.id ?? null;
                    localEndDateStr = activeAttempt?.attemptEndTime ?? null;
                    if (!currentAttemptId) {
                        throw new Error('No active attempt found to resume.');
                    }
                } else {
                    const attempt = await startQuizAttempt(id);
                    currentAttemptId = attempt.id;
                    localEndDateStr = attempt.attemptEndDate;
                    
                    if (state?.courseId) {
                        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE_QUIZZES(state.courseId) });
                    }
                }

                setAttemptId(currentAttemptId);

                const attemptQuestions = await getAttemptQuestions(currentAttemptId);
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

                // Determine the end time for the timer
                if (localEndDateStr) {
                    setEndDateStr(localEndDateStr);
                } else {
                    // Fallback: compute end date from quiz time limit
                    const fallbackMinutes = quiz.attemptTimeLimit || 30;
                    const fallbackEnd = new Date(Date.now() + fallbackMinutes * 60 * 1000).toISOString();
                    setEndDateStr(fallbackEnd);
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

    const doSubmit = useCallback(async (mode: 'manual' | 'auto' = 'manual') => {
        const aid = attemptIdRef.current;
        if (!aid) {
            if (mode === 'auto') window.location.href = returnPath;
            return;
        }

        setIsSubmitting(true);
        try {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length > 0) await saveAttemptProgress(aid, entries);
            await submitQuizAttempt(aid);
            
            sessionStorage.setItem('quiz_submit_toast', mode === 'auto' ? 'auto_submit' : 'manual_submit');
            window.location.href = returnPath;
        } catch {
            if (mode === 'auto') {
                sessionStorage.setItem('quiz_submit_toast', 'auto_fail');
                window.location.href = returnPath;
            } else {
                toast.error('Failed to submit quiz. Please try again.');
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }, [returnPath]);

    // ── Timestamp-based countdown timer (drift-proof) ───────────────────
    const handleTimerExpire = useCallback(() => {
        if (!isSubmitting) doSubmit('auto');
    }, [doSubmit, isSubmitting]);

    const { remainingSeconds, formattedTime, isExpired } = useExamTimer({
        attemptEndDate: endDateStr ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        attemptId: attemptId ?? '',
        onExpire: handleTimerExpire,
        syncIntervalMs: 30_000,
        disabled: !endDateStr || !attemptId || isSubmitting,
    });

    // Auto-save
    useEffect(() => {
        if (!attemptId) return;
        const autoSave = setInterval(async () => {
            const entries = buildSaveAnswerEntries(questionsRef.current, answersRef.current);
            if (entries.length === 0) return;
            setIsSaving(true);
            try {
                await saveAttemptProgress(attemptId, entries);
            } catch {
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

    const handleEditorNext = () => {
        if (currentIndex === questions.length - 1) {
            setShowSubmitConfirm(true);
        } else {
            setCurrentIndex(v => v + 1);
        }
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
        if (!attemptId || isSubmitting) return;
        setShowSubmitConfirm(false);
        await doSubmit('manual');
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

    // formatTime is now provided by useExamTimer as formattedTime

    const getStatus = (qId: string) => {
        if (flagged.has(qId)) return 'flagged';
        return isAnswered(qId) ? 'answered' : 'remaining';
    };

    /** Aggressive multi-pass decoding */
    const decodeHtml = (html: string) => {
        if (!html) return '';
        let result = html;
        const decoder = document.createElement('textarea');
        for (let i = 0; i < 3; i++) {
            if (!result.includes('&')) break;
            decoder.innerHTML = result;
            result = decoder.value;
        }
        return result;
    };

    // ── Render ─────────────────────────────────────────────────────────────

    // ── Render ─────────────────────────────────────────────────────────────
 
    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-16 h-16 mb-4" />
            <p className="text-slate-500 font-bold tracking-widest uppercase animate-pulse">Initializing Exam Environment...</p>
        </div>
    );
 
    if (error || !currentQ) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 p-10 rounded-[3rem] text-center max-w-lg shadow-2xl">
                <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 mb-8">{error || 'Session is no longer valid.'}</p>
                <button onClick={() => navigate(-1)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all w-full shadow-lg shadow-indigo-200">Return to Dashboard</button>
            </div>
        </div>
    );
 
    const isUrgent = endDateStr !== null && remainingSeconds < 120;

    return (
        <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 flex flex-col font-sans">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 h-16 px-6 sm:px-10 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 font-black text-lg text-white">A</div>
                    <div className="hidden sm:block">
                        <span className="text-base font-black tracking-tight text-slate-900">Ailern</span>
                        <span className="text-base font-black tracking-tight text-indigo-600 ml-1">Exam</span>
                    </div>
                </div>
                <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border transition-all duration-500 ${isUrgent ? 'border-red-200 bg-red-50/80 shadow-red-100 shadow-md animate-pulse' : 'border-slate-100 bg-white/80 shadow-sm'}`}>
                    <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-indigo-500'}`} />
                    <span className={`text-lg font-black font-mono tabular-nums tracking-wider ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                        {endDateStr !== null ? formattedTime : '--:--'}
                    </span>
                </div>
            </header>
 
            <div className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                <main className="space-y-6">
                    {/* Progress Header */}
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-xl font-black text-slate-900 line-clamp-1">{quizTitle}</h1>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Question {currentIndex + 1} of {questions.length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wide">{totalAnswered} Answered</span>
                                </div>
                            </div>
                            <button onClick={toggleFlag} className={`p-3 rounded-xl border transition-all duration-200 ${flagged.has(currentQ.id) ? 'bg-red-50 border-red-300 text-red-500 shadow-sm shadow-red-100' : 'border-slate-200 text-slate-300 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'}`}>
                                <Flag className={`w-5 h-5 ${flagged.has(currentQ.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 h-full transition-all duration-700 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
 
                    {/* Question Content */}
                    <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl p-6 sm:p-10 shadow-sm relative min-h-[400px] animate-in fade-in duration-300 overflow-hidden" key={currentQ.id}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-400 rounded-l-2xl" />
                        <div className="flex items-center gap-2.5 mb-6">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQ.type}</span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {currentQ.mark} Pts
                            </span>
                            {currentQ.instructions && <span className="text-slate-400 text-xs italic ml-1">{currentQ.instructions}</span>}
                        </div>
                        
                        <div className="mb-8 text-slate-800 leading-relaxed font-sans">
                            <QnARenderer 
                                content={decodeHtml(currentQ.question)} 
                                className="!prose-lg !text-slate-900"
                            />
                        </div>
 
                        <div className="grid gap-3">
                            {currentQ.type === 'Written' ? (
                                <div className="space-y-5">
                                    <ExamAnswerEditor
                                        value={getWrittenValue(currentQ.id)}
                                        onChange={(html) => handleWrittenAnswer(html)}
                                        onNext={handleEditorNext}
                                        isLastQuestion={currentIndex === questions.length - 1}
                                    />
                                    <AnswerPreviewer
                                        value={getWrittenValue(currentQ.id)}
                                        label="ANSWER PREVIEW"
                                    />
                                </div>
                            ) : currentQ.type === 'TrueFalse' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentQ.options.map(opt => {
                                        const selected = getSelectedOptionId(currentQ.id) === opt.optionId;
                                        return (
                                            <button key={opt.optionId} onClick={() => handleSelectOption(opt.optionId)} className={`p-5 rounded-xl border-2 font-bold text-lg transition-all duration-200 flex items-center justify-between ${selected ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-md shadow-indigo-100' : 'border-slate-100 bg-slate-50/60 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
                                                <span><QnARenderer content={decodeHtml(opt.option)} /></span>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-indigo-500 bg-indigo-500 scale-110' : 'border-slate-300'}`}>
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
                                        <button key={opt.optionId} onClick={() => handleSelectOption(opt.optionId)} className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-200 text-left ${selected ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-md shadow-indigo-100' : 'border-slate-100 bg-slate-50/60 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
                                            <span className="text-base font-semibold pr-4"><QnARenderer content={decodeHtml(opt.option)} /></span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? 'border-indigo-500 bg-indigo-500 scale-110' : 'border-slate-300'}`}>
                                                {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
 
                    {/* Bottom Nav */}
                    <div className="flex justify-between items-center bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200/60 shadow-sm">
                        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(v => v - 1)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all disabled:opacity-30 flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            {isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing</> : <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-Saved</>}
                        </div>
                        {currentIndex === questions.length - 1 ? (
                            <button onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} SUBMIT EXAM
                            </button>
                        ) : (
                            <button onClick={() => setCurrentIndex(v => v + 1)} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                NEXT <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </main>
 
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)]">
                        <h3 className="text-2xl font-black text-slate-900">Submit your quiz?</h3>
                        <p className="mt-2 text-slate-500 leading-relaxed">
                            Make sure you have reviewed your answers. Once submitted, you cannot continue this attempt.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleManualSubmit}
                                disabled={isSubmitting}
                                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-4 text-sm font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-60 transition-all active:scale-95"
                            >
                                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
 
                {/* Sidebar */}
                <aside className="space-y-6">
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Grid3x3 className="w-4 h-4 text-indigo-500" /> Exam Map</h3>
                            <span className="text-[10px] font-black bg-indigo-50 px-2.5 py-1 rounded-md text-indigo-600 border border-indigo-100">{totalAnswered}/{questions.length}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2.5">
                            {questions.map((q, idx) => {
                                const status = getStatus(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`aspect-square rounded-lg flex items-center justify-center font-black text-xs transition-all duration-200 relative ${
                                            currentIndex === idx
                                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-2 ring-indigo-200 scale-105 shadow-md shadow-indigo-200'
                                                : status === 'answered'
                                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
                                                    : status === 'flagged'
                                                        ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'
                                                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        {idx + 1}
                                        {status === 'flagged' && currentIndex !== idx && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
 
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                <div className="w-3 h-3 rounded bg-gradient-to-br from-indigo-600 to-violet-600" /> Current
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                <div className="w-3 h-3 rounded bg-indigo-50 border border-indigo-100" /> Answered
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                <div className="w-3 h-3 rounded bg-amber-50 border border-amber-100" /> Flagged
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
