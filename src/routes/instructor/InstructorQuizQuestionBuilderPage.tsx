import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QUERY_KEYS, ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Loader2, GripVertical, Sparkles, HelpCircle, Settings, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { createQuiz, upsertQuizQuestions } from '@/api/services/quiz.service';
import type { CreateQuizBody } from '@/types/api.types';
import { AIQuestionGeneratorModal } from '@/components/ui/AIQuestionGeneratorModal';
import type { OptionRequest, QuestionUpsertRequest, QuestionType } from '@/types/api.types';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';
import { toast } from 'sonner';

// ─── Local UI types ────────────────────────────────────────────────────────

const questionSchema = yup.object().shape({
    questionText: yup.string()
        .required('Question text is required.')
        .max(2000, 'Question text cannot exceed 2000 characters.'),
    mark: yup.number()
        .typeError('Mark must be a number.')
        .required('Mark is required.')
        .positive('Mark must be greater than 0.')
        .max(100, 'Mark must be less than or equal to 100.'),
    questionType: yup.string().oneOf(['MCQ', 'TrueFalse', 'Written']).required(),
    instructions: yup.string()
        .max(1000, 'Instructions cannot exceed 1000 characters.')
        .optional()
        .default(''),
    explanation: yup.string()
        .max(1000, 'Explanation cannot exceed 1000 characters.')
        .optional()
        .default(''),
    options: yup.array().of(
        yup.object().shape({
            optionText: yup.string()
                .required('Option text is required.')
                .max(300, 'Option text cannot exceed 300 characters.'),
            isCorrect: yup.boolean().required(),
        })
    ).when('questionType', {
        is: (val: string) => val === 'MCQ' || val === 'TrueFalse',
        then: (schema) => schema.required('Options are required for this type of questions.')
            .min(1, 'Options are required.')
            .test('one-correct', 'Exactly one option must be marked as correct.', (options) => {
                if (!options) return true;
                return options.filter(o => o.isCorrect).length === 1;
            }),
        otherwise: (schema) => schema.optional().default([]),
    }).when('questionType', {
        is: 'MCQ',
        then: (schema) => schema.min(3, 'MCQ questions must have between 3 and 5 options.')
            .max(5, 'MCQ questions must have between 3 and 5 options.'),
    }).when('questionType', {
        is: 'TrueFalse',
        then: (schema) => schema.length(2, 'True/False questions must have exactly 2 options.')
            .test('has-true-false', "True/False questions must have options 'True' and 'False'.", (options) => {
                if (!options || options.length !== 2) return true;
                const texts = options.map(o => o.optionText.toLowerCase());
                return texts.includes('true') && texts.includes('false');
            }),
    }),
});

const builderSchema = yup.object().shape({
    questions: yup.array().of(questionSchema).required().min(1, 'At least one question is required.'),
});

type BuilderFormData = yup.InferType<typeof builderSchema>;

interface BuilderDraftData {
    settings: any;
    questions: BuilderFormData['questions'];
    counter: number;
    savedAt: string;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const defaultQuestion = (): any => ({
    questionType: 'MCQ' as QuestionType,
    questionText: '',
    instructions: '',
    mark: 1,
    explanation: '',
    options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
    ],
});

const makeTFOptions = (): any[] => [
    { optionText: 'True', isCorrect: true },
    { optionText: 'False', isCorrect: false },
];

const makeMCQOptions = (): any[] => [
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
];

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls =
    'w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-medium';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const settings = (location.state as any)?.settings;

    const queryClient = useQueryClient();
    const courseKey = String(settings?.courseId ?? '');
    const [hydrated, setHydrated] = useState(false);
    const [apiError, setApiError] = useState<string>('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<BuilderFormData>({
        resolver: yupResolver(builderSchema) as any,
        defaultValues: {
            questions: [],
        }
    });

    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: 'questions',
    });

    // Guard + recovery
    useEffect(() => {
        if (settings) return;
        const persisted = storage.get<BuilderDraftData>(STORAGE_KEYS.QUIZ_BUILDER_DRAFT);
        if (persisted?.settings) {
            navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, { replace: true, state: { settings: persisted.settings } });
            return;
        }
        navigate(ROUTES.INSTRUCTOR_QUIZ_CREATE);
    }, [settings, navigate]);

    // Hydrate question state
    useEffect(() => {
        if (!settings || hydrated) return;
        const persisted = storage.get<BuilderDraftData>(STORAGE_KEYS.QUIZ_BUILDER_DRAFT);
        const sameContext =
            persisted?.settings?.courseId === settings.courseId &&
            persisted?.settings?.title === settings.title &&
            persisted?.settings?.status === settings.status;

        if (sameContext && Array.isArray(persisted?.questions)) {
            reset({ questions: persisted.questions });
        } else {
            reset({ questions: [defaultQuestion()] });
        }
        setHydrated(true);
    }, [settings, hydrated, reset]);

    // Save draft
    useEffect(() => {
        if (!settings || !hydrated) return;
        const subscription = watch((value) => {
            storage.set<BuilderDraftData>(STORAGE_KEYS.QUIZ_BUILDER_DRAFT, {
                settings,
                questions: (value.questions as any[]) || [],
                counter: fields.length,
                savedAt: new Date().toISOString(),
            });
        });
        return () => subscription.unsubscribe();
    }, [settings, hydrated, watch, fields.length]);

    // ── Question helpers ──────────────────────────────────────────────────

    const addQuestion = () => {
        append(defaultQuestion());
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const handleAIGenerate = (generatedQuestions: QuestionUpsertRequest[]) => {
        if (!generatedQuestions.length) {
            setApiError('AI generation returned no questions. Please try again.');
            setShowAIModal(false);
            return;
        }
        const newQuestions = generatedQuestions.map(q => ({
            questionType: q.questionType,
            questionText: q.questionText,
            mark: q.mark ?? 1,
            instructions: q.instructions ?? '',
            explanation: q.explanation ?? '',
            options: q.options?.map(o => ({ optionText: o.optionText, isCorrect: o.isCorrect })) || [],
        }));
        append(newQuestions);
        setApiError('');
        setShowAIModal(false);
    };

    const changeType = (index: number, type: QuestionType) => {
        const options = type === 'MCQ' ? makeMCQOptions() : type === 'TrueFalse' ? makeTFOptions() : [];
        const current = watch(`questions.${index}`);
        update(index, { ...current, questionType: type, options });
    };

    const setCorrect = (qIndex: number, optIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`) || [];
        const updated = currentOptions.map((o, i) => ({ ...o, isCorrect: i === optIndex }));
        setValue(`questions.${qIndex}.options`, updated, { shouldValidate: true });
    };

    const addOption = (qIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`) || [];
        if (currentOptions.length >= 5) return;
        setValue(`questions.${qIndex}.options`, [...currentOptions, { optionText: '', isCorrect: false }], { shouldValidate: true });
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`) || [];
        if (currentOptions.length <= 1) return; // Keep at least one for MCQ/TF logic
        setValue(`questions.${qIndex}.options`, currentOptions.filter((_, i) => i !== optIndex), { shouldValidate: true });
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const onSubmit = async (data: BuilderFormData) => {
        try {
            setApiError('');
            
            const body: CreateQuizBody = {
                title: settings.title,
                description: settings.description?.trim() || settings.title?.trim() || 'Quiz',
                maximumAttempts: settings.maximumAttempts,
                attemptTimeLimit: Number(settings.attemptTimeLimit) || 0,
                availableFrom: new Date(settings.availableFrom).toISOString(),
                availableUntil: new Date(settings.availableUntil).toISOString(),
                showResultOnClose: settings.showResultOnClose ?? false,
                shuffleQuestions: settings.shuffleQuestions ?? false,
                shuffleOptions: settings.shuffleOptions ?? false,
            };

            const quizId = await createQuiz(Number(settings.courseId), body);
            
            // Format for API
            const payloadQuestions: QuestionUpsertRequest[] = data.questions.map(q => ({
                questionType: q.questionType as QuestionType,
                questionText: q.questionText,
                mark: q.mark,
                instructions: q.instructions || undefined,
                explanation: q.explanation || undefined,
                options: q.options?.map(o => ({
                    optionText: o.optionText,
                    isCorrect: Boolean(o.isCorrect)
                })) || [],
            }));

            await upsertQuizQuestions(quizId, payloadQuestions);
            
            if (courseKey) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES(courseKey) });
            }
            
            storage.remove(STORAGE_KEYS.QUIZ_SETTINGS_DRAFT);
            storage.remove(STORAGE_KEYS.QUIZ_BUILDER_DRAFT);
            setSuccess(true);
            toast.success('Quiz created successfully!');
            setTimeout(() => navigate(-2), 1500);
        } catch (e: any) {
            if (e?.response?.data?.errors) {
                mapServerErrors(e.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(errors), 100);
            } else {
                setApiError(e?.response?.data?.message || 'Failed to create quiz. Please try again.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const onInvalid = () => {
        setTimeout(() => scrollToFirstError(errors), 100);
    };

    const isQuestionComplete = (index: number): boolean => {
        // Just a simple visual check for the sidebar
        const q = watch(`questions.${index}`);
        if (!q) return false;
        const hasError = !!errors.questions?.[index];
        return !hasError && !!q.questionText.trim() && q.mark > 0;
    };

    const scrollToQuestion = (index: number) => {
        document.getElementById(`question-card-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const getQuestionName = (index: number): string => {
        const q = watch(`questions.${index}`);
        const raw = q?.questionText?.trim();
        if (!raw) return `Untitled Question ${index + 1}`;
        return raw.length > 35 ? `${raw.slice(0, 35)}...` : raw;
    };

    if (showAIModal) {
        return (
            <AIQuestionGeneratorModal
                isOpen={true}
                quizId={settings?.quizId}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleAIGenerate}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-32">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                                <HelpCircle className="w-8 h-8 text-blue-500" /> Question Builder
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                                Step 2 of 2 — Adding questions for "{settings?.title}"
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-sm font-bold text-purple-700 dark:text-purple-400 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" /> AI Generator
                        </button>
                    </div>
                </div>

                {/* Feedback Banners */}
                {apiError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold shadow-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        {apiError}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        Quiz created successfully! Redirecting...
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-start relative">

                    {/* Left Sidebar: Quiz Map */}
                    <aside className="w-full lg:w-72 lg:sticky lg:top-24 shrink-0 space-y-4">
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 sm:p-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-4 flex items-center justify-between">
                                Quiz Map
                                <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px]">{fields.length} Items</span>
                            </h3>

                            {fields.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">No questions yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                    {fields.map((field, idx) => {
                                        const complete = isQuestionComplete(idx);
                                        const hasError = !!errors.questions?.[idx];
                                        return (
                                            <button
                                                key={field.id}
                                                draggable
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    // Move logic for RHF if needed
                                                }}
                                                onClick={() => scrollToQuestion(idx)}
                                                className={`w-full text-left rounded-xl border p-3 transition-all group flex items-start gap-2 ${complete
                                                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-300'
                                                        : hasError
                                                            ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5 hover:border-red-300'
                                                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm'
                                                    }`}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-0.5">Question {idx + 1}</p>
                                                    <p className={`text-xs font-semibold truncate ${complete ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                                                        {getQuestionName(idx)}
                                                    </p>
                                                </div>
                                                {complete ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                                ) : hasError ? (
                                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                onClick={addQuestion}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-bold text-blue-600 dark:text-blue-400"
                            >
                                <Plus className="w-4 h-4" /> Add Question
                            </button>
                        </div>

                        {/* Submit Box inside Sidebar */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 sm:p-6">
                            <button
                                onClick={handleSubmit(onSubmit, onInvalid)}
                                disabled={isSubmitting || success}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Finish & Create Quiz</>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Right Area: Question List */}
                    <div className="flex-1 space-y-6">
                        {fields.map((field, idx) => {
                            const qType = watch(`questions.${idx}.questionType`);
                            const qText = watch(`questions.${idx}.questionText`) || '';
                            const qOptions = watch(`questions.${idx}.options`) || [];
                            const qError = errors.questions?.[idx];
                            const hasError = !!qError;

                            return (
                                <div
                                    key={field.id}
                                    id={`question-card-${idx}`}
                                    className={`bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border transition-all shadow-sm p-6 sm:p-8 relative overflow-hidden group ${hasError ? 'border-red-500 ring-4 ring-red-500/5' : 'border-gray-200 dark:border-slate-700/50'}`}
                                >
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${hasError ? 'bg-red-500' : qType === 'MCQ' ? 'bg-blue-500' : qType === 'TrueFalse' ? 'bg-orange-500' : 'bg-purple-500'}`}></div>

                                    {/* Q Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">{idx + 1}</span>
                                        </h3>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <select
                                                {...register(`questions.${idx}.questionType`)}
                                                onChange={e => changeType(idx, e.target.value as QuestionType)}
                                                className="flex-1 sm:w-48 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white cursor-pointer"
                                            >
                                                <option value="MCQ">Multiple Choice</option>
                                                <option value="TrueFalse">True / False</option>
                                                <option value="Written">Written Answer</option>
                                            </select>
                                            <button
                                                onClick={() => remove(idx)}
                                                className="p-2.5 text-gray-400 hover:text-red-600 bg-gray-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-700 rounded-xl transition-colors shrink-0 shadow-sm"
                                                title="Delete Question"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Form Grid */}
                                    <div className="grid lg:grid-cols-12 gap-6">
                                        {/* Question Text Area */}
                                        <div className="lg:col-span-8 space-y-5">
                                            <div>
                                                <label className={labelCls}>
                                                    Question Text <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    {...register(`questions.${idx}.questionText`)}
                                                    rows={3}
                                                    placeholder="Type the question here..."
                                                    className={`${inputCls} resize-none text-base ${qError?.questionText ? 'border-red-500 bg-red-50/10' : ''}`}
                                                />
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                    {qError?.questionText && (
                                                        <p className="text-[11px] font-bold text-red-500 uppercase flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> {qError.questionText.message}
                                                        </p>
                                                    )}
                                                    <span className={`text-[10px] font-bold ml-auto ${qText.length > 1900 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
                                                        {qText.length} / 2000
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Dynamic Options based on Type */}
                                            <div className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
                                                {(qType === 'MCQ' || qType === 'TrueFalse') && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex flex-col">
                                                                <label className={`${labelCls} mb-0`}>
                                                                    {qType === 'MCQ' ? 'Answers (Mark the correct one)' : 'Select the correct answer'}
                                                                </label>
                                                                {qError?.options?.message && (
                                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> {qError.options.message}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {qType === 'MCQ' && qOptions.length < 5 && (
                                                                <button onClick={() => addOption(idx)} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                                                                    + Add Option
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className={qType === 'MCQ' ? 'space-y-3' : 'flex gap-4'}>
                                                            {qOptions.map((opt, oi) => {
                                                                const optError = (qError?.options as any)?.[oi];
                                                                if (qType === 'MCQ') {
                                                                    return (
                                                                        <div key={oi} className="flex flex-col gap-1">
                                                                            <div
                                                                                className={`flex items-center gap-3 p-2 pr-3 rounded-xl border-2 transition-colors bg-white dark:bg-slate-900 ${opt.isCorrect ? 'border-emerald-500 shadow-sm' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'} ${optError?.optionText ? 'border-red-500' : ''}`}
                                                                            >
                                                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 cursor-grab ml-1" />
                                                                                <label className="flex items-center justify-center cursor-pointer shrink-0">
                                                                                    <input
                                                                                        type="radio"
                                                                                        checked={opt.isCorrect}
                                                                                        onChange={() => setCorrect(idx, oi)}
                                                                                        className="hidden"
                                                                                    />
                                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-emerald-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                                                        {opt.isCorrect && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                                                                                    </div>
                                                                                </label>
                                                                                <input
                                                                                    {...register(`questions.${idx}.options.${oi}.optionText`)}
                                                                                    type="text"
                                                                                    placeholder={`Option ${oi + 1}`}
                                                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-white px-2"
                                                                                />
                                                                                {qOptions.length > 3 && (
                                                                                    <button onClick={() => removeOption(idx, oi)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                                                        <XCircle className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            {optError?.optionText && (
                                                                                <p className="text-[10px] font-bold text-red-500 uppercase ml-12 mt-1 flex items-center gap-1">
                                                                                    <AlertCircle className="w-3 h-3" /> {optError.optionText.message}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <label
                                                                            key={oi}
                                                                            className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all font-bold ${opt.isCorrect
                                                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                                                                                }`}
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                checked={opt.isCorrect}
                                                                                onChange={() => setCorrect(idx, oi)}
                                                                                className="hidden"
                                                                            />
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-emerald-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                                                {opt.isCorrect && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                                                                            </div>
                                                                            {opt.optionText}
                                                                        </label>
                                                                    );
                                                                }
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {qType === 'Written' && (
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 rounded-xl text-center">
                                                        <HelpCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Manual Grading Required</p>
                                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Students will see a text area to type their long-form answer.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Settings Area (Sidebar inside Card) */}
                                        <div className="lg:col-span-4 space-y-5 lg:border-l border-gray-100 dark:border-slate-700/50 lg:pl-6">
                                            <div>
                                                <label className={labelCls}>Points / Mark</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        {...register(`questions.${idx}.mark`)}
                                                        className={`${inputCls} pl-10 text-lg font-black text-blue-600 dark:text-blue-400 ${qError?.mark ? 'border-red-500 bg-red-50/10' : ''}`}
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">#</span>
                                                </div>
                                                {qError?.mark && (
                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-2 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.mark.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelCls}>Student Instructions (Optional)</label>
                                                <textarea
                                                    {...register(`questions.${idx}.instructions`)}
                                                    rows={2}
                                                    placeholder="E.g. Choose the BEST possible answer."
                                                    className={`${inputCls} resize-none ${qError?.instructions ? 'border-red-500 bg-red-50/10' : ''}`}
                                                />
                                                {qError?.instructions && (
                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.instructions.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelCls}>Answer Explanation (Optional)</label>
                                                <textarea
                                                    {...register(`questions.${idx}.explanation`)}
                                                    rows={2}
                                                    placeholder="Shown to students after the quiz ends."
                                                    className={`${inputCls} resize-none ${qError?.explanation ? 'border-red-500 bg-red-50/10' : ''}`}
                                                />
                                                {qError?.explanation && (
                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.explanation.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};