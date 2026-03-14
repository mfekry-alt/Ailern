import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Loader2, GripVertical, Sparkles } from 'lucide-react';
import { useQuiz, useUpdateQuiz } from '@/features/quizzes/api';
import { AIQuestionGeneratorModal } from '@/components/ui/AIQuestionGeneratorModal';
import type { GeneratePayload } from '@/components/ui/AIQuestionGeneratorModal';
import type { OptionRequest, QuestionRequest, QuestionType, QuestionDto, OptionDto } from '@/types/api.types';

// ─── Local UI types ────────────────────────────────────────────────────────

interface UIOption {
    text: string;
    isCorrect: boolean;
    backendId?: string;  // Preserve backend ID for updates
}

interface UIQuestion {
    uid: number;
    type: QuestionType;
    text: string;
    instructions: string;
    mark: number;
    explanation: string;
    options: UIOption[];
    backendId?: string;  // Preserve backend ID for updates
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

const makeAIDraftQuestion = (uid: number, topic: string): UIQuestion => ({
    uid,
    type: 'MCQ',
    text: `Which statement best explains ${topic}?`,
    instructions: `Choose the single best answer related to ${topic}.`,
    mark: 5,
    explanation: `This checks core understanding of ${topic} before moving to advanced items.`,
    options: [
        { text: `${topic} focuses on applying key concepts to practical scenarios.`, isCorrect: true },
        { text: `${topic} is only about memorizing definitions without application.`, isCorrect: false },
        { text: `${topic} has no relation to real-world problem solving.`, isCorrect: false },
    ],
});

const makePrioritizedAIDraftQuestion = (
    uid: number,
    topic: string,
    type: 'MCQ' | 'Written',
    level: 'Hard' | 'Medium' | 'Easy'
): UIQuestion => {
    if (type === 'Written') {
        const promptByLevel =
            level === 'Hard'
                ? `Analyze a difficult classroom scenario using ${topic} and justify your decision.`
                : level === 'Medium'
                    ? `Explain one applied strategy of ${topic} and its expected outcome.`
                    : `Write a short explanation of a basic ${topic} concept.`;

        return {
            uid,
            type: 'Written',
            text: promptByLevel,
            instructions: `Difficulty: ${level}. Answer with one practical example.`,
            mark: 5,
            explanation: '',
            options: [],
        };
    }

    const base = makeAIDraftQuestion(uid, topic);
    return {
        ...base,
        text:
            level === 'Hard'
                ? `Which advanced statement best explains ${topic} for complex decision-making?`
                : level === 'Medium'
                    ? `Which statement best applies ${topic} in realistic teaching scenarios?`
                    : `Which statement best introduces the fundamentals of ${topic}?`,
        instructions: `Difficulty: ${level}. ${base.instructions}`,
    };
};

const buildPrioritizedAIQuestions = (startUid: number, topic: string, payload: GeneratePayload): UIQuestion[] => {
    const total = 3;
    const requestedTotal = Math.max(1, payload.mcqCount + payload.writtenCount);
    const ratioMcq = payload.mcqCount / requestedTotal;
    const mcqTarget = Math.max(2, Math.min(3, Math.round(ratioMcq * total)));
    const writtenTarget = total - mcqTarget;

    const levels: Array<'Hard' | 'Medium' | 'Easy'> = [];
    const hardCount = Math.max(1, Math.round((payload.difficulty.hard / 100) * total));
    const mediumCount = Math.max(0, Math.round((payload.difficulty.medium / 100) * total));
    for (let i = 0; i < Math.min(total, hardCount); i++) levels.push('Hard');
    for (let i = 0; i < Math.min(total - levels.length, mediumCount); i++) levels.push('Medium');
    while (levels.length < total) levels.push(levels.length < 2 ? 'Hard' : 'Easy');

    const types: Array<'MCQ' | 'Written'> = [
        ...Array.from({ length: mcqTarget }, () => 'MCQ' as const),
        ...Array.from({ length: writtenTarget }, () => 'Written' as const),
    ];

    return Array.from({ length: total }, (_, i) =>
        makePrioritizedAIDraftQuestion(startUid + i, topic, types[i], levels[i])
    );
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
    options: dto.options.map(convertOptionDtoToUI),
    backendId: dto.id,
});

// ─── Payload builders ──────────────────────────────────────────────────────

const buildPayloadOptions = (q: UIQuestion): OptionRequest[] =>
    q.options.map(o => ({ optionText: o.text, isCorrect: o.isCorrect }));

const buildPayloadQuestion = (q: UIQuestion): QuestionRequest => ({
    id: q.backendId,  // Include ID for existing questions, undefined for new
    questionType: q.type,
    questionText: q.text,
    mark: q.mark,
    instructions: q.instructions || undefined,
    explanation: q.explanation || undefined,
    options: buildPayloadOptions(q),
});

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls =
    'w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100';
const labelCls = 'block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2';

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionsEditPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: quizId } = useParams<{ id: string }>();
    const settings = (location.state as any)?.settings;

    const { data: quiz, isLoading: quizLoading } = useQuiz(quizId ?? '');
    const updateQuizMutation = useUpdateQuiz(settings?.courseId ?? quiz?.courseId ?? '');
    const isDraftQuiz = settings?.status === 'Draft' || quiz?.quizStatus === 'Draft';

    const [questions, setQuestions] = useState<UIQuestion[]>([]);
    const [counter, setCounter] = useState(1);
    const [draggedUid, setDraggedUid] = useState<number | null>(null);
    const [draggedOption, setDraggedOption] = useState<{ uid: number; idx: number } | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [success, setSuccess] = useState(false);

    // Load existing quiz questions on mount
    useEffect(() => {
        if (!quiz || loaded) return;

        if (quiz.questions && quiz.questions.length > 0) {
            const uiQuestions = quiz.questions.map((q, idx) => convertQuestionDtoToUI(q, idx + 1));
            setQuestions(uiQuestions);
            setCounter(uiQuestions.length + 1);
        } else if (!isDraftQuiz) {
            // For non-draft quizzes without questions, start with one question
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

    const handleGenerateWithAI = () => {
        setShowAIModal(true);
    };

    const handleAIGenerate = (data: GeneratePayload) => {
        const rawTopic = String(settings?.title || quiz?.title || settings?.description || data.instructions || 'this topic').trim();
        const topic = rawTopic.replace(/\s+/g, ' ').slice(0, 80) || 'this topic';

        const newQuestions = buildPrioritizedAIQuestions(counter, topic, data);

        setQuestions(qs => [...qs, ...newQuestions]);
        setCounter(c => c + newQuestions.length);
        setError('');
        setShowAIModal(false);
    };

    if (showAIModal) {
        return (
            <AIQuestionGeneratorModal
                isOpen={true}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleAIGenerate}
            />
        );
    }

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
        const options =
            type === 'MCQ' ? makeMCQOptions() :
                type === 'TrueFalse' ? makeTFOptions() : [];
        updateQ(uid, { type, options });
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

    const validate = (): string | null => {
        if (isDraftQuiz) return null;

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
                if (q.options.length < 3 || q.options.length > 5)
                    return `${n}: MCQ must have 3–5 options.`;
                if (q.options.some(o => !o.text.trim()))
                    return `${n}: All option texts are required.`;
                if (q.options.filter(o => o.isCorrect).length !== 1)
                    return `${n}: Exactly one correct option is required.`;
            }

            if (q.type === 'TrueFalse') {
                if (q.options.filter(o => o.isCorrect).length !== 1)
                    return `${n}: Select the correct answer (True or False).`;
            }
        }
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');

        const payloadQuestions = questions.map(buildPayloadQuestion);

        const payload = {
            title: settings?.title || quiz?.title,
            // Backend currently validates description as required; keep UI optional with a safe fallback.
            description:
                settings?.description?.trim() ||
                quiz?.description?.trim() ||
                settings?.title?.trim() ||
                quiz?.title?.trim() ||
                'Quiz',
            courseId: Number(settings?.courseId || quiz?.courseId) as any,
            maximumAttempts: settings?.maximumAttempts ?? quiz?.maximumAttempts,
            status: settings?.status || quiz?.quizStatus,
            availableFrom: settings?.availableFrom ? new Date(settings.availableFrom).toISOString() : quiz?.availableFrom,
            availableUntil: settings?.availableUntil ? new Date(settings.availableUntil).toISOString() : quiz?.availableUntil,
            publishedDate:
                settings?.status === 'Scheduled' && settings?.publishedDate
                    ? new Date(settings.publishedDate).toISOString()
                    : quiz?.publishedDate,
            showResultOnClose: settings?.showResultOnClose ?? quiz?.showResultOnClose ?? false,
            shuffleQuestions: settings?.shuffleQuestions ?? quiz?.shuffleQuestions ?? false,
            shuffleOptions: settings?.shuffleOptions ?? quiz?.shuffleOptions ?? false,
            questions: payloadQuestions,
        };

        try {
            await updateQuizMutation.mutateAsync({ id: quizId!, cmd: payload });
            storage.remove(STORAGE_KEYS.QUIZ_EDIT_DRAFT);
            setSuccess(true);
            setTimeout(() => navigate(-2), 1500);
        } catch (e: any) {
            console.error('[UpdateQuiz] error:', e?.response?.status, e?.response?.data, e);
            const d = e?.response?.data;
            const fieldErrors = d?.errors
                ? Object.entries(d.errors as Record<string, string[]>)
                    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                    .join(' | ')
                : null;
            const title = d?.message || d?.title;
            const extracted = fieldErrors
                ? (title ? `${title} — ${fieldErrors}` : fieldErrors)
                : (title || e?.message || 'Failed to update quiz. Please try again.');
            setError(extracted);
        }
    };

    if (quizLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
                Quiz not found.
            </div>
        );
    }

    const isLoading = updateQuizMutation.isPending;
    const statusBadgeClass =
        (settings?.status || quiz.quizStatus) === 'Published'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : (settings?.status || quiz.quizStatus) === 'Scheduled'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300';

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
        document.getElementById(`question-card-${uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const getQuestionName = (q: UIQuestion, idx: number): string => {
        const raw = q.text.trim();
        if (!raw) return `Untitled Question ${idx + 1}`;
        return raw.length > 44 ? `${raw.slice(0, 44)}...` : raw;
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
                <div className="space-y-6">

                    {/* Header card */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-[30px] font-bold text-gray-900 dark:text-zinc-100 mb-1">
                                        Edit Quiz Questions
                                    </h1>
                                    <p className="text-[16px] text-gray-600 dark:text-zinc-400">
                                        Step 2 of 2 — Edit questions for "{settings?.title || quiz.title}"
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass}`}>
                                            Status: {settings?.status || quiz.quizStatus}
                                        </span>
                                        {isDraftQuiz && (
                                            <span className="text-[12px] text-slate-600 dark:text-zinc-400">
                                                Draft quizzes can be saved without questions.
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAIModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-[14px] font-medium text-blue-700 dark:text-blue-300"
                                    >
                                        <Sparkles className="w-4 h-4" /> Generate with AI
                                    </button>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feedback banners */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-[14px] text-red-700 dark:text-red-300 font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="text-[14px] text-green-700 dark:text-green-300 font-medium">
                                Quiz updated successfully! Redirecting...
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
                        <Card variant="elevated" className="xl:sticky xl:top-6">
                            <CardContent className="p-4">
                                <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">
                                    Quiz Map
                                </p>
                                {questions.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 p-3 text-[13px] text-gray-500 dark:text-zinc-400">
                                        No questions yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
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
                                                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${complete
                                                        ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <GripVertical className="w-3.5 h-3.5 mt-0.5 text-gray-400 dark:text-zinc-500" />
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] text-gray-500 dark:text-zinc-400">Question {idx + 1}</div>
                                                            <div className="text-[13px] font-medium text-gray-900 dark:text-zinc-100 truncate">{getQuestionName(q, idx)}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[11px] ${complete ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                                                        {complete ? 'Complete' : 'Incomplete'}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            {/* Questions */}
                            {questions.map((q, idx) => (
                                <Card key={q.uid} variant="elevated" id={`question-card-${q.uid}`}>
                                    <CardContent className="p-6 space-y-4">

                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">
                                                    Question {idx + 1}
                                                </h3>
                                                {isQuestionComplete(q) ? (
                                                    <span className="text-[12px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                                        Complete
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                                                        Incomplete
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeQ(q.uid)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className={labelCls}>Question Type</label>
                                            <select
                                                value={q.type}
                                                onChange={e => changeType(q.uid, e.target.value as QuestionType)}
                                                className={inputCls}
                                            >
                                                <option value="MCQ">Multiple Choice (MCQ)</option>
                                                <option value="TrueFalse">True / False</option>
                                                <option value="Written">Written Answer</option>
                                            </select>
                                        </div>

                                        {/* Question text */}
                                        <div>
                                            <label className={labelCls}>
                                                Question Text <span className="text-red-500">*</span>
                                                <span className="ml-2 font-normal text-gray-400 dark:text-zinc-500">
                                                    ({q.text.length}/1500)
                                                </span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                maxLength={1500}
                                                placeholder="Enter your question..."
                                                value={q.text}
                                                onChange={e => updateQ(q.uid, { text: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>

                                        {/* Points */}
                                        <div className="w-48">
                                            <label className={labelCls}>
                                                Points <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0.5"
                                                max="100"
                                                step="0.5"
                                                value={q.mark}
                                                onChange={e =>
                                                    updateQ(q.uid, { mark: parseFloat(e.target.value) || 1 })
                                                }
                                                className={inputCls}
                                            />
                                        </div>

                                        {/* MCQ options */}
                                        {q.type === 'MCQ' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className={`${labelCls} mb-0`}>
                                                        Options <span className="text-red-500">*</span>
                                                    </label>
                                                    {q.options.length < 5 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addOption(q.uid)}
                                                            className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div
                                                                draggable
                                                                onDragStart={() => setDraggedOption({ uid: q.uid, idx: i })}
                                                                onDragOver={e => e.preventDefault()}
                                                                onDrop={() => {
                                                                    if (draggedOption && draggedOption.uid === q.uid && draggedOption.idx !== i) {
                                                                        moveOption(q.uid, draggedOption.idx, i);
                                                                    }
                                                                    setDraggedOption(null);
                                                                }}
                                                                onDragEnd={() => setDraggedOption(null)}
                                                                className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                                                            >
                                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                            <span className="text-[14px] text-gray-600 dark:text-zinc-400 w-6">
                                                                {String.fromCharCode(65 + i)}.
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                                value={opt.text}
                                                                onChange={e => updateOpt(q.uid, i, { text: e.target.value })}
                                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-[14px] bg-white dark:bg-zinc-800"
                                                            />
                                                            <input
                                                                type="radio"
                                                                name={`correct-${q.uid}`}
                                                                checked={opt.isCorrect}
                                                                onChange={() => setCorrect(q.uid, i)}
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <span className="text-[12px] text-gray-500 dark:text-zinc-500 w-16">
                                                                Correct
                                                            </span>
                                                            {q.options.length > 3 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOption(q.uid, i)}
                                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-2">
                                                    Select the correct answer. You can have 3–5 options. Drag to reorder.
                                                </p>
                                            </div>
                                        )}

                                        {/* True/False options */}
                                        {q.type === 'TrueFalse' && (
                                            <div>
                                                <label className={labelCls}>
                                                    Correct Answer <span className="text-red-500">*</span>
                                                </label>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <label key={i} className="flex items-center gap-3 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
                                                            <input
                                                                type="radio"
                                                                name={`tf-${q.uid}`}
                                                                checked={opt.isCorrect}
                                                                onChange={() => setCorrect(q.uid, i)}
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <span className="text-[14px] font-medium">{opt.text}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Instructions */}
                                        <div>
                                            <label className={labelCls}>
                                                Instructions{' '}
                                                <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Add student-facing instruction for this question..."
                                                value={q.instructions}
                                                onChange={e => updateQ(q.uid, { instructions: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>

                                        {/* Explanation */}
                                        <div>
                                            <label className={labelCls}>
                                                Explanation{' '}
                                                <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Explain the correct answer..."
                                                value={q.explanation}
                                                onChange={e => updateQ(q.uid, { explanation: e.target.value })}
                                                className={`${inputCls} resize-none`}
                                            />
                                        </div>

                                    </CardContent>
                                </Card>
                            ))}

                            {/* Add question button */}
                            <button
                                onClick={addQuestion}
                                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-[14px] font-medium">Add Question</span>
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-[14px] text-gray-600 dark:text-zinc-400">
                                    {questions.length} question{questions.length !== 1 ? 's' : ''} •{' '}
                                    {questions.reduce((sum, q) => sum + q.mark, 0)} total points
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Update Quiz
                                        </>
                                    )}
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </>
    );
};
