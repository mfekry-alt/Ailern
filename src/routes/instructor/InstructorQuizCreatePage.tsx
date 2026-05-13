import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, HelpCircle, CheckCircle2, ListChecks } from 'lucide-react';
import { QuizForm, toISOFromLocal } from '@/components/QuizForm';
import type { QuizFormData } from '@/components/QuizForm';
import type { CreateQuizBody } from '@/types/api.types';
import { useCreateQuiz } from '@/features/quizzes/api';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

const buildCreateBody = (data: QuizFormData): CreateQuizBody => ({
    title: data.title.trim(),
    description: data.description?.trim() || data.title.trim() || 'Quiz',
    maximumAttempts: data.maximumAttempts,
    attemptTimeLimit: Number(data.attemptTimeLimit) || 0,
    availableFrom: toISOFromLocal(data.availableFrom),
    availableUntil: toISOFromLocal(data.availableUntil),
    showResultOnClose: data.showResultOnClose,
    shuffleQuestions: data.shuffleQuestions,
    shuffleOptions: data.shuffleOptions,
    enableAIGrading: data.enableAIGrading,
    globalAIInstructions: data.globalAIInstructions,
});

export const InstructorQuizCreatePage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const createQuizMutation = useCreateQuiz(courseId || '');
    const [apiError, setApiError] = useState<string>('');
    const [createdQuiz, setCreatedQuiz] = useState<{ id: string; title: string } | null>(null);

    if (!courseId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-2xl text-center shadow-xl border border-gray-200 dark:border-slate-700">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid request</h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">Course ID is missing from the URL.</p>
                    <button type="button" onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md">
                        Back to My Courses
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (data: QuizFormData) => {
        try {
            setApiError('');
            const body = buildCreateBody(data);
            const quizId = await createQuizMutation.mutateAsync(body);
            setCreatedQuiz({ id: quizId, title: data.title.trim() });
            toast.success('Quiz created successfully!');
        } catch (err: any) {
            const d = err?.response?.data;
            const fieldErrors = d?.errors
                ? Object.entries(d.errors as Record<string, string[]>)
                      .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                      .join(' | ')
                : null;
            const title = d?.message || d?.title;
            setApiError(
                fieldErrors
                    ? title ? `${title} — ${fieldErrors}` : fieldErrors
                    : title || err?.message || 'Failed to create quiz. Please try again.'
            );
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (createdQuiz) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-lg w-full rounded-[2rem] text-center shadow-xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 space-y-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Created!</h1>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">
                            <span className="font-bold text-gray-700 dark:text-slate-200">&quot;{createdQuiz.title}&quot;</span> has been created successfully.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', createdQuiz.id))}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95"
                        >
                            <ListChecks className="w-5 h-5" /> Add Questions
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes`)}
                            className="w-full px-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-colors hover:bg-gray-200 dark:hover:bg-slate-600"
                        >
                            Back to Course Quizzes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-blue-500" /> Create New Quiz
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                            Set up timing, attempts, and behavior for your quiz.
                        </p>
                    </div>
                </div>

                {apiError && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 animate-in fade-in">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{apiError}</p>
                        </div>
                    </div>
                )}

                <QuizForm
                    validationMode="create"
                    showVisibilitySection={false}
                    onSubmit={handleSubmit}
                    isPending={createQuizMutation.isPending}
                    submitLabel="Create Quiz"
                    onCancel={() => navigate(-1)}
                />
            </div>
        </div>
    );
};
