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
    X,
    Eye,
    MessageSquare,
    BookOpen,
    Sparkles,
    AlertTriangle,
    RefreshCw
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
            // Deselect all visible
            const visibleIds = new Set(filteredRows.map(r => r.id));
            setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
        } else {
            // Select all visible (merge with existing)
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
            // mutation hook handles cache invalidation; silent fail
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

    const stats = [
        { label: 'Total', value: page?.totalResults ?? 0, icon: Users, color: 'blue' },
        { label: 'Graded', value: page?.items.filter(i => i.status === 'Graded').length ?? 0, icon: CheckCircle2, color: 'emerald' },
        { label: 'AI Graded', value: page?.items.filter(i => i.isAIGraded).length ?? 0, icon: Sparkles, color: 'violet' },
        { label: 'Pending', value: page?.items.filter(i => i.status === 'Submitted').length ?? 0, icon: Clock, color: 'orange' },
        { label: 'Total Submissions', value: page?.totalResults ?? 0, icon: Users, color: 'blue' },
        { label: 'Reviewed', value: page?.items.filter(i => i.status === 'Reviewed' || i.status === 'Graded').length ?? 0, icon: CheckCircle2, color: 'emerald' },
        { label: 'Pending Review', value: page?.items.filter(i => i.status === 'Submitted').length ?? 0, icon: Clock, color: 'orange' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-28">
            <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="flex items-center gap-3 sm:gap-5">
                    <button
                        onClick={() => {
                            if (quizMeta?.courseId) {
                                navigate(`/instructor/courses/${quizMeta.courseId}/manage/quizzes`);
                            } else {
                                navigate(-1);
                            }
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">Submissions</h1>
                        {quizMeta && (
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[#21A9FF] text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">{quizMeta.title}</p>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{page?.totalResults ?? 0} Total</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats — compact 4-col */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-none transition-all duration-500">
                            <div className={`absolute left-0 top-0 w-1 h-full opacity-60 ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]' :
                                stat.color === 'emerald' ? 'bg-emerald-500' :
                                stat.color === 'violet' ? 'bg-violet-500' :
                                'bg-orange-500'
                            }`} />
                            <div className="min-w-0 pr-2">
                                <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 truncate">{stat.label}</p>
                                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
                            </div>
                            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]/10 text-[#21A9FF]' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                stat.color === 'violet' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-500' :
                                'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                            }`}>
                                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Grading Summary Card */}
                <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white">AI Grading Status</h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Current page overview</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="text-center min-w-[70px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Currently Grading</p>
                            <p className="text-xl font-black text-blue-500">{page?.items.filter(i => i.aiGradingStatus === 'InProgress').length ?? 0}</p>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="text-center min-w-[70px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Completed</p>
                            <p className="text-xl font-black text-emerald-500">{page?.items.filter(i => i.aiGradingStatus === 'Graded' || i.aiGradingStatus === 'Overwritten').length ?? 0}</p>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="text-center min-w-[70px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Failed</p>
                            <p className="text-xl font-black text-red-500">{page?.items.filter(i => i.aiGradingStatus === 'Failed').length ?? 0}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="relative z-10 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-3 sm:p-4 flex flex-col lg:flex-row gap-3 shadow-sm">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search student or email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPageNo(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] outline-none text-sm font-bold transition-all placeholder:text-slate-400 placeholder:font-medium"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 lg:flex-none lg:min-w-[200px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <div
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF] transition-all group"
                            >
                                <span className="flex-1 text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                                    {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        {STATUS_FILTERS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setStatusFilter(opt.value as any); setPageNo(1); setIsStatusDropdownOpen(false); }}
                                                className={`w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                                    statusFilter === opt.value
                                                        ? 'bg-[#21A9FF]/5 text-[#21A9FF]'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white'
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
                                className="flex-1 lg:flex-none px-5 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/50 text-violet-600 dark:text-violet-400 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all group"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="uppercase tracking-widest text-[10px]">Grade Selected with AI</span>
                            </button>
                        )}
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
                        {/* Select All */}
                        {isSelectionMode && (
                            <div className="flex items-center gap-3 px-2 animate-in fade-in slide-in-from-left-2">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#21A9FF] focus:ring-[#21A9FF]/30 cursor-pointer accent-[#21A9FF]"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        Select All ({filteredRows.length})
                                    </span>
                                </label>
                            </div>
                        )}

                        {filteredRows.map((row) => {
                            const info = getStatusInfo(row.status);
                            const isSelected = selectedIds.includes(row.id);
                            return (
                                <div
                                    key={row.id}
                                    className={`bg-white dark:bg-slate-800/40 backdrop-blur-md border rounded-[2rem] p-4 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-[#21A9FF]/5 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden group ${
                                        row.status === 'Reviewed' || row.status === 'Graded'
                                            ? 'border-emerald-200/50 dark:border-emerald-500/20'
                                            : 'border-slate-200 dark:border-slate-700/50'
                                    }`}
                                >
                                    {/* Left: Checkbox + Student Info */}
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        {/* Checkbox */}
                                        {isSelectionMode && (
                                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(row.id)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#21A9FF] focus:ring-[#21A9FF]/30 cursor-pointer shrink-0 accent-[#21A9FF]"
                                                />
                                            </div>
                                        )}

                                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center font-black text-base sm:text-xl shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-500 ${
                                            row.status === 'Reviewed' || row.status === 'Graded'
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-[#21A9FF] text-white shadow-lg shadow-blue-500/20'
                                        }`}>
                                            {(row.studentName || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                                                <h4 className="font-black text-slate-900 dark:text-white text-[15px] sm:text-lg tracking-tight truncate leading-tight">{row.studentName || 'Student'}</h4>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-widest w-fit">
                                                    Attempt #{row.attemptNumber}
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 sm:gap-y-2 gap-x-3">
                                                <p className="text-[8px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#21A9FF]" /> {formatDate(row.startAt)}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                                        row.status === 'Reviewed' || row.status === 'Graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        row.status === 'Submitted' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-[#21A9FF] dark:border-blue-500/20' :
                                                        'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                                    }`}>
                                                        <info.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {info.label}
                                                    </span>
                                                    {row.score !== null && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 uppercase tracking-widest">
                                                            Score: {row.score}
                                                        </span>
                                                    )}
                                                    {row.aiGradingStatus === 'InProgress' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 uppercase tracking-wider">
                                                            AI Grading
                                                        </span>
                                                    )}
                                                    {row.aiGradingStatus === 'Failed' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 uppercase tracking-wider">
                                                            <AlertTriangle className="w-2.5 h-2.5" /> AI Failed
                                                        </span>
                                                    )}
                                                    {row.aiGradingStatus === 'Overwritten' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 uppercase tracking-wider">
                                                            AI · Edited
                                                        </span>
                                                    )}
                                                    {(row.aiGradingStatus === 'Graded' || (row.isAIGraded && row.status === 'Graded' && row.aiGradingStatus !== 'InProgress' && row.aiGradingStatus !== 'Overwritten' && row.aiGradingStatus !== 'Failed')) && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 uppercase tracking-wider">
                                                            <Sparkles className="w-2.5 h-2.5" /> AI
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6 shrink-0 mt-0 sm:mt-0 pt-0 sm:pt-0 border-t-0">
                                        <button
                                            onClick={() => navigate(
                                                ROUTES.INSTRUCTOR_QUIZ_SUBMISSION_REVIEW
                                                    .replace(':quizId', quizId)
                                                    .replace(':attemptId', row.id)
                                            )}
                                            className={`w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/btn ${
                                                row.status === 'Reviewed' || row.status === 'Graded'
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                                    : 'bg-[#21A9FF] hover:bg-[#0094F2] text-white shadow-blue-500/20'
                                            }`}
                                        >
                                            <MessageSquare className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                            {row.status === 'Reviewed' || row.status === 'Graded' ? 'Edit Review' : 'Review & Grade'}
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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

            {/* Floating Batch AI Grading Toolbar */}
            {isSelectionMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 py-3 px-5 flex items-center gap-5">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                            {selectedIds.length} <span className="font-bold text-slate-400 dark:text-slate-500">selected</span>
                        </span>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
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
                            className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel Selection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
