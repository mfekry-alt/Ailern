import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUpdateQuiz, useQuiz } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, AlertTriangle, FileArchive, ListChecks } from 'lucide-react';
import { QuizForm, toDatetimeLocal, toISOFromLocal } from '@/components/QuizForm';
import type { QuizFormData } from '@/components/QuizForm';
import type { GetQuizDto, QuizFormStatus, UpdateQuizBody } from '@/types/api.types';
import { toast } from 'sonner';

function quizToFormData(quiz: GetQuizDto): QuizFormData {
    return {
        title: quiz.title,
        description: quiz.description || '',
        availableFrom: toDatetimeLocal(quiz.availableFrom),
        availableUntil: toDatetimeLocal(quiz.availableUntil),
        maximumAttempts: quiz.maximumAttempts,
        attemptTimeLimit: quiz.attemptTimeLimit || 5,
        status: (quiz.status ?? 'Draft') as QuizFormStatus,
        publishedDate: (quiz.publishedAt || quiz.publishedDate)
            ? toDatetimeLocal(String(quiz.publishedAt || quiz.publishedDate))
            : '',
        showResultOnClose: quiz.showResultOnClose ?? true,
        shuffleQuestions: quiz.shuffleQuestions ?? true,
        shuffleOptions: quiz.shuffleOptions ?? true,
    };
}

function formDataToUpdateBody(data: QuizFormData): UpdateQuizBody {
    return {
        title: data.title.trim(),
        description: data.description?.trim() || data.title.trim() || 'Quiz',
        maximumAttempts: data.maximumAttempts,
        attemptTimeLimit: Number(data.attemptTimeLimit) || 0,
        availableFrom: toISOFromLocal(data.availableFrom),
        availableUntil: toISOFromLocal(data.availableUntil),
        showResultOnClose: data.showResultOnClose,
        shuffleQuestions: data.shuffleQuestions,
        shuffleOptions: data.shuffleOptions,
    };
}

export const InstructorQuizEditPage = () => {
    const { courseId, id } = useParams<{ courseId?: string; id: string }>();
    const quizId = id;
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<{ message: string; errors?: Record<string, string[]> } | null>(null);
    const [restoredFromDraft, setRestoredFromDraft] = useState(false);
    const [initialFormData, setInitialFormData] = useState<QuizFormData | null>(null);

    const { data: quizData, isLoading: isFetchingQuiz, error: fetchError } = useQuiz(quizId || '');
    const actualCourseId = courseId || quizData?.courseId?.toString() || '';
    const updateQuizMutation = useUpdateQuiz(actualCourseId);

    const DRAFT_KEY = `quiz_draft_${quizId}`;

    useEffect(() => {
        if (!quizData) return;

        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft) as QuizFormData;
                setInitialFormData(parsed);
                setRestoredFromDraft(true);
                return;
            } catch { /* ignore corrupt draft */ }
        }

        setInitialFormData(quizToFormData(quizData));
    }, [quizData, DRAFT_KEY]);

    useEffect(() => {
        if (fetchError) setApiError({ message: 'Failed to load quiz details.' });
    }, [fetchError]);

    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setRestoredFromDraft(false);
        if (quizData) setInitialFormData(quizToFormData(quizData));
    };

    const handleSave = async (data: QuizFormData) => {
        try {
            setApiError(null);
            const payload = formDataToUpdateBody(data);
            await updateQuizMutation.mutateAsync({ id: quizId!, cmd: payload });
            localStorage.removeItem(DRAFT_KEY);
            toast.success('Quiz updated successfully!');
            navigate(`/instructor/courses/${actualCourseId}/manage/quizzes`);
        } catch (err: any) {
            const apiErrors = err.response?.data?.errors;
            setApiError({
                message: err.response?.data?.message || 'Failed to update quiz. Please try again.',
                errors: apiErrors,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isFetchingQuiz) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase">Loading Quiz...</p>
                </div>
            </div>
        );
    }

    if (!quizId || (!quizData && !isFetchingQuiz)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-[2rem] text-center shadow-xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Not Found</h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">The quiz you are trying to update is missing or doesn't exist.</p>
                    <button onClick={() => navigate(actualCourseId ? `/instructor/courses/${actualCourseId}/manage/quizzes` : '/instructor/courses')} className="w-full px-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-colors hover:bg-gray-200 dark:hover:bg-slate-600">
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    if (!initialFormData) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-24">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Update Quiz Details</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                                Modify settings, fix timings, and adjust behavior rules.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', quizId!))}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:-translate-y-0.5 active:scale-95"
                    >
                        <ListChecks className="w-4 h-4" /> Manage Questions
                    </button>
                </div>

                {/* Draft Restored Banner */}
                {restoredFromDraft && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                Unsaved changes were restored from your last session.
                            </p>
                        </div>
                        <button type="button" onClick={handleDiscardDraft} className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 hover:underline">
                            Discard Draft
                        </button>
                    </div>
                )}

                {/* API Error Banner */}
                {apiError && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 animate-in fade-in">
                        <div className="flex items-start gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{apiError.message}</p>
                        </div>
                        {apiError.errors && Object.keys(apiError.errors).length > 0 && (
                            <div className="ml-8 space-y-2 border-t border-red-200 dark:border-red-500/20 pt-3 mt-3">
                                {Object.entries(apiError.errors).map(([field, messages]) => {
                                    const formatted = field.replace(/Questions\[(\d+)\]/g, (_m, p1) => `Question ${parseInt(p1) + 1} `).replace(/\./g, ' ');
                                    return (
                                        <div key={field} className="space-y-1">
                                            <p className="text-xs font-semibold text-red-600 dark:text-red-300 uppercase tracking-wide">{formatted}</p>
                                            {Array.isArray(messages) && messages.map((msg, i) => (
                                                <p key={i} className="text-xs text-red-600 dark:text-red-300 leading-relaxed">• {msg}</p>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <QuizForm
                    key={restoredFromDraft ? 'draft' : 'server'}
                    initialData={initialFormData}
                    onSubmit={handleSave}
                    isPending={updateQuizMutation.isPending}
                    submitLabel="Save Changes"
                    showVisibilitySection={false}
                    onCancel={() => {
                        localStorage.removeItem(DRAFT_KEY);
                        navigate(-1);
                    }}
                />
            </div>
        </div>
    );
};

export default InstructorQuizEditPage;
