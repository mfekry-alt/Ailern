import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import type { QuizStatus } from '@/types/api.types';

interface QuizSettings {
    title: string;
    description: string;
    availableUntil: string;
    maximumAttempts: number;
    status: QuizStatus | '';
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
    { value: 'Published', title: 'Publish Immediately', desc: 'Visible to students right away after creation' },
    { value: 'Scheduled', title: 'Schedule', desc: 'Set a future publish date' },
];

export const InstructorQuizCreatePage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [hydrated, setHydrated] = useState(false);

    const [settings, setSettings] = useState<QuizSettings>({
        title: '',
        description: '',
        availableUntil: '',
        maximumAttempts: 1,
        status: '',
        availableFrom: '',
        publishedDate: '',
        courseId: '1018',
        showResultOnClose: false,
        shuffleQuestions: false,
        shuffleOptions: false,
    });

    const set = (patch: Partial<QuizSettings>) =>
        setSettings(s => ({ ...s, ...patch }));

    // Load persisted settings from localStorage on mount
    useEffect(() => {
        const persisted = storage.get<QuizSettings>(STORAGE_KEYS.QUIZ_SETTINGS_DRAFT);
        if (persisted) {
            // Force temporary courseId target for API integration.
            setSettings(prev => ({
                ...persisted,
                courseId: '1018',
            }));
        }
        setHydrated(true);
    }, []);

    // Save settings to localStorage whenever they change (after hydration)
    useEffect(() => {
        if (hydrated) {
            storage.set(STORAGE_KEYS.QUIZ_SETTINGS_DRAFT, settings);
        }
    }, [settings, hydrated]);

    const validate = (): string | null => {
        if (!settings.title.trim()) return 'Quiz title is required.';
        if (!settings.status) return 'Please choose a publish status.';
        if (settings.maximumAttempts < 1 || settings.maximumAttempts > 5)
            return 'Attempts allowed must be between 1 and 5.';
        if (!settings.availableFrom) return 'Available From date & time is required.';
        if (new Date(settings.availableFrom) <= new Date())
            return 'Available From must be in the future.';
        if (!settings.availableUntil) return '"Available Until" date & time is required.';
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
        navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, {
            state: { settings: { ...settings, status: settings.status as QuizStatus, courseId: '1018' } },
        });
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div>
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="space-y-6">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-[30px] font-bold text-gray-900 dark:text-zinc-100 mb-1">
                                        Create New Quiz
                                    </h1>
                                    <p className="text-[16px] text-gray-600 dark:text-zinc-400">
                                        Step 1 of 2 — Quiz Settings
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className={labelCls}>
                                    Quiz Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Midterm Exam — Chapter 1–5"
                                    value={settings.title}
                                    onChange={e => set({ title: e.target.value })}
                                    className={inputCls}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Instructions or info for students..."
                                    value={settings.description}
                                    onChange={e => set({ description: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>

                            {/* Available From / Available Until */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    min="1"
                                    max="5"
                                    value={settings.maximumAttempts}
                                    onChange={e =>
                                        set({
                                            maximumAttempts: Math.min(
                                                5,
                                                Math.max(1, parseInt(e.target.value) || 1)
                                            ),
                                        })
                                    }
                                    className={`${inputCls} max-w-xs`}
                                />
                                <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">1 – 5 attempts.</p>
                            </div>

                            {/* Publish Options */}
                            <div>
                                <label className={labelCls}>Publish Options</label>
                                <div className="space-y-3">
                                    {PUBLISH_OPTIONS.map(opt => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${settings.status === opt.value
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
                                                className="w-4 h-4 text-blue-600"
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

                            {/* Footer */}
                            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-700">
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                                >
                                    Next: Add Questions →
                                </button>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

