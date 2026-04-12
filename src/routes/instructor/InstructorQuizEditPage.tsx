import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUpdateQuiz, useQuiz } from '@/features/quizzes/api';
import type { CreateQuizCommand } from '@/types/api.types';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, AlertTriangle, Settings, CalendarClock,
    Eye, Timer, Save, RefreshCw, Edit3, ListChecks, FileArchive
} from 'lucide-react';

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';
const getInputCls = (hasError: boolean) =>
    `w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-semibold text-gray-900 dark:text-white ${hasError
        ? 'border-red-500 focus:ring-red-500/50'
        : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/50'
    }`;

export const InstructorQuizEditPage = () => {
    const { courseId, id } = useParams<{ courseId?: string; id: string }>();
    const quizId = id;
    const navigate = useNavigate();
    const [error, setError] = useState<{ message: string; errors?: Record<string, string[]> } | null>(null);

    // 💡 حالة جديدة عشان نعرض رسالة للمدرس إننا رجعناله مسودة
    const [restoredFromDraft, setRestoredFromDraft] = useState(false);

    // Fetch existing quiz data
    const { data: quizData, isLoading: isFetchingQuiz, error: fetchError } = useQuiz(quizId || '');

    // مفتاح الحفظ في الـ Local Storage (مميز لكل كويز)
    const DRAFT_KEY = `quiz_draft_${quizId}`;

    const actualCourseId = courseId || quizData?.courseId?.toString() || '';
    const updateQuizMutation = useUpdateQuiz(actualCourseId);

    const [formData, setFormData] = useState<CreateQuizCommand>({
        title: '',
        description: '',
        courseId: actualCourseId,
        maximumAttempts: 1,
        attemptTimeLimit: 0,
        status: 'Draft',
        availableFrom: new Date().toISOString(),
        availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        publishedDate: undefined,
        showResultOnClose: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        questions: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveAction, setSaveAction] = useState<'settings' | 'questions'>('settings');

    // 1️⃣ استرجاع البيانات (Load Data)
    useEffect(() => {
        if (quizData) {
            // محاولة جلب المسودة المحفوظة
            const savedDraft = localStorage.getItem(DRAFT_KEY);

            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    setFormData(parsedDraft);
                    setRestoredFromDraft(true);
                    return; // لو لقينا مسودة، استخدمها ومتكملش قراءة من الداتابيز
                } catch (e) {
                    console.error('Failed to parse draft', e);
                }
            }

            // لو مفيش مسودة، اقرأ البيانات العادية من السيرفر
            setFormData({
                title: quizData.title,
                description: quizData.description || '',
                courseId: actualCourseId,
                maximumAttempts: quizData.maximumAttempts,
                attemptTimeLimit: quizData.attemptTimeLimit || 0,
                status: quizData.status,
                availableFrom: quizData.availableFrom,
                availableUntil: quizData.availableUntil,
                publishedDate: quizData.publishedDate || undefined,
                showResultOnClose: quizData.showResultOnClose ?? true,
                shuffleQuestions: quizData.shuffleQuestions ?? true,
                shuffleOptions: quizData.shuffleOptions ?? true,
                questions: quizData.questions ?? [],
            });
        }
    }, [quizData, actualCourseId, DRAFT_KEY]);

    // 2️⃣ الحفظ التلقائي (Auto-Save to LocalStorage)
    useEffect(() => {
        // مش هنحفظ حاجة إلا لو البيانات الأصلية حملت
        if (!quizData) return;

        // بنستخدم Debounce عشان منعملش حفظ مع كل حرف بالضبط (بياخد ثانية تأخير)
        const timeoutId = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData, quizData, DRAFT_KEY]);

    useEffect(() => {
        if (fetchError) {
            setError({ message: 'Failed to load quiz details.' });
        }
    }, [fetchError]);

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Formatter functions
    const formatDateTimeForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const parseDateTimeInput = (inputValue: string) => {
        if (!inputValue) return '';
        return new Date(inputValue).toISOString();
    };

    const nowLocalString = formatDateTimeForInput(new Date().toISOString());

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        else if (formData.title.length > 200) newErrors.title = 'Title must be 200 characters or less';

        const availableFrom = new Date(formData.availableFrom);
        const availableUntil = new Date(formData.availableUntil);
        const now = new Date();

        if (availableFrom.getTime() < (now.getTime() - 5 * 60000)) {
            newErrors.availableFrom = 'Start date cannot be in the past.';
        }

        if (availableUntil <= availableFrom) {
            newErrors.availableUntil = 'End date must be strictly AFTER the start date.';
        }
        if ((formData.description ?? '').length > 2000)
            newErrors.description = 'Description must be 2000 characters or less.';        if (formData.maximumAttempts < 1) newErrors.maximumAttempts = 'Attempts allowed must be at least 1';
        if (formData.attemptTimeLimit < 5) newErrors.attemptTimeLimit = 'Time limit must be at least 5 minutes.';

        if (formData.status === 'Scheduled') {
            if (!formData.publishedDate) {
                newErrors.publishedDate = 'Published date is required when scheduling';
            } else {
                const published = new Date(formData.publishedDate);
                if (published <= now) newErrors.publishedDate = 'Publish date must be in the future and cannot be in the past.';
                if (published >= availableFrom) newErrors.publishedDate = 'Publish date must be BEFORE available from date.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (actionType: 'settings' | 'questions') => {
        setSaveAction(actionType);

        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setError(null);

            if (actionType === 'settings') {
                const payload = {
                    ...formData,
                    questions: formData.questions && formData.questions.length > 0
                        ? formData.questions
                        : (quizData?.questions || []),
                };

                await updateQuizMutation.mutateAsync({
                    id: quizId!,
                    cmd: payload,
                });

                // 3️⃣ مسح المسودة بعد الحفظ الناجح
                localStorage.removeItem(DRAFT_KEY);
                setRestoredFromDraft(false);

                navigate(`/instructor/courses/${actualCourseId}/content`);
            } else {
                // 3️⃣ مسح المسودة عشان هيروح يكمل في صفحة الأسئلة
                localStorage.removeItem(DRAFT_KEY);
                setRestoredFromDraft(false);

                navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT.replace(':id', quizId!));
            }
        } catch (err: any) {
            console.error('Failed to update quiz:', err);
            const apiErrors = err.response?.data?.errors;
            const message = err.response?.data?.message || 'Failed to update quiz. Please try again.';
            setError({
                message,
                errors: apiErrors,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isFetchingQuiz) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase">Loading Quiz...</p>
                </div>
            </div>
        );
    }

    if (!quizId || (!quizData && !isFetchingQuiz)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800/50 p-8 max-w-md w-full rounded-[2rem] text-center shadow-xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quiz Not Found</h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">The quiz you are trying to update is missing or doesn't exist.</p>
                    <button onClick={() => navigate(actualCourseId ? `/instructor/courses/${actualCourseId}/content` : '/instructor/courses')} className="w-full px-6 py-4 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-colors hover:bg-gray-200 dark:hover:bg-slate-600">
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-24">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                                Update Quiz Details
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                                Modify settings, fix timings, and adjust behavior rules.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Draft Restored Banner */}
                {restoredFromDraft && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                Unsaved changes were restored from your last session.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem(DRAFT_KEY);
                                setRestoredFromDraft(false);
                                window.location.reload(); // Reload to get fresh data
                            }}
                            className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 hover:underline"
                        >
                            Discard Draft
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 animate-in fade-in">
                        <div className="flex items-start gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{error.message}</p>
                        </div>
                        {error.errors && Object.keys(error.errors).length > 0 && (
                            <div className="ml-8 space-y-2 border-t border-red-200 dark:border-red-500/20 pt-3 mt-3">
                                {Object.entries(error.errors).map(([field, messages]) => {
                                    const formattedField = field.replace(/Questions\[(\d+)\]/g, (match, p1) => `Question ${parseInt(p1) + 1} `).replace(/\./g, ' ');
                                    return (
                                        <div key={field} className="space-y-1">
                                            <p className="text-xs font-semibold text-red-600 dark:text-red-300 uppercase tracking-wide">{formattedField}</p>
                                            {Array.isArray(messages) && messages.map((msg, idx) => (
                                                <p key={idx} className="text-xs text-red-600 dark:text-red-300 leading-relaxed">• {msg}</p>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Form Container */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Basic Info */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-indigo-500" /> Basic Information
                            </h3>
                            <div>
                                <label htmlFor="title" className={labelCls}>Quiz Title <span className="text-red-500">*</span></label>
                                <input
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); clearError('title'); }}
                                    className={getInputCls(!!errors.title)}
                                    disabled={updateQuizMutation.isPending}
                                />
                                {errors.title && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.title}</p>}
                            </div>

                            <div>
                                <label htmlFor="description" className={labelCls}>Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    rows={4}
                                    className={`${getInputCls(false)} resize-none`}
                                    disabled={updateQuizMutation.isPending}
                                />
                            </div>
                        </div>

                        {/* Timing & Limits */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <CalendarClock className="w-5 h-5 text-blue-500" /> Timing & Limits
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="availableFrom" className={labelCls}>Available From <span className="text-red-500">*</span></label>
                                    <input
                                        id="availableFrom"
                                        type="datetime-local"
                                        min={nowLocalString}
                                        value={formatDateTimeForInput(formData.availableFrom)}
                                        onChange={e => { setFormData(p => ({ ...p, availableFrom: parseDateTimeInput(e.target.value) })); clearError('availableFrom'); clearError('availableUntil'); }}
                                        className={getInputCls(!!errors.availableFrom)}
                                        disabled={updateQuizMutation.isPending}
                                    />
                                    {errors.availableFrom && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.availableFrom}</p>}
                                </div>
                                <div>
                                    <label htmlFor="availableUntil" className={labelCls}>Available Until <span className="text-red-500">*</span></label>
                                    <input
                                        id="availableUntil"
                                        type="datetime-local"
                                        min={formatDateTimeForInput(formData.availableFrom) || nowLocalString}
                                        value={formatDateTimeForInput(formData.availableUntil)}
                                        onChange={e => { setFormData(p => ({ ...p, availableUntil: parseDateTimeInput(e.target.value) })); clearError('availableUntil'); }}
                                        className={getInputCls(!!errors.availableUntil)}
                                        disabled={updateQuizMutation.isPending}
                                    />
                                    {errors.availableUntil && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.availableUntil}</p>}
                                </div>

                                {/* Maximum Attempts */}
                                <div>
                                    <label htmlFor="maximumAttempts" className={labelCls}>Attempts Allowed <span className="text-red-500">*</span></label>
                                    <input
                                        id="maximumAttempts"
                                        type="number"
                                        min={1}
                                        max={5}
                                        value={formData.maximumAttempts}
                                        onChange={e => { setFormData(p => ({ ...p, maximumAttempts: parseInt(e.target.value) || 1 })); clearError('maximumAttempts'); }}
                                        className={getInputCls(!!errors.maximumAttempts)}
                                        disabled={updateQuizMutation.isPending}
                                    />
                                    {errors.maximumAttempts && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.maximumAttempts}</p>}
                                </div>

                                {/* Duration / Time Limit */}
                                <div>
                                    <label htmlFor="attemptTimeLimit" className={labelCls}>Time Limit (Minutes) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="attemptTimeLimit"
                                            type="number"
                                            min={5}
                                            value={formData.attemptTimeLimit}
                                            onChange={e => { setFormData(p => ({ ...p, attemptTimeLimit: Math.max(5, parseInt(e.target.value) || 5) })); clearError('attemptTimeLimit'); }}
                                            className={`${getInputCls(!!errors.attemptTimeLimit)} pl-12`}
                                            disabled={updateQuizMutation.isPending}
                                        />
                                    </div>
                                    {errors.attemptTimeLimit ? (
                                        <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.attemptTimeLimit}</p>
                                    ) : (
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1.5 ml-1">Minimum <strong>5</strong> minutes required.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Publish Status */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Eye className="w-5 h-5 text-purple-500" /> Visibility Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { value: 'Draft', title: 'Save as Draft', desc: 'Not visible to students yet' },
                                    { value: 'Published', title: 'Published', desc: 'Visible to students right away' },
                                    { value: 'Scheduled', title: 'Scheduled', desc: 'Set a future publish date' }
                                ].map(opt => {
                                    const isSelected = formData.status === opt.value;
                                    return (
                                        <label key={opt.value} className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-bold text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>{opt.title}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>{opt.desc}</span>
                                            <input type="radio" name="status" value={opt.value} checked={isSelected} onChange={() => { setFormData(p => ({ ...p, status: opt.value as any })); clearError('publishedDate'); }} className="hidden" disabled={updateQuizMutation.isPending} />
                                        </label>
                                    );
                                })}
                            </div>

                            {formData.status === 'Scheduled' && (
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                    <label htmlFor="publishedDate" className={`${labelCls} !text-blue-700 dark:!text-blue-400`}>Publish Date & Time <span className="text-red-500">*</span></label>
                                    <input
                                        id="publishedDate"
                                        type="datetime-local"
                                        min={nowLocalString}
                                        max={formatDateTimeForInput(formData.availableFrom)}
                                        value={formData.publishedDate ? formatDateTimeForInput(formData.publishedDate) : ''}
                                        onChange={e => { setFormData(p => ({ ...p, publishedDate: parseDateTimeInput(e.target.value) })); clearError('publishedDate'); }}
                                        className={`${getInputCls(!!errors.publishedDate)} !bg-white dark:!bg-slate-900`}
                                        disabled={updateQuizMutation.isPending}
                                    />
                                    {errors.publishedDate && <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {errors.publishedDate}</p>}
                                </div>
                            )}
                        </div>

                        {/* Quiz Behavior */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-emerald-500" /> Quiz Behavior
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'showResultOnClose' as const, label: 'Show results on close', desc: 'Display correct answers after quiz' },
                                    { key: 'shuffleQuestions' as const, label: 'Shuffle questions', desc: 'Randomize question order' },
                                    { key: 'shuffleOptions' as const, label: 'Shuffle options', desc: 'Randomize answer choices' },
                                ].map(({ key, label, desc }) => {
                                    const isChecked = formData[key];
                                    return (
                                        <label key={key} className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                            <div className="flex-1">
                                                <div className={`font-bold text-sm mb-1 ${isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>{label}</div>
                                                <div className={`text-xs font-medium ${isChecked ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-400'}`}>{desc}</div>
                                            </div>
                                            <div className="pt-0.5">
                                                <input type="checkbox" checked={isChecked as boolean} onChange={e => setFormData(p => ({ ...p, [key]: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" disabled={updateQuizMutation.isPending} />
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions with Choice */}
                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                // مسح الـ Draft لو داس إلغاء عشان ميرجعش ليه تاني لو مدخلش يعدل بجد
                                localStorage.removeItem(DRAFT_KEY);
                                navigate(-1);
                            }}
                            disabled={updateQuizMutation.isPending}
                            className="w-full lg:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => handleSave('settings')}
                                disabled={updateQuizMutation.isPending}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {updateQuizMutation.isPending && saveAction === 'settings' ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Settings Only</>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave('questions')}
                                disabled={updateQuizMutation.isPending}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {updateQuizMutation.isPending && saveAction === 'questions' ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Moving...</>
                                ) : (
                                    <><ListChecks className="w-4 h-4" /> Save & Edit Questions</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorQuizEditPage;