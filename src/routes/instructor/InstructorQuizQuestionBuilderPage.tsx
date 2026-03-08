import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateQuiz } from '@/features/quizzes/api';
import type { AddOptionRequest, AddQuestionRequest, QuestionType } from '@/types/api.types';

// ─── Local UI types ────────────────────────────────────────────────────────

interface UIOption {
    text: string;
    isCorrect: boolean;
}

interface UIQuestion {
    uid: number;
    type: QuestionType;
    text: string;
    mark: number;
    explanation: string;
    options: UIOption[];
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const makeMCQOptions = (): UIOption[] => [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

const makeTFOptions = (): UIOption[] => [
    { text: 'True',  isCorrect: true  },
    { text: 'False', isCorrect: false },
];

const defaultQuestion = (uid: number): UIQuestion => ({
    uid,
    type: 'MCQ',
    text: '',
    mark: 5,
    explanation: '',
    options: makeMCQOptions(),
});

// ─── Payload builders ──────────────────────────────────────────────────────

const buildPayloadOptions = (q: UIQuestion): AddOptionRequest[] =>
    q.options.map(o => ({ questionText: o.text, isCorrect: o.isCorrect }));

const buildPayloadQuestion = (q: UIQuestion): AddQuestionRequest => ({
    questionType: q.type,
    questionText: q.text,
    mark: q.mark,
    explanation: q.explanation || undefined,
    options: buildPayloadOptions(q),
});

// ─── Shared style constants ────────────────────────────────────────────────

const inputCls =
    'w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100';
const labelCls = 'block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2';

// ─── Component ─────────────────────────────────────────────────────────────

export const InstructorQuizQuestionBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const settings = (location.state as any)?.settings;

    const createQuizMutation = useCreateQuiz();

    const [questions, setQuestions] = useState<UIQuestion[]>([defaultQuestion(1)]);
    const [counter,   setCounter]   = useState(2);
    const [error,     setError]     = useState('');
    const [success,   setSuccess]   = useState(false);

    // Guard: if no settings, go back to step 1
    useEffect(() => {
        if (!settings) navigate(ROUTES.INSTRUCTOR_QUIZ_CREATE);
    }, [settings, navigate]);

    // ── Question helpers ──────────────────────────────────────────────────

    const updateQ = (uid: number, patch: Partial<UIQuestion>) =>
        setQuestions(qs => qs.map(q => q.uid === uid ? { ...q, ...patch } : q));

    const removeQ = (uid: number) =>
        setQuestions(qs => qs.filter(q => q.uid !== uid));

    const addQuestion = () => {
        setQuestions(qs => [...qs, defaultQuestion(counter)]);
        setCounter(c => c + 1);
    };

    const changeType = (uid: number, type: QuestionType) => {
        const options =
            type === 'MCQ'       ? makeMCQOptions() :
            type === 'TrueFalse' ? makeTFOptions()  : [];
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

    // ── Validation ────────────────────────────────────────────────────────

    const validate = (): string | null => {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const n = `Question ${i + 1}`;
            if (!q.text.trim())       return `${n}: Question text is required.`;
            if (q.text.length > 1500) return `${n}: Max 1500 characters.`;
            if (q.mark <= 0)          return `${n}: Points must be greater than 0.`;

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

        // Compute availableUntil = availableFrom + durationMinutes
        const from  = new Date(settings.availableFrom);
        const until = new Date(from.getTime() + settings.durationMinutes * 60_000);

        const payload = {
            title:             settings.title,
            description:       settings.description || undefined,
            courseId:          settings.courseId,
            maximumAttempts:   settings.maximumAttempts,
            quizStatus:        settings.quizStatus,
            availableFrom:     from.toISOString(),
            availableUntil:    until.toISOString(),
            publishedDate:
                settings.quizStatus === 'Scheduled' && settings.publishedDate
                    ? new Date(settings.publishedDate).toISOString()
                    : undefined,
            showResultOnClose: false,
            shuffleQuestions:  false,
            shuffleOptions:    false,
            questions:         questions.map(buildPayloadQuestion),
        };

        try {
            await createQuizMutation.mutateAsync(payload);
            setSuccess(true);
            setTimeout(() => navigate(-2), 1500);
        } catch (e: any) {
            setError(
                e?.response?.data?.message ?? 'Failed to create quiz. Please try again.'
            );
        }
    };

    const isLoading = createQuizMutation.isPending;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header card */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-[30px] font-bold text-gray-900 dark:text-zinc-100 mb-1">
                                    Question Builder
                                </h1>
                                <p className="text-[16px] text-gray-600 dark:text-zinc-400">
                                    Step 2 of 2 — Questions for "{settings?.title}"
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Feedback banners */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                            Quiz created successfully! Redirecting…
                        </p>
                    </div>
                )}

                {/* Question cards */}
                {questions.map((q, idx) => (
                    <Card key={q.uid} variant="elevated">
                        <CardContent className="p-6 space-y-5">

                            {/* Q header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">
                                    Question {idx + 1}
                                </h3>
                                {questions.length > 1 && (
                                    <button
                                        onClick={() => removeQ(q.uid)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
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
                                            <span className="ml-2 font-normal text-gray-400 dark:text-zinc-500">
                                                ({q.options.length}/5, min 3)
                                            </span>
                                        </label>
                                        {q.options.length < 5 && (
                                            <button
                                                onClick={() => addOption(q.uid)}
                                                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                + Add Option
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.uid}`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => setCorrect(q.uid, oi)}
                                                    className="w-4 h-4 text-blue-600 flex-shrink-0"
                                                    title="Mark as correct answer"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={`Option ${oi + 1}`}
                                                    value={opt.text}
                                                    onChange={e => updateOpt(q.uid, oi, { text: e.target.value })}
                                                    className={`${inputCls} flex-1`}
                                                />
                                                {q.options.length > 3 && (
                                                    <button
                                                        onClick={() => removeOption(q.uid, oi)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">
                                        Click the radio button to mark the correct answer.
                                    </p>
                                </div>
                            )}

                            {/* True/False */}
                            {q.type === 'TrueFalse' && (
                                <div>
                                    <label className={labelCls}>
                                        Correct Answer <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oi) => (
                                            <label
                                                key={oi}
                                                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                                    opt.isCorrect
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`tf-${q.uid}`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => setCorrect(q.uid, oi)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">
                                                    {opt.text}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Written note */}
                            {q.type === 'Written' && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-[13px] text-blue-800 dark:text-blue-300">
                                        Written questions are manually graded after submission. No options needed.
                                    </p>
                                </div>
                            )}

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
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800/50 transition-colors text-[14px] font-medium text-gray-600 dark:text-zinc-400"
                >
                    <Plus className="w-5 h-5" /> Add Another Question
                </button>

                {/* Footer actions */}
                <div className="flex items-center justify-between pb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Settings
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || success}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium text-[14px] rounded-lg transition-colors"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4" /> Create Quiz</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

