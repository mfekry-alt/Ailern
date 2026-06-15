import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Settings, CalendarClock, Eye, Timer, AlertCircle, BrainCircuit } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import type { QuizFormStatus } from '@/types/api.types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';

export interface QuizFormData {
    title: string;
    description: string;
    availableFrom: string;
    availableUntil: string;
    maximumAttempts: number;
    attemptTimeLimit: number;
    status: QuizFormStatus;
    publishedDate: string;
    showResultOnClose: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableAIGrading?: boolean;
    globalAIInstructions?: string;
}

const getQuizSchema = (timingState: 'NotStarted' | 'Started' | 'Ended', initialData?: Partial<QuizFormData>) => yup.object().shape({
    title: yup.string()
        .required('Title is required.')
        .max(200, 'Title must be 200 characters or less.'),
    description: yup.string()
        .max(2000, 'Description must be 2000 characters or less.')
        .optional()
        .default(''),
    availableFrom: yup.string()
        .required('Available From is required.')
        .test('future-date', 'AvailableFrom must be in the future.', (val) => timingState !== 'NotStarted' || (!val || new Date(val) > new Date())),
    availableUntil: yup.string()
        .required('Available Until is required.')
        .test('future-date', 'AvailableUntil must be in the future.', (val) => timingState !== 'NotStarted' || (!val || new Date(val) > new Date()))
        .test('is-after-from', 'Available Until must be after Available From.', function(value) {
            const { availableFrom } = this.parent;
            if (!availableFrom || !value) return true;
            return new Date(value) > new Date(availableFrom);
        })
        .test('increase-only', 'Available Until can only be extended.', function(value) {
            if (timingState === 'NotStarted' || !initialData?.availableUntil || !value) return true;
            return new Date(value) >= new Date(initialData.availableUntil);
        })
        .test('future-if-published', 'Available Until must be in the future to publish.', function(value) {
            const { status } = this.parent;
            if (status !== 'Published' || !value) return true;
            return new Date(value) > new Date();
        }),
    maximumAttempts: yup.number()
        .typeError('Maximum attempts must be a number.')
        .required('Maximum attempts is required.')
        .min(1, 'MaximumAttempts must be between 1 and 3.')
        .max(3, 'MaximumAttempts must be between 1 and 3.')
        .test('increase-only', 'Maximum attempts can only be increased.', function(value) {
            if (timingState === 'NotStarted' || initialData?.maximumAttempts === undefined || value === undefined) return true;
            return value >= initialData.maximumAttempts;
        }),
    attemptTimeLimit: yup.number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .typeError('Time limit must be a number.')
        .required('AttemptTimeLimit must be greater than 0.')
        .positive('AttemptTimeLimit must be greater than 0.')
        .test('increase-only', 'Time limit can only be increased.', function(value) {
            if (timingState === 'NotStarted' || initialData?.attemptTimeLimit === undefined || value === undefined) return true;
            return value >= initialData.attemptTimeLimit;
        })
        .test('within-window', 'AttemptTimeLimit must be less than or equal to the total available time.', function(value) {
            const { availableFrom, availableUntil } = this.parent;
            if (!availableFrom || !availableUntil || !value) return true;
            const windowMinutes = (new Date(availableUntil).getTime() - new Date(availableFrom).getTime()) / 60000;
            return value <= Math.floor(windowMinutes);
        }),
    status: yup.string().oneOf(['Draft', 'Published', 'Scheduled']).required(),
    publishedDate: yup.string().when('status', {
        is: 'Scheduled',
        then: (schema) => schema.required('Publish Date is required for scheduled quizzes.')
            .test('future-date', 'Publish Date must be in the future.', (val) => !val || new Date(val) > new Date())
            .test('before-from', 'Publish Date must be before "Available From".', function(val) {
                const { availableFrom } = this.parent;
                if (!val || !availableFrom) return true;
                return new Date(val) < new Date(availableFrom);
            }),
        otherwise: (schema) => schema.optional(),
    }),
    showResultOnClose: yup.boolean().default(true),
    shuffleQuestions: yup.boolean().default(true),
    shuffleOptions: yup.boolean().default(true),
});

interface QuizFormProps {
    initialData?: Partial<QuizFormData>;
    onSubmit: (data: QuizFormData) => void | Promise<void>;
    isPending?: boolean;
    submitLabel: string;
    secondaryAction?: { label: string; onClick: (data: QuizFormData) => void | Promise<void>; isPending?: boolean };
    onCancel: () => void;
    /** Create flow uses stricter rules that match POST /Courses/{id}/quizzes validation. */
    validationMode?: 'create' | 'edit';
    /** Hide Draft / Published / Scheduled when new quizzes are always created as Draft. */
    showVisibilitySection?: boolean;
}

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

const getInputCls = (hasError: boolean) =>
    `w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-semibold text-gray-900 dark:text-white ${
        hasError
            ? 'border-red-500 focus:ring-red-500/50'
            : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/50'
    }`;

const PUBLISH_OPTIONS: { value: QuizFormStatus; title: string; desc: string }[] = [
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

/** Format an API ISO instant for display in the user's local timezone. */
export function formatIsoDateTimeLocal(iso: string): string {
    if (!iso) return '—';
    try {
        const normalized = iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

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
    const from = new Date(Date.now() + 60 * 60 * 1000);
    const until = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
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
    validationMode = 'edit',
    showVisibilitySection = true,
}: QuizFormProps) => {
    const timingState = useMemo(() => {
        if (!initialData || !initialData.availableFrom || !initialData.availableUntil) return 'NotStarted';
        const initialFrom = new Date(initialData.availableFrom).getTime();
        const initialUntil = new Date(initialData.availableUntil).getTime();
        const nowTime = new Date().getTime();
        if (nowTime >= initialUntil) return 'Ended';
        if (nowTime >= initialFrom && nowTime < initialUntil) return 'Started';
        return 'NotStarted';
    }, [initialData]);

    const displayStatus = useMemo(() => {
        if (!initialData || initialData.status === 'Draft') return 'Draft';
        if (timingState === 'Started') return 'Started';
        if (timingState === 'Ended') return 'Ended';
        return 'Published';
    }, [timingState, initialData]);

    const schema = useMemo(() => getQuizSchema(timingState, initialData), [timingState, initialData]);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<QuizFormData>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            ...defaultFormData(),
            ...initialData,
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                ...defaultFormData(),
                ...initialData,
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: QuizFormData) => {
        try {
            await onSubmit(data);
        } catch (error: any) {
            if (error?.response?.data?.errors) {
                mapServerErrors(error.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(error.response.data.errors), 100);
            }
        }
    };

    const handleSecondaryAction = async () => {
        if (secondaryAction) {
            handleSubmit(async (data) => {
                await secondaryAction.onClick(data);
            })();
        }
    };

    const formData = watch();
    const busy = isPending || isSubmitting || !!secondaryAction?.isPending;
    const nowDate = new Date();

    return (
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">

                {/* Basic Information */}
                <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" /> Basic Information
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-700/50 rounded-full w-fit">
                            <div className={`w-2 h-2 rounded-full ${displayStatus === 'Published' || displayStatus === 'Started' ? 'bg-emerald-500' : displayStatus === 'Ended' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">{displayStatus}</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="title" className={labelCls}>Quiz Title <span className="text-red-500">*</span></label>
                        <input
                            id="title"
                            type="text"
                            {...register('title')}
                            className={getInputCls(!!errors.title)}
                            placeholder="e.g. Midterm Examination - Chapter 1 to 5"
                            disabled={busy}
                        />
                        {errors.title && <ErrorText msg={errors.title.message} />}
                    </div>
                    <div>
                        <label htmlFor="description" className={labelCls}>Description (Optional)</label>
                        <textarea
                            id="description"
                            {...register('description')}
                            rows={3}
                            className={`${getInputCls(!!errors.description)} resize-none`}
                            placeholder="Add instructions or guidelines for the students..."
                            disabled={busy}
                        />
                        {errors.description && <ErrorText msg={errors.description.message} />}
                    </div>
                </div>

                {/* Timing & Limits */}
                <div className="space-y-5 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                        <CalendarClock className="w-5 h-5 text-blue-500" /> Timing & Limits
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 -mt-2 mb-1 ml-1">
                        Times are shown in your local timezone. The server stores and receives them as UTC (ISO-8601).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Available From <span className="text-red-500">*</span></label>
                            <Controller
                                name="availableFrom"
                                control={control}
                                render={({ field }) => (
                                    <DateTimePicker
                                        id="availableFrom"
                                        value={parseDateStr(field.value)}
                                        onChange={(d) => field.onChange(dateToLocalStr(d))}
                                        minDate={timingState === 'NotStarted' ? nowDate : undefined}
                                        hasError={!!errors.availableFrom}
                                        disabled={busy || timingState === 'Started' || timingState === 'Ended'}
                                        placeholder="Select start date & time"
                                        iconColor="text-emerald-500"
                                    />
                                )}
                            />
                            {errors.availableFrom ? <ErrorText msg={errors.availableFrom.message} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">When students can start.</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Available Until <span className="text-red-500">*</span></label>
                            <Controller
                                name="availableUntil"
                                control={control}
                                render={({ field }) => (
                                    <DateTimePicker
                                        id="availableUntil"
                                        value={parseDateStr(field.value)}
                                        onChange={(d) => field.onChange(dateToLocalStr(d))}
                                        minDate={parseDateStr(watch('availableFrom')) ?? nowDate}
                                        hasError={!!errors.availableUntil}
                                        disabled={busy}
                                        placeholder="Select end date & time"
                                        iconColor="text-red-500"
                                    />
                                )}
                            />
                            {errors.availableUntil ? <ErrorText msg={errors.availableUntil.message} /> : <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Last moment a student can enter.</p>}
                        </div>
                        <div>
                            <label htmlFor="maximumAttempts" className={labelCls}>Attempts Allowed <span className="text-red-500">*</span></label>
                            <input
                                id="maximumAttempts"
                                type="number"
                                min={timingState !== 'NotStarted' ? Math.max(1, initialData?.maximumAttempts || 1) : 1}
                                max={3}
                                {...register('maximumAttempts')}
                                className={getInputCls(!!errors.maximumAttempts)}
                                disabled={busy}
                            />
                            {errors.maximumAttempts ? (
                                <ErrorText msg={errors.maximumAttempts.message} />
                            ) : (
                                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">
                                    Between 1 and 3 attempts.
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="attemptTimeLimit" className={labelCls}>Time Limit (Minutes) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="attemptTimeLimit"
                                    type="number"
                                    min={timingState !== 'NotStarted' ? Math.max(1, initialData?.attemptTimeLimit || 1) : 1}
                                    {...register('attemptTimeLimit')}
                                    className={`${getInputCls(!!errors.attemptTimeLimit)} pl-11`}
                                    disabled={busy}
                                />
                            </div>
                            {errors.attemptTimeLimit ? (
                                <ErrorText msg={errors.attemptTimeLimit.message} />
                            ) : (
                                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">
                                    Minutes per attempt; must be greater than 0 and not longer than the availability window.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Visibility Status */}
                {showVisibilitySection && (
                    <div className="space-y-5 pt-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                            <Eye className="w-5 h-5 text-purple-500" /> Visibility Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PUBLISH_OPTIONS.map((opt) => {
                                const isSelected = watch('status') === opt.value;
                                return (
                                    <label key={opt.value} className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`font-bold text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>{opt.title}</span>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>{opt.desc}</span>
                                        <input type="radio" {...register('status')} value={opt.value} checked={isSelected} className="hidden" disabled={busy} />
                                    </label>
                                );
                            })}
                        </div>

                        {watch('status') === 'Scheduled' && (
                            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <label className={`${labelCls} !text-blue-700 dark:!text-blue-400`}>Publish Date & Time <span className="text-red-500">*</span></label>
                                <Controller
                                    name="publishedDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DateTimePicker
                                            id="publishedDate"
                                            value={parseDateStr(field.value)}
                                            onChange={(d) => field.onChange(dateToLocalStr(d))}
                                            minDate={nowDate}
                                            hasError={!!errors.publishedDate}
                                            disabled={busy}
                                            placeholder="Select publish date & time"
                                            iconColor="text-blue-500"
                                        />
                                    )}
                                />
                                {errors.publishedDate ? <ErrorText msg={errors.publishedDate.message} /> : <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-2 ml-1">Must be in the future and <strong>before</strong> &quot;Available From&quot; date.</p>}
                            </div>
                        )}
                    </div>
                )}

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
                            const isChecked = watch(key);
                            return (
                                <label key={key} className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex-1">
                                        <div className={`font-bold text-sm mb-1 ${isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>{label}</div>
                                        <div className={`text-xs font-medium ${isChecked ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>{desc}</div>
                                    </div>
                                    <div className="pt-0.5">
                                        <input type="checkbox" {...register(key)} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" disabled={busy} />
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
                    {secondaryAction && timingState === 'NotStarted' && (
                        <button 
                            type="button" 
                            onClick={handleSecondaryAction} 
                            disabled={busy} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {secondaryAction.isPending ? 'Saving...' : secondaryAction.label}
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={handleSubmit(handleFormSubmit)} 
                        disabled={busy} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isPending ? 'Saving...' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
