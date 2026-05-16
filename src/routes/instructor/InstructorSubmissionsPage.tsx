import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import {
    getSubmissionsByAssignment,
    getSubmissionFiles,
    reviewSubmission,
    getAssignment,
} from '@/api/services/assignment.service';
import { handleApiError } from '@/api/client';
import {
    ArrowLeft, Download, Search, Filter, CheckCircle2,
    ChevronUp, ChevronDown, Loader2, FileText, MessageSquare,
    X, Send, AlertTriangle, Eye, Clock, Users, BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { GetAssignmentSubmissionDto } from '@/types/api.types';

// ─── Helper ─────────────────────────────────────────────────────────────────
// Determines review status purely from the `feedback` field value.
// The `localFeedbackMap` is an in-memory override for submissions reviewed this session
// (needed when backend doesn't yet return feedback in the list endpoint).
const isReviewed = (
    sub: GetAssignmentSubmissionDto,
    localFeedbackMap: Record<number, string>
) => {
    const localFeedback = localFeedbackMap[sub.id];
    const feedback = localFeedback !== undefined ? localFeedback : (sub.feedback ?? '');
    return feedback.trim().length > 0;
};

const getFeedback = (
    sub: GetAssignmentSubmissionDto,
    localFeedbackMap: Record<number, string>
) => {
    const localFeedback = localFeedbackMap[sub.id];
    return localFeedback !== undefined ? localFeedback : (sub.feedback ?? '');
};

// ─── Component ───────────────────────────────────────────────────────────────
export const InstructorSubmissionsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { assignmentId: assignmentIdParam } = useParams<{ assignmentId: string }>();
    const assignmentId = parseInt(assignmentIdParam || '0');

    // ── Filter / Sort State ────────────────────────────────────────────────
    const [apiStatus, setApiStatus] = useState('all');
    const [gradingFilter, setGradingFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
    const [search, setSearch] = useState('');
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [isGradingDropdownOpen, setIsGradingDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Local feedback map (optimistic updates only) ───────────────────────
    // The backend now returns `feedback` in the list response.
    // This map is only needed to show optimistic updates immediately before
    // the server response comes back.
    const [localFeedbackMap, setLocalFeedbackMap] = useState<Record<number, string>>({});

    const persistFeedback = (submissionId: number, feedback: string) => {
        setLocalFeedbackMap(prev => ({ ...prev, [submissionId]: feedback }));
    };

    // ── Modal State ────────────────────────────────────────────────────────
    const [feedbackModal, setFeedbackModal] = useState<{
        submissionId: number;
        studentName: string;
    } | null>(null);
    const [feedbackText, setFeedbackText] = useState('');

    const [viewFeedbackModal, setViewFeedbackModal] = useState<{
        studentName: string;
        feedback: string;
    } | null>(null);

    const [filesModal, setFilesModal] = useState<{
        submissionId: number;
        studentName: string;
    } | null>(null);

    // ── Toast ──────────────────────────────────────────────────────────────
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const showToast = useCallback((type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ── Queries ────────────────────────────────────────────────────────────
    const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
        queryKey: QUERY_KEYS.ASSIGNMENT(assignmentId),
        queryFn: () => getAssignment(assignmentId),
        enabled: !!assignmentId,
    });

    const { data: submissions = [], isLoading: isLoadingSubmissions, error: submissionsError } = useQuery({
        queryKey: [...QUERY_KEYS.ASSIGNMENT_SUBMISSIONS(assignmentId), apiStatus],
        queryFn: () => getSubmissionsByAssignment(assignmentId, apiStatus),
        enabled: !!assignmentId,
        // Keep previous data so UI doesn't flash on filter change
        placeholderData: (prev) => prev,
    });

    const { data: submissionFiles, isLoading: isLoadingFiles } = useQuery({
        queryKey: QUERY_KEYS.SUBMISSION_FILES(assignmentId, filesModal?.submissionId || 0),
        queryFn: () => getSubmissionFiles(assignmentId, filesModal!.submissionId),
        enabled: !!filesModal?.submissionId && !!assignmentId,
    });

    // ── Review Mutation ────────────────────────────────────────────────────
    const reviewMutation = useMutation({
        mutationFn: ({ submissionId, feedback }: { submissionId: number; feedback: string }) =>
            reviewSubmission(submissionId, feedback),
        onSuccess: (_, variables) => {
            // 1. Persist locally — survives page refresh.
            persistFeedback(variables.submissionId, variables.feedback);

            // 2. Also update the React Query cache so filter/sort logic stays in sync
            const statusVariants = ['all', 'ontime', 'late'];
            statusVariants.forEach(status => {
                const key = [...QUERY_KEYS.ASSIGNMENT_SUBMISSIONS(assignmentId), status];
                queryClient.setQueryData(key, (oldData: GetAssignmentSubmissionDto[] | undefined) => {
                    if (!oldData) return undefined;
                    return oldData.map(sub =>
                        sub.id === variables.submissionId
                            ? { ...sub, feedback: variables.feedback }
                            : sub
                    );
                });
            });

            // 3. Do NOT call invalidateQueries here — the server doesn't return feedback
            //    in the list response, so refetching would wipe our optimistic data.
            //    We schedule a soft background refresh after 5s instead.
            setTimeout(() => {
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.ASSIGNMENT_SUBMISSIONS(assignmentId),
                    refetchType: 'none', // mark stale but don't refetch automatically
                });
            }, 5000);

            setFeedbackModal(null);
            setFeedbackText('');
            showToast('success', 'Feedback saved successfully!');
        },
        onError: (error) => {
            const apiError = handleApiError(error);
            showToast('error', apiError.message || 'Failed to submit feedback.');
        },
    });

    // ── Derived: per submission reviewed state ─────────────────────────────
    const enrichedSubmissions = useMemo(() =>
        submissions.map((sub: GetAssignmentSubmissionDto) => ({
            ...sub,
            _reviewed: isReviewed(sub, localFeedbackMap),
            _feedback: getFeedback(sub, localFeedbackMap),
        })),
        [submissions, localFeedbackMap]
    );

    // ── Stats ──────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const reviewed = enrichedSubmissions.filter(s => s._reviewed).length;
        return {
            total: enrichedSubmissions.length,
            reviewed,
            pending: Math.max(0, enrichedSubmissions.length - reviewed),
        };
    }, [enrichedSubmissions]);

    // ── Filtering & Sorting ────────────────────────────────────────────────
    const filteredAndSorted = useMemo(() => {
        let result = enrichedSubmissions.filter(sub => {
            const gradingMatch =
                gradingFilter === 'all' ||
                (gradingFilter === 'graded' && sub._reviewed) ||
                (gradingFilter === 'ungraded' && !sub._reviewed);
            const searchMatch =
                search === '' ||
                sub.name?.toLowerCase().startsWith(search.toLowerCase());
            return gradingMatch && searchMatch;
        });

        // Default sort: Pending first, then Reviewed; within each group by date desc
        result.sort((a, b) => {
            if (a._reviewed !== b._reviewed) return a._reviewed ? 1 : -1;
            return new Date(b.submissionDate || '').getTime() - new Date(a.submissionDate || '').getTime();
        });

        return result;
    }, [enrichedSubmissions, gradingFilter, search]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not submitted';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    // ── Open Review Modal ──────────────────────────────────────────────────
    const openReviewModal = (sub: typeof enrichedSubmissions[0]) => {
        setFeedbackModal({ submissionId: sub.id, studentName: sub.name });
        setFeedbackText(sub._feedback); // pre-fill if already reviewed
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoadingAssignment || isLoadingSubmissions) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#21A9FF]/30 border-t-[#21A9FF] rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading submissions...</p>
                </div>
            </div>
        );
    }

    if (submissionsError) {
        const apiError = handleApiError(submissionsError);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 p-12 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load submissions</h3>
                        <p className="text-gray-500">{apiError.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── RENDER ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg animate-in slide-in-from-top-2 ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <p className="text-sm font-bold">{toast.text}</p>
                        <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-black/10 rounded-lg">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 sm:gap-5">
                    <button
                        onClick={() => navigate(assignment?.courseId ? `/instructor/courses/${assignment.courseId}/manage/assignments` : ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">Student Submissions</h1>
                        {assignment && (
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[#21A9FF] text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">{assignment.title}</p>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.total} Total</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                    {[
                        { label: 'Total Submissions', value: stats.total, icon: Users, color: 'blue' },
                        { label: 'Reviewed', value: stats.reviewed, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'orange' },
                    ].map((stat, idx) => (
                        <div key={idx} className={clsx(
                            "bg-white dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500",
                            idx === 2 && "col-span-2 lg:col-span-1"
                        )}>
                            <div className={`absolute left-0 top-0 w-1 sm:w-1.5 h-full opacity-60 ${stat.color === 'blue' ? 'bg-[#21A9FF]' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                            <div className="min-w-0">
                                <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                                <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                                stat.color === 'blue' ? 'bg-[#21A9FF]/10 text-[#21A9FF]' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                            }`}>
                                <stat.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="relative z-30 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-3 sm:p-4 flex flex-col lg:flex-row gap-3 shadow-sm">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search student name..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] outline-none text-sm font-bold transition-all placeholder:text-slate-400 placeholder:font-medium"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Time Status Dropdown */}
                        <div className="relative flex-1 sm:min-w-[180px]">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <div
                                onClick={() => { setIsTimeDropdownOpen(!isTimeDropdownOpen); setIsGradingDropdownOpen(false); }}
                                className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF] transition-all"
                            >
                                <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">
                                    {apiStatus === 'all' ? 'Any Time Status' : apiStatus === 'ontime' ? 'On Time' : 'Late'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isTimeDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsTimeDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        {[
                                            { value: 'all', label: 'Any Time Status' },
                                            { value: 'ontime', label: 'On Time' },
                                            { value: 'late', label: 'Late' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setApiStatus(opt.value); setCurrentPage(1); setIsTimeDropdownOpen(false); }}
                                                className={`w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                                    apiStatus === opt.value
                                                        ? 'bg-[#21A9FF]/5 text-[#21A9FF]'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                                }`}
                                            >
                                                {opt.label}
                                                {apiStatus === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Grading Filter Dropdown */}
                        <div className="relative flex-1 sm:min-w-[180px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <div
                                onClick={() => { setIsGradingDropdownOpen(!isGradingDropdownOpen); setIsTimeDropdownOpen(false); }}
                                className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF] transition-all"
                            >
                                <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">
                                    {gradingFilter === 'all' ? 'All Submissions' : gradingFilter === 'graded' ? 'Reviewed' : 'Pending Review'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isGradingDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isGradingDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsGradingDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        {[
                                            { value: 'all', label: 'All Submissions' },
                                            { value: 'graded', label: 'Reviewed' },
                                            { value: 'ungraded', label: 'Pending Review' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setGradingFilter(opt.value as any); setCurrentPage(1); setIsGradingDropdownOpen(false); }}
                                                className={`w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                                    gradingFilter === opt.value
                                                        ? 'bg-[#21A9FF]/5 text-[#21A9FF]'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                                }`}
                                            >
                                                {opt.label}
                                                {gradingFilter === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submission Cards */}
                <div className="space-y-3">
                    {paginated.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                            <FileText className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No submissions found</h3>
                            <p className="text-gray-500 dark:text-slate-400 mt-2">
                                {submissions.length === 0 ? 'No students have submitted yet.' : 'No submissions match your filters.'}
                            </p>
                        </div>
                    ) : paginated.map((sub) => {
                        const reviewed = sub._reviewed;
                        const feedback = sub._feedback;

                        return (
                            <div
                                key={sub.id}
                                className={`bg-white dark:bg-slate-800/40 backdrop-blur-md border rounded-[2rem] p-4 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-[#21A9FF]/5 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group ${
                                    reviewed
                                        ? 'border-emerald-200/50 dark:border-emerald-500/20'
                                        : 'border-slate-200 dark:border-slate-700/50'
                                }`}
                            >
                                {/* Left: Student Info */}
                                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-500 ${
                                        reviewed
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                                            : 'bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF]'
                                    }`}>
                                        {(sub.name || 'S').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                                            <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate">{sub.name || 'Student'}</h4>
                                            {sub.isLate && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20 uppercase tracking-widest w-fit animate-pulse">
                                                    Late Submission
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-[#21A9FF]" /> {formatDate(sub.submissionDate)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                    reviewed ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                    'bg-orange-50/50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                                }`}>
                                                    {reviewed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {reviewed ? 'Reviewed' : 'Pending Review'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action Buttons */}
                                <div className="flex items-center gap-2 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6 shrink-0 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                        {/* View Files */}
                                        <button
                                            onClick={() => setFilesModal({ submissionId: sub.id, studentName: sub.name })}
                                            className="flex-1 sm:flex-none p-3 bg-white dark:bg-slate-800 text-[#21A9FF] border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-[#21A9FF] hover:text-white transition-all shadow-sm active:scale-95"
                                            title="View Files"
                                        >
                                            <Eye className="w-4 h-4 mx-auto" />
                                        </button>

                                        {/* View Feedback (only when reviewed) */}
                                        {reviewed && (
                                            <button
                                                onClick={() => setViewFeedbackModal({ studentName: sub.name, feedback })}
                                                className="flex-1 sm:flex-none p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                title="View Feedback"
                                            >
                                                <BookOpen className="w-4 h-4 mx-auto" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Review / Edit Feedback */}
                                    <button
                                        onClick={() => openReviewModal(sub)}
                                        disabled={reviewMutation.isPending}
                                        className={`flex-[2] sm:flex-none px-6 py-3.5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/btn disabled:opacity-50 ${
                                            reviewed
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                                : 'bg-[#21A9FF] hover:bg-[#0094F2] text-white shadow-blue-500/20'
                                        }`}
                                    >
                                        <MessageSquare className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        {reviewed ? 'Edit' : 'Review'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                                        currentPage === page
                                            ? 'bg-[#21A9FF] text-white'
                                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Review / Edit Feedback Modal ── */}
                {feedbackModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFeedbackModal(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {feedbackText.trim() ? 'Edit Feedback' : 'Review Submission'}
                                    </h2>
                                    <p className="text-sm font-semibold text-[#21A9FF] mt-0.5">{feedbackModal.studentName}</p>
                                </div>
                                <button onClick={() => setFeedbackModal(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </header>
                            <div className="p-6">
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Instructor Feedback
                                </label>
                                <textarea
                                    rows={6}
                                    placeholder="Write your feedback for this student..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white text-sm font-medium resize-none transition-all"
                                />
                                {feedbackText.trim() === '' && (
                                    <p className="text-xs text-orange-500 mt-1.5 font-semibold">Feedback cannot be empty.</p>
                                )}
                            </div>
                            <footer className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => setFeedbackModal(null)}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (!feedbackText.trim()) {
                                            showToast('error', 'Please enter feedback before submitting.');
                                            return;
                                        }
                                        reviewMutation.mutate({
                                            submissionId: feedbackModal.submissionId,
                                            feedback: feedbackText.trim(),
                                        });
                                    }}
                                    disabled={reviewMutation.isPending || !feedbackText.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {reviewMutation.isPending ? 'Saving...' : 'Save Feedback'}
                                </button>
                            </footer>
                        </div>
                    </div>
                )}

                {/* ── View Feedback Modal ── */}
                {viewFeedbackModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewFeedbackModal(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Feedback</h2>
                                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{viewFeedbackModal.studentName}</p>
                                </div>
                                <button onClick={() => setViewFeedbackModal(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </header>
                            <div className="p-6">
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700/30 rounded-xl p-4">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">{viewFeedbackModal.feedback}</p>
                                </div>
                            </div>
                            <footer className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                                <button
                                    onClick={() => setViewFeedbackModal(null)}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </footer>
                        </div>
                    </div>
                )}

                {/* ── Files Modal ── */}
                {filesModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFilesModal(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Files</h2>
                                    <p className="text-sm font-semibold text-[#21A9FF] mt-0.5">{filesModal.studentName}</p>
                                </div>
                                <button onClick={() => setFilesModal(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </header>
                            <div className="p-6 overflow-y-auto flex-1">
                                {isLoadingFiles ? (
                                    <div className="py-12 flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#21A9FF]" />
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading files...</p>
                                    </div>
                                ) : !submissionFiles || (Array.isArray(submissionFiles) && submissionFiles.length === 0) ? (
                                    <div className="py-12 text-center">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No files attached to this submission.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(Array.isArray(submissionFiles) ? submissionFiles : [submissionFiles]).map((file: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 bg-[#21A9FF]/10 rounded-lg shrink-0">
                                                        <FileText className="w-5 h-5 text-[#21A9FF]" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.fileName || file.name || `File ${idx + 1}`}</p>
                                                        {(file.fileSize || file.size) && (
                                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                                {((file.fileSize || file.size) / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <a
                                                    href={file.fileUrl || file.url || '#'}
                                                    target={file.fileUrl || file.url ? '_blank' : undefined}
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => {
                                                        if (!file.fileUrl && !file.url) {
                                                            e.preventDefault();
                                                            showToast('error', "This file doesn't have a download URL.");
                                                        }
                                                    }}
                                                    className="p-2.5 text-[#21A9FF] hover:bg-[#21A9FF]/10 rounded-lg transition-colors shrink-0"
                                                    title="Download File"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <footer className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                                <button
                                    onClick={() => setFilesModal(null)}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </footer>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
