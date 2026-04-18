import { useState } from 'react';
import { AlertTriangle, Settings, CalendarClock, Eye, Timer } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import type { QuizStatus } from '@/types/api.types';

export interface QuizFormData {
    title: string;
    description: string;
    availableFrom: string;
    availableUntil: string;
    maximumAttempts: number;
    attemptTimeLimit: number | '';
    status: QuizStatus;
    publishedDate: string;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

interface QuizFormProps {
    initialData?: Partial<QuizFormData>;
    onSubmit: (data: QuizFormData) => void | Promise<void>;
    isPending?: boolean;
    submitLabel: string;
    secondaryAction?: { label: string; onClick: (data: QuizFormData) => void | Promise<void>; isPending?: boolean };
    onCancel: () => void;
}

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

const getInputCls = (hasError: boolean) =>
    `w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-semibold text-gray-900 dark:text-white ${
        hasError
            ? 'border-red-500 focus:ring-red-500/50'
            : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/50'
    }`;

const PUBLISH_OPTIONS: { value: QuizStatus; title: string; desc: string }[] = [
    { value: 'Draft', title: 'Save as Draft', desc: 'Not visible to students yet' },
    { value: 'Published', title: 'Publish Immediately', desc: 'Visible to students right away' },
    { value: 'Scheduled', title: 'Schedule', desc: 'Set a future publish date' },
];

export const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const normalized = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toISOFromLocal = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    const d = new Date(datetimeLocal);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString();
};

const parseDateStr = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
};

const dateToLocalStr = (d: Date | null): string => {
    if (!d) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultDateRange = () => {
    const from = new Date();
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
        availableFrom: toDatetimeLocal(from.toISOString()),
        availableUntil: toDatetimeLocal(until.toISOString()),
    };
};

const defaultFormData = (): QuizFormData => {
    const { availableFrom, availableUntil } = defaultDateRange();
    return {
        title: '',
        description: '',
        availableFrom,
        availableUntil,
        maximumAttempts: 1,
        attemptTimeLimit: 5,
        status: 'Draft',
        publishedDate: '',
        showResultOnClose: true,
        shuffleQuestions: true,
        shuffleOptions: true,
    };
};

function ErrorText({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {msg}
        </p>
    );
}

export const QuizForm = ({
    initialData,
    onSubmit,
    isPending = false,
    submitLabel,
    secondaryAction,
    onCancel,
}: QuizFormProps) => {
    const [data, setData] = useState<QuizFormData>(() => ({
        ...defaultFormData(),
        ...initialData,
    }));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (patch: Partial<QuizFormData>) => setData((s) => ({ ...s, ...patch }));

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};

        if (!data.title.trim()) e.title = 'Quiz title is required.';
        else if (data.title.length > 200) e.title = 'Title must be 200 characters or less.';

        if (data.description.length > 2000) e.description = 'Description must be 2000 characters or less.';

        if (data.maximumAttempts < 1 || data.maximumAttempts > 5)
            e.maximumAttempts = 'Attempts allowed must be between 1 and 5.';

        if (data.attemptTimeLimit === '' || Number(data.attemptTimeLimit) < 5)
            e.attemptTimeLimit = 'Time limit must be at least 5 minutes.';

        if (!data.availableFrom) e.availableFrom = 'Available From is required.';
        if (!data.availableUntil) e.availableUntil = 'Available Until is required.';
        else if (data.availableFrom && new Date(data.availableUntil) <= new Date(data.availableFrom))
            e.availableUntil = '"Available Until" must be after "Available From".';

        if (data.status === 'Scheduled') {
            if (!data.publishedDate) e.publishedDate = 'Publish Date is required for scheduled quizzes.';
            else {
                const pd = new Date(data.publishedDate);
                if (pd <= new Date()) e.publishedDate = 'Publish Date must be in the future.';
                if (data.availableFrom && pd >= new Date(data.availableFrom))
                    e.publishedDate = 'Publish Date must be before "Available From".';
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (action: 'primary' | 'secondary') => {
        if (!validate()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (action === 'primary') {
            await onSubmit(data);
        } else if (secondaryAction) {
            await secondaryAction.onClick(data);
        }
    };

    const nowDate = new Date();
    const busy = isPending || !!secondaryAction?.isPending;

    return (
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">

                {/* Basic Information */}
                <div className="space-y-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <Settings className="w-5 h-5 text-indigo-500" /> Basic Information
                    </h3>
                    <div>
                        <label htmlFor="title" className={labelCls}>Quiz Title <span className="text-red-500">*</span></label>
                        <input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => { set({ title: e.target.value }); clearError('title'); }}
                            className={getInputCls(!!errors.title)}
                            placeholder="e.g. Midterm Examination - Chapter 1 to 5"
                            disabled={busy}
                        />
                        <ErrorText msg={errors.title} />
                    </div>
                    <div>
                        <label htmlFor="description" className={labelCls}>Description (Optional)</label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => set({ description: e.target.value })}
                            rows={3}
                            className={`${getInputCls(!!errors.description)} resize-none`}
                            placeholder="Add instructions or guidelines for the students..."
                            disabled={busy}
                        />
                        <ErrorText msg={errors.description} />
                    </div>
                </div>

                {/* Timing & Limits */}
                <div className="space-y-5 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <CalendarClock className="w-5 h-5 text-blue-500" /> Timing & Limits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Available From <span className="text-red-500">*</span></label>
                            <DateTimePicker
                                id="availableFrom"
                                value={parseDateStr(data.availableFrom)}
                                onChange={(d) => { set({ availableFrom: dateToLocalStr(d) }); clearError('availableFrom'); }}
                                minDate={nowDate}
                                hasError={!!errors.availableFrom}
                                disabled={busy}
                                placeholder="Select start date & time"
                                iconColor="text-emerald-500"
                            />
                            {errors.availableFrom ? <ErrorText msg={errors.availableFrom} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">When students can start.</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Available Until <span className="text-red-500">*</span></label>
                            <DateTimePicker
                                id="availableUntil"
                                value={parseDateStr(data.availableUntil)}
                                onChange={(d) => { set({ availableUntil: dateToLocalStr(d) }); clearError('availableUntil'); }}
                                minDate={parseDateStr(data.availableFrom) ?? nowDate}
                                hasError={!!errors.availableUntil}
                                disabled={busy}
                                placeholder="Select end date & time"
                                iconColor="text-red-500"
                            />
                            {errors.availableUntil ? <ErrorText msg={errors.availableUntil} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Last moment a student can enter.</p>}
                        </div>
                        <div>
                            <label htmlFor="maximumAttempts" className={labelCls}>Attempts Allowed <span className="text-red-500">*</span></label>
                            <input id="maximumAttempts" type="number" min={1} max={5} value={data.maximumAttempts} onChange={(e) => { set({ maximumAttempts: Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1)) }); clearError('maximumAttempts'); }} className={getInputCls(!!errors.maximumAttempts)} disabled={busy} />
                            {errors.maximumAttempts ? <ErrorText msg={errors.maximumAttempts} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Between 1 and 5 attempts.</p>}
                        </div>
                        <div>
                            <label htmlFor="attemptTimeLimit" className={labelCls}>Time Limit (Minutes) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="attemptTimeLimit"
                                    type="number"
                                    min={5}
                                    value={data.attemptTimeLimit}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        set({ attemptTimeLimit: val === '' ? '' : Math.max(5, parseInt(val, 10)) });
                                        clearError('attemptTimeLimit');
                                    }}
                                    className={`${getInputCls(!!errors.attemptTimeLimit)} pl-11`}
                                    disabled={busy}
                                />
                            </div>
                            {errors.attemptTimeLimit ? <ErrorText msg={errors.attemptTimeLimit} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Minimum <strong>5</strong> minutes required.</p>}
                        </div>
                    </div>
                </div>

                {/* Visibility Status */}
                <div className="space-y-5 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <Eye className="w-5 h-5 text-purple-500" /> Visibility Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PUBLISH_OPTIONS.map((opt) => {
                            const isSelected = data.status === opt.value;
                            return (
                                <label key={opt.value} className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>{opt.title}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>{opt.desc}</span>
                                    <input type="radio" name="status" value={opt.value} checked={isSelected} onChange={() => { set({ status: opt.value }); clearError('publishedDate'); }} className="hidden" disabled={busy} />
                                </label>
                            );
                        })}
                    </div>

                    {data.status === 'Scheduled' && (
                        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <label className={`${labelCls} !text-blue-700 dark:!text-blue-400`}>Publish Date & Time <span className="text-red-500">*</span></label>
                            <DateTimePicker
                                id="publishedDate"
                                value={parseDateStr(data.publishedDate)}
                                onChange={(d) => { set({ publishedDate: dateToLocalStr(d) }); clearError('publishedDate'); }}
                                minDate={nowDate}
                                hasError={!!errors.publishedDate}
                                disabled={busy}
                                placeholder="Select publish date & time"
                                iconColor="text-blue-500"
                            />
                            {errors.publishedDate ? <ErrorText msg={errors.publishedDate} /> : <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-2 ml-1">Must be in the future and <strong>before</strong> "Available From" date.</p>}
                        </div>
                    )}
                </div>

                {/* Quiz Behavior */}
                <div className="space-y-5 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <Settings className="w-5 h-5 text-emerald-500" /> Quiz Behavior
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {([
                            { key: 'showResultOnClose' as const, label: 'Show results on close', desc: 'Display correct answers after quiz ends' },
                            { key: 'shuffleQuestions' as const, label: 'Shuffle questions', desc: 'Randomize order of questions' },
                            { key: 'shuffleOptions' as const, label: 'Shuffle options', desc: 'Randomize order of answer choices' },
                        ]).map(({ key, label, desc }) => {
                            const isChecked = data[key];
                            return (
                                <label key={key} className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex-1">
                                        <div className={`font-bold text-sm mb-1 ${isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>{label}</div>
                                        <div className={`text-xs font-medium ${isChecked ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>{desc}</div>
                                    </div>
                                    <div className="pt-0.5">
                                        <input type="checkbox" checked={isChecked} onChange={(e) => set({ [key]: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" disabled={busy} />
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <button type="button" onClick={onCancel} disabled={busy} className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm disabled:opacity-50">
                    Cancel
                </button>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                    {secondaryAction && (
                        <button type="button" onClick={() => handleSubmit('secondary')} disabled={busy} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                            {secondaryAction.isPending ? 'Saving...' : secondaryAction.label}
                        </button>
                    )}
                    <button type="button" onClick={() => handleSubmit('primary')} disabled={busy} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                        {isPending ? 'Saving...' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
