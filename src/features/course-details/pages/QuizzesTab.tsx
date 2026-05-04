import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCourseQuizzes } from '../api';
import { EmptyState } from '../components/EmptyState';
import { TabLoadingState } from '../components/TabLoadingState';
import { QuizCard } from '@/components/QuizCard';
import { HelpCircle, AlertCircle, RefreshCw, Search, Filter, ChevronDown } from 'lucide-react';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

const parseServerDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(normalizedDate);
};

export const QuizzesTab = () => {
    const { courseId, numericCourseId } = useOutletContext<CourseContext>();
    const navigate = useNavigate();

    const { data: quizzes, isLoading, error, refetch } = useCourseQuizzes(numericCourseId ?? 0);
    const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

    // Force a refetch when returning to this tab to ensure fresh attempt statuses
    useEffect(() => {
        const toastType = sessionStorage.getItem('quiz_submit_toast');
        if (toastType) {
            sessionStorage.removeItem('quiz_submit_toast');
            if (toastType === 'auto_submit') {
                import('sonner').then(({ toast }) => toast.info('Time is up. Your attempt was auto-submitted.'));
            } else if (toastType === 'manual_submit') {
                import('sonner').then(({ toast }) => toast.success('Quiz submitted successfully.'));
            } else if (toastType === 'auto_fail') {
                import('sonner').then(({ toast }) => toast.error('Time is up. Attempt closed.'));
            }
        }
        refetch();
    }, [refetch]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'close'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const publishedQuizzes = useMemo(
        () => (quizzes ?? []).filter((q) => q.status === 'Published'),
        [quizzes]
    );

    const getAvailabilityStatus = (quiz: { availableFrom: string; availableUntil: string }): 'open' | 'close' => {
        const now = new Date();
        const from = parseServerDate(quiz.availableFrom);
        const until = parseServerDate(quiz.availableUntil);
        return now >= from && now <= until ? 'open' : 'close';
    };

    const filteredQuizzes = useMemo(
        () =>
            publishedQuizzes.filter((quiz) => {
                if (statusFilter !== 'all' && getAvailabilityStatus(quiz) !== statusFilter) return false;
                if (searchQuery) {
                    const term = searchQuery.toLowerCase();
                    return (quiz.title ?? '').toLowerCase().startsWith(term);
                }
                return true;
            }),
        [publishedQuizzes, statusFilter, searchQuery]
    );

    const handleStartQuiz = (quizId: string, resume = false) => {
        setStartingQuizId(quizId);
        navigate(`/quizzes/${quizId}/attempt`, { state: { resume, courseId } });
        setStartingQuizId(null);
    };

    const handleViewAttempts = (quizId: string) => {
        navigate(`/quizzes/${quizId}/attempts`, { state: { courseId } });
    };

    if (isLoading) return <TabLoadingState />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-500/20 shadow-inner">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    Failed to load quizzes
                </h2>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-8 max-w-sm mx-auto">
                    Could not fetch course quizzes. Please try again.
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-3 px-8 py-3.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    if (publishedQuizzes.length === 0) {
        return (
            <EmptyState
                icon={HelpCircle}
                title="No quizzes yet"
                description="This course doesn't have any published quizzes yet. Check back later."
            />
        );
    }

    const filterLabel = statusFilter === 'all' ? 'All Status' : statusFilter === 'open' ? 'Open' : 'Closed';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                        <HelpCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Quizzes & Assessments
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                {publishedQuizzes.length} {publishedQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} Available
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="relative z-30 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
                {/* Search */}
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a quiz..."
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 text-slate-900 dark:text-white font-semibold transition-all shadow-sm placeholder:text-slate-400"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative shrink-0 w-full sm:w-auto">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-3 shadow-sm hover:border-indigo-300 dark:hover:border-slate-500 transition-all min-w-[160px]"
                    >
                        <span className="flex-1 text-slate-800 dark:text-white">{filterLabel}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                    </div>
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 overflow-hidden backdrop-blur-xl">
                                {[
                                    { value: 'all' as const, label: 'All Status' },
                                    { value: 'open' as const, label: 'Open' },
                                    { value: 'close' as const, label: 'Closed' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setStatusFilter(opt.value); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-all flex items-center justify-between ${statusFilter === opt.value
                                                ? 'bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {opt.label}
                                        {statusFilter === opt.value && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Quiz Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredQuizzes.map((quiz) => (
                    <QuizCard
                        key={quiz.id}
                        quiz={quiz as any}
                        onStartQuiz={handleStartQuiz}
                        onViewAttempts={handleViewAttempts}
                        isLoading={startingQuizId === quiz.id}
                        parseServerDate={parseServerDate}
                    />
                ))}
            </div>

            {filteredQuizzes.length === 0 && (
                <EmptyState
                    icon={HelpCircle}
                    title="No quizzes match this filter"
                    description="Try switching between Open and Closed to view available quizzes."
                />
            )}
        </div>
    );
};
