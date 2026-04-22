import { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCourseQuizzes, useDeleteQuiz } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import { formatIsoDateTimeLocal } from '@/components/QuizForm';
import { DeleteQuizDialog } from '@/components/ui/DeleteQuizDialog';
import { QuizStatusSelect } from '@/components/QuizStatusSelect';
import { Plus, HelpCircle, Edit, Trash2, Filter, Loader2, Clock, Calendar, Repeat, ListChecks, BarChart2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseQuizzesTab = () => {
    const { courseId } = useOutletContext<Ctx>();
    const navigate = useNavigate();
    const { data: courseQuizzes = [], isLoading } = useCourseQuizzes(courseId);
    const deleteQuizMutation = useDeleteQuiz(courseId);

    const [filterStatus, setFilterStatus] = useState<'all' | 'Published' | 'Draft'>('all');
    const [search, setSearch] = useState('');
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
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading quizzes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-purple-500" /> Quizzes
                </h2>
                <button onClick={() => navigate(`/courses/${courseId}/quiz/create`)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-purple-500/25 active:scale-95">
                    <Plus className="w-4 h-4" /> Create Quiz
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none">
                        <option value="all">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
                <div className="flex-[2]">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white" />
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
                        return (
                            <div key={quiz.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl flex flex-col group hover:shadow-lg hover:border-purple-300 dark:hover:border-slate-500 transition-all overflow-hidden">
                                {/* Card header */}
                                <div className="p-5 pb-0 flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <QuizStatusSelect quizId={quiz.id} courseId={courseId} status={status} />
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                        {/* Analytics Dashboard icon — subtle, top-right */}
                                        <button
                                            onClick={() => navigate(`/quiz-dashboard/${quiz.id}`)}
                                            className="p-1.5 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                                            title="View Analytics"
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS.replace(':quizId', quiz.id.toString()))}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                                            title="View Submissions"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_EDIT.replace(':id', quiz.id.toString()))} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit Quiz">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', quiz.id.toString()))} className="p-1.5 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors" title="Manage Questions">
                                            <ListChecks className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuizToDelete({ id: quiz.id, title: quiz.title })}
                                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                            title="Delete Quiz"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2">{quiz.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-4 line-clamp-2">{quiz.description || 'No description'}</p>

                                    {/* Meta info */}
                                    <div className="mt-auto space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            <span className="font-semibold">From:</span>
                                            <span className="truncate">{formatIsoDateTimeLocal(quiz.availableFrom)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                            <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                            <span className="font-semibold">Until:</span>
                                            <span className="truncate">{formatIsoDateTimeLocal(quiz.availableUntil)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card footer */}
                                <div className="border-t border-gray-100 dark:border-slate-700/50 px-5 py-3 bg-gray-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-slate-400">
                                        <Repeat className="w-3.5 h-3.5 text-purple-500" />
                                        {quiz.maximumAttempts} attempt{quiz.maximumAttempts !== 1 ? 's' : ''}
                                    </div>
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
                    const deletingQuiz = quizToDelete;
                    setQuizToDelete(null);
                    deleteQuizMutation.mutate(deletingQuiz.id, {
                        onSuccess: () => {
                            toast.success(`"${deletingQuiz.title || 'Quiz'}" deleted successfully.`);
                        },
                        onError: () => {
                            toast.error(`Could not delete "${deletingQuiz.title || 'quiz'}". Please try again.`);
                        },
                    });
                }}
                isPending={deleteQuizMutation.isPending}
            />
        </div>
    );
};
