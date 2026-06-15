import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
    MessageSquare,
    Sparkles,
    AlertTriangle,
    Zap,
    TrendingUp,
    BarChart3,
    Brain,
    Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuiz, useQuizSubmissions, useAIGradeQuiz } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import type { AttemptStatus } from '@/types/api.types';

const STATUS_FILTERS: Array<{ label: string; value: AttemptStatus | 'all' }> = [
    { label: 'All Submissions', value: 'all' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Graded', value: 'Graded' },
];

export const InstructorQuizSubmissionsPage = () => {
    const { quizId = '' } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<AttemptStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [pageNo, setPageNo] = useState(1);
    const pageSize = 10;

    // Batch selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [wasPolling, setWasPolling] = useState(false);

    const { data: quizMeta } = useQuiz(quizId);
    const { data: page, isLoading, isError, refetch } = useQuizSubmissions(
        quizId,
        statusFilter === 'all' ? null : statusFilter,
        pageNo,
        pageSize
    );

    const aiGradeMutation = useAIGradeQuiz(quizId);

    const rows = page?.items ?? [];
    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((r) =>
            `${r.studentName} ${r.email}`.toLowerCase().includes(term)
        );
    }, [rows, search]);

    // Selection helpers
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const allVisibleSelected = filteredRows.length > 0 && filteredRows.every(r => selectedIds.includes(r.id));

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            const visibleIds = new Set(filteredRows.map(r => r.id));
            setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
        } else {
            const visibleIds = filteredRows.map(r => r.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleBatchAIGrade = async () => {
        if (selectedIds.length === 0) return;
        try {
            await aiGradeMutation.mutateAsync(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast.success('AI grading started.');
            refetch();
        } catch {
            toast.error('Failed to start AI grading.');
        }
    };

    const hasInProgress = page?.items.some(x => x.aiGradingStatus === 'InProgress');

    useEffect(() => {
        if (hasInProgress) {
            setWasPolling(true);
            const interval = setInterval(() => {
                refetch();
            }, 20000);
            return () => clearInterval(interval);
        } else if (wasPolling) {
            setWasPolling(false);
            refetch();
            toast.success("AI grading completed.");
        }
    }, [hasInProgress, wasPolling, refetch]);

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
            case 'Graded':
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

    const totalSubmissions = page?.totalResults ?? 0;
    const reviewedCount = page?.items.filter(i => i.status === 'Reviewed' || i.status === 'Graded').length ?? 0;
    const pendingCount = page?.items.filter(i => i.status === 'Submitted').length ?? 0;
    const aiGradedCount = page?.items.filter(i => i.isAIGraded).length ?? 0;
    const currentlyGrading = page?.items.filter(i => i.aiGradingStatus === 'InProgress').length ?? 0;
    const aiCompleted = page?.items.filter(i => i.aiGradingStatus === 'Graded' || i.aiGradingStatus === 'Overwritten').length ?? 0;
    const aiFailed = page?.items.filter(i => i.aiGradingStatus === 'Failed').length ?? 0;

    const stats = [
        {
            label: 'Total Submissions',
            value: totalSubmissions,
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            glowColor: 'bg-blue-500',
        },
        {
            label: 'Reviewed',
            value: reviewedCount,
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            glowColor: 'bg-emerald-500',
        },
        {
            label: 'Pending Review',
            value: pendingCount,
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            glowColor: 'bg-amber-500',
        },
        {
            label: 'AI Graded',
            value: aiGradedCount,
            icon: Sparkles,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
            glowColor: 'bg-violet-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans pb-28">

            {/* Inline styles for shimmer + pulse animations */}
            <style>{`
                @keyframes shimmerLine {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes subtlePulse {
                    0%, 100% { opacity: 0.6; }
                    50%      { opacity: 1; }
                }
                @keyframes slideUp {
                    0%   { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ─── Hero Header ─── */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 border-b border-gray-200/60 dark:border-slate-700/40">
                {/* Subtle ambient gradient blobs */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-blue-400/8 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-violet-400/6 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <button
                            onClick={() => {
                                if (quizMeta?.courseId) {
                                    navigate(`/instructor/courses/${quizMeta.courseId}/manage/quizzes`);
                                } else {
                                    navigate(-1);
                                }
                            }}
                            className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all shadow-sm active:scale-90 shrink-0 mt-0.5"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Submissions
                                </h1>
                                {totalSubmissions > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#21A9FF]/10 text-[#21A9FF] border border-[#21A9FF]/15 w-fit">
                                        <BarChart3 className="w-3 h-3" />
                                        {totalSubmissions} total
                                    </span>
                                )}
                            </div>
                            {quizMeta && (
                                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-1.5 truncate max-w-xl">
                                    {quizMeta.title}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* ─── Stats Grid ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" style={{ animation: 'slideUp 0.5s ease-out' }}>
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 relative group overflow-hidden"
                        >
                            {/* Ambient glow circle */}
                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[30px] opacity-10 group-hover:opacity-20 transition-opacity duration-300 -mr-8 -mt-8 ${stat.glowColor}`} />
                            
                            <div className="relative flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                        {stat.label}
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center ${stat.color} group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
                                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── AI Grading Status Card ─── */}
                <div
                    className="relative overflow-hidden bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-violet-100/80 dark:border-violet-500/15 rounded-2xl sm:rounded-[1.75rem] shadow-sm hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-500"
                    style={{ animation: 'slideUp 0.6s ease-out' }}
                >
                    {/* Shimmer line at top */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 30%, rgba(99,102,241,0.45) 50%, rgba(139,92,246,0.35) 70%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmerLine 4s linear infinite',
                        }}
                    />

                    {/* Ambient blobs */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-violet-400/8 to-transparent rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-indigo-400/6 to-transparent rounded-full blur-2xl pointer-events-none" />

                    <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        {/* Left: Icon + Title */}
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-md opacity-25" style={{ animation: 'subtlePulse 3s ease-in-out infinite' }} />
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                                    <Brain className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                                    AI Grading Status
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                        AI
                                    </span>
                                </h3>
                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">Current page overview</p>
                            </div>
                        </div>

                        {/* Right: Stats chips */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            {/* Currently Grading */}
                            <div className="flex items-center gap-3 bg-blue-50/80 dark:bg-blue-500/10 border border-blue-100/60 dark:border-blue-500/15 rounded-xl px-4 py-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <Loader2 className={`w-4 h-4 text-blue-500 ${currentlyGrading > 0 ? 'animate-spin' : ''}`} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 leading-none mb-0.5">Grading</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">{currentlyGrading}</p>
                                </div>
                            </div>

                            {/* Completed */}
                            <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100/60 dark:border-emerald-500/15 rounded-xl px-4 py-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 leading-none mb-0.5">Completed</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{aiCompleted}</p>
                                </div>
                            </div>

                            {/* Failed */}
                            <div className="flex items-center gap-3 bg-red-50/80 dark:bg-red-500/10 border border-red-100/60 dark:border-red-500/15 rounded-xl px-4 py-2.5">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 leading-none mb-0.5">Failed</p>
                                    <p className="text-lg font-black text-red-600 dark:text-red-400 leading-none">{aiFailed}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Filter Bar ─── */}
                <div
                    className="relative z-10 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/50 rounded-2xl sm:rounded-[1.75rem] p-3 sm:p-4 flex flex-col lg:flex-row gap-3 shadow-sm"
                    style={{ animation: 'slideUp 0.7s ease-out' }}
                >
                    {/* Search */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#21A9FF] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search student or email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPageNo(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] outline-none text-sm font-semibold transition-all placeholder:text-gray-400 placeholder:font-medium"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 lg:flex-none lg:min-w-[200px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <div
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF] transition-all group"
                            >
                                <span className="flex-1 text-gray-700 dark:text-slate-200 uppercase tracking-widest text-[10px] font-black">
                                    {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top py-1">
                                        {STATUS_FILTERS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setStatusFilter(opt.value as any); setPageNo(1); setIsStatusDropdownOpen(false); }}
                                                className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                                    statusFilter === opt.value
                                                        ? 'bg-[#21A9FF]/5 text-[#21A9FF]'
                                                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {opt.label}
                                                {statusFilter === opt.value && <div className="w-2 h-2 bg-[#21A9FF] rounded-full shadow-[0_0_10px_#21A9FF]" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {!isSelectionMode && (
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="flex-1 lg:flex-none px-5 py-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 border border-violet-200/60 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/40 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all group hover:shadow-md hover:shadow-violet-500/5"
                            >
                                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                <span className="uppercase tracking-widest text-[10px]">AI Grade</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Submission Cards ─── */}
                {isError ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-500/20 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load submissions</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Something went wrong. Please try again.</p>
                        <button onClick={() => refetch()} className="px-6 py-2.5 bg-[#21A9FF] text-white font-bold rounded-xl hover:bg-[#0094F2] transition-colors shadow-md">Retry</button>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No submissions found</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Select All */}
                        {isSelectionMode && (
                            <div className="flex items-center justify-between px-5 py-3.5 mb-4 bg-[#21A9FF]/5 dark:bg-[#21A9FF]/10 border border-[#21A9FF]/20 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                <label className="flex items-center gap-3.5 cursor-pointer select-none group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAll}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 rounded-[6px] border-2 border-[#21A9FF]/40 peer-checked:border-[#21A9FF] peer-checked:bg-[#21A9FF] transition-all flex items-center justify-center shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100 duration-200" strokeWidth={3.5} />
                                        </div>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-[#21A9FF] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        Select All ({filteredRows.length})
                                    </span>
                                </label>
                            </div>
                        )}

                        {filteredRows.map((row, rowIdx) => {
                            const info = getStatusInfo(row.status);
                            const isSelected = selectedIds.includes(row.id);
                            const isReviewedRow = row.status === 'Reviewed' || row.status === 'Graded';

                            return (
                                <div
                                    key={row.id}
                                    className={clsx(
                                        "relative backdrop-blur-md border rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 overflow-hidden group",
                                        isReviewedRow
                                            ? 'bg-white dark:bg-slate-800/50 border-emerald-200/50 dark:border-emerald-500/15 hover:shadow-emerald-500/5'
                                            : 'bg-white dark:bg-slate-800/50 border-gray-200/80 dark:border-slate-700/50 hover:shadow-[#21A9FF]/5',
                                        isSelected && '!bg-[#21A9FF]/[0.03] dark:!bg-[#21A9FF]/10 ring-2 ring-[#21A9FF]/40 border-[#21A9FF]/60 dark:border-[#21A9FF]/50 scale-[1.01]'
                                    )}
                                    style={{ animation: `slideUp ${0.4 + rowIdx * 0.06}s ease-out` }}
                                >
                                    {/* Subtle left accent */}
                                    <div className={`absolute left-0 top-0 w-1 h-full transition-opacity duration-300 ${isReviewedRow ? 'bg-emerald-500 opacity-50' : 'bg-[#21A9FF] opacity-0 group-hover:opacity-40'}`} />

                                    {/* Left: Checkbox + Student Info */}
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        {/* Checkbox */}
                                        {isSelectionMode && (
                                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                                <label className="relative flex items-center justify-center cursor-pointer group/cb">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(row.id)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-5 h-5 rounded-[6px] border-2 border-slate-300 dark:border-slate-600 peer-checked:border-[#21A9FF] peer-checked:bg-[#21A9FF] group-hover/cb:border-[#21A9FF]/60 transition-all flex items-center justify-center shadow-sm">
                                                        <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100 duration-200" strokeWidth={3.5} />
                                                    </div>
                                                </label>
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className={clsx(
                                            "relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 transition-transform duration-500 group-hover:scale-105",
                                            isReviewedRow
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-gradient-to-br from-[#21A9FF] to-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        )}>
                                            {(row.studentName || 'S').charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 mb-1 sm:mb-2">
                                                <h4 className="font-black text-gray-900 dark:text-white text-[15px] sm:text-base tracking-tight truncate leading-tight">
                                                    {row.studentName || 'Student'}
                                                </h4>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[8px] sm:text-[9px] font-black bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200/80 dark:border-slate-700 uppercase tracking-widest w-fit">
                                                    Attempt #{row.attemptNumber}
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1.5 sm:gap-y-2 gap-x-2.5">
                                                <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#21A9FF]" /> {formatDate(row.startAt)}
                                                </p>

                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {/* Status badge */}
                                                    <span className={clsx(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-colors",
                                                        isReviewedRow && 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                                                        row.status === 'Submitted' && 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-[#21A9FF] dark:border-blue-500/20',
                                                        row.status === 'InProgress' && 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                                                    )}>
                                                        <info.icon className="w-3 h-3" /> {info.label}
                                                    </span>

                                                    {/* Score badge */}
                                                    {row.score !== null && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 uppercase tracking-widest">
                                                            <TrendingUp className="w-3 h-3" /> Score: {row.score}
                                                        </span>
                                                    )}

                                                    {/* AI Status Chips */}
                                                    {row.aiGradingStatus === 'InProgress' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 uppercase tracking-wider">
                                                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> AI Grading
                                                        </span>
                                                    )}
                                                    {row.aiGradingStatus === 'Failed' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 uppercase tracking-wider">
                                                            <AlertTriangle className="w-2.5 h-2.5" /> AI Failed
                                                        </span>
                                                    )}
                                                    {row.aiGradingStatus === 'Overwritten' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black bg-gray-50 text-gray-500 border border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 uppercase tracking-wider">
                                                            AI · Edited
                                                        </span>
                                                    )}
                                                    {(row.aiGradingStatus === 'Graded' || (row.isAIGraded && (row.status === 'Graded') && row.aiGradingStatus !== 'InProgress' && row.aiGradingStatus !== 'Overwritten' && row.aiGradingStatus !== 'Failed')) && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 uppercase tracking-wider">
                                                            <Sparkles className="w-2.5 h-2.5" /> AI
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 sm:border-l border-gray-100 dark:border-slate-800 sm:pl-5 shrink-0">
                                        <button
                                            onClick={() => navigate(
                                                ROUTES.INSTRUCTOR_QUIZ_SUBMISSION_REVIEW
                                                    .replace(':quizId', quizId)
                                                    .replace(':attemptId', row.id)
                                            )}
                                            className={clsx(
                                                "w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 font-black text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/btn",
                                                isReviewedRow
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                                                    : 'bg-gradient-to-r from-[#21A9FF] to-blue-600 hover:from-[#0094F2] hover:to-blue-700 text-white shadow-blue-500/20'
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                            {isReviewedRow ? 'Edit Review' : 'Review & Grade'}
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ─── Pagination ─── */}
                {(page?.pagesCount ?? 1) > 1 && (
                    <div className="flex items-center justify-between bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Page <span className="font-black text-gray-900 dark:text-white">{pageNo}</span> of <span className="font-black text-gray-900 dark:text-white">{page?.pagesCount}</span>
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

            {/* ─── Floating Batch AI Grading Toolbar ─── */}
            {isSelectionMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-gray-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-gray-900/10 dark:shadow-black/40 py-3.5 px-6 flex items-center gap-5 overflow-hidden">
                        {/* Shimmer top */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(99,102,241,0.5), rgba(139,92,246,0.4), transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmerLine 3s linear infinite',
                            }}
                        />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#21A9FF]/10 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#21A9FF]" />
                            </div>
                            <span className="text-sm font-black text-gray-800 dark:text-slate-200 tabular-nums">
                                {selectedIds.length} <span className="font-semibold text-gray-400 dark:text-slate-500">selected</span>
                            </span>
                        </div>

                        <div className="w-px h-7 bg-gray-200 dark:bg-slate-700" />

                        <button
                            onClick={handleBatchAIGrade}
                            disabled={aiGradeMutation.isPending || selectedIds.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {aiGradeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {aiGradeMutation.isPending ? 'Starting...' : 'Start AI Grading'}
                        </button>

                        <button
                            onClick={() => {
                                setSelectedIds([]);
                                setIsSelectionMode(false);
                            }}
                            className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
