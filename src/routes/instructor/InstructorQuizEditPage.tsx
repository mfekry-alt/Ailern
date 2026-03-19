import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Loader2, ArrowRight } from 'lucide-react';
import { useQuiz, useUpdateQuiz } from '@/features/quizzes/api';
import type { QuizStatus, QuestionRequest } from '@/types/api.types';
import { ROUTES } from '@/lib/constants';

interface QuizSettings {
    title: string;
    description: string;
    availableUntil: string;
    maximumAttempts: number;
    status: QuizStatus;
    availableFrom: string;
    publishedDate: string;
    courseId: string;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

const inputCls =
    'w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100';
const labelCls = 'block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2';

const PUBLISH_OPTIONS: { value: QuizStatus; title: string; desc: string }[] = [
    { value: 'Draft', title: 'Save as Draft', desc: 'Not visible to students yet' },
    { value: 'Published', title: 'Publish Immediately', desc: 'Visible to students right away' },
    { value: 'Scheduled', title: 'Schedule', desc: 'Set a future publish date' },
];

const resolveQuizStatus = (quiz: unknown): QuizStatus => {
    const status = (quiz as { quizStatus?: QuizStatus; status?: QuizStatus })?.quizStatus
        ?? (quiz as { quizStatus?: QuizStatus; status?: QuizStatus })?.status;
    return status ?? 'Draft';
};

/** Format an ISO/UTC date string to datetime-local input value (YYYY-MM-DDTHH:MM) */
const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const InstructorQuizEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data: quiz, isLoading: quizLoading } = useQuiz(id ?? '');
    const [error, setError] = useState('');
    const [populated, setPopulated] = useState(false);

    const [settings, setSettings] = useState<QuizSettings>({
        title: '',
        description: '',
        availableUntil: '',
        maximumAttempts: 1,
        status: 'Draft',
        availableFrom: '',
        publishedDate: '',
        courseId: '',
        showResultOnClose: false,
        shuffleQuestions: false,
        shuffleOptions: false,
    });

    const set = (patch: Partial<QuizSettings>) =>
        setSettings(s => ({ ...s, ...patch }));

    const updateQuiz = useUpdateQuiz(settings.courseId);

    useEffect(() => {
        if (quiz && !populated) {
            setSettings({
                title: quiz.title,
                description: quiz.description ?? '',
                availableUntil: toDatetimeLocal(quiz.availableUntil),
                maximumAttempts: quiz.maximumAttempts,
                status: resolveQuizStatus(quiz),
                availableFrom: toDatetimeLocal(quiz.availableFrom),
                publishedDate: quiz.publishedDate ? toDatetimeLocal(quiz.publishedDate) : '',
                courseId: quiz.courseId,
                showResultOnClose: quiz.showResultOnClose ?? false,
                shuffleQuestions: quiz.shuffleQuestions ?? false,
                shuffleOptions: quiz.shuffleOptions ?? false,
            });
            setPopulated(true);
        }
    }, [quiz, populated]);

    const validate = (): string | null => {
        if (!settings.title.trim()) return 'Quiz title is required.';
        if (settings.maximumAttempts < 1 || settings.maximumAttempts > 5)
            return 'Attempts allowed must be between 1 and 5.';
        if (!settings.availableFrom) return 'Available From date & time is required.';
        if (!settings.availableUntil) return '"Available Until" is required.';
        if (new Date(settings.availableUntil) <= new Date(settings.availableFrom))
            return '"Available Until" must be after "Available From".';
        if (settings.status === 'Scheduled') {
            if (!settings.publishedDate) return 'Publish Date is required for scheduled quizzes.';
            const pd = new Date(settings.publishedDate);
            if (pd <= new Date()) return 'Publish Date must be in the future.';
            if (pd >= new Date(settings.availableFrom))
                return 'Publish Date must be before "Available From".';
        }
        return null;
    };

    const handleNext = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');

        // Navigate to questions edit page with current settings in state
        navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', id!), {
            state: { settings, fromEdit: true },
        });
    };

    const handleSettingsOnly = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');

        if (!quiz || !Array.isArray(quiz.questions)) {
            setError('Unable to load all existing questions for full update. Please continue to "Next: Edit Questions" and save from there.');
            return;
        }

        const availableFrom = settings.availableFrom;
        const availableUntil = new Date(settings.availableUntil).toISOString();
        const allQuestions: QuestionRequest[] = quiz.questions.map(q => ({
            id: q.id,
            questionType: q.questionType,
            questionText: q.questionText,
            mark: q.mark,
            instructions: q.instructions,
            explanation: q.explanation,
            options: q.options.map(o => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
            })),
        }));

        updateQuiz.mutate(
            {
                id: id!,
                cmd: {
                    title: settings.title,
                    // Backend currently validates description as required; keep UI optional with a safe fallback.
                    description: settings.description?.trim() || settings.title?.trim() || 'Quiz',
                    courseId: Number(settings.courseId) as any,
                    maximumAttempts: settings.maximumAttempts,
                    status: settings.status,
                    availableFrom,
                    availableUntil,
                    publishedDate: settings.status === 'Scheduled' ? settings.publishedDate : undefined,
                    showResultOnClose: settings.showResultOnClose,
                    shuffleQuestions: settings.shuffleQuestions,
                    shuffleOptions: settings.shuffleOptions,
                    // Backend expects full question collection on update, including unchanged questions.
                    questions: allQuestions,
                },
            },
            { onSuccess: () => navigate(-1) }
        );
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                </button>
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 dark:text-zinc-100">Update Quiz</h1>
                    <p className="text-[14px] text-gray-500 dark:text-zinc-400">Update quiz settings</p>
                </div>
            </div>

            <Card variant="elevated">
                <CardContent className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-[14px]">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className={labelCls}>
                            Quiz Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={settings.title}
                            onChange={e => set({ title: e.target.value })}
                            className={inputCls}
                            placeholder="Enter quiz title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea
                            value={settings.description}
                            onChange={e => set({ description: e.target.value })}
                            rows={3}
                            className={inputCls}
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Available From / Available Until */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>
                                Available From <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={settings.availableFrom}
                                onChange={e => set({ availableFrom: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">
                                When students can start the quiz.
                            </p>
                        </div>
                        <div>
                            <label className={labelCls}>
                                Available Until <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={settings.availableUntil}
                                onChange={e => set({ availableUntil: e.target.value })}
                                min={settings.availableFrom || new Date().toISOString().slice(0, 16)}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">
                                Last moment a student can enter the quiz.
                            </p>
                        </div>
                    </div>

                    {/* Attempts Allowed */}
                    <div>
                        <label className={labelCls}>
                            Attempts Allowed <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={settings.maximumAttempts}
                            onChange={e => set({ maximumAttempts: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                            className={`${inputCls} max-w-xs`}
                        />
                        <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">1 – 5 attempts.</p>
                    </div>

                    {/* Publish Status */}
                    <div>
                        <label className={labelCls}>Publish Status</label>
                        <div className="space-y-2">
                            {PUBLISH_OPTIONS.map(opt => (
                                <label
                                    key={opt.value}
                                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${settings.status === opt.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={opt.value}
                                        checked={settings.status === opt.value}
                                        onChange={() => set({ status: opt.value })}
                                        className="w-4 h-4 text-blue-600 mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-[14px] text-gray-900 dark:text-zinc-100">
                                            {opt.title}
                                        </div>
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">
                                            {opt.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Scheduled: Publish Date */}
                    {settings.status === 'Scheduled' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label className={labelCls}>
                                Publish Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={settings.publishedDate}
                                onChange={e => set({ publishedDate: e.target.value })}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-blue-700 dark:text-blue-400 mt-1">
                                Must be in the future and <strong>before</strong> "Available From".
                            </p>
                        </div>
                    )}

                    {/* Quiz Behavior Toggles */}
                    <div>
                        <label className={labelCls}>Quiz Behavior</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {[
                                { key: 'showResultOnClose' as const, label: 'Show results on close', desc: 'Show correct answers to students after the quiz ends' },
                                { key: 'shuffleQuestions' as const, label: 'Shuffle questions', desc: 'Randomize the order of questions for each attempt' },
                                { key: 'shuffleOptions' as const, label: 'Shuffle options', desc: 'Randomize the order of answer choices' },
                            ].map(({ key, label, desc }) => (
                                <label
                                    key={key}
                                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${settings[key]
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={settings[key]}
                                        onChange={e => set({ [key]: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-[14px] text-gray-900 dark:text-zinc-100">{label}</div>
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 font-medium text-[14px] rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSettingsOnly}
                                disabled={updateQuiz.isPending}
                                className="flex items-center gap-2 px-6 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 font-medium text-[14px] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
                            >
                                {updateQuiz.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                                    : <><Save className="w-4 h-4" /> Update Settings Only</>
                                }
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                            >
                                Next: Edit Questions <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
