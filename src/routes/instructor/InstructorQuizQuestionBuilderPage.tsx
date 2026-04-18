import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Loader2, GripVertical, Sparkles, HelpCircle, Settings, XCircle, AlertTriangle } from 'lucide-react';
import { useCreateQuiz } from '@/features/quizzes/api';
import { AIQuestionGeneratorModal } from '@/components/ui/AIQuestionGeneratorModal';
import type { OptionRequest, QuestionUpsertRequest, QuestionType } from '@/types/api.types';

// ─── Local UI types ────────────────────────────────────────────────────────

interface UIOption {
    text: string;
    isCorrect: boolean;
}

interface UIQuestion {
    uid: number;
    type: QuestionType;
    text: string;
    instructions: string;
    mark: number;
    explanation: string;
    options: UIOption[];
}

interface BuilderDraftData {
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
    mark: 1,
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
        mark: q.mark ?? 1,
        explanation: q.explanation ?? '',
        options,
    };
};

// ─── Payload builders ──────────────────────────────────────────────────────

const buildPayloadOptions = (q: UIQuestion): OptionRequest[] =>
    q.options.map(o => ({ optionText: o.text, isCorrect: o.isCorrect }));

const buildPayloadQuestion = (q: UIQuestion): QuestionUpsertRequest => ({
    questionType: q.type,
    questionText: q.text,
    mark: q.mark,
    instructions: q.instructions || undefined,
    explanation: q.explanation || undefined,
    options: buildPayloadOptions(q),
});

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls =
    'w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-medium';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const settings = (location.state as any)?.settings;

    const createQuizMutation = useCreateQuiz(settings?.courseId || '');
    const isDraftQuiz = settings?.status === 'Draft';

    const [questions, setQuestions] = useState<UIQuestion[]>(() => (isDraftQuiz ? [] : [defaultQuestion(1)]));
    const [counter, setCounter] = useState(isDraftQuiz ? 1 : 2);
    const [draggedUid, setDraggedUid] = useState<number | null>(null);
    const [draggedOption, setDraggedOption] = useState<{ uid: number; idx: number } | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [error, setError] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [success, setSuccess] = useState(false);

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
            setQuestions(persisted!.questions);
            setCounter(typeof persisted?.counter === 'number' && persisted.counter > 0 ? persisted.counter : 1);
        }
        setHydrated(true);
    }, [settings, hydrated]);

    useEffect(() => {
        if (!settings || !hydrated) return;
        storage.set<BuilderDraftData>(STORAGE_KEYS.QUIZ_BUILDER_DRAFT, {
            settings, questions, counter, savedAt: new Date().toISOString(),
        });
    }, [settings, questions, counter, hydrated]);

    // ── Question helpers ──────────────────────────────────────────────────

    const updateQ = (uid: number, patch: Partial<UIQuestion>) =>
        setQuestions(qs => qs.map(q => q.uid === uid ? { ...q, ...patch } : q));

    const removeQ = (uid: number) =>
        setQuestions(qs => qs.filter(q => q.uid !== uid));

    const addQuestion = () => {
        setQuestions(qs => [...qs, defaultQuestion(counter)]);
        setCounter(c => c + 1);
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

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
    };

    // ── Option helpers ────────────────────────────────────────────────────

    const updateOpt = (uid: number, idx: number, patch: Partial<UIOption>) =>
        setQuestions(qs => qs.map(q => {
            if (q.uid !== uid) return q;
            return { ...q, options: q.options.map((o, i) => i === idx ? { ...o, ...patch } : o) };
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

    const validate = (): string | null => {
        if (isDraftQuiz && questions.length === 0) return null; // Draft can have 0 questions

        if (questions.length === 0) {
            return 'At least one question is required for published or scheduled quizzes.';
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const n = `Question ${i + 1}`;
            if (!q.text.trim()) return `${n}: Question text is required.`;
            if (q.text.length > 1500) return `${n}: Max 1500 characters.`;
            if (q.mark <= 0) return `${n}: Points must be greater than 0.`;

            if (q.type === 'MCQ') {
                if (q.options.length < 3 || q.options.length > 5) return `${n}: MCQ must have 3–5 options.`;
                if (q.options.some(o => !o.text.trim())) return `${n}: All option texts are required.`;
                if (q.options.filter(o => o.isCorrect).length !== 1) return `${n}: Exactly one correct option is required.`;
            }

            if (q.type === 'TrueFalse') {
                if (q.options.filter(o => o.isCorrect).length !== 1) return `${n}: Select the correct answer (True or False).`;
            }
        }
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        const err = validate();
        if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        setError('');

        const payloadQuestions = questions.map(buildPayloadQuestion);

        const payload = {
            title: settings.title,
            description: settings.description?.trim() || settings.title?.trim() || 'Quiz',
            courseId: Number(settings.courseId),
            maximumAttempts: settings.maximumAttempts,
            attemptTimeLimit: Number(settings.attemptTimeLimit) || 0,
            status: settings.status,
            availableFrom: new Date(settings.availableFrom).toISOString(),
            availableUntil: new Date(settings.availableUntil).toISOString(),
            publishedDate: settings.status === 'Scheduled' && settings.publishedDate ? new Date(settings.publishedDate).toISOString() : undefined,
            showResultOnClose: settings.showResultOnClose ?? false,
            shuffleQuestions: settings.shuffleQuestions ?? false,
            shuffleOptions: settings.shuffleOptions ?? false,
            questions: payloadQuestions,
        };

        try {
            await createQuizMutation.mutateAsync(payload);
            storage.remove(STORAGE_KEYS.QUIZ_SETTINGS_DRAFT);
            storage.remove(STORAGE_KEYS.QUIZ_BUILDER_DRAFT);
            setSuccess(true);
            setTimeout(() => navigate(-2), 1500);
        } catch (e: any) {
            const d = e?.response?.data;
            const fieldErrors = d?.errors ? Object.entries(d.errors as Record<string, string[]>).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join(' | ') : null;
            const title = d?.message || d?.title;
            const extracted = fieldErrors ? (title ? `${title} — ${fieldErrors}` : fieldErrors) : (title || e?.message || 'Failed to create quiz. Please try again.');
            setError(extracted);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isLoading = createQuizMutation.isPending;

    const isQuestionComplete = (q: UIQuestion): boolean => {
        if (!q.text.trim() || q.mark <= 0) return false;
        if (q.type === 'MCQ') {
            if (q.options.length < 3 || q.options.length > 5) return false;
            if (q.options.some(o => !o.text.trim())) return false;
            return q.options.filter(o => o.isCorrect).length === 1;
        }
        if (q.type === 'TrueFalse') {
            return q.options.filter(o => o.isCorrect).length === 1;
        }
        return true;
    };

    const scrollToQuestion = (uid: number) => {
        document.getElementById(`question-card-${uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const getQuestionName = (q: UIQuestion, idx: number): string => {
        const raw = q.text.trim();
        if (!raw) return `Untitled Question ${idx + 1}`;
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
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold shadow-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        {error}
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
                                <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px]">{questions.length} Items</span>
                            </h3>

                            {questions.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">No questions yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
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
                                                className={`w-full text-left rounded-xl border p-3 transition-all group flex items-start gap-2 ${complete
                                                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-300'
                                                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm'
                                                    }`}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-0.5">Question {idx + 1}</p>
                                                    <p className={`text-xs font-semibold truncate ${complete ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                                                        {getQuestionName(q, idx)}
                                                    </p>
                                                </div>
                                                {complete ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
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
                                onClick={handleSubmit}
                                disabled={isLoading || success}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-95"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Finish & Create Quiz</>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Right Area: Question List */}
                    <div className="flex-1 space-y-6">
                        {questions.map((q, idx) => (
                            <div key={q.uid} id={`question-card-${q.uid}`} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${q.type === 'MCQ' ? 'bg-blue-500' : q.type === 'TrueFalse' ? 'bg-orange-500' : 'bg-purple-500'}`}></div>

                                {/* Q Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">{idx + 1}</span>
                                    </h3>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <select
                                            value={q.type}
                                            onChange={e => changeType(q.uid, e.target.value as QuestionType)}
                                            className="flex-1 sm:w-48 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="MCQ">Multiple Choice</option>
                                            <option value="TrueFalse">True / False</option>
                                            <option value="Written">Written Answer</option>
                                        </select>
                                        <button
                                            onClick={() => removeQ(q.uid)}
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
                                                rows={3}
                                                maxLength={1500}
                                                placeholder="Type the question here..."
                                                value={q.text}
                                                onChange={e => updateQ(q.uid, { text: e.target.value })}
                                                className={`${inputCls} resize-none text-base`}
                                            />
                                            <div className="mt-1.5 flex justify-end">
                                                <span className={`text-[10px] font-bold ${q.text.length > 1400 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
                                                    {q.text.length} / 1500
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dynamic Options based on Type */}
                                        <div className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
                                            {q.type === 'MCQ' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <label className={`${labelCls} mb-0`}>Answers (Mark the correct one)</label>
                                                        {q.options.length < 5 && (
                                                            <button onClick={() => addOption(q.uid)} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                                                                + Add Option
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {q.options.map((opt, oi) => (
                                                            <div
                                                                key={oi}
                                                                draggable
                                                                onDragStart={() => setDraggedOption({ uid: q.uid, idx: oi })}
                                                                onDragOver={e => e.preventDefault()}
                                                                onDrop={e => {
                                                                    e.preventDefault();
                                                                    if (draggedOption && draggedOption.uid === q.uid) moveOption(q.uid, draggedOption.idx, oi);
                                                                    setDraggedOption(null);
                                                                }}
                                                                onDragEnd={() => setDraggedOption(null)}
                                                                className={`flex items-center gap-3 p-2 pr-3 rounded-xl border-2 transition-colors bg-white dark:bg-slate-900 ${opt.isCorrect ? 'border-emerald-500 shadow-sm' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'}`}
                                                            >
                                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 cursor-grab ml-1" />
                                                                <label className="flex items-center justify-center cursor-pointer shrink-0">
                                                                    <input
                                                                        type="radio"
                                                                        name={`correct-${q.uid}`}
                                                                        checked={opt.isCorrect}
                                                                        onChange={() => setCorrect(q.uid, oi)}
                                                                        className="hidden"
                                                                    />
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-emerald-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                                        {opt.isCorrect && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                                                                    </div>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Option ${oi + 1}`}
                                                                    value={opt.text}
                                                                    onChange={e => updateOpt(q.uid, oi, { text: e.target.value })}
                                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-white px-2"
                                                                />
                                                                {q.options.length > 3 && (
                                                                    <button onClick={() => removeOption(q.uid, oi)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'TrueFalse' && (
                                                <div>
                                                    <label className={`${labelCls} mb-4`}>Select the correct answer</label>
                                                    <div className="flex gap-4">
                                                        {q.options.map((opt, oi) => (
                                                            <label
                                                                key={oi}
                                                                className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all font-bold ${opt.isCorrect
                                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`tf-${q.uid}`}
                                                                    checked={opt.isCorrect}
                                                                    onChange={() => setCorrect(q.uid, oi)}
                                                                    className="hidden"
                                                                />
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-emerald-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                                    {opt.isCorrect && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                                                                </div>
                                                                {opt.text}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'Written' && (
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
                                                    min="0.5" max="100" step="0.5"
                                                    value={q.mark}
                                                    onChange={e => updateQ(q.uid, { mark: parseFloat(e.target.value) || 1 })}
                                                    className={`${inputCls} pl-10 text-lg font-black text-blue-600 dark:text-blue-400`}
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">#</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Student Instructions (Optional)</label>
                                            <textarea
                                                rows={2}
                                                placeholder="E.g. Choose the BEST possible answer."
                                                value={q.instructions}
                                                onChange={e => updateQ(q.uid, { instructions: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>

                                        <div>
                                            <label className={labelCls}>Answer Explanation (Optional)</label>
                                            <textarea
                                                rows={2}
                                                placeholder="Shown to students after the quiz ends."
                                                value={q.explanation}
                                                onChange={e => updateQ(q.uid, { explanation: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};