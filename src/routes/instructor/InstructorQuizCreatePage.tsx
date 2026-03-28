import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { CreateQuizCommand, QuizStatus } from '@/types/api.types';
import { ROUTES } from '@/lib/constants';

interface QuizSettings {
    title: string;
    description: string;
    availableUntil: string;
    maximumAttempts: number;
    status: QuizStatus;
    availableFrom: string;
    publishedDate: string;
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

/** Format an ISO/UTC date string to datetime-local input value (YYYY-MM-DDTHH:MM) */
const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Convert datetime-local input value to ISO/UTC string for backend submission */
const toISOStringFromLocal = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    const d = new Date(datetimeLocal);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString();
};

const defaultDateRange = () => {
    const from = new Date();
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
        availableFrom: toDatetimeLocal(from.toISOString()),
        availableUntil: toDatetimeLocal(until.toISOString()),
    };
};

export const InstructorQuizCreatePage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const [error, setError] = useState('');

    const [settings, setSettings] = useState<QuizSettings>(() => {
        const { availableFrom, availableUntil } = defaultDateRange();
        return {
            title: '',
            description: '',
            availableUntil,
            maximumAttempts: 1,
            status: 'Draft',
            availableFrom,
            publishedDate: '',
            showResultOnClose: true,
            shuffleQuestions: true,
            shuffleOptions: true,
        };
    });

    const set = (patch: Partial<QuizSettings>) =>
        setSettings(s => ({ ...s, ...patch }));

    const validate = (): string | null => {
        if (!settings.title.trim()) return 'Quiz title is required.';
        if (settings.title.length > 255) return 'Title must be 255 characters or less.';
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

    const buildCommand = (): CreateQuizCommand => {
        const availableFrom = toISOStringFromLocal(settings.availableFrom);
        const availableUntil = toISOStringFromLocal(settings.availableUntil);
        const description =
            settings.description?.trim() || settings.title.trim() || 'Quiz';
        return {
            title: settings.title.trim(),
            description,
            courseId: courseId!,
            maximumAttempts: settings.maximumAttempts,
            status: settings.status,
            availableFrom,
            availableUntil,
            publishedDate:
                settings.status === 'Scheduled'
                    ? toISOStringFromLocal(settings.publishedDate)
                    : undefined,
            showResultOnClose: settings.showResultOnClose,
            shuffleQuestions: settings.shuffleQuestions,
            shuffleOptions: settings.shuffleOptions,
            questions: [],
        };
    };

    /** Step 1: go to question builder; API create runs there on final submit. */
    const handleNextToQuestions = () => {
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setError('');
        const cmd = buildCommand();
        navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, {
            state: {
                settings: cmd,
                courseId: courseId!,
            },
        });
    };

    if (!courseId) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    Invalid request
                </h1>
                <p className="text-gray-500 dark:text-zinc-400 mb-6">Course ID is missing.</p>
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg cursor-pointer"
                >
                    Back to courses
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                </button>
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 dark:text-zinc-100">
                        Create Quiz
                    </h1>
                    <p className="text-[14px] text-gray-500 dark:text-zinc-400">
                        Set up timing, attempts, and behavior—then add questions.
                    </p>
                </div>
            </div>

            <Card variant="elevated">
                <CardContent className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-[14px]">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className={labelCls}>
                            Quiz Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={settings.title}
                            onChange={e => set({ title: e.target.value })}
                            className={inputCls}
                            placeholder="Enter quiz title"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className={labelCls}>
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={settings.description}
                            onChange={e => set({ description: e.target.value })}
                            rows={3}
                            className={inputCls}
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="availableFrom" className={labelCls}>
                                Available From <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="availableFrom"
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
                            <label htmlFor="availableUntil" className={labelCls}>
                                Available Until <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="availableUntil"
                                type="datetime-local"
                                value={settings.availableUntil}
                                onChange={e => set({ availableUntil: e.target.value })}
                                min={
                                    settings.availableFrom ||
                                    new Date().toISOString().slice(0, 16)
                                }
                                className={inputCls}
                            />
                            <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">
                                Last moment a student can enter the quiz.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="maximumAttempts" className={labelCls}>
                            Attempts Allowed <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="maximumAttempts"
                            type="number"
                            min={1}
                            max={5}
                            value={settings.maximumAttempts}
                            onChange={e =>
                                set({
                                    maximumAttempts: Math.min(
                                        5,
                                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                                    ),
                                })
                            }
                            className={`${inputCls} max-w-xs`}
                        />
                        <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">
                            1 – 5 attempts.
                        </p>
                    </div>

                    <div>
                        <div className={labelCls}>Publish Status</div>
                        <div className="space-y-2">
                            {PUBLISH_OPTIONS.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                                        settings.status === opt.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <input
                                        id={`status-${opt.value}`}
                                        type="radio"
                                        name="status"
                                        value={opt.value}
                                        checked={settings.status === opt.value}
                                        onChange={() => set({ status: opt.value })}
                                        className="w-4 h-4 text-blue-600 mt-0.5 cursor-pointer"
                                    />
                                    <label
                                        htmlFor={`status-${opt.value}`}
                                        className="cursor-pointer w-full"
                                    >
                                        <div className="font-medium text-[14px] text-gray-900 dark:text-zinc-100">
                                            {opt.title}
                                        </div>
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">
                                            {opt.desc}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {settings.status === 'Scheduled' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label htmlFor="publishedDate" className={labelCls}>
                                Publish Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="publishedDate"
                                type="datetime-local"
                                value={settings.publishedDate}
                                onChange={e => set({ publishedDate: e.target.value })}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-blue-700 dark:text-blue-400 mt-1">
                                Must be in the future and <strong>before</strong> &quot;Available
                                From&quot;.
                            </p>
                        </div>
                    )}

                    <div>
                        <div className={labelCls}>Quiz Behavior</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                {
                                    key: 'showResultOnClose' as const,
                                    label: 'Show results on close',
                                    desc: 'Show correct answers to students after the quiz ends',
                                },
                                {
                                    key: 'shuffleQuestions' as const,
                                    label: 'Shuffle questions',
                                    desc: 'Randomize the order of questions for each attempt',
                                },
                                {
                                    key: 'shuffleOptions' as const,
                                    label: 'Shuffle options',
                                    desc: 'Randomize the order of answer choices',
                                },
                            ].map(({ key, label, desc }) => (
                                <div
                                    key={key}
                                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                                        settings[key]
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <input
                                        id={key}
                                        type="checkbox"
                                        checked={settings[key]}
                                        onChange={e => set({ [key]: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 mt-0.5 cursor-pointer"
                                    />
                                    <label htmlFor={key} className="cursor-pointer w-full">
                                        <div className="font-medium text-[14px] text-gray-900 dark:text-zinc-100">
                                            {label}
                                        </div>
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">
                                            {desc}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 font-medium text-[14px] rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleNextToQuestions}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors cursor-pointer"
                        >
                            Next: Add questions
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
