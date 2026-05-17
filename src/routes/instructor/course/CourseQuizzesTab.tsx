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
    BrainCircuit,
    Settings
} from 'lucide-react';
import { toast } from 'sonner';

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
                <button onClick={() => navigate(`/courses/${courseId}/quiz/create`)} className="flex items-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-[#21A9FF]/25 active:scale-95">
                    <Plus className="w-4 h-4" /> Create Quiz
                </button>
            </div>

            {/* Filters (Symmetric with Assignments) */}
            <div className="relative z-30 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white font-semibold transition-all" />
                </div>

                <div className="relative shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm hover:border-blue-300 dark:hover:border-slate-500 transition-colors min-w-[160px]"
                    >
                        <span className="flex-1 text-gray-800 dark:text-white">
                            {filterStatus === 'all' ? 'All Status' : filterStatus}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStatusDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5">
                                {[
                                    { value: 'all' as const, label: 'All Status' },
                                    { value: 'Draft' as const, label: 'Draft' },
                                    { value: 'Published' as const, label: 'Published' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilterStatus(opt.value); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-between ${
                                            filterStatus === opt.value
                                                ? 'bg-blue-50 dark:bg-[#21A9FF]/10 text-[#21A9FF]'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
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
                                    <div className="space-y-1.5">
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
                                </div>

                                {/* Card footer / Actions */}
                                <div className="border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/40 grid grid-cols-5 divide-x divide-gray-100 dark:divide-slate-700/50 mt-auto">
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_EDIT.replace(':id', quiz.id.toString()))} className="py-2.5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all" title="Edit Quiz">
                                        <Settings className="w-4 h-4" />
                                        <span className="text-[8px] font-black leading-none tracking-tight uppercase">Settings</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', quiz.id.toString()))} className="py-2.5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all" title="Manage Questions">
                                        <ListChecks className="w-4 h-4" />
                                        <span className="text-[8px] font-black leading-none tracking-tight uppercase">Questions</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_AI_GRADER.replace(':quizId', quiz.id.toString()))} className="py-2.5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all" title="AI Grader">
                                        <BrainCircuit className="w-4 h-4" />
                                        <span className="text-[8px] font-black leading-none tracking-tight uppercase">AI Grader</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quiz.id.toString()))} className="py-2.5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all" title="View Submissions">
                                        <Eye className="w-4 h-4" />
                                        <span className="text-[8px] font-black leading-none tracking-tight uppercase">Submissions</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_DASHBOARD.replace(':quizId', quiz.id.toString()))} className="py-2.5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all" title="View Analytics">
                                        <BarChart2 className="w-4 h-4" />
                                        <span className="text-[8px] font-black leading-none tracking-tight uppercase">Analytics</span>
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
