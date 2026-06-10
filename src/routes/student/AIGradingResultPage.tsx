import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle2, XCircle, Target, Sparkles,
    Percent, MessageSquare, AlertCircle, Loader2, BarChart3,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { getAIGradingResult } from '@/features/ai-grading/api/ai-grading.service';
import type { AIGradingAttemptResult, AIGradedQuestion } from '@/features/ai-grading/types/ai-grading.types';
import { QnARenderer } from '@/features/qna/components/QnARenderer';

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

/* ─── Score Ring ────────────────────────────────────────────────────────── */
function ScoreRing({ percentage }: { percentage: number }) {
    const r = 54, c = 2 * Math.PI * r;
    const offset = c - (percentage / 100) * c;
    const color = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={color}
                    strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
                    strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900 dark:text-white">{percentage}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</span>
            </div>
        </div>
    );
}

/* ─── Breakdown Bar ────────────────────────────────────────────────────── */
function BreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-slate-300 capitalize">{label}</span>
                <span className="font-black text-gray-900 dark:text-white">{value}/{max}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#21A9FF] to-[#0094F2] rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ─── Question Card ────────────────────────────────────────────────────── */
function QuestionCard({ q, index }: { q: AIGradedQuestion; index: number }) {
    const [open, setOpen] = useState(true);
    const isFull = q.aiResult.score >= q.aiResult.max_score && q.aiResult.max_score > 0;
    const pct = q.aiResult.max_score > 0 ? Math.round((q.aiResult.score / q.aiResult.max_score) * 100) : 0;

    return (
        <div className={`bg-white dark:bg-slate-800/60 border rounded-2xl shadow-sm overflow-hidden transition-all ${
            isFull ? 'border-emerald-200/60 dark:border-emerald-700/30' : 'border-gray-200 dark:border-slate-700/50'
        }`}>
            {/* Header */}
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isFull ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    }`}>
                        Q{index + 1}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {q.type === 'MCQ' ? 'Multiple Choice' : q.type === 'TrueFalse' ? 'True / False' : 'Written'}
                            </span>
                        </div>
                        <div className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                            <QnARenderer content={decodeHtml(q.questionText)} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        isFull ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                        {q.aiResult.score}/{q.aiResult.max_score} ({pct}%)
                    </span>
                    {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </button>

            {/* Body */}
            {open && (
                <div className="px-6 pb-6 space-y-5 border-t border-gray-100 dark:border-slate-700/50 pt-5">
                    {/* MCQ Options */}
                    {q.options && q.options.length > 0 && (
                        <div className="space-y-2.5">
                            {q.options.sort((a, b) => a.order - b.order).map((opt, i) => {
                                let cls = 'border-gray-100 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-300';
                                let icon = null;
                                if (opt.isCorrect) {
                                    cls = 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm';
                                    icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                                } else if (opt.isSelected && !opt.isCorrect) {
                                    cls = 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 shadow-sm';
                                    icon = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
                                }
                                return (
                                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${cls}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-gray-400 shadow-sm border border-gray-100 dark:border-slate-700">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="font-semibold text-sm">
                                                <QnARenderer content={decodeHtml(opt.optionText)} />
                                            </span>
                                        </div>
                                        {icon}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Written Answer */}
                    {q.type === 'Written' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700/60 rounded-2xl p-5 shadow-inner">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Student Answer</p>
                                <p className="text-sm text-gray-800 dark:text-slate-200 font-medium italic">"{q.studentAnswer}"</p>
                            </div>
                            {q.correctAnswer && (
                                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Expected Answer</p>
                                    <p className="text-sm text-gray-800 dark:text-slate-200 font-medium">{q.correctAnswer}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rubric Breakdown */}
                    {Object.keys(q.aiResult.breakdown).length > 0 && (
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5" /> Rubric Breakdown
                            </p>
                            <div className="space-y-3">
                                {Object.entries(q.aiResult.breakdown).map(([key, val]) => (
                                    <BreakdownBar key={key} label={key} value={val} max={q.aiResult.max_score} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {q.aiResult.feedback.length > 0 && (
                        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/5 rounded-2xl p-5 border border-violet-100/50 dark:border-violet-500/20">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-violet-100 dark:border-violet-500/30">
                                    <Sparkles className="w-4 h-4 text-violet-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-2">AI Feedback</p>
                                    <ul className="space-y-1.5">
                                        {q.aiResult.feedback.map((fb, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-800 dark:text-slate-200 flex items-start gap-2">
                                                <span className="text-violet-400 mt-0.5">•</span> {fb}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export const AIGradingResultPage = () => {
    const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

    const { data, isLoading, isError } = useQuery<AIGradingAttemptResult>({
        queryKey: ['ai-grading-result', attemptId],
        queryFn: () => getAIGradingResult(attemptId!),
        enabled: !!attemptId,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading AI grading result...</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800/60 border border-red-200 dark:border-red-500/30 rounded-2xl p-12 text-center max-w-lg shadow-xl">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Failed to load result</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">The AI grading result could not be retrieved.</p>
                    <button onClick={() => navigate(-1)}
                        className="px-8 py-3 rounded-xl bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold transition-all shadow-lg active:scale-95">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    AI has successfully evaluated this attempt
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/quizzes/${id}/attempts`)}
                            className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">AI Grading Result</h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-violet-100 to-fuchsia-100 text-fuchsia-700 dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-500/30 shadow-sm">
                                    <Sparkles className="w-3 h-3" /> AI Evaluated
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold mt-2">
                                {data.quizTitle} — Attempt
                            </p>
                        </div>
                    </div>
                    <button onClick={() => navigate(`/quizzes/${id}/attempts`)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95">
                        Back to Attempts
                    </button>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center justify-center">
                        <ScoreRing percentage={data.percentage} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Total Score', value: `${data.totalScore} / ${data.maxScore}`, icon: Target, color: 'blue' },
                            { label: 'Percentage', value: `${data.percentage}%`, icon: Percent, color: 'fuchsia' },
                            { label: 'Questions', value: data.questions.length, icon: MessageSquare, color: 'orange' },
                            { label: 'Grading Mode', value: data.gradingMode, icon: Sparkles, color: 'violet' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                <div className={`absolute left-0 top-0 w-1 h-full ${
                                    s.color === 'blue' ? 'bg-[#21A9FF]' : s.color === 'fuchsia' ? 'bg-fuchsia-500' : s.color === 'orange' ? 'bg-orange-500' : 'bg-violet-500'
                                }`} />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">{s.label}</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">{s.value}</h3>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Feedback */}
                {data.overallFeedback && (
                    <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-violet-500" />
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Overall AI Feedback</h3>
                                <p className="text-gray-800 dark:text-slate-200 font-medium leading-relaxed">{data.overallFeedback}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-6 pt-4">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Question Breakdown</h2>
                    {data.questions.map((q, i) => (
                        <QuestionCard key={q.id} q={q} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
};
