import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock3, Filter, Loader2, Search, Users } from 'lucide-react';
import { useQuiz, useQuizSubmissions } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import type { AttemptStatus } from '@/types/api.types';

const STATUS_FILTERS: Array<{ label: string; value: AttemptStatus }> = [
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Reviewed', value: 'Reviewed' },
];

export const InstructorQuizSubmissionsPage = () => {
    const { quizId = '' } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [status, setStatus] = useState<AttemptStatus>('Submitted');
    const [search, setSearch] = useState('');
    const [pageNo, setPageNo] = useState(1);
    const pageSize = 10;

    const { data: quizMeta } = useQuiz(quizId);
    const { data: page, isLoading, isError, refetch } = useQuizSubmissions(
        quizId,
        status,
        pageNo,
        pageSize
    );

    const rows = page?.items ?? [];
    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((r) =>
            `${r.studentName} ${r.email}`.toLowerCase().includes(term)
        );
    }, [rows, search]);

    const formatDate = (input?: string | null) => {
        if (!input) return '—';
        return new Date(input).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusBadge = (value: AttemptStatus) => {
        if (value === 'Reviewed') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
        if (value === 'Submitted') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading quiz submissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Quiz Submissions</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                                Quiz: <span className="text-gray-700 dark:text-slate-200 font-semibold">{quizMeta?.title ?? quizId}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">{page?.totalResults ?? 0} submissions</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row gap-3">
                    <div className="relative md:w-72">
                        <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as AttemptStatus);
                                setPageNo(1);
                            }}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                            {STATUS_FILTERS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by student name or email..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                    </div>
                </div>

                {isError ? (
                    <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-500/20 rounded-2xl p-10 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Failed to load submissions</p>
                        <button
                            onClick={() => refetch()}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-16 text-center">
                        <Clock3 className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-slate-400 font-medium">No submissions found for this filter.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRows.map((row) => (
                            <div
                                key={row.id}
                                className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{row.studentName}</p>
                                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusBadge(row.status)}`}>
                                            {row.status}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-700/60 dark:text-slate-200 dark:border-slate-600">
                                            Attempt #{row.attemptNumber}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">{row.email}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                        <p className="text-gray-600 dark:text-slate-300"><span className="font-bold">Started:</span> {formatDate(row.startAt)}</p>
                                        <p className="text-gray-600 dark:text-slate-300"><span className="font-bold">Submitted:</span> {formatDate(row.submittedAt)}</p>
                                        <p className="text-gray-600 dark:text-slate-300"><span className="font-bold">Score:</span> {row.score ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => navigate(
                                            ROUTES.INSTRUCTOR_QUIZ_SUBMISSION_REVIEW
                                                .replace(':quizId', quizId)
                                                .replace(':attemptId', row.id)
                                        )}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
                                    >
                                        Review & Grade
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(page?.pagesCount ?? 1) > 1 && (
                    <div className="flex justify-end items-center gap-2">
                        <button
                            disabled={pageNo <= 1}
                            onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                            className="px-3 py-2 text-sm font-bold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Page {pageNo} / {page?.pagesCount ?? 1}
                        </span>
                        <button
                            disabled={pageNo >= (page?.pagesCount ?? 1)}
                            onClick={() => setPageNo((p) => p + 1)}
                            className="px-3 py-2 text-sm font-bold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
