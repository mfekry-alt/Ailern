import { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCourseQuizzes, useDeleteQuiz } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import { formatIsoDateTimeLocal } from '@/components/QuizForm';
import { DeleteQuizDialog } from '@/components/ui/DeleteQuizDialog';
import { QuizStatusSelect } from '@/components/QuizStatusSelect';
import { 
    Plus, 
    HelpCircle, 
    Edit, 
    Trash2, 
    Filter, 
    Loader2, 
    Clock, 
    Calendar, 
    ListChecks, 
    BarChart2, 
    Search, 
    ChevronDown,
    Eye,
    Brain,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseQuizzesTab = () => {
    const { courseId } = useOutletContext<Ctx>();
    const navigate = useNavigate();
    const { data: courseQuizzes = [], isLoading } = useCourseQuizzes(courseId);
    const deleteQuizMutation = useDeleteQuiz(courseId);

    const [filterStatus, setFilterStatus] = useState<'all' | 'Published' | 'Draft'>('all');
    const [search, setSearch] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<{ id: string; title: string } | null>(null);

    const filteredQuizzes = useMemo(() => {
        const arr = Array.isArray(courseQuizzes) ? courseQuizzes : [];
        const term = search.trim().toLowerCase();
        return arr
            .filter((q) => {
                const s = String((q as any).quizStatus ?? (q as any).status ?? '').toLowerCase();
                const statusOk = filterStatus === 'all' || s === filterStatus.toLowerCase();
                const searchOk = !term || String(q.title ?? '').toLowerCase().startsWith(term);
                return statusOk && searchOk;
            })
            .sort((a, b) => new Date((b as any).createdAt ?? 0).getTime() - new Date((a as any).createdAt ?? 0).getTime());
    }, [courseQuizzes, filterStatus, search]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading quizzes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-[#21A9FF]" /> Quizzes
                </h2>
                <button onClick={() => navigate(`/courses/${courseId}/quiz/create`)} className="flex items-center justify-center gap-2.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-[0.15em] px-8 py-4 rounded-2xl sm:rounded-[2rem] transition-all shadow-xl shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 active:scale-95 w-full sm:w-auto">
                    <Plus className="w-4 h-4" /> Create Quiz
                </button>
            </div>

            {/* Filters (Standardized & Responsive) */}
            <div className="relative z-10 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 sm:p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="Search quizzes by title..." 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 placeholder:font-medium" 
                    />
                </div>

                <div className="relative w-full sm:w-auto shrink-0">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-between shadow-sm hover:border-[#21A9FF] transition-all min-w-full sm:min-w-[180px]"
                    >
                        <span className="text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                            {filterStatus === 'all' ? 'All Status' : filterStatus}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStatusDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-2 w-full sm:w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1">
                                {[
                                    { value: 'all' as const, label: 'All Status' },
                                    { value: 'Draft' as const, label: 'Draft' },
                                    { value: 'Published' as const, label: 'Published' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilterStatus(opt.value); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                            filterStatus === opt.value
                                                ? 'bg-blue-50 dark:bg-[#21A9FF]/10 text-[#21A9FF]'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {opt.label}
                                        {filterStatus === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {filteredQuizzes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No quizzes found</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create a quiz or adjust your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredQuizzes.map((quiz) => {
                        const status = String((quiz as any).quizStatus ?? (quiz as any).status ?? 'Draft');
                        const questionsCount = (quiz as any).questionsCount ?? 0;
                        const submissionsCount = (quiz as any).studentAttemptCount ?? 0;
                        const maxAttempts = quiz.maximumAttempts ?? 1;
                        const isEnded = new Date(quiz.availableUntil) <= new Date();

                        return (
                            <div key={quiz.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl flex flex-col group hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-500 transition-all overflow-hidden">
                                {/* Card header - Styled Action Bar */}
                                <div className="px-4 pt-4 pb-2 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/10 border-b border-gray-100/50 dark:border-slate-700/20">
                                    <QuizStatusSelect quizId={quiz.id} courseId={courseId} status={status} />
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_DASHBOARD.replace(':quizId', quiz.id.toString()))}
                                            className="h-8 px-2.5 flex items-center gap-1.5 text-violet-600 bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-500/20 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group/analytics"
                                            title="View Analytics"
                                        >
                                            <BarChart2 className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Stats</span>
                                        </button>
                                        <button 
                                            onClick={() => setQuizToDelete({ id: quiz.id, title: quiz.title })}
                                            className="h-8 w-8 flex items-center justify-center text-red-500 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-500/20 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                            title="Delete Quiz"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 line-clamp-1 group-hover:text-[#21A9FF] transition-colors">{quiz.title}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mb-3 line-clamp-1">{quiz.description || 'No description'}</p>

                                    {/* Enhanced Metrics Row - Better Visibility */}
                                    <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-700/30 shadow-sm">
                                        <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-slate-700/50 last:border-0">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-tight">Questions</span>
                                            <span className="text-sm font-black text-[#21A9FF]">{questionsCount}</span>
                                        </div>
                                        <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-slate-700/50 last:border-0">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-tight">Submissions</span>
                                            <span className="text-sm font-black text-emerald-500">{submissionsCount}</span>
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-tight">Attempts</span>
                                            <span className="text-sm font-black text-amber-500">{maxAttempts}</span>
                                        </div>
                                    </div>

                                    {/* Enhanced Concise Dates */}
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-2 p-1.5 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div className="min-w-0 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shrink-0">From:</span>
                                                <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate">{formatIsoDateTimeLocal(quiz.availableFrom)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-1.5 bg-rose-50/30 dark:bg-rose-500/5 rounded-xl border border-rose-100/50 dark:border-rose-500/10">
                                            <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                            <div className="min-w-0 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest shrink-0">Until:</span>
                                                <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate">{formatIsoDateTimeLocal(quiz.availableUntil)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Evaluation Spotlight Section */}
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/instructor/courses/${courseId}/manage/quizzes/${quiz.id}/ai-evaluation`);
                                        }}
                                        className="group/ai relative mt-auto pt-4 pb-2"
                                    >
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover/ai:opacity-100 transition duration-500" />
                                        <div className="relative p-4 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-[0_2px_10px_rgba(99,102,241,0.05)] group-hover/ai:border-indigo-300 dark:group-hover/ai:border-indigo-500/50 transition-all cursor-pointer">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover/ai:scale-110 transition-transform duration-500">
                                                        <Sparkles className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em] block leading-none mb-0.5">AI Studio</span>
                                                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Evaluation Center</h5>
                                                    </div>
                                                </div>
                                                
                                                {/* Dynamic AI Badge */}
                                                <div className={clsx(
                                                    "px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                                                    questionsCount > 0 
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                                )}>
                                                    <div className={clsx(
                                                        "w-1 h-1 rounded-full animate-pulse",
                                                        questionsCount > 0 ? "bg-emerald-500" : "bg-indigo-500"
                                                    )} />
                                                    {questionsCount > 0 ? 'AI READY' : 'RECOMMENDED'}
                                                </div>
                                            </div>
                                            
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-4">
                                                Run intelligent AI grading with rubrics, model answers, and automated assessment insights.
                                            </p>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 group-hover/ai:translate-x-1 transition-transform">
                                                    Launch AI Studio <ChevronRight className="w-3.5 h-3.5" />
                                                </span>
                                                <div className="flex -space-x-1.5">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <Brain className="w-2.5 h-2.5 text-indigo-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                 {/* Card footer / Actions (Responsive Grid) */}
                                <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-700/50 mt-auto">
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_EDIT.replace(':id', quiz.id.toString()))} className="py-3 sm:py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] hover:bg-[#21A9FF]/5 transition-all" title="Edit Quiz">
                                        <Edit className="w-4 h-4" />
                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Edit</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', quiz.id.toString()))} className="py-3 sm:py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/5 transition-all" title="Manage Questions">
                                        <ListChecks className="w-4 h-4" />
                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Items</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quiz.id.toString()))} className="py-3 sm:py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/5 transition-all" title="View Submissions">
                                        <Eye className="w-4 h-4" />
                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Result</span>
                                    </button>
                                    <button onClick={() => setQuizToDelete({ id: quiz.id, title: quiz.title })} className="py-3 sm:py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/5 transition-all" title="Delete Quiz">
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Trash</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <DeleteQuizDialog
                open={quizToDelete !== null}
                quizTitle={quizToDelete?.title ?? ''}
                onClose={() => setQuizToDelete(null)}
                onConfirm={() => {
                    if (!quizToDelete) return;
                    deleteQuizMutation.mutate(quizToDelete.id, {
                        onSuccess: () => {
                            toast.success(`"${quizToDelete.title}" deleted.`);
                            setQuizToDelete(null);
                        },
                        onError: () => toast.error('Failed to delete quiz.')
                    });
                }}
                isPending={deleteQuizMutation.isPending}
            />
        </div>
    );
};
