import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, MessageSquare, Save, XCircle } from 'lucide-react';
import { attemptsService } from '@/api/services';
import type { AnswerDto, AttemptStatus, GradeSubmissionBody } from '@/types/api.types';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

type GradeRow = {
    questionId: string;
    score: number;
    feedback: string;
};

export const InstructorQuizSubmissionReviewPage = () => {
    const { quizId = '', attemptId = '' } = useParams<{ quizId: string; attemptId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [targetStatus, setTargetStatus] = useState<AttemptStatus>('Reviewed');
    const [gradeRows, setGradeRows] = useState<Record<string, GradeRow>>({});

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [...QUERY_KEYS.ATTEMPT_GRADE(attemptId), 'student-answers'],
        queryFn: () => attemptsService.getAttemptStudentAnswers(attemptId),
        enabled: !!attemptId,
    });

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
                    throw new Error('Missing questionId in student answers response. Please include questionId in backend payload.');
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
                status: targetStatus,
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
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading attempt answers...</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800/60 border border-red-200 dark:border-red-500/30 rounded-2xl p-10 text-center max-w-lg">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Failed to load submission</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-5">Could not fetch student answers for this attempt.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 pb-20">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quizId))}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Review & Grade Submission</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                                Quiz: <span className="text-gray-700 dark:text-slate-200 font-semibold">{data.quizTitle}</span> · Attempt: {attemptId}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value as AttemptStatus)}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-gray-800 dark:text-slate-100"
                        >
                            <option value="Submitted">Submitted</option>
                            <option value="Reviewed">Reviewed</option>
                        </select>
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Grade
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1">Status</p>
                        <p className="text-base font-black text-indigo-600 dark:text-indigo-400">{data.status}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1">Score</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{data.score} / {data.totalScore}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1">Answers</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{answers.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1">Time Spent</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{data.timeSpent}s</p>
                    </div>
                </div>

                <div className="space-y-4">
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
                                className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                                Question {answer.order}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                                {formatType(answer.type)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{answer.questionText}</h3>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                        isFull
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                                    }`}>
                                        {isFull ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {isFull ? 'Full Mark' : 'Partial / Pending'}
                                    </div>
                                </div>

                                {answer.options && answer.options.length > 0 && (
                                    <div className="space-y-2.5 mb-4">
                                        {answer.options
                                            .slice()
                                            .sort((a, b) => a.order - b.order)
                                            .map((opt) => (
                                                <div
                                                    key={`${answer.order}-${opt.order}`}
                                                    className={`rounded-xl border px-4 py-3 ${
                                                        opt.isSelected
                                                            ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                                                            : opt.isCorrect
                                                                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                                                                : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{opt.optionText}</p>
                                                        <div className="flex items-center gap-2">
                                                            {opt.isCorrect && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                                                    Correct
                                                                </span>
                                                            )}
                                                            {opt.isSelected && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                                                    Student choice
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {answer.type === 'Written' && (
                                    <div className="mb-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Student Answer</p>
                                        <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                                            {answer.answer?.trim() ? answer.answer : 'No answer submitted.'}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                                            Score (0 - {maxScore})
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={maxScore}
                                            step="0.5"
                                            value={row?.score ?? 0}
                                            onChange={(e) => updateRow(answer, { score: Number(e.target.value) })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                                            Feedback
                                        </label>
                                        <div className="relative">
                                            <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            <textarea
                                                value={row?.feedback ?? ''}
                                                onChange={(e) => updateRow(answer, { feedback: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 pl-9 pr-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white"
                                                placeholder="Optional instructor feedback..."
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
