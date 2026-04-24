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
import { validateQuestionsArray, formatQuizQuestionErrors } from '@/lib/validators';

// ─── Local UI types ────────────────────────────────────────────────────────

interface UIOption {
    text: string;
    isCorrect: boolean;
    backendId?: string;
}

interface UIQuestion {
    uid: number;
    type: QuestionType;
    text: string;
    instructions: string;
    mark: number;
    explanation: string;
    options: UIOption[];
    backendId?: string;
}

interface EditDraftData {
    quizId: string;
    settings: any;
    questions: UIQuestion[];
    counter: number;
    savedAt: string;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const makeMCQOptions = (): UIOption[] => [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

const makeTFOptions = (): UIOption[] => [
    { text: 'True', isCorrect: true },
    { text: 'False', isCorrect: false },
];

const defaultQuestion = (uid: number): UIQuestion => ({
    uid,
    type: 'MCQ',
    text: '',
    instructions: '',
    mark: 5,
    explanation: '',
    options: makeMCQOptions(),
});

const convertQuestionRequestToUI = (q: QuestionUpsertRequest, uid: number): UIQuestion => {
    const options = q.options?.length
        ? q.options.map(o => ({ text: o.optionText, isCorrect: o.isCorrect }))
        : q.questionType === 'TrueFalse'
            ? makeTFOptions()
            : q.questionType === 'MCQ'
                ? makeMCQOptions()
                : [];

    return {
        uid,
        type: q.questionType,
        text: q.questionText,
        instructions: q.instructions ?? '',
        mark: q.mark ?? 5,
        explanation: q.explanation ?? '',
        options,
    };
};

// ─── Converters ────────────────────────────────────────────────────────────

const convertOptionDtoToUI = (dto: OptionDto): UIOption => ({
    text: dto.optionText,
    isCorrect: dto.isCorrect,
    backendId: dto.id,
});

const convertQuestionDtoToUI = (dto: QuestionDto, uid: number): UIQuestion => ({
    uid,
    type: dto.questionType,
    text: dto.questionText,
    instructions: dto.instructions || '',
    mark: dto.mark,
    explanation: dto.explanation || '',
    options: (dto.options ?? []).map(convertOptionDtoToUI),
    backendId: dto.id ?? undefined,
});

// ─── Payload builders ──────────────────────────────────────────────────────

const buildPayloadOptions = (q: UIQuestion): OptionRequest[] =>
    q.options.map(o => ({
        optionId: o.backendId ?? null,
        optionText: o.text,
        isCorrect: o.isCorrect,
    }));

const buildPayloadQuestion = (q: UIQuestion): QuestionUpsertRequest => ({
    id: q.backendId ?? null,
    questionType: q.type,
    questionText: q.text,
    mark: q.mark,
    instructions: q.instructions || undefined,
    explanation: q.explanation || undefined,
    options: buildPayloadOptions(q),
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

    const { data: quiz, isLoading: quizLoading } = useQuiz(quizId ?? '');
    const upsertQuestionsMutation = useUpsertQuizQuestions(quizId ?? '');
    const isDraftQuiz = settings?.status === 'Draft' || quiz?.status === 'Draft';

    const [questions, setQuestions] = useState<UIQuestion[]>([]);
    const [counter, setCounter] = useState(1);
    const [draggedUid, setDraggedUid] = useState<number | null>(null);
    const [draggedOption, setDraggedOption] = useState<{ uid: number; idx: number } | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [openTypeUid, setOpenTypeUid] = useState<number | null>(null);

    // Load existing quiz questions on mount
    useEffect(() => {
        if (!quiz || loaded) return;

        if (quiz.questions && quiz.questions.length > 0) {
            const uiQuestions = quiz.questions.map((q, idx) => convertQuestionDtoToUI(q, idx + 1));
            setQuestions(uiQuestions);
            setCounter(uiQuestions.length + 1);
        } else if (!isDraftQuiz) {
            setQuestions([defaultQuestion(1)]);
            setCounter(2);
        }

        setLoaded(true);
        setHydrated(true);
    }, [quiz, loaded, isDraftQuiz]);

    // Hydrate from localStorage if returning to edit
    useEffect(() => {
        if (!quizId || hydrated || loaded) return;

        const persisted = storage.get<EditDraftData>(STORAGE_KEYS.QUIZ_EDIT_DRAFT);
        if (persisted && persisted.quizId === quizId && Array.isArray(persisted.questions)) {
            setQuestions(persisted.questions);
            setCounter(persisted.counter || 1);
            setHydrated(true);
        }
    }, [quizId, hydrated, loaded]);

    // Persist to localStorage
    useEffect(() => {
        if (!quizId || !hydrated) return;

        storage.set<EditDraftData>(STORAGE_KEYS.QUIZ_EDIT_DRAFT, {
            quizId,
            settings,
            questions,
            counter,
            savedAt: new Date().toISOString(),
        });
    }, [quizId, settings, questions, counter, hydrated]);

    // ── Question helpers ──────────────────────────────────────────────────

    const updateQ = (uid: number, patch: Partial<UIQuestion>) =>
        setQuestions(qs => qs.map(q => q.uid === uid ? { ...q, ...patch } : q));

    const removeQ = (uid: number) =>
        setQuestions(qs => qs.filter(q => q.uid !== uid));

    const addQuestion = () => {
        setQuestions(qs => [...qs, defaultQuestion(counter)]);
        setCounter(c => c + 1);
    };

    const handleGenerateWithAI = () => setShowAIModal(true);

    const handleAIGenerate = (generatedQuestions: QuestionUpsertRequest[]) => {
        if (!generatedQuestions.length) {
            setError('AI generation returned no questions. Please try again.');
            setShowAIModal(false);
            return;
        }
        const newQuestions = generatedQuestions.map((q, idx) => convertQuestionRequestToUI(q, counter + idx));
        setQuestions(qs => [...qs, ...newQuestions]);
        setCounter(c => c + newQuestions.length);
        setError('');
        setShowAIModal(false);
    };

    const moveQuestion = (fromUid: number, toUid: number) => {
        if (fromUid === toUid) return;
        setQuestions(qs => {
            const from = qs.findIndex(q => q.uid === fromUid);
            const to = qs.findIndex(q => q.uid === toUid);
            if (from === -1 || to === -1) return qs;
            const next = [...qs];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const changeType = (uid: number, type: QuestionType) => {
        const options = type === 'MCQ' ? makeMCQOptions() : type === 'TrueFalse' ? makeTFOptions() : [];
        updateQ(uid, { type, options });
        setOpenTypeUid(null);
    };

    // ── Option helpers ────────────────────────────────────────────────────

    const updateOpt = (uid: number, idx: number, patch: Partial<UIOption>) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid) return q;
            const options = q.options.map((o, i) => i === idx ? { ...o, ...patch } : o);
            return { ...q, options };
        }));

    const setCorrect = (uid: number, idx: number) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid) return q;
            return { ...q, options: q.options.map((o, i) => ({ ...o, isCorrect: i === idx })) };
        }));

    const addOption = (uid: number) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid || q.options.length >= 5) return q;
            return { ...q, options: [...q.options, { text: '', isCorrect: false }] };
        }));

    const removeOption = (uid: number, idx: number) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid || q.options.length <= 3) return q;
            return { ...q, options: q.options.filter((_, i) => i !== idx) };
        }));

    const moveOption = (uid: number, fromIdx: number, toIdx: number) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid || fromIdx === toIdx) return q;
            if (fromIdx < 0 || toIdx < 0 || fromIdx >= q.options.length || toIdx >= q.options.length) return q;
            const nextOptions = [...q.options];
            const [moved] = nextOptions.splice(fromIdx, 1);
            nextOptions.splice(toIdx, 0, moved);
            return { ...q, options: nextOptions };
        }));

    // ── Validation ────────────────────────────────────────────────────────

    /**
     * Client validation aligned with `POST .../quizzes/{id}/questions` and `@/lib/validators`.
     * Draft quizzes may have zero questions (empty save); any question listed must be complete
     * (question text, marks, MCQ/TF options with exactly one correct answer).
     */
    const validate = (): string | null => {
        if (questions.length === 0) {
            if (isDraftQuiz) return null;
            return 'At least one question is required for published or scheduled quizzes.';
        }

        const payload = questions.map(buildPayloadQuestion);
        const result = validateQuestionsArray(payload);
        if (!result.isValid) return formatQuizQuestionErrors(result.errors);
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        const err = validate();
        if (err) {
            setError(err);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setError('');

        const payloadQuestions = questions.map(buildPayloadQuestion);

        try {
            await upsertQuestionsMutation.mutateAsync(payloadQuestions);
            storage.remove(STORAGE_KEYS.QUIZ_EDIT_DRAFT);
            toast.success('Questions saved successfully.', {
                description: quiz?.title ? `“${quiz.title}” is up to date.` : undefined,
            });
            const courseIdStr = quiz?.courseId != null ? String(quiz.courseId) : null;
            navigate(courseIdStr ? `/instructor/courses/${courseIdStr}/manage/quizzes` : -1);
        } catch (e: any) {
            console.error('[UpsertQuestions] error:', e?.response?.status, e?.response?.data, e);
            const d = e?.response?.data;
            const fieldErrors = d?.errors ? Object.entries(d.errors as Record<string, string[]>)
                .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join(' | ') : null;
            const title = d?.message || d?.title;
            const extracted = fieldErrors ? (title ? `${title} — ${fieldErrors}` : fieldErrors) : (title || e?.message || 'Failed to save questions. Please try again.');
            const forToast = extracted.length > 220 ? `${extracted.slice(0, 217)}…` : extracted;
            toast.error('Could not save questions', { description: forToast });
            setError(extracted);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

    const isQuestionComplete = (q: UIQuestion): boolean => {
        if (!q.text.trim() || q.mark <= 0) return false;
        if (q.type === 'MCQ') {
            if (q.options.length < 3 || q.options.length > 5) return false;
            if (q.options.some(o => !o.text.trim())) return false;
            return q.options.filter(o => o.isCorrect).length === 1;
        }
        if (q.type === 'TrueFalse') return q.options.filter(o => o.isCorrect).length === 1;
        return true;
    };

    const scrollToQuestion = (uid: number) => {
        const el = document.getElementById(`question-card-${uid}`);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const getQuestionName = (q: UIQuestion, idx: number): string => {
        const raw = q.text.trim();
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

                    {/* Banners */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
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
                                    {questions.length} Q
                                </span>
                            </div>

                            {questions.length === 0 ? (
                                <div className="text-center py-12 text-[10px] font-black uppercase tracking-widest text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                    Empty
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                                    {questions.map((q, idx) => {
                                        const complete = isQuestionComplete(q);
                                        return (
                                            <button
                                                key={q.uid}
                                                draggable
                                                onDragStart={() => setDraggedUid(q.uid)}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    if (draggedUid !== null) moveQuestion(draggedUid, q.uid);
                                                    setDraggedUid(null);
                                                }}
                                                onDragEnd={() => setDraggedUid(null)}
                                                onClick={() => scrollToQuestion(q.uid)}
                                                className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 flex items-start gap-3 group relative overflow-hidden ${complete
                                                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10'
                                                    : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {/* Left Accent */}
                                                <div className={`absolute left-0 top-0 w-1 h-full opacity-50 ${complete ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                
                                                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 cursor-grab group-hover:text-[#21A9FF] transition-colors" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Question {idx + 1}</span>
                                                        {complete && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                    </div>
                                                    <p className={`text-xs font-bold truncate tracking-tight transition-colors ${complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {getQuestionName(q, idx)}
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

                        {/* --- Main Content: Questions Editor --- */}
                        <div className="space-y-6">
                            {questions.map((q, idx) => (
                                <div key={q.uid} id={`question-card-${q.uid}`} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden relative group/qcard hover:shadow-xl hover:shadow-[#21A9FF]/5 transition-all duration-500">
                                    {/* Accent Line */}
                                    <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${isQuestionComplete(q) ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                                    <div className="p-6 sm:p-10 space-y-8 ml-2">

                                        {/* Question Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-50 dark:border-slate-800 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                                                    Question {idx + 1}
                                                </div>
                                                {isQuestionComplete(q) ? (
                                                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Incomplete
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => removeQ(q.uid)} className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all active:scale-90 border border-rose-100 dark:border-rose-500/20" title="Delete Question">
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>

                                        {/* Row 1: Type & Points */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelCls}>Question Type</label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenTypeUid(openTypeUid === q.uid ? null : q.uid)}
                                                        className={`${inputCls} flex items-center justify-between text-left group/drop`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Filter className="w-4 h-4 text-gray-400" />
                                                            <span className="font-bold">{
                                                                q.type === 'MCQ' ? 'Multiple Choice (MCQ)' :
                                                                q.type === 'TrueFalse' ? 'True / False' :
                                                                'Written Answer (Essay)'
                                                            }</span>
                                                        </div>
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openTypeUid === q.uid ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {openTypeUid === q.uid && (
                                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                                                            {[
                                                                { val: 'MCQ', lab: 'Multiple Choice (MCQ)', icon: ListChecks },
                                                                { val: 'TrueFalse', lab: 'True / False', icon: HelpCircle },
                                                                { val: 'Written', lab: 'Written Answer (Essay)', icon: FileText }
                                                            ].map((opt) => (
                                                                <button
                                                                    key={opt.val}
                                                                    type="button"
                                                                    onClick={() => changeType(q.uid, opt.val as QuestionType)}
                                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                                                                        q.type === opt.val 
                                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <opt.icon className={`w-4 h-4 ${q.type === opt.val ? 'text-blue-600' : 'text-gray-400'}`} />
                                                                        <span className="text-sm font-bold">{opt.lab}</span>
                                                                    </div>
                                                                    {q.type === opt.val && (
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Invisible Click-away Overlay */}
                                                    {openTypeUid === q.uid && (
                                                        <div 
                                                            className="fixed inset-0 z-50 cursor-default" 
                                                            onClick={() => setOpenTypeUid(null)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Points / Marks <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                                    <input type="number" min="0.5" max="100" step="0.5" value={q.mark} onChange={e => updateQ(q.uid, { mark: parseFloat(e.target.value) || 1 })} className={`${inputCls} pl-11`} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <div>
                                            <label className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Question Text <span className="text-red-500">*</span></span>
                                                <span className="text-[10px] font-bold text-gray-400">{q.text.length} / 1500</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                maxLength={1500}
                                                placeholder="Type your question here..."
                                                value={q.text}
                                                onChange={e => updateQ(q.uid, { text: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>

                                        {/* Options Area */}
                                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">

                                            {q.type === 'MCQ' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <label className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                                            Answer Options <span className="text-red-500">*</span>
                                                        </label>
                                                        {q.options.length < 5 && (
                                                            <button type="button" onClick={() => addOption(q.uid)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3.5 h-3.5" /> Add Option
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className={`flex items-center gap-3 p-2 pr-4 rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                                                <div
                                                                    draggable onDragStart={() => setDraggedOption({ uid: q.uid, idx: i })} onDragOver={e => e.preventDefault()}
                                                                    onDrop={() => {
                                                                        if (draggedOption && draggedOption.uid === q.uid && draggedOption.idx !== i) {
                                                                            moveOption(q.uid, draggedOption.idx, i);
                                                                        }
                                                                        setDraggedOption(null);
                                                                    }}
                                                                    onDragEnd={() => setDraggedOption(null)}
                                                                    className="cursor-move p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400"
                                                                >
                                                                    <GripVertical className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm font-black text-gray-400 w-6">{String.fromCharCode(65 + i)}.</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                                    value={opt.text}
                                                                    onChange={e => updateOpt(q.uid, i, { text: e.target.value })}
                                                                    className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-900 dark:text-white py-2 placeholder-gray-400"
                                                                />
                                                                <label className="flex items-center gap-2 cursor-pointer pl-3 border-l border-gray-200 dark:border-slate-700">
                                                                    <input type="radio" name={`correct-${q.uid}`} checked={opt.isCorrect} onChange={() => setCorrect(q.uid, i)} className="w-4 h-4 text-emerald-500 focus:ring-emerald-500" />
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${opt.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>Correct</span>
                                                                </label>
                                                                {q.options.length > 3 && (
                                                                    <button type="button" onClick={() => removeOption(q.uid, i)} className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'TrueFalse' && (
                                                <div>
                                                    <label className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-4 block">
                                                        Select Correct Answer <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="flex gap-4">
                                                        {q.options.map((opt, i) => (
                                                            <label key={i} className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${opt.isCorrect ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                                                <input type="radio" name={`tf-${q.uid}`} checked={opt.isCorrect} onChange={() => setCorrect(q.uid, i)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                                <span className={`font-bold text-lg ${opt.isCorrect ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300'}`}>{opt.text}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'Written' && (
                                                <div className="text-center p-6 text-sm font-bold text-gray-500 dark:text-slate-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                                    Students will be provided with a text area to write their answer. No options needed.
                                                </div>
                                            )}
                                        </div>

                                        {/* Instructions & Explanations */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                                            <div>
                                                <label className={labelCls}>Instructions <span className="normal-case font-medium text-gray-400">(Optional)</span></label>
                                                <textarea rows={2} placeholder="E.g., Select all that apply..." value={q.instructions} onChange={e => updateQ(q.uid, { instructions: e.target.value })} className={`${inputCls} resize-none`} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Explanation <span className="normal-case font-medium text-gray-400">(Optional)</span></label>
                                                <textarea rows={2} placeholder="Shown to student after completion..." value={q.explanation} onChange={e => updateQ(q.uid, { explanation: e.target.value })} className={`${inputCls} resize-none`} />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}

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
                            <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">{questions.length} Questions</span>
                            <span className="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1.5 rounded-lg">{questions.reduce((sum, q) => sum + q.mark, 0)} Total Points</span>
                        </div>
                        <div className="flex w-full sm:w-auto gap-3">
                            <button onClick={() => navigate(-1)} disabled={isLoading} className="flex-1 sm:flex-none px-8 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded-xl font-bold transition-all text-sm hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Quiz Questions</>}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};