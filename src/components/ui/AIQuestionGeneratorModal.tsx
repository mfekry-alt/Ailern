import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    X, Sparkles, BrainCircuit, Settings, BookOpen, Loader2, AlertTriangle,
    ChevronDown, ChevronRight, FileText, CheckCircle2, LayoutGrid,
    Plus, Info, Zap, Unlock, Lock, Check, XCircle, Brain
} from 'lucide-react';
import { aiResourcesService, quizService } from '@/api/services';
import { AIResourceCard, type AiFileDto } from '@/components/AIResourceCard';
import { DifficultyDistribution } from '@/components/DifficultyDistribution';
import type { QuestionUpsertRequest } from '@/types/api.types';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { FormProvider } from 'react-hook-form';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import React, { useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { createAiResourcesHubConnection } from '@/api/signalr/aiResourcesHub';

const generationSchema = z.object({
    courseId: z.number(),
    selectedFileIds: z.array(z.string()).min(1, "Please select at least one material file."),
    totalQuestions: z.number().min(1, "At least 1 question is required").max(100, "Maximum 100 questions allowed"),
    questionTypes: z.object({ mcq: z.number().min(0), trueFalse: z.number().min(0), written: z.number().min(0) }),
    difficulty: z.object({ easy: z.number().min(0).max(100), medium: z.number().min(0).max(100), hard: z.number().min(0).max(100) }),
    options: z.object({ topics: z.array(z.string()).default([]), instructions: z.string().optional() })
}).refine(data => data.questionTypes.mcq + data.questionTypes.trueFalse + data.questionTypes.written === data.totalQuestions, {
    message: "Sum of question types must equal total questions", path: ["questionTypes"]
}).refine(data => data.difficulty.easy + data.difficulty.medium + data.difficulty.hard === 100, {
    message: "Total difficulty must equal exactly 100%", path: ["difficulty.root"]
});

type GenerationFormData = z.infer<typeof generationSchema>;

interface AIQuestionGeneratorModalProps {
    isOpen: boolean;
    quizId?: string;
    onClose: () => void;
    onGenerate: (questions: QuestionUpsertRequest[]) => void;
    onComplete?: () => void;
}

type GenerationPhase = 'form' | 'generating' | 'review';

export function AIQuestionGeneratorModal({ isOpen, quizId, onClose, onGenerate, onComplete }: AIQuestionGeneratorModalProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [lockedType, setLockedType] = useState<'mcq' | 'trueFalse' | 'written' | null>(null);
    const [topicInput, setTopicInput] = useState('');

    const [phase, setPhase] = useState<GenerationPhase>('form');
    const [generatedCount, setGeneratedCount] = useState(0);
    const [generatedTotal, setGeneratedTotal] = useState(0);
    const [generationCompleted, setGenerationCompleted] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<quizService.AiGeneratedQuestionDto[]>([]);
    const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
    const [acceptingAll, setAcceptingAll] = useState(false);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useLockBodyScroll();

    useEffect(() => {
        if (!isOpen) {
            setPhase('form');
            setGeneratedCount(0);
            setGenerationCompleted(false);
            setGeneratedQuestions([]);
            setIsGenerating(false);
            connectionRef.current?.stop().catch(() => { });
            connectionRef.current = null;
        }
    }, [isOpen]);

    const quizQuery = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizService.getQuiz(quizId as string),
        enabled: Boolean(quizId) && isOpen
    });
    const courseId = quizQuery.data?.courseId ? Number(quizQuery.data.courseId) : undefined;

    const resourcesQuery = useQuery({
        queryKey: ['ai-resources', courseId],
        queryFn: () => aiResourcesService.getAiResources(courseId as number),
        enabled: Boolean(courseId) && isOpen,
    });

    const resources = useMemo(() => {
        const resp = resourcesQuery.data;
        if (resp && 'success' in resp && resp.success) return resp.data as AiFileDto[];
        return [];
    }, [resourcesQuery.data]);

    const formMethods = useForm<GenerationFormData>({
        resolver: zodResolver(generationSchema) as any,
        mode: 'onChange',
        defaultValues: {
            courseId: courseId ?? 0,
            selectedFileIds: [],
            totalQuestions: 10,
            questionTypes: { mcq: 5, trueFalse: 3, written: 2 },
            difficulty: { easy: 0, medium: 0, hard: 100 },
            options: { topics: [], instructions: '' }
        }
    });

    const { register, handleSubmit, setValue, getValues, control, formState: { errors, isValid } } = formMethods;
    const totalQuestions = useWatch({ control, name: 'totalQuestions' });
    const questionTypes = useWatch({ control, name: 'questionTypes' });
    const selectedFileIds = useWatch({ control, name: 'selectedFileIds' }) || [];

    useEffect(() => { if (courseId) setValue('courseId', courseId); }, [courseId, setValue]);

    useEffect(() => {
        if (totalQuestions > 0) {
            const mcq = Math.floor(totalQuestions * 0.5);
            const tf = Math.floor(totalQuestions * 0.3);
            const written = Math.max(0, totalQuestions - mcq - tf);
            setValue('questionTypes', { mcq, trueFalse: tf, written }, { shouldValidate: true });
        }
    }, [totalQuestions, setValue]);

    const handleQuestionTypeChange = useCallback((type: 'mcq' | 'trueFalse' | 'written', newValue: number) => {
        if (type === lockedType) return;
        const currentTypes = getValues('questionTypes');
        const keys: Array<'mcq' | 'trueFalse' | 'written'> = ['mcq', 'trueFalse', 'written'];
        const priorityMap = { mcq: ['trueFalse', 'written'], trueFalse: ['written', 'mcq'], written: ['mcq', 'trueFalse'] } as const;
        const targets = priorityMap[type];

        if (lockedType && lockedType !== type) {
            const thirdField = keys.find(k => k !== type && k !== lockedType)!;
            const lockedVal = currentTypes[lockedType];
            const remainingForPair = totalQuestions - lockedVal;
            const clampedCurrent = Math.max(0, Math.min(remainingForPair, newValue));
            const otherVal = remainingForPair - clampedCurrent;
            setValue(`questionTypes.${type}`, clampedCurrent, { shouldValidate: true });
            setValue(`questionTypes.${thirdField}`, otherVal, { shouldValidate: true });
            return;
        }

        const clampedNew = Math.max(0, Math.min(totalQuestions, newValue));
        const diff = clampedNew - (currentTypes[type] || 0);
        setValue(`questionTypes.${type}`, clampedNew, { shouldValidate: true });
        let remainingDiff = diff;
        targets.forEach((targetKey, i) => {
            const currentTargetVal = currentTypes[targetKey] || 0;
            const adjustment = i === 0 ? Math.min(currentTargetVal, remainingDiff) : remainingDiff;
            const nextTargetVal = Math.max(0, currentTargetVal - adjustment);
            setValue(`questionTypes.${targetKey}`, nextTargetVal, { shouldValidate: true });
            remainingDiff -= (currentTargetVal - nextTargetVal);
        });
        if (remainingDiff !== 0) {
            setValue(`questionTypes.${type}`, clampedNew - remainingDiff, { shouldValidate: true });
        }
    }, [totalQuestions, lockedType, getValues, setValue]);

    const toggleFileSelection = React.useCallback((id: string) => {
        const current = getValues('selectedFileIds') || [];
        const next = current.includes(id) ? current.filter(fid => fid !== id) : [...current, id];
        setValue('selectedFileIds', next, { shouldValidate: true });
    }, [getValues, setValue]);

    const startSignalR = useCallback((total: number) => {
        setGeneratedTotal(total);
        setGeneratedCount(0);
        setGenerationCompleted(false);
        const conn = createAiResourcesHubConnection(
            () => { },
            (count: number, completed: boolean) => {
                setGeneratedCount(count);
                if (completed) setGenerationCompleted(true);
            }
        );
        connectionRef.current = conn;
        conn.start().catch((e) => {
            console.error('[ai-questions hub] failed to start', e);
            toast.error('Failed to connect to real-time updates. Please refresh.');
            setIsGenerating(false);
            setPhase('form');
        });
    }, []);

    useEffect(() => {
        if (generationCompleted && phase === 'generating' && quizId) {
            connectionRef.current?.stop().catch(() => { });
            connectionRef.current = null;
            quizService.getAiGeneratedQuestions(quizId)
                .then((questions) => {
                    setGeneratedQuestions(questions);
                    setPhase('review');
                    setIsGenerating(false);
                })
                .catch(() => {
                    toast.error('Failed to fetch generated questions.');
                    setPhase('form');
                    setIsGenerating(false);
                });
        }
    }, [generationCompleted, phase, quizId]);

    const generateMutation = useMutation({
        mutationFn: (data: GenerationFormData) => quizService.generateQuizQuestionsByAI(quizId as string, {
            fileIds: data.selectedFileIds,
            topics: data.options.topics || [],
            questionsCount: data.totalQuestions,
            questionTypeCounts: { MCQ: data.questionTypes.mcq, TrueFalse: data.questionTypes.trueFalse, Written: data.questionTypes.written },
            questionDifficultyPercents: { Easy: data.difficulty.easy, Medium: data.difficulty.medium, Hard: data.difficulty.hard },
            query: data.options.instructions || ''
        }),
        onSuccess: (_data: any) => {
            if (!quizId) {
                const questions = _data?.questions ?? _data?.data ?? [];
                if (questions.length > 0) { onGenerate(questions); onClose(); }
                else toast.error("No questions were generated. Please try again.");
                setIsGenerating(false);
            }
        },
        onError: (err) => {
            console.error(err);
            toast.error("Generation failed. Please check your connection or try again.");
            setIsGenerating(false);
            if (quizId) setPhase('form');
        }
    });

    const onSubmit = (data: GenerationFormData) => {
        setIsGenerating(true);
        if (quizId) {
            setPhase('generating');
            generateMutation.mutate(data, {
                onSuccess: () => startSignalR(data.totalQuestions),
                onError: () => { setPhase('form'); setIsGenerating(false); }
            });
        } else {
            setGenerationProgress(10);
            const interval = setInterval(() => {
                setGenerationProgress(prev => {
                    if (prev >= 90) { clearInterval(interval); return 90; }
                    return prev + 5;
                });
            }, 1000);
            generateMutation.mutate(data);
        }
    };

    const handleAccept = async (questionId: string) => {
        if (!quizId) return;
        setAcceptingIds(prev => new Set(prev).add(questionId));
        try {
            await quizService.acceptAiGeneratedQuestion(quizId, questionId);
            setGeneratedQuestions(prev => prev.filter(q => q.id !== questionId));
            toast.success('Question accepted');
            onComplete?.();
        } catch { toast.error('Failed to accept question'); }
        finally {
            setAcceptingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
        }
    };

    const handleReject = async (questionId: string) => {
        if (!quizId) return;
        setRejectingIds(prev => new Set(prev).add(questionId));
        try {
            await quizService.rejectAiGeneratedQuestion(quizId, questionId);
            setGeneratedQuestions(prev => prev.filter(q => q.id !== questionId));
            toast.success('Question rejected');
        } catch { toast.error('Failed to reject question'); }
        finally {
            setRejectingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
        }
    };

    const handleAcceptAll = async () => {
        if (!quizId) return;
        setAcceptingAll(true);
        try {
            await quizService.acceptAllAiGeneratedQuestions(quizId);
            setGeneratedQuestions([]);
            toast.success('All questions accepted');
            onComplete?.();
            onClose();
        } catch {
            toast.error('Failed to accept all questions');
            setAcceptingAll(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => !isGenerating && onClose()} />
            <FormProvider {...formMethods}>
                <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4">
                    {/* Header */}
                    <header className="flex items-center justify-between px-10 py-7 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 z-20">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                {phase === 'review' ? <Brain className="w-7 h-7" /> : <BrainCircuit className="w-7 h-7" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {phase === 'review' ? 'Review AI Questions' : 'AI Assessment Generator'}
                                </h2>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                                    {phase === 'review' ? `${generatedQuestions.length} pending review` : 'Powered by Ailern Intelligence Engine'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} disabled={isGenerating}
                            className="p-4 text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-slate-800 rounded-3xl transition-all disabled:opacity-50 active:scale-90">
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto overscroll-behavior-contain scroll-smooth will-change-transform px-10 py-10 custom-scrollbar">
                        {/* Phase: Form */}
                        {phase === 'form' && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-blue-500" />
                                                Step 1: Select Source Materials
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Choose the files the AI should analyze to generate questions.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setValue('selectedFileIds', resources.map(r => r.id))}
                                                className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-all">Select All</button>
                                            <button type="button" onClick={() => setValue('selectedFileIds', [])}
                                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all">Clear</button>
                                        </div>
                                    </div>
                                    {resourcesQuery.isLoading ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
                                        </div>
                                    ) : resources.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                                            <FileText className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">No materials found in this course</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {resources.map(file => (
                                                <AIResourceCard key={file.id} file={file} isSelected={selectedFileIds.includes(file.id)} onToggle={toggleFileSelection} />
                                            ))}
                                        </div>
                                    )}
                                    {errors.selectedFileIds && (
                                        <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {errors.selectedFileIds.message}
                                        </p>
                                    )}
                                </section>

                                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <LayoutGrid className="w-5 h-5 text-indigo-500" />
                                                Step 2: Question Distribution
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Configure the total count and variety of questions.</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">Total Questions</label>
                                                <div className="relative group w-32">
                                                    <input type="number" {...register('totalQuestions', { valueAsNumber: true })}
                                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl text-center group-hover:text-left group-hover:pl-6 font-black text-xl text-indigo-600 dark:text-indigo-400 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button type="button" onClick={() => { const val = getValues('totalQuestions') || 0; if (val < 100) setValue('totalQuestions', val + 1, { shouldValidate: true }); }}
                                                            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 rounded-md transition-colors"><ChevronRight className="w-4 h-4 -rotate-90" /></button>
                                                        <button type="button" onClick={() => { const val = getValues('totalQuestions') || 0; if (val > 1) setValue('totalQuestions', val - 1, { shouldValidate: true }); }}
                                                            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 rounded-md transition-colors"><ChevronRight className="w-4 h-4 rotate-90" /></button>
                                                    </div>
                                                    <div className="absolute -top-7 right-0 text-[10px] font-black text-gray-400 uppercase tracking-tighter">MAX 100</div>
                                                </div>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                                                {[{ id: 'mcq', label: 'Multiple Choice', color: 'blue' }, { id: 'trueFalse', label: 'True / False', color: 'emerald' }, { id: 'written', label: 'Written Response', color: 'amber' }].map(type => {
                                                    const isLocked = lockedType === type.id;
                                                    const val = questionTypes[type.id as keyof typeof questionTypes] || 0;
                                                    return (
                                                        <div key={type.id} className="flex items-center justify-between group">
                                                            <div className="flex items-center gap-3">
                                                                <button type="button" onClick={() => setLockedType(isLocked ? null : type.id as any)}
                                                                    className={clsx("p-1 rounded-md transition-all active:scale-90", isLocked ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" : "text-gray-300 hover:text-gray-600 dark:text-slate-700 dark:hover:text-slate-400")}>
                                                                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <div className={clsx("w-2 h-2 rounded-full", type.color === 'blue' ? "bg-blue-500" : type.color === 'emerald' ? "bg-emerald-500" : "bg-amber-500")} />
                                                                <span className={clsx("text-sm font-bold transition-colors", isLocked ? "text-amber-600" : "text-gray-600 dark:text-slate-400")}>{type.label}</span>
                                                            </div>
                                                            <div className="relative group w-20">
                                                                <input type="number" value={val} disabled={isLocked} onChange={(e) => handleQuestionTypeChange(type.id as any, Number(e.target.value))}
                                                                    className={clsx("w-full px-2 py-2 bg-gray-50 dark:bg-slate-900 border rounded-xl text-center font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                        isLocked ? "border-amber-200 bg-amber-50/50 text-amber-600 cursor-not-allowed" : "border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white group-hover:text-left group-hover:pl-4 focus:ring-2 focus:ring-indigo-500/50")} />
                                                                {!isLocked && (
                                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                                        <button type="button" onClick={() => handleQuestionTypeChange(type.id as any, val + 1)}
                                                                            className="p-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 rounded transition-colors"><ChevronRight className="w-3 h-3 -rotate-90" /></button>
                                                                        <button type="button" onClick={() => handleQuestionTypeChange(type.id as any, val - 1)}
                                                                            className="p-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 rounded transition-colors"><ChevronRight className="w-3 h-3 rotate-90" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {errors.questionTypes && (
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">{errors.questionTypes.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <DifficultyDistribution />
                                </section>

                                <section className="pt-8 border-t border-gray-100 dark:border-slate-800">
                                    <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                        className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-widest">
                                        <Settings className={clsx("w-4 h-4 transition-transform duration-300", isAdvancedOpen ? "rotate-90" : "")} />
                                        Advanced Controls
                                        {isAdvancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                    {isAdvancedOpen && (
                                        <div className="mt-6 p-8 bg-gray-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" /> Topics to Focus On
                                                </label>
                                                <div className="min-h-[120px] p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all cursor-text" onClick={() => (document.getElementById('topic-input') as HTMLInputElement)?.focus()}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formMethods.watch('options.topics').map((topic, index) => (
                                                            <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black rounded-xl border border-indigo-100 dark:border-indigo-500/20 animate-in zoom-in-90 duration-200">
                                                                {topic}
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); const current = formMethods.getValues('options.topics'); formMethods.setValue('options.topics', current.filter((_, i) => i !== index)); }}
                                                                    className="hover:bg-indigo-200 dark:hover:bg-indigo-500/30 p-0.5 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                                            </span>
                                                        ))}
                                                        <input id="topic-input" type="text" value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ',') {
                                                                    e.preventDefault();
                                                                    const val = topicInput.trim().replace(/,$/, '');
                                                                    if (val) {
                                                                        const current = formMethods.getValues('options.topics');
                                                                        if (!current.includes(val)) formMethods.setValue('options.topics', [...current, val]);
                                                                        setTopicInput('');
                                                                    }
                                                                }
                                                            }}
                                                            placeholder={formMethods.watch('options.topics').length === 0 ? "Type topic and press Enter..." : "Add more..."}
                                                            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-bold text-gray-700 dark:text-white placeholder:text-gray-400 py-1" />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">AI will prioritize these specific areas</p>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Settings className="w-3.5 h-3.5 text-amber-500" /> Custom Instructions
                                                </label>
                                                <textarea {...register('options.instructions')} placeholder="e.g. Make questions challenging, use professional tone..." rows={3}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" />
                                                <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Additional rules for the AI to follow</p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {/* Phase: Generating */}
                        {phase === 'generating' && (
                            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center space-y-10 py-20">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse">
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg animate-bounce">
                                        {generatedCount}
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">AI is Generating Questions</h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Real-time updates via SignalR hub</p>
                                </div>
                                <div className="w-full space-y-3">
                                    <div className="flex items-center justify-between text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
                                        <span className="text-xl tabular-nums">{generatedCount} / {generatedTotal}</span>
                                    </div>
                                    <div className="h-5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${generatedTotal > 0 ? Math.min(100, (generatedCount / generatedTotal) * 100) : 0}%` }} />
                                    </div>
                                </div>
                                <div className="flex gap-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Analyzing materials</span>
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75" /> Crafting questions</span>
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse delay-150" /> Validating answers</span>
                                </div>
                            </div>
                        )}

                        {/* Phase: Review */}
                        {phase === 'review' && (
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> AI Generated Questions
                                        </h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Review each question and choose to accept or reject it.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {generatedQuestions.length > 0 && (
                                            <button onClick={handleAcceptAll} disabled={acceptingAll}
                                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                                {acceptingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Accept All
                                            </button>
                                        )}
                                        <button onClick={onClose}
                                            className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white text-sm font-black rounded-2xl transition-all active:scale-95">Close</button>
                                    </div>
                                </div>

                                {generatedQuestions.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                                        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">All Questions Reviewed</h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">All generated questions have been accepted or rejected.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {generatedQuestions.map((q, idx) => (
                                            <div key={q.id} className="bg-white dark:bg-slate-800/50 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                                <div className="px-8 py-5 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                                        <span className={clsx("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                            q.questionType === 'MCQ' ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                                                q.questionType === 'TrueFalse' ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                                    "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400")}>{q.questionType}</span>
                                                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{q.mark} pts</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleAccept(q.id)} disabled={acceptingIds.has(q.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                                            {acceptingIds.has(q.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                                                        </button>
                                                        <button onClick={() => handleReject(q.id)} disabled={rejectingIds.has(q.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                                            {rejectingIds.has(q.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-8 space-y-6">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{q.questionText}</p>
                                                        {q.instructions && <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 italic">{q.instructions}</p>}
                                                    </div>
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="space-y-2">
                                                            {q.options.map((opt, oi) => (
                                                                <div key={oi} className={clsx("flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold transition-all",
                                                                    opt.isCorrect ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300")}>
                                                                    <span className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                                                        opt.isCorrect ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400")}>{String.fromCharCode(65 + oi)}</span>
                                                                    <span>{opt.optionText}</span>
                                                                    {opt.isCorrect && <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.questionType === 'Written' && (
                                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 rounded-xl text-center">
                                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Written Answer Question</p>
                                                        </div>
                                                    )}
                                                    {q.explanation && (
                                                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Explanation</p>
                                                            <p className="text-xs text-gray-600 dark:text-slate-400">{q.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <footer className="p-10 border-t border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 z-20">
                        <div className="max-w-4xl mx-auto">
                            {phase === 'generating' && quizId && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 animate-pulse" /><span>AI is composing your questions...</span></div>
                                        <span className="text-xl tabular-nums">{generatedCount} / {generatedTotal}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${generatedTotal > 0 ? Math.min(100, (generatedCount / generatedTotal) * 100) : 0}%` }} />
                                    </div>
                                    <p className="text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                                        Analyzing content &bull; Generating options &bull; Validating answers
                                    </p>
                                </div>
                            )}
                            {phase === 'form' && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Configuration</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{totalQuestions} Questions &bull; {selectedFileIds.length} Materials</span>
                                        </div>
                                        <div className="w-px h-10 bg-gray-100 dark:bg-slate-800 hidden sm:block" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Estimation</span>
                                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">~{Math.ceil(totalQuestions / 5) * 5} Seconds</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleSubmit(onSubmit)} disabled={!isValid || selectedFileIds.length === 0}
                                        className="w-full sm:w-auto flex items-center justify-center gap-4 px-14 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-3xl shadow-2xl shadow-indigo-500/25 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                                        <Sparkles className="w-6 h-6" /> Generate Assessment
                                    </button>
                                </div>
                            )}
                            {phase === 'review' && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
                                        {generatedQuestions.length} question{generatedQuestions.length !== 1 ? 's' : ''} remaining
                                    </p>
                                    {generatedQuestions.length > 0 && (
                                        <button onClick={handleAcceptAll} disabled={acceptingAll}
                                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black rounded-3xl shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95">
                                            {acceptingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Accept All & Close
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </footer>
                </div>
            </FormProvider>
        </div>
    );
}
