import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import {
    ArrowLeft, Plus, Trash2, CheckCircle2, Loader2,
    GripVertical, Sparkles, ListChecks, HelpCircle, AlertTriangle, Save,
    ChevronDown, ChevronUp, Check, Filter, FileText, LayoutGrid
} from 'lucide-react';
import { useQuiz, useUpsertQuizQuestions } from '@/features/quizzes/api';
import { AIQuestionGeneratorModal } from '@/components/ui/AIQuestionGeneratorModal';
import { toast } from 'sonner';
import type { OptionRequest, QuestionUpsertRequest, QuestionType, QuestionDto, OptionDto } from '@/types/api.types';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQueryClient } from '@tanstack/react-query';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';
import { AlertCircle } from 'lucide-react';

// ─── Validation Schema ──────────────────────────────────────────────────────

const questionSchema = yup.object().shape({
    id: yup.string().nullable().optional(),
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
            optionId: yup.string().nullable().optional(),
            optionText: yup.string()
                .required('Option text is required.')
                .max(300, 'Option text cannot exceed 300 characters.'),
            isCorrect: yup.boolean().required(),
        })
    ).when('questionType', {
        is: (val: string) => val === 'MCQ' || val === 'TrueFalse',
        then: (schema) => schema.required('Options are required.')
            .min(1, 'Options are required.')
            .test('one-correct', 'Exactly one option must be marked as correct.', (options) => {
                if (!options) return true;
                return options.filter(o => o.isCorrect).length === 1;
            }),
        otherwise: (schema) => schema.optional().nullable()
    })
});

const builderSchema = yup.object().shape({
    questions: yup.array().of(questionSchema).required().min(1, 'At least one question is required.'),
});

type BuilderFormData = yup.InferType<typeof builderSchema>;

// ─── Defaults ──────────────────────────────────────────────────────────────

const makeMCQOptions = () => [
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
];

const makeTFOptions = () => [
    { optionText: 'True', isCorrect: true },
    { optionText: 'False', isCorrect: false },
];

const defaultQuestion = (type: QuestionType = 'MCQ') => ({
    questionType: type,
    questionText: '',
    mark: 5,
    instructions: '',
    explanation: '',
    options: type === 'MCQ' ? makeMCQOptions() : type === 'TrueFalse' ? makeTFOptions() : [],
});

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm text-gray-900 dark:text-white transition-all outline-none';
const labelCls = 'block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1';

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionsEditPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: quizId } = useParams<{ id: string }>();
    const settings = (location.state as any)?.settings;
    const queryClient = useQueryClient();

    const { data: quiz, isLoading: quizLoading } = useQuiz(quizId ?? '');
    const upsertQuestionsMutation = useUpsertQuizQuestions(quizId ?? '');
    const isDraftQuiz = settings?.status === 'Draft' || quiz?.status === 'Draft';

    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [loaded, setLoaded] = useState(false);
    
    // Drag & Drop States
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
    const [draggedOptionInfo, setDraggedOptionInfo] = useState<{ qIndex: number; optIndex: number } | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        setError,
        getValues,
        formState: { errors, isSubmitting }
    } = useForm<BuilderFormData>({
        resolver: yupResolver(builderSchema) as any,
        defaultValues: {
            questions: []
        }
    });

    const { fields, append, remove, update, move } = useFieldArray({
        control,
        name: 'questions'
    });

    // Load existing quiz questions on mount
    useEffect(() => {
        if (!quiz || loaded) return;

        if (quiz.questions && quiz.questions.length > 0) {
            const initialQuestions = quiz.questions.map(q => ({
                id: q.id ?? null,
                questionType: q.questionType,
                questionText: q.questionText,
                mark: q.mark,
                instructions: q.instructions || '',
                explanation: q.explanation || '',
                options: (q.options || []).map(o => ({
                    optionId: o.id ?? null,
                    optionText: o.optionText,
                    isCorrect: o.isCorrect
                }))
            }));
            setValue('questions', initialQuestions);
        } else if (!isDraftQuiz) {
            append(defaultQuestion('MCQ'));
        }

        setLoaded(true);
    }, [quiz, loaded, isDraftQuiz, setValue, append]);

    const addQuestion = () => append(defaultQuestion('MCQ'));

    const handleAIGenerate = (generatedQuestions: QuestionUpsertRequest[]) => {
        const newQs = generatedQuestions.map(q => ({
            id: null,
            questionType: q.questionType,
            questionText: q.questionText,
            mark: q.mark,
            instructions: q.instructions || '',
            explanation: q.explanation || '',
            options: (q.options || []).map(o => ({
                optionId: null,
                optionText: o.optionText,
                isCorrect: o.isCorrect
            }))
        }));
        append(newQs);
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
        if (currentOptions.length <= 1) return;
        setValue(`questions.${qIndex}.options`, currentOptions.filter((_, i) => i !== optIndex), { shouldValidate: true });
    };

    // Auto-save logic for reordering
    const handleAutoSave = () => {
        // Run on next tick to ensure react-hook-form's getValues() has the updated array order
        setTimeout(async () => {
            const data = getValues();
            setIsAutoSaving(true);
            const toastId = toast.loading('Saving order...');
            
            try {
                const payloadQuestions: QuestionUpsertRequest[] = data.questions.map(q => ({
                    id: q.id ?? null,
                    questionType: q.questionType as QuestionType,
                    questionText: q.questionText,
                    mark: q.mark,
                    instructions: q.instructions || undefined,
                    explanation: q.explanation || undefined,
                    options: q.options?.map(o => ({
                        optionId: o.optionId ?? null,
                        optionText: o.optionText,
                        isCorrect: Boolean(o.isCorrect)
                    })) || [],
                }));

                await upsertQuestionsMutation.mutateAsync(payloadQuestions);
                toast.success('Reordered successfully', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            } catch (e: any) {
                console.error('[AutoSave] error:', e);
                toast.error('Failed to reorder. Ensure all fields are valid.', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            } finally {
                setIsAutoSaving(false);
            }
        }, 0);
    };

    const onSubmit = async (data: BuilderFormData) => {
        try {
            setApiError('');
            setSuccess(false);

            const payloadQuestions: QuestionUpsertRequest[] = data.questions.map(q => ({
                id: q.id ?? null,
                questionType: q.questionType as QuestionType,
                questionText: q.questionText,
                mark: q.mark,
                instructions: q.instructions || undefined,
                explanation: q.explanation || undefined,
                options: q.options?.map(o => ({
                    optionId: o.optionId ?? null,
                    optionText: o.optionText,
                    isCorrect: Boolean(o.isCorrect)
                })) || [],
            }));

            await upsertQuestionsMutation.mutateAsync(payloadQuestions);
            setSuccess(true);
            toast.success('Questions saved successfully.');
            setTimeout(() => navigate(-1), 1500);
        } catch (e: any) {
            console.error('[UpsertQuestions] error:', e);
            if (e?.response?.data?.errors) {
                mapServerErrors(e.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(errors), 100);
            } else {
                setApiError(e?.response?.data?.message || 'Failed to save questions. Please try again.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const onInvalid = () => {
        setTimeout(() => scrollToFirstError(errors), 100);
    };

    if (quizLoading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase">Loading Editor...</p>
        </div>
    );

    if (!quiz) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-[2rem] text-center shadow-xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Not Found</h1>
                <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">The quiz you are trying to edit doesn't exist.</p>
                <button onClick={() => navigate(-1)} className="w-full px-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-colors hover:bg-gray-200 dark:hover:bg-slate-600">
                    Go Back
                </button>
            </div>
        </div>
    );

    const isLoading = upsertQuestionsMutation.isPending;
    const currentStatus = settings?.status || quiz?.status;
    const statusBadgeClass =
        currentStatus === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
            currentStatus === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' :
                'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border-gray-200 dark:border-slate-700';

    const isQuestionComplete = (index: number): boolean => {
        const q = watch(`questions.${index}`);
        if (!q || !q.questionText.trim() || q.mark <= 0) return false;
        if (q.questionType === 'MCQ' || q.questionType === 'TrueFalse') {
            if (!q.options || q.options.length === 0) return false;
            if (q.questionType === 'MCQ' && (q.options.length < 3 || q.options.length > 5)) return false;
            if (q.options.some(o => !o.optionText.trim())) return false;
            return q.options.filter(o => o.isCorrect).length === 1;
        }
        return true;
    };

    const scrollToQuestion = (idx: number) => {
        const el = document.getElementById(`question-card-${idx}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getQuestionName = (idx: number): string => {
        const qText = watch(`questions.${idx}.questionText`) || '';
        const raw = qText.trim();
        if (!raw) return `New Question ${idx + 1}`;
        return raw.length > 35 ? `${raw.slice(0, 35)}...` : raw;
    };

    return (
        <>
            {showAIModal && (
                <AIQuestionGeneratorModal
                    isOpen={true}
                    quizId={quizId ?? undefined}
                    onClose={() => setShowAIModal(false)}
                    onGenerate={handleAIGenerate}
                />
            )}

            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans pb-32">

                {/* --- Sticky Header --- */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 py-4 px-4 sm:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-5">
                            <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 transition-all shrink-0 shadow-sm active:scale-90">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-[#21A9FF]">
                                        <ListChecks className="w-5 h-5" />
                                    </div>
                                    Edit Questions
                                </h1>
                                <div className="flex items-center gap-3 mt-1.5 ml-0.5">
                                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-[200px] sm:max-w-md truncate">
                                        {settings?.title || quiz.title}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border shadow-sm ${statusBadgeClass}`}>
                                        {currentStatus}
                                    </span>
                                    {isAutoSaving && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                            <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                            <button onClick={() => setShowAIModal(true)} className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-8 py-4 bg-[#A855F7] text-white font-black rounded-[1.25rem] transition-all duration-300 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 active:scale-95 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-100"></div>
                                <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                                <span className="relative z-10 text-sm">AI Generator</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-4 sm:p-8">

                    {/* Feedback Banners */}
                    {apiError && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold shadow-sm">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {apiError}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            Questions saved successfully! Redirecting...
                        </div>
                    )}
                    <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">

                        {/* --- Sidebar: Quiz Map --- */}
                        <aside className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm xl:sticky xl:top-28 hidden md:block">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-slate-700/50">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-[#21A9FF]" /> Map
                                </h3>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {fields.length} Q
                                </span>
                            </div>

                            {fields.length === 0 ? (
                                <div className="text-center py-12 text-[10px] font-black uppercase tracking-widest text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                    Empty
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                                    {fields.map((field, idx) => {
                                        const complete = isQuestionComplete(idx);
                                        const hasError = !!errors.questions?.[idx];
                                        const isDragged = draggedQuestionIndex === idx;
                                        
                                        return (
                                            <button
                                                key={field.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    setDraggedQuestionIndex(idx);
                                                    e.dataTransfer.effectAllowed = "move";
                                                }}
                                                onDragOver={e => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = "move";
                                                }}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    if (draggedQuestionIndex !== null && draggedQuestionIndex !== idx) {
                                                        move(draggedQuestionIndex, idx);
                                                        handleAutoSave();
                                                    }
                                                    setDraggedQuestionIndex(null);
                                                }}
                                                onDragEnd={() => setDraggedQuestionIndex(null)}
                                                onClick={() => scrollToQuestion(idx)}
                                                className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 flex items-start gap-3 group relative overflow-hidden ${isDragged ? 'opacity-50 scale-95 shadow-inner' : ''} ${hasError
                                                    ? 'border-red-500 bg-red-50/10'
                                                    : complete
                                                        ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10'
                                                        : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {/* Left Accent */}
                                                <div className={`absolute left-0 top-0 w-1 h-full opacity-50 ${hasError ? 'bg-red-500' : complete ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                
                                                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 cursor-grab group-hover:text-[#21A9FF] transition-colors" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Question {idx + 1}</span>
                                                        {hasError ? <AlertCircle className="w-3 h-3 text-red-500" /> : complete && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                    </div>
                                                    <p className={`text-xs font-bold truncate tracking-tight transition-colors ${hasError ? 'text-red-700' : complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {getQuestionName(idx)}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <button onClick={addQuestion} className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 group">
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Blank
                            </button>
                        </aside>

                        <div className="space-y-6">
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
                                        className={`bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border transition-all shadow-sm overflow-hidden relative group/qcard hover:shadow-xl hover:shadow-[#21A9FF]/5 duration-500 ${hasError ? 'border-red-500 ring-4 ring-red-500/5' : 'border-gray-200 dark:border-slate-700/50'}`}
                                    >
                                        <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${hasError ? 'bg-red-500' : isQuestionComplete(idx) ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                                        <div className="p-6 sm:p-10 space-y-8 ml-2">

                                            {/* Question Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-50 dark:border-slate-800 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                                                        Question {idx + 1}
                                                    </div>
                                                    {isQuestionComplete(idx) ? (
                                                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                                                            <AlertTriangle className="w-3.5 h-3.5" /> Incomplete
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={() => remove(idx)} className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all active:scale-90 border border-rose-100 dark:border-rose-500/20" title="Delete Question">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelCls}>Question Type</label>
                                                <div className="relative">
                                                    <select
                                                        {...register(`questions.${idx}.questionType`)}
                                                        onChange={(e) => changeType(idx, e.target.value as QuestionType)}
                                                        className={`${inputCls} appearance-none cursor-pointer`}
                                                    >
                                                        <option value="MCQ">Multiple Choice (MCQ)</option>
                                                        <option value="TrueFalse">True / False</option>
                                                        <option value="Written">Written Answer (Essay)</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Points / Marks <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                                    <input
                                                        type="number"
                                                        {...register(`questions.${idx}.mark`)}
                                                        className={`${inputCls} pl-11 ${qError?.mark ? 'border-red-500 bg-red-50/10' : ''}`}
                                                    />
                                                </div>
                                                {qError?.mark && (
                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.mark.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Question Text <span className="text-red-500">*</span></span>
                                                <span className={`text-[10px] font-bold ${qText.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}>{qText.length} / 2000</span>
                                            </label>
                                            <textarea
                                                {...register(`questions.${idx}.questionText`)}
                                                rows={3}
                                                placeholder="Type your question here..."
                                                className={`${inputCls} resize-none ${qError?.questionText ? 'border-red-500 bg-red-50/10' : ''}`}
                                            />
                                            {qError?.questionText && (
                                                <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {qError.questionText.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Options Area */}
                                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">

                                            {qType === 'MCQ' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex flex-col">
                                                            <label className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                                Answer Options <span className="text-red-500">*</span>
                                                            </label>
                                                            {qError?.options?.message && (
                                                                <p className="text-[11px] font-bold text-red-500 uppercase mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> {qError.options.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {qOptions.length < 5 && (
                                                            <button type="button" onClick={() => addOption(idx)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3.5 h-3.5" /> Add Option
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {qOptions.map((opt, i) => {
                                                            const optError = (qError?.options as any)?.[i];
                                                            const isDraggedOpt = draggedOptionInfo?.qIndex === idx && draggedOptionInfo?.optIndex === i;
                                                            return (
                                                                <div 
                                                                    key={i} 
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        e.stopPropagation();
                                                                        setDraggedOptionInfo({ qIndex: idx, optIndex: i });
                                                                        e.dataTransfer.effectAllowed = "move";
                                                                    }}
                                                                    onDragOver={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        e.dataTransfer.dropEffect = "move";
                                                                    }}
                                                                    onDrop={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (draggedOptionInfo && draggedOptionInfo.qIndex === idx && draggedOptionInfo.optIndex !== i) {
                                                                            const currentOptions = getValues(`questions.${idx}.options`) || [];
                                                                            const newOptions = [...currentOptions];
                                                                            const [movedOption] = newOptions.splice(draggedOptionInfo.optIndex, 1);
                                                                            newOptions.splice(i, 0, movedOption);
                                                                            setValue(`questions.${idx}.options`, newOptions, { shouldValidate: true });
                                                                            handleAutoSave();
                                                                        }
                                                                        setDraggedOptionInfo(null);
                                                                    }}
                                                                    onDragEnd={() => setDraggedOptionInfo(null)}
                                                                    className={`flex flex-col gap-1 transition-all ${isDraggedOpt ? 'opacity-40 scale-[0.98]' : ''}`}
                                                                >
                                                                    <div className={`flex items-center gap-3 p-2 pr-4 rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'} ${optError?.optionText ? 'border-red-500' : ''}`}>
                                                                        <div className="cursor-grab p-2 text-gray-400 active:cursor-grabbing hover:text-[#21A9FF]">
                                                                            <GripVertical className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="text-sm font-black text-gray-400 w-6">{String.fromCharCode(65 + i)}.</span>
                                                                        <input
                                                                            {...register(`questions.${idx}.options.${i}.optionText`)}
                                                                            type="text"
                                                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                                            className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-900 dark:text-white py-2 placeholder-gray-400"
                                                                        />
                                                                        <label className="flex items-center gap-2 cursor-pointer pl-3 border-l border-gray-200 dark:border-slate-700">
                                                                            <input
                                                                                type="radio"
                                                                                checked={opt.isCorrect}
                                                                                onChange={() => setCorrect(idx, i)}
                                                                                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                                                                            />
                                                                            <span className={`text-xs font-bold uppercase tracking-wider ${opt.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>Correct</span>
                                                                        </label>
                                                                        {qOptions.length > 3 && (
                                                                            <button type="button" onClick={() => removeOption(idx, i)} className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                                                <Trash2 className="w-4 h-4" />
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
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {qType === 'TrueFalse' && (
                                                <div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-4 block">
                                                            Select Correct Answer <span className="text-red-500">*</span>
                                                        </label>
                                                        {qError?.options?.message && (
                                                            <p className="text-[11px] font-bold text-red-500 uppercase mt-1 mb-4 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" /> {qError.options.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        {qOptions.map((opt, i) => (
                                                            <label key={i} className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${opt.isCorrect ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                                                <input
                                                                    type="radio"
                                                                    checked={opt.isCorrect}
                                                                    onChange={() => setCorrect(idx, i)}
                                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className={`font-bold text-lg ${opt.isCorrect ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300'}`}>{opt.optionText}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {qType === 'Written' && (
                                                <div className="text-center p-6 text-sm font-bold text-gray-500 dark:text-slate-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                                    Students will be provided with a text area to write their answer. No options needed.
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                                            <div>
                                                <label className={labelCls}>Instructions <span className="normal-case font-medium text-gray-400">(Optional)</span></label>
                                                <textarea
                                                    {...register(`questions.${idx}.instructions`)}
                                                    rows={2}
                                                    placeholder="E.g., Select all that apply..."
                                                    className={`${inputCls} resize-none ${qError?.instructions ? 'border-red-500 bg-red-50/10' : ''}`}
                                                />
                                                {qError?.instructions && (
                                                    <p className="text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.instructions.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelCls}>Explanation <span className="normal-case font-medium text-gray-400">(Optional)</span></label>
                                                <textarea
                                                    {...register(`questions.${idx}.explanation`)}
                                                    rows={2}
                                                    placeholder="Shown to student after completion..."
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

                            {/* Add Large Button at Bottom */}
                            <button onClick={addQuestion} className="w-full py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] text-slate-400 dark:text-slate-500 hover:border-[#21A9FF] hover:text-[#21A9FF] hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-500 flex flex-col items-center justify-center gap-4 font-black group shadow-sm hover:shadow-xl hover:shadow-[#21A9FF]/5">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 group-hover:bg-[#21A9FF] group-hover:text-white flex items-center justify-center transition-all duration-500 shadow-inner group-hover:rotate-12">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg tracking-tight">Add New Question</span>
                                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manual Content Creation</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Sticky Footer Actions --- */}
                <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 py-4 px-4 sm:px-8 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm font-bold text-gray-600 dark:text-slate-300 flex items-center gap-4">
                            <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">{fields.length} Questions</span>
                            <span className="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1.5 rounded-lg">{(watch('questions') || []).reduce((sum, q) => sum + (Number(q.mark) || 0), 0)} Total Points</span>
                        </div>
                        <div className="flex w-full sm:w-auto gap-3">
                            <button onClick={() => navigate(-1)} disabled={isSubmitting} className="flex-1 sm:flex-none px-8 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded-xl font-bold transition-all text-sm hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit, onInvalid)}
                                disabled={isSubmitting || success}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Quiz Questions</>}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};