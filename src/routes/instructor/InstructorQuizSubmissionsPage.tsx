import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    ChevronRight, 
    Clock, 
    Filter, 
    Loader2, 
    Search, 
    Users, 
    CheckCircle2, 
    ChevronDown,
    X,
    Eye,
    MessageSquare,
    BookOpen
} from 'lucide-react';
import { useQuiz, useQuizSubmissions } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import type { AttemptStatus } from '@/types/api.types';

const STATUS_FILTERS: Array<{ label: string; value: AttemptStatus | 'all' }> = [
    { label: 'All Submissions', value: 'all' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Reviewed', value: 'Reviewed' },
];

export const InstructorQuizSubmissionsPage = () => {
    const { quizId = '' } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<AttemptStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [pageNo, setPageNo] = useState(1);
    const pageSize = 10;

    const { data: quizMeta } = useQuiz(quizId);
    const { data: page, isLoading, isError, refetch } = useQuizSubmissions(
        quizId,
        statusFilter === 'all' ? null : statusFilter,
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

    const getStatusInfo = (status: AttemptStatus) => {
        switch (status) {
            case 'Reviewed':
                return { label: 'Reviewed', color: 'emerald', icon: CheckCircle2 };
            case 'Submitted':
                return { label: 'Submitted', color: 'blue', icon: CheckCircle2 };
            case 'InProgress':
                return { label: 'In Progress', color: 'orange', icon: Clock };
            default:
                return { label: status, color: 'gray', icon: Clock };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#21A9FF]/30 border-t-[#21A9FF] rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading quiz submissions...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Total Submissions', value: page?.totalResults ?? 0, icon: Users, color: 'blue' },
        { label: 'Reviewed', value: page?.items.filter(i => i.status === 'Reviewed').length ?? 0, icon: CheckCircle2, color: 'emerald' },
        { label: 'Pending Review', value: page?.items.filter(i => i.status === 'Submitted').length ?? 0, icon: Clock, color: 'orange' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (quizMeta?.courseId) {
                                navigate(`/instructor/courses/${quizMeta.courseId}/manage/quizzes`);
                            } else {
                                navigate(-1);
                            }
                        }}
                        className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Quiz Submissions</h1>
                        {quizMeta && (
                            <p className="text-[#21A9FF] mt-0.5 text-base font-semibold">{quizMeta.title}</p>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute left-0 top-0 w-1 h-full ${stat.color === 'blue' ? 'bg-[#21A9FF]' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                            <div>
                                <p className="text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]/10 text-[#21A9FF]' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                'bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                            }`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="relative z-30 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by student name or email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPageNo(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#21A9FF]/50 outline-none text-sm font-semibold transition-all"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <div
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF]/50 transition-colors min-w-[180px]"
                            >
                                <span className="flex-1 text-gray-800 dark:text-white">
                                    {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5">
                                        {STATUS_FILTERS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setStatusFilter(opt.value as any); setPageNo(1); setIsStatusDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-between ${
                                                    statusFilter === opt.value
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF]'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {opt.label}
                                                {statusFilter === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isError ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 p-12 text-center shadow-sm">
                        <Users className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load submissions</h3>
                        <button onClick={() => refetch()} className="mt-4 px-6 py-2 bg-[#21A9FF] text-white font-bold rounded-xl hover:bg-[#0094F2] transition-colors">Retry</button>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <Search className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No submissions found</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-2">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRows.map((row) => {
                            const info = getStatusInfo(row.status);
                            return (
                                <div
                                    key={row.id}
                                    className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                        row.status === 'Reviewed'
                                            ? 'border-emerald-200/60 dark:border-emerald-700/30'
                                            : 'border-gray-200 dark:border-slate-700/50'
                                    }`}
                                >
                                    {/* Left: Student Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                                            row.status === 'Reviewed'
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                        }`}>
                                            {(row.studentName || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{row.studentName || 'Student'}</h4>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 border border-gray-200 dark:border-slate-600 uppercase tracking-tighter">
                                                    Attempt #{row.attemptNumber}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> Started: {formatDate(row.startAt)}
                                            </p>
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                                    row.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                                                    row.status === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                                                }`}>
                                                    <info.icon className="w-3 h-3" /> {info.label}
                                                </span>
                                                {row.score !== null && (
                                                    <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 uppercase tracking-wider">
                                                        Score: {row.score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700/50 pt-3 md:pt-0 md:pl-5 shrink-0">
                                        <button
                                            onClick={() => navigate(
                                                ROUTES.INSTRUCTOR_QUIZ_SUBMISSION_REVIEW
                                                    .replace(':quizId', quizId)
                                                    .replace(':attemptId', row.id)
                                            )}
                                            className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
                                                row.status === 'Reviewed'
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    : 'bg-[#21A9FF] hover:bg-[#0094F2] text-white'
                                            }`}
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {row.status === 'Reviewed' ? 'Edit Review' : 'Review & Grade'}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {(page?.pagesCount ?? 1) > 1 && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Page {pageNo} of {page?.pagesCount}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPageNo(p => Math.max(1, p - 1))}
                                disabled={pageNo === 1}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPageNo(p => Math.min(page?.pagesCount ?? 1, p + 1))}
                                disabled={pageNo >= (page?.pagesCount ?? 1)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
