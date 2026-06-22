import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import {
    ArrowLeft, Plus, Trash2, CheckCircle2, Loader2,
    GripVertical, Sparkles, ListChecks, HelpCircle, AlertTriangle, Save,
    ChevronDown, ChevronUp, Check, Filter, FileText, LayoutGrid, BrainCircuit, XCircle, Eye
} from 'lucide-react';
import { useQuiz, useUpsertQuizQuestions, useAiGeneratedQuestions, useAcceptAiGeneratedQuestion, useRejectAiGeneratedQuestion } from '@/features/quizzes/api';
import { AIQuestionGeneratorModal } from '@/components/ui/AIQuestionGeneratorModal';
import { toast } from 'sonner';
import { submitAIQuestionValidation } from '@/api/services/quiz.service';
import { useMe } from '@/features/auth/api';
import type { OptionRequest, QuestionUpsertRequest, QuestionType, QuestionDto, OptionDto } from '@/types/api.types';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQueryClient } from '@tanstack/react-query';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';
import { AlertCircle, Code2, Sigma, Palette } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Drawer } from '@/components/ui/Drawer';
import { WhiteboardDrawer } from '@/components/ui/WhiteboardDrawer';
import { MathEditorModal } from '@/components/ui/MathEditorModal';
import { CodeEditorDrawer } from '@/components/ui/CodeEditorDrawer';
import { QnARenderer } from '@/features/qna/components/QnARenderer';

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
        .nullable()
        .default(''),
    explanation: yup.string()
        .max(1000, 'Explanation cannot exceed 1000 characters.')
        .optional()
        .nullable()
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
    }),
});

const builderSchema = yup.object().shape({
    questions: yup.array().of(questionSchema).required(),
});

type BuilderFormData = {
    questions: {
        id?: string | null;
        questionText: string;
        questionType: 'MCQ' | 'TrueFalse' | 'Written';
        mark: number;
        instructions?: string | null;
        explanation?: string | null;
        options?: {
            optionId?: string | null;
            optionText: string;
            isCorrect: boolean;
        }[] | null;
    }[];
};

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
    id: null,
    questionType: type,
    questionText: '',
    mark: 5,
    instructions: '',
    explanation: '',
    options: type === 'MCQ' ? makeMCQOptions() : type === 'TrueFalse' ? makeTFOptions() : [],
});

// ─── Constants & Helpers ───────────────────────────────────────────────────

const QUESTION_TYPES = [
    { id: 'MCQ', title: 'Multiple Choice (MCQ)', icon: ListChecks },
    { id: 'TrueFalse', title: 'True / False', icon: LayoutGrid },
    { id: 'Written', title: 'Answer (Essay)', icon: FileText },
];

const QuestionTypeSelector = ({ value, onChange, disabled }: { value: QuestionType, onChange: (val: QuestionType) => void, disabled?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = QUESTION_TYPES.find(t => t.id === value) || QUESTION_TYPES[0];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-900 border rounded-xl transition-all duration-300",
                    isOpen ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center transition-colors", isOpen ? "bg-blue-100 text-blue-600" : "bg-slate-200/50 dark:bg-slate-800 text-slate-400")}>
                        <selected.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selected.title}</span>
                </div>
                <ChevronDown className={clsx("w-3.5 h-3.5 text-slate-400 transition-transform duration-500", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-[101] p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top">
                        {QUESTION_TYPES.map((type) => {
                            const isSelected = type.id === value;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(type.id as QuestionType);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 mb-0.5 last:mb-0",
                                        isSelected 
                                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                            : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center transition-all", isSelected ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                                            <type.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold">{type.title}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm text-gray-900 dark:text-white transition-all outline-none';
const labelCls = 'block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1';

const stripHtml = (html: string) => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
};

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionsEditPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: quizId } = useParams<{ id: string }>();
    const settings = (location.state as any)?.settings;
    const queryClient = useQueryClient();

    const { data: quiz, isLoading: quizLoading } = useQuiz(quizId ?? '');
    const upsertQuestionsMutation = useUpsertQuizQuestions(quizId ?? '');
    const aiGeneratedQuery = useAiGeneratedQuestions(quizId ?? '');
    const acceptAiQuestion = useAcceptAiGeneratedQuestion(quizId ?? '');
    const rejectAiQuestion = useRejectAiGeneratedQuestion(quizId ?? '');
    const isDraftQuiz = settings?.status === 'Draft' || quiz?.status === 'Draft';

    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<'questions' | 'ai-generated'>('questions');
    const [questionValidations, setQuestionValidations] = useState<Record<string, { isRelated: boolean; isSubmitted: boolean }>>({});
    const { data: currentUser } = useMe();
    
    // Drag & Drop States
    const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
    const [draggedOptionInfo, setDraggedOptionInfo] = useState<{ qIndex: number; optIndex: number } | null>(null);

    // Drawer States
    const [activeDrawer, setActiveDrawer] = useState<'code' | 'math' | 'whiteboard' | null>(null);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);

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
                questionType: q.questionType as QuestionType,
                questionText: q.questionText,
                mark: q.mark,
                instructions: q.instructions || '',
                explanation: q.explanation || '',
                options: (q.options || []).map(o => ({
                    optionId: o.optionId ?? o.id ?? null,
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
            instructions: q.instructions ?? '',
            explanation: q.explanation ?? '',
            options: q.options?.map(o => ({
                optionId: null,
                optionText: o.optionText,
                isCorrect: o.isCorrect
            })) || [],
        }));
        append(newQs);
        setShowAIModal(false);
    };

    // Sync newly accepted AI questions from server into the form
    useEffect(() => {
        if (!quiz?.questions) return;
        const currentQs = getValues('questions') || [];
        const formIds = new Set(currentQs.map(q => q.id).filter(Boolean));
        const newServerQuestions = quiz.questions.filter(q => q.id && !formIds.has(q.id));
        if (newServerQuestions.length > 0) {
            const qsToAppend = newServerQuestions.map(q => ({
                id: q.id ?? null,
                questionType: q.questionType as QuestionType,
                questionText: q.questionText,
                mark: q.mark,
                instructions: q.instructions ?? '',
                explanation: q.explanation ?? '',
                options: q.options?.map(o => ({
                    optionId: o.optionId ?? o.id ?? null,
                    optionText: o.optionText,
                    isCorrect: o.isCorrect
                })) || [],
            }));
            append(qsToAppend);
        }
    }, [quiz?.questions, getValues, append]);

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
        setValue(`questions.${qIndex}.options`, [...currentOptions, { optionText: '', isCorrect: false }], { shouldValidate: false });
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        const currentOptions = watch(`questions.${qIndex}.options`) || [];
        if (currentOptions.length <= 1) return;
        setValue(`questions.${qIndex}.options`, currentOptions.filter((_, i) => i !== optIndex), { shouldValidate: true });
    };

    const onSubmit = async (data: BuilderFormData) => {
        if (!isDraftQuiz && data.questions.length === 0) {
            toast.error('Published quizzes must have at least one question.');
            return;
        }

        try {
            setApiError('');
            setSuccess(false);

            const payloadQuestions: QuestionUpsertRequest[] = data.questions.map(q => {
                const req: QuestionUpsertRequest = {
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
                    })) || []
                };

                return req;
            });

            await upsertQuestionsMutation.mutateAsync(payloadQuestions);
            setSuccess(true);
            toast.success('Questions saved successfully.');
            setTimeout(() => navigate(`/instructor/courses/${quiz?.courseId}/manage/quizzes`), 1500);
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
        const plainText = stripHtml(qText).trim();
        if (!plainText) return `New Question ${idx + 1}`;
        return plainText.length > 35 ? `${plainText.slice(0, 35)}...` : plainText;
    };

    return (
        <>
            {showAIModal && (
                <AIQuestionGeneratorModal
                    isOpen={true}
                    quizId={quizId ?? undefined}
                    onClose={() => setShowAIModal(false)}
                    onGenerate={handleAIGenerate}
                    onComplete={() => queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })}
                />
            )}

            <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans pb-32">

                {/* --- Sticky Header --- */}
                <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 py-3 sm:py-4 px-4 sm:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                            <button onClick={() => navigate(`/instructor/courses/${quiz?.courseId}/manage/quizzes`)} className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 transition-all shrink-0 shadow-sm active:scale-90">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-[#21A9FF] shrink-0">
                                        <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="truncate">Edit Questions</span>
                                </h1>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 ml-0.5">
                                    <span className="text-[9px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-[120px] sm:max-w-md truncate">
                                        {settings?.title || quiz.title}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className={`px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-md border shadow-sm ${statusBadgeClass}`}>
                                        {currentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                            <button onClick={() => setShowAIModal(true)} className="w-full sm:w-auto group relative flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#A855F7] text-white font-black rounded-xl sm:rounded-[1.25rem] transition-all duration-300 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 active:scale-95 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-100"></div>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                                <span className="relative z-10 text-[11px] sm:text-sm uppercase tracking-widest sm:tracking-normal">AI Generator</span>
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
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 flex flex-col gap-2 p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-400 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                <span className="uppercase tracking-widest text-[11px]">Form Validation Error</span>
                            </div>
                            <p className="font-medium opacity-90">Please check your questions. Some required fields are missing or invalid.</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {fields.map((_, i) => errors.questions?.[i] && (
                                    <button 
                                        key={i}
                                        onClick={() => scrollToQuestion(i)}
                                        className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-[10px] uppercase tracking-tighter hover:bg-amber-200 transition-colors"
                                    >
                                        Fix Q{i+1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            Questions saved successfully! Redirecting...
                        </div>
                    )}
                    {/* Tabs */}
                <div className="grid grid-cols-2 lg:flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={clsx(
                            "px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all",
                            activeTab === 'questions'
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <ListChecks className="w-4 h-4" /> 
                            <span className="hidden xs:inline">Questions</span>
                            <span className="xs:hidden">Qs</span>
                            ({fields.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai-generated')}
                        className={clsx(
                            "px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all",
                            activeTab === 'ai-generated'
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> 
                            <span className="hidden xs:inline">AI Generated</span>
                            <span className="xs:hidden">AI Gen</span>
                        </span>
                    </button>
                </div>

                {activeTab === 'questions' && (
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

                                        <div className="p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 ml-2">

                                            {/* Question Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-5 sm:pb-6">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
                                                        Question {idx + 1}
                                                    </div>
                                                    {isQuestionComplete(idx) ? (
                                                        <span className="text-[9px] sm:text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] sm:text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 flex items-center gap-1.5">
                                                            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Incomplete
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={() => remove(idx)} className="p-2.5 sm:p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl sm:rounded-2xl transition-all active:scale-90 border border-rose-100 dark:border-rose-500/20" title="Delete Question">
                                                    <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                                </button>
                                            </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                            <div>
                                                <label className={labelCls}>Question Type</label>
                                                <div className="relative">
                                                    <Controller
                                                        name={`questions.${idx}.questionType`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <QuestionTypeSelector
                                                                value={field.value as QuestionType}
                                                                onChange={(val) => changeType(idx, val)}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Points / Marks <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        {...register(`questions.${idx}.mark`)}
                                                        className={`${inputCls} pl-11 !py-2.5 sm:!py-3 ${qError?.mark ? 'border-red-500 bg-red-50/10' : ''}`}
                                                    />
                                                </div>
                                                {qError?.mark && (
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.mark.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center justify-between mb-2 sm:mb-3">
                                                <span className="text-[10px] sm:text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Question Content <span className="text-red-500">*</span></span>
                                                <span className={`text-[9px] sm:text-[10px] font-bold ${qText.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}>{qText.length} / 2000</span>
                                            </label>
                                            
                                            <Controller
                                                name={`questions.${idx}.questionText`}
                                                control={control}
                                                render={({ field }) => (
                                                    <RichTextEditor
                                                        content={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Describe your question in detail..."
                                                        onMathAction={() => {
                                                            setActiveQuestionIdx(idx);
                                                            setActiveDrawer('math');
                                                        }}
                                                        className={qError?.questionText ? 'border-red-500 ring-2 ring-red-500/10' : ''}
                                                    />
                                                )}
                                            />

                                            {qError?.questionText && (
                                                <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {qError.questionText.message}
                                                </p>
                                            )}
                                        </div>

                                            {/* Question Preview Area */}
                                            <div className="mb-8 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(33,169,255,0.5)]" />
                                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Question Preview</span>
                                                    </div>
                                                    <div className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                        <Eye className="w-3 h-3 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-white dark:border-slate-800/50 shadow-inner backdrop-blur-sm min-h-[100px] flex flex-col">
                                                    {!stripHtml(qText) ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                                                            <HelpCircle className="w-5 h-5 opacity-20" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Preview will appear here</span>
                                                        </div>
                                                    ) : (
                                                        <QnARenderer content={qText} />
                                                    )}
                                                </div>
                                            </div>

                                        {/* Options Area */}
                                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800">

                                            {qType === 'MCQ' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                        <div className="flex flex-col">
                                                            <label className="text-[10px] sm:text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                                Answer Options <span className="text-red-500">*</span>
                                                            </label>
                                                            {qError?.options?.message && (
                                                                <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> {qError.options.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {qOptions.length < 5 && (
                                                            <button type="button" onClick={() => addOption(idx)} className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Option
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2.5 sm:space-y-3">
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
                                                                        }
                                                                        setDraggedOptionInfo(null);
                                                                    }}
                                                                    onDragEnd={() => setDraggedOptionInfo(null)}
                                                                    className={`flex flex-col gap-1 transition-all ${isDraggedOpt ? 'opacity-40 scale-[0.98]' : ''}`}
                                                                >
                                                                    <div className={`flex items-center gap-2 sm:gap-3 p-2 pr-3 sm:pr-4 rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'} ${optError?.optionText ? 'border-red-500' : ''}`}>
                                                                        <div className="cursor-grab p-1.5 sm:p-2 text-gray-400 active:cursor-grabbing hover:text-[#21A9FF]">
                                                                            <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                        </div>
                                                                        <span className="text-xs sm:text-sm font-black text-gray-400 w-5 sm:w-6">{String.fromCharCode(65 + i)}.</span>
                                                                        <Controller
                                                                            control={control}
                                                                            name={`questions.${idx}.options.${i}.optionText`}
                                                                            defaultValue={opt.optionText ?? ''}
                                                                            render={({ field }) => (
                                                                                <input
                                                                                    {...field}
                                                                                    type="text"
                                                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                                                    className="flex-1 bg-transparent outline-none text-xs sm:text-sm font-semibold text-gray-900 dark:text-white py-1.5 sm:py-2 placeholder-gray-400 min-w-0"
                                                                                />
                                                                            )}
                                                                        />
                                                                        <label className="flex items-center gap-1 sm:gap-2 cursor-pointer pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-700 shrink-0">
                                                                            <input
                                                                                type="radio"
                                                                                checked={opt.isCorrect}
                                                                                onChange={() => setCorrect(idx, i)}
                                                                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 focus:ring-emerald-500"
                                                                            />
                                                                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${opt.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}><span className="hidden xs:inline">Correct</span><Check className={clsx("w-3.5 h-3.5 xs:hidden", opt.isCorrect ? "text-emerald-500" : "text-slate-300")} /></span>
                                                                        </label>
                                                                        {qOptions.length > 3 && (
                                                                            <button type="button" onClick={() => removeOption(idx, i)} className="ml-1 sm:ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {optError?.optionText && (
                                                                        <p className="text-[9px] sm:text-[10px] font-bold text-red-500 uppercase ml-10 sm:ml-12 mt-0.5 sm:mt-1 flex items-center gap-1">
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
                                                        <label className="text-[10px] sm:text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-3 sm:mb-4 block">
                                                            Select Correct Answer <span className="text-red-500">*</span>
                                                        </label>
                                                        {qError?.options?.message && (
                                                            <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1 mb-3 sm:mb-4 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" /> {qError.options.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-3 sm:gap-4">
                                                        {qOptions.map((opt, i) => (
                                                            <label key={i} className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${opt.isCorrect ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                                                <input
                                                                    type="radio"
                                                                    checked={opt.isCorrect}
                                                                    onChange={() => setCorrect(idx, i)}
                                                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className={`font-bold text-base sm:text-lg ${opt.isCorrect ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300'}`}>{opt.optionText}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-5 sm:pt-6 border-t border-gray-100 dark:border-slate-700/50">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                        <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                    </div>
                                                    <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Instructions <span className="normal-case font-medium opacity-60">(Opt)</span></label>
                                                </div>
                                                <textarea
                                                    {...register(`questions.${idx}.instructions`)}
                                                    rows={2}
                                                    className={clsx(inputCls, "!py-2.5 sm:!py-3 resize-none min-h-[70px] sm:min-h-[80px]", qError?.instructions && "border-red-500 ring-2 ring-red-500/10")}
                                                    placeholder="e.g. Select all that apply..."
                                                />
                                                {qError?.instructions && (
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> {qError.instructions.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                    </div>
                                                    <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Explanation <span className="normal-case font-medium opacity-60">(Opt)</span></label>
                                                </div>
                                                <textarea
                                                    {...register(`questions.${idx}.explanation`)}
                                                    rows={2}
                                                    className={clsx(inputCls, "!py-2.5 sm:!py-3 resize-none min-h-[70px] sm:min-h-[80px]", qError?.explanation && "border-red-500 ring-2 ring-red-500/10")}
                                                    placeholder="Shown to students after they submit..."
                                                />
                                                {qError?.explanation && (
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-red-500 uppercase mt-1.5 ml-1 flex items-center gap-1">
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
                            <button onClick={addQuestion} className="w-full py-8 sm:py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] sm:rounded-[3rem] text-slate-400 dark:text-slate-500 hover:border-[#21A9FF] hover:text-[#21A9FF] hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-500 flex flex-col items-center justify-center gap-3 sm:gap-4 font-black group shadow-sm hover:shadow-xl hover:shadow-[#21A9FF]/5">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 group-hover:bg-[#21A9FF] group-hover:text-white flex items-center justify-center transition-all duration-500 shadow-inner group-hover:rotate-12">
                                    <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <div className="text-center px-4">
                                    <span className="block text-base sm:text-lg tracking-tight">Add New Question</span>
                                    <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manual Content Creation</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'ai-generated' && (
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                    <div className="flex items-center justify-between px-2 sm:px-0">
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                                AI Generated Questions
                            </h3>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">
                                Review and accept questions generated by the AI.
                            </p>
                        </div>
                    </div>

                    {aiGeneratedQuery.isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl sm:rounded-[2rem] animate-pulse" />
                            ))}
                        </div>
                    ) : aiGeneratedQuery.isError ? (
                        <div className="text-center py-10 sm:py-12 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl sm:rounded-[2rem]">
                            <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 mx-auto mb-2 sm:mb-3" />
                            <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">Failed to load AI-generated questions.</p>
                        </div>
                    ) : !aiGeneratedQuery.data || aiGeneratedQuery.data.length === 0 ? (
                        <div className="text-center py-16 sm:py-20 bg-gray-50 dark:bg-slate-800/30 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-800 mx-2 sm:mx-0">
                            <BrainCircuit className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                            <h4 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2">No Pending AI Questions</h4>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 px-4">Generate questions using the AI Generator to see them here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {aiGeneratedQuery.data.map((q, idx) => (
                                <div key={q.id} className="bg-white dark:bg-slate-800/50 rounded-2xl sm:rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden mx-2 sm:mx-0">
                                    <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50/50 dark:bg-slate-800/30 gap-3">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] sm:text-xs font-black">{idx + 1}</span>
                                            <span className={clsx("px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest",
                                                q.questionType === 'MCQ' ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                                q.questionType === 'TrueFalse' ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400")}>{q.questionType}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400">{q.mark} pts</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button onClick={() => acceptAiQuestion.mutate(q.id, { onSuccess: () => { toast.success('Question accepted'); } })}
                                                disabled={acceptAiQuestion.isPending}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                                {acceptAiQuestion.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                                            </button>
                                            <button onClick={() => rejectAiQuestion.mutate(q.id, { onSuccess: () => toast.success('Question rejected') })}
                                                disabled={rejectAiQuestion.isPending}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] sm:text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                                {rejectAiQuestion.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{q.questionText}</p>
                                        {q.options && q.options.length > 0 && (
                                            <div className="space-y-2">
                                                {q.options.map((opt, oi) => (
                                                    <div key={oi} className={clsx("flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-sm font-semibold transition-all",
                                                        opt.isCorrect ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300")}>
                                                        <span className={clsx("w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0",
                                                            opt.isCorrect ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400")}>{String.fromCharCode(65 + oi)}</span>
                                                        <span className="truncate">{opt.optionText}</span>
                                                        {opt.isCorrect && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 ml-auto shrink-0" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {q.questionType === 'Written' && (
                                            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 rounded-xl text-center">
                                                <p className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Written Answer Question</p>
                                            </div>
                                        )}
                                        {q.explanation && (
                                            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Explanation</p>
                                                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-400">{q.explanation}</p>
                                            </div>
                                        )}

                                        {/* AI Topic Validation Section */}
                                        <div className="mt-6 pt-6 border-t border-gray-150 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900/10 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BrainCircuit className="w-4.5 h-4.5 text-purple-500 animate-pulse" />
                                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">AI Topic Validation</h4>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-4">
                                                Help improve future AI-generated questions by validating whether this question matches the intended learning content.
                                            </p>

                                            {questionValidations[q.id]?.isSubmitted ? (
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Thank you. Your validation helps improve future AI-generated assessments.</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold text-gray-700 dark:text-slate-350">
                                                        Does this question accurately relate to the uploaded content and intended topic?
                                                    </p>
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setQuestionValidations(prev => ({
                                                                    ...prev,
                                                                    [q.id]: { isRelated: true, isSubmitted: false }
                                                                }));
                                                            }}
                                                            className={`flex-1 py-3 px-4 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
                                                                questionValidations[q.id]?.isRelated === true
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                                                    : 'bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 hover:border-emerald-350 hover:bg-emerald-50/10'
                                                            }`}
                                                        >
                                                            ✓ Related
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setQuestionValidations(prev => ({
                                                                    ...prev,
                                                                    [q.id]: { isRelated: false, isSubmitted: false }
                                                                }));
                                                            }}
                                                            className={`flex-1 py-3 px-4 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
                                                                questionValidations[q.id]?.isRelated === false
                                                                    ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25'
                                                                    : 'bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 hover:border-rose-355 hover:bg-rose-50/10'
                                                            }`}
                                                        >
                                                            ✗ Unrelated
                                                        </button>
                                                    </div>

                                                    {questionValidations[q.id]?.isRelated !== undefined && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const isRelated = questionValidations[q.id].isRelated;
                                                                try {
                                                                    const payload = {
                                                                        questionId: q.id,
                                                                        quizId: quizId ?? '',
                                                                        instructorId: (quiz as any)?.instructorId ?? currentUser?.id ?? 'unknown-instructor',
                                                                        isRelated,
                                                                        courseId: quiz?.courseId ?? 0,
                                                                        topicName: q.topicName || 'Machine Learning',
                                                                        questionText: q.questionText,
                                                                        courseName: (quiz as any)?.courseName || 'Advanced Neural Networks',
                                                                        instructorName: 'Dr. Sarah Jenkins',
                                                                        createdAt: new Date().toISOString()
                                                                    };
                                                                    await submitAIQuestionValidation(payload);
                                                                    setQuestionValidations(prev => ({
                                                                        ...prev,
                                                                        [q.id]: { ...prev[q.id], isSubmitted: true }
                                                                    }));
                                                                    toast.success('Validation submitted.');
                                                                } catch (err) {
                                                                    toast.error('Failed to submit validation.');
                                                                }
                                                            }}
                                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                                                        >
                                                            Submit Validation
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                )}
                </div>

                {/* --- Sticky Footer Actions --- */}
                <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-gray-200 dark:border-slate-800 py-3 sm:py-5 px-4 sm:px-8 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-6">
                        <div className="flex items-center justify-center gap-3 sm:gap-6 w-full md:w-auto">
                            <div className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                    <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[9px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{fields.length} Qs</span>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 sm:py-2 rounded-xl border border-purple-100 dark:border-purple-500/10">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-[9px] sm:text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                        {(watch('questions') || []).reduce((sum, q) => sum + (Number(q.mark) || 0), 0)} Pts
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex w-full md:w-auto gap-2 sm:gap-3 items-stretch">
                            <button onClick={() => navigate(`/instructor/courses/${quiz?.courseId}/manage/quizzes`)} disabled={isSubmitting} className="px-4 sm:px-6 py-3 sm:py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 active:scale-95">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit, onInvalid)}
                                disabled={isSubmitting || success}
                                className="flex-1 md:w-56 flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            {/* Drawers for specialized content */}
            <MathEditorModal
                isOpen={activeDrawer === 'math'}
                onClose={() => setActiveDrawer(null)}
                onApply={(latex) => {
                    if (activeQuestionIdx === null) return;
                    const current = getValues(`questions.${activeQuestionIdx}.questionText`) || '';
                    const formatted = `${current} ${latex} `;
                    setValue(`questions.${activeQuestionIdx}.questionText`, formatted);
                }}
            />

            </div>
        </>
    );
};
