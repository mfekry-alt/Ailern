import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, Settings, HelpCircle, CalendarClock, Eye, Timer } from 'lucide-react';
import type { CreateQuizCommand, QuizStatus } from '@/types/api.types';
import { ROUTES } from '@/lib/constants';

interface QuizSettings {
    title: string;
    description: string;
    availableFrom: string;
    availableUntil: string;
    maximumAttempts: number;
    attemptTimeLimit: number | ''; // <-- Allow empty string while typing
    status: QuizStatus;
    publishedDate: string;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

const getInputCls = (hasError: boolean) =>
    `w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-semibold text-gray-900 dark:text-white ${hasError
        ? 'border-red-500 focus:ring-red-500/50'
        : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/50'
    }`;

const PUBLISH_OPTIONS: { value: QuizStatus; title: string; desc: string }[] = [
    { value: 'Draft', title: 'Save as Draft', desc: 'Not visible to students yet' },
    { value: 'Published', title: 'Publish Immediately', desc: 'Visible to students right away' },
    { value: 'Scheduled', title: 'Schedule', desc: 'Set a future publish date' },
];

const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [settings, setSettings] = useState<QuizSettings>(() => {
        const { availableFrom, availableUntil } = defaultDateRange();
        return {
            title: '',
            description: '',
            availableUntil,
            maximumAttempts: 1,
            attemptTimeLimit: 5,
            status: 'Draft',
            availableFrom,
            publishedDate: '',
            showResultOnClose: true,
            shuffleQuestions: true,
            shuffleOptions: true,
        };
    });

    const set = (patch: Partial<QuizSettings>) => setSettings(s => ({ ...s, ...patch }));

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!settings.title.trim()) newErrors.title = 'Quiz title is required.';
        else if (settings.title.length > 255) newErrors.title = 'Title must be 255 characters or less.';

        if (settings.maximumAttempts < 1 || settings.maximumAttempts > 5)
            newErrors.maximumAttempts = 'Attempts allowed must be between 1 and 5.';

        if (settings.attemptTimeLimit === '' || Number(settings.attemptTimeLimit) < 5)
            newErrors.attemptTimeLimit = 'Time limit must be at least 5 minutes.';

        if (!settings.availableFrom) newErrors.availableFrom = 'Available From date & time is required.';

        if (!settings.availableUntil) newErrors.availableUntil = '"Available Until" is required.';
        else if (settings.availableFrom && new Date(settings.availableUntil) <= new Date(settings.availableFrom))
            newErrors.availableUntil = '"Available Until" must be after "Available From".';

        if (settings.status === 'Scheduled') {
            if (!settings.publishedDate) newErrors.publishedDate = 'Publish Date is required for scheduled quizzes.';
            else {
                const pd = new Date(settings.publishedDate);
                const now = new Date();
                if (pd <= now) newErrors.publishedDate = 'Publish Date must be in the future and cannot be in the past.';
                if (settings.availableFrom && pd >= new Date(settings.availableFrom))
                    newErrors.publishedDate = 'Publish Date must be before "Available From".';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const buildCommand = (): CreateQuizCommand & { attemptTimeLimit: number } => {
        const availableFrom = toISOStringFromLocal(settings.availableFrom);
        const availableUntil = toISOStringFromLocal(settings.availableUntil);
        const description = settings.description?.trim() || settings.title.trim() || 'Quiz';
        return {
            title: settings.title.trim(),
            description,
            courseId: courseId!,
            maximumAttempts: settings.maximumAttempts,
            attemptTimeLimit: Number(settings.attemptTimeLimit) || 0, // Ensure it's passed as number
            status: settings.status,
            availableFrom,
            availableUntil,
            publishedDate: settings.status === 'Scheduled' ? toISOStringFromLocal(settings.publishedDate) : undefined,
            showResultOnClose: settings.showResultOnClose,
            shuffleQuestions: settings.shuffleQuestions,
            shuffleOptions: settings.shuffleOptions,
            questions: [],
        } as any;
    };

    const handleNextToQuestions = () => {
        const isValid = validate();
        if (!isValid) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const cmd = buildCommand();
        navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, {
            state: { settings: cmd, courseId: courseId! },
        });
    };

    if (!courseId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-2xl text-center shadow-xl border border-gray-200 dark:border-slate-700">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid request</h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">Course ID is missing from the URL.</p>
                    <button type="button" onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md">
                        Back to My Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-blue-500" /> Create New Quiz
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                            Set up timing, attempts, and behavior—then add questions.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-8">

                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-indigo-500" /> Basic Information
                            </h3>
                            <div>
                                <label htmlFor="title" className={labelCls}>Quiz Title <span className="text-red-500">*</span></label>
                                <input id="title" type="text" value={settings.title} onChange={e => { set({ title: e.target.value }); clearError('title'); }} className={getInputCls(!!errors.title)} placeholder="e.g. Midterm Examination - Chapter 1 to 5" />
                                {errors.title && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.title}</p>}
                            </div>

                            <div>
                                <label htmlFor="description" className={labelCls}>Description (Optional)</label>
                                <textarea id="description" value={settings.description} onChange={e => set({ description: e.target.value })} rows={3} className={`${getInputCls(false)} resize-none`} placeholder="Add instructions or guidelines for the students..." />
                            </div>
                        </div>

                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <CalendarClock className="w-5 h-5 text-blue-500" /> Timing & Limits
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="availableFrom" className={labelCls}>Available From <span className="text-red-500">*</span></label>
                                    <input id="availableFrom" type="datetime-local" value={settings.availableFrom} onChange={e => { set({ availableFrom: e.target.value }); clearError('availableFrom'); }} min={new Date().toISOString().slice(0, 16)} className={getInputCls(!!errors.availableFrom)} />
                                    {errors.availableFrom ? <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.availableFrom}</p> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">When students can start.</p>}
                                </div>
                                <div>
                                    <label htmlFor="availableUntil" className={labelCls}>Available Until <span className="text-red-500">*</span></label>
                                    <input id="availableUntil" type="datetime-local" value={settings.availableUntil} onChange={e => { set({ availableUntil: e.target.value }); clearError('availableUntil'); }} min={settings.availableFrom || new Date().toISOString().slice(0, 16)} className={getInputCls(!!errors.availableUntil)} />
                                    {errors.availableUntil ? <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.availableUntil}</p> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Last moment a student can enter.</p>}
                                </div>

                                <div>
                                    <label htmlFor="maximumAttempts" className={labelCls}>Attempts Allowed <span className="text-red-500">*</span></label>
                                    <input id="maximumAttempts" type="number" min={1} max={5} value={settings.maximumAttempts} onChange={e => { set({ maximumAttempts: Math.min(5, Math.max(1, Number.parseInt(e.target.value, 10) || 1)) }); clearError('maximumAttempts'); }} className={getInputCls(!!errors.maximumAttempts)} />
                                    {errors.maximumAttempts ? <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.maximumAttempts}</p> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Between 1 and 5 attempts.</p>}
                                </div>

                                <div>
                                    <label htmlFor="attemptTimeLimit" className={labelCls}>Time Limit (Minutes) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="attemptTimeLimit"
                                            type="number"
                                            min={5}
                                            value={settings.attemptTimeLimit}
                                            onChange={e => {
                                                const val = e.target.value;
                                                set({ attemptTimeLimit: val === '' ? '' : Math.max(5, Number.parseInt(val, 10)) });
                                                clearError('attemptTimeLimit');
                                            }}
                                            className={`${getInputCls(!!errors.attemptTimeLimit)} pl-11`}
                                        />
                                    </div>
                                    {errors.attemptTimeLimit ? <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.attemptTimeLimit}</p> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Minimum <strong>5</strong> minutes required.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Eye className="w-5 h-5 text-purple-500" /> Visibility Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {PUBLISH_OPTIONS.map(opt => {
                                    const isSelected = settings.status === opt.value;
                                    return (
                                        <label key={opt.value} className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-bold text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>{opt.title}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>{opt.desc}</span>
                                            <input type="radio" name="status" value={opt.value} checked={isSelected} onChange={() => { set({ status: opt.value }); clearError('publishedDate'); }} className="hidden" />
                                        </label>
                                    );
                                })}
                            </div>

                            {settings.status === 'Scheduled' && (
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                    <label htmlFor="publishedDate" className={`${labelCls} !text-blue-700 dark:!text-blue-400`}>Publish Date & Time <span className="text-red-500">*</span></label>
                                    <input id="publishedDate" type="datetime-local" value={settings.publishedDate} onChange={e => { set({ publishedDate: e.target.value }); clearError('publishedDate'); }} min={new Date().toISOString().slice(0, 16)} className={`${getInputCls(!!errors.publishedDate)} !bg-white dark:!bg-slate-900`} />
                                    {errors.publishedDate ? <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.publishedDate}</p> : <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-2 ml-1">Must be in the future and <strong>before</strong> "Available From" date.</p>}
                                </div>
                            )}
                        </div>

                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-emerald-500" /> Quiz Behavior
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'showResultOnClose' as const, label: 'Show results on close', desc: 'Display correct answers after quiz ends' },
                                    { key: 'shuffleQuestions' as const, label: 'Shuffle questions', desc: 'Randomize order of questions' },
                                    { key: 'shuffleOptions' as const, label: 'Shuffle options', desc: 'Randomize order of answer choices' },
                                ].map(({ key, label, desc }) => {
                                    const isChecked = settings[key];
                                    return (
                                        <label key={key} className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                            <div className="flex-1">
                                                <div className={`font-bold text-sm mb-1 ${isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>{label}</div>
                                                <div className={`text-xs font-medium ${isChecked ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>{desc}</div>
                                            </div>
                                            <div className="pt-0.5">
                                                <input type="checkbox" checked={isChecked as boolean} onChange={e => set({ [key]: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm">
                            Cancel
                        </button>
                        <button type="button" onClick={handleNextToQuestions} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 text-sm">
                            Next: Add Questions <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};