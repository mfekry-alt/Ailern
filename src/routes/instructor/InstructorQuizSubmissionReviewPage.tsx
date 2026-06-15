import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Loader2, 
    MessageSquare, 
    Save, 
    XCircle, 
    Clock, 
    Target, 
    FileText, 
    ChevronDown,
    Check,
    Sparkles
} from 'lucide-react';
import { attemptsService } from '@/api/services';
import { useAIGradeQuiz } from '@/features/quizzes/api';
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
import type { AnswerDto, AttemptStatus, GradeSubmissionBody } from '@/types/api.types';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

type GradeRow = {
    questionId: string;
    score: number;
    feedback: string;
};

const STATUS_OPTIONS: Array<{ label: string; value: AttemptStatus }> = [
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Graded', value: 'Graded' },
];

export const InstructorQuizSubmissionReviewPage = () => {
    const { quizId = '', attemptId = '' } = useParams<{ quizId: string; attemptId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [targetStatus, setTargetStatus] = useState<AttemptStatus>('Graded');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [gradeRows, setGradeRows] = useState<Record<string, GradeRow>>({});

    const aiGradeMutation = useAIGradeQuiz(quizId);

    const handleAIReGrade = async () => {
        try {
            await aiGradeMutation.mutateAsync([attemptId]);
            toast.success('AI grading triggered successfully.');
            refetch();
        } catch {
            toast.error('AI grading failed. Please try again.');
        }
    };

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [...QUERY_KEYS.ATTEMPT_GRADE(attemptId), 'student-answers'],
        queryFn: () => attemptsService.getAttemptStudentAnswers(attemptId),
        enabled: !!attemptId,
    });

    useEffect(() => {
        if (data?.status) {
            const mappedStatus = data.status === 'Graded' ? 'Reviewed' : data.status;
            setTargetStatus(mappedStatus as AttemptStatus);
        }
    }, [data?.status]);

    const answers = useMemo(() => {
        const list = data?.answers ?? [];
        return [...list].sort((a, b) => a.order - b.order);
    }, [data]);

    const updateRow = (answer: AnswerDto, patch: Partial<GradeRow>) => {
        const questionId = answer.questionId;
        if (!questionId) return;
        const current = gradeRows[questionId] ?? {
            questionId,
            score: answer.score ?? 0,
            feedback: answer.feedback ?? '',
        };
        setGradeRows((prev) => ({
            ...prev,
            [questionId]: { ...current, ...patch },
        }));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const payloadRows = answers.map((a) => {
                if (!a.questionId) {
                    throw new Error('Missing questionId in student answers response.');
                }
                const row = gradeRows[a.questionId] ?? {
                    questionId: a.questionId,
                    score: a.score ?? 0,
                    feedback: a.feedback ?? '',
                };
                return {
                    questionId: row.questionId,
                    score: Number(row.score),
                    feedback: row.feedback?.trim() || null,
                };
            });

            const invalidScore = payloadRows.find((r, idx) => r.score < 0 || r.score > (answers[idx]?.maxScore ?? 0));
            if (invalidScore) {
                throw new Error('One or more question scores are out of allowed range.');
            }

            const payload: GradeSubmissionBody = {
                grades: payloadRows,
                status: targetStatus === 'Reviewed' ? ('Graded' as AttemptStatus) : targetStatus,
            };
            await attemptsService.gradeSubmission(attemptId, payload);
        },
        onSuccess: () => {
            toast.success('Submission graded successfully.');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZ_SUBMISSIONS(quizId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTEMPT_GRADE(attemptId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTEMPT(attemptId) });
            navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quizId));
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Failed to grade submission.';
            toast.error(message);
        },
    });

    const formatType = (value: string) => (value === 'TrueFalse' ? 'True / False' : value);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#21A9FF]/30 border-t-[#21A9FF] rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading attempt details...</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800/60 border border-red-200 dark:border-red-500/30 rounded-[2rem] p-12 text-center max-w-lg shadow-xl">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Failed to load submission</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-8">We couldn't retrieve the student's answers for this attempt.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-8 py-3 rounded-xl bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Status', value: data.status === 'Graded' ? 'Reviewed' : data.status, icon: Target, color: (data.status === 'Reviewed' || data.status === 'Graded') ? 'emerald' : 'blue' },
        { label: 'Score', value: `${data.score} / ${data.totalScore}`, icon: FileText, color: 'violet' },
        { label: 'Questions', value: answers.length, icon: MessageSquare, color: 'orange' },
        { label: 'Time Spent', value: `${data.timeSpent || 0}m`, icon: Clock, color: 'emerald' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quizId))}
                            className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                                Review Submission {data.studentName ? `— ${data.studentName}` : ''}
                            </h1>
                            <p className="text-[#21A9FF] mt-1.5 text-sm font-semibold flex items-center gap-2">
                                <span className="opacity-60">Quiz:</span> {data.quizTitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="pl-4 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF]/50 transition-colors min-w-[160px]"
                            >
                                <span className="flex-1 text-gray-800 dark:text-white">
                                    {targetStatus}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-2">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setTargetStatus(opt.value); setIsStatusDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between ${
                                                    targetStatus === opt.value
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF]'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {opt.label}
                                                {targetStatus === opt.value && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {data.status === 'Graded' && (
                            <button
                                onClick={handleAIReGrade}
                                disabled={aiGradeMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {aiGradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {aiGradeMutation.isPending ? 'Grading...' : 'Re-Grade by AI'}
                            </button>
                        )}
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {mutation.isPending ? 'Saving...' : 'Save Grade'}
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute left-0 top-0 w-1 h-full ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]' : 
                                stat.color === 'emerald' ? 'bg-emerald-500' : 
                                stat.color === 'violet' ? 'bg-violet-500' : 'bg-orange-500'
                            }`} />
                            <div>
                                <p className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]/10 text-[#21A9FF]' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                stat.color === 'violet' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600' :
                                'bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                            }`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {answers.map((answer) => {
                        const questionId = answer.questionId;
                        const row = questionId
                            ? gradeRows[questionId] ?? {
                                questionId,
                                score: answer.score ?? 0,
                                feedback: answer.feedback ?? '',
                            }
                            : null;
                        const maxScore = answer.maxScore ?? 0;
                        const isFull = (row?.score ?? 0) >= maxScore && maxScore > 0;

                        return (
                            <div
                                key={`${answer.order}-${answer.questionText}`}
                                className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-[#21A9FF]/10 text-[#21A9FF] border border-[#21A9FF]/20 uppercase tracking-tight">
                                                Question {answer.order}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600">
                                                {formatType(answer.type)}
                                            </span>
                                        </div>
                                        <div className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
                                            <QnARenderer content={decodeHtml(answer.questionText)} />
                                        </div>
                                    </div>
                                    <div className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                                        isFull
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                    }`}>
                                        {isFull ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {isFull ? 'Full Score' : 'Partial / Incorrect'}
                                    </div>
                                </div>

                                {/* Options (MCQ / T/F) */}
                                {answer.options && answer.options.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        {answer.options
                                            .slice()
                                            .sort((a, b) => a.order - b.order)
                                            .map((opt) => (
                                                <div
                                                    key={`${answer.order}-${opt.order}`}
                                                    className={`relative rounded-2xl border p-4 transition-all ${
                                                        opt.isSelected
                                                            ? 'border-blue-300 bg-blue-50/50 dark:border-blue-500/40 dark:bg-blue-500/10'
                                                            : opt.isCorrect
                                                                ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10 shadow-sm'
                                                                : 'border-gray-100 bg-gray-50/50 dark:border-slate-700/50 dark:bg-slate-900/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                                            <QnARenderer content={decodeHtml(opt.optionText)} />
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {opt.isCorrect && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-lg">
                                                                    Correct
                                                                </span>
                                                            )}
                                                            {opt.isSelected && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-lg">
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {answer.type === 'Written' && (
                                    <div className="mb-6 rounded-[1.5rem] border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60 p-5 shadow-inner">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-3">Student Answer</p>
                                        {answer.answer?.trim() ? (
                                            <div className="bg-white dark:bg-slate-950/60 rounded-xl p-4 border border-gray-200/55 dark:border-slate-800/80">
                                                <QnARenderer content={decodeHtml(answer.answer)} />
                                            </div>
                                        ) : (
                                            <p className="text-base text-gray-400 dark:text-slate-500 font-medium italic">
                                                No answer submitted.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Grading Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 px-1">
                                            Score (Max {maxScore})
                                        </label>
                                        <div className="relative group">
                                            <Target className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#21A9FF]" />
                                            <input
                                                type="number"
                                                min={0}
                                                max={maxScore}
                                                step="0.5"
                                                value={row?.score ?? 0}
                                                onChange={(e) => updateRow(answer, { score: Number(e.target.value) })}
                                                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/40 focus:border-[#21A9FF]/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 px-1">
                                            Instructor Feedback
                                        </label>
                                        <div className="relative group">
                                            <MessageSquare className="w-4 h-4 text-gray-400 absolute left-4 top-4 transition-colors group-focus-within:text-[#21A9FF]" />
                                            <textarea
                                                value={row?.feedback ?? ''}
                                                onChange={(e) => updateRow(answer, { feedback: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/40 focus:border-[#21A9FF]/50 transition-all resize-none"
                                                placeholder="Provide detailed feedback for the student..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
