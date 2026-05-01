import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    X, Sparkles, BrainCircuit, Settings, SlidersHorizontal, 
    BookOpen, Loader2, AlertTriangle, ChevronDown, ChevronRight,
    FileText, HelpCircle, CheckCircle2, LayoutGrid, Trash2,
    Plus, Info, Zap, Unlock, Lock
} from 'lucide-react';
import { aiResourcesService, quizService } from '@/api/services';
import { AIResourceCard, type AiFileDto } from '@/components/AIResourceCard';
import { DifficultyDistribution } from '@/components/DifficultyDistribution';
import type { QuestionUpsertRequest } from '@/types/api.types';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { FormProvider } from 'react-hook-form';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import React from 'react';

// ─── Validation Schema ──────────────────────────────────────────────────────

const generationSchema = z.object({
    courseId: z.number(),
    selectedFileIds: z.array(z.string()).min(1, "Please select at least one material file."),
    totalQuestions: z.number().min(1, "At least 1 question is required").max(100, "Maximum 100 questions allowed"),
    questionTypes: z.object({
        mcq: z.number().min(0),
        trueFalse: z.number().min(0),
        written: z.number().min(0),
    }),
    difficulty: z.object({
        easy: z.number().min(0).max(100),
        medium: z.number().min(0).max(100),
        hard: z.number().min(0).max(100),
    }),
    options: z.object({
        topics: z.array(z.string()).default([]),
        instructions: z.string().optional()
    })
}).refine(data => {
    const sum = data.questionTypes.mcq + data.questionTypes.trueFalse + data.questionTypes.written;
    return sum === data.totalQuestions;
}, {
    message: "Sum of question types must equal total questions",
    path: ["questionTypes"]
}).refine(data => {
    const sum = data.difficulty.easy + data.difficulty.medium + data.difficulty.hard;
    return sum === 100;
}, {
    message: "Total difficulty must equal exactly 100%",
    path: ["difficulty.root"] // Targeted path for root-level error in component
});

type GenerationFormData = z.infer<typeof generationSchema>;

// ─── Types ──────────────────────────────────────────────────────────────────

interface AIQuestionGeneratorModalProps {
    isOpen: boolean;
    quizId?: string;
    onClose: () => void;
    onGenerate: (questions: QuestionUpsertRequest[]) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function AIQuestionGeneratorModal({ isOpen, quizId, onClose, onGenerate }: AIQuestionGeneratorModalProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [lockedType, setLockedType] = useState<'mcq' | 'trueFalse' | 'written' | null>(null);
    const [topicInput, setTopicInput] = useState('');

    // Lock body scroll when modal is open
    useLockBodyScroll();

    // Get Course ID from Quiz
    const quizQuery = useQuery({ 
        queryKey: ['quiz', quizId], 
        queryFn: () => quizService.getQuiz(quizId as string), 
        enabled: Boolean(quizId) && isOpen 
    });
    
    const courseId = quizQuery.data?.courseId ? Number(quizQuery.data.courseId) : undefined;

    // Fetch AI Resources
    const resourcesQuery = useQuery({
        queryKey: ['ai-resources', courseId],
        queryFn: () => aiResourcesService.getAiResources(courseId as number),
        enabled: Boolean(courseId) && isOpen,
    });

    const resources = useMemo(() => {
        const resp = resourcesQuery.data;
        if (resp && 'success' in resp && resp.success) {
            return resp.data as AiFileDto[];
        }
        return [];
    }, [resourcesQuery.data]);

    // React Hook Form
    const formMethods = useForm<GenerationFormData>({
        resolver: zodResolver(generationSchema) as any,
        mode: 'onChange',
        defaultValues: {
            courseId: courseId ?? 0,
            selectedFileIds: [],
            totalQuestions: 10,
            questionTypes: {
                mcq: 5,
                trueFalse: 3,
                written: 2,
            },
            difficulty: {
                easy: 0,
                medium: 0,
                hard: 100,
            },
            options: {
                topics: [],
                instructions: ''
            }
        }
    });

    const { 
        register, 
        handleSubmit, 
        setValue, 
        getValues, 
        control, 
        formState: { errors, isValid } 
    } = formMethods;

    // Targeted watchers to prevent full component re-renders
    const totalQuestions = useWatch({ control, name: 'totalQuestions' });
    const questionTypes = useWatch({ control, name: 'questionTypes' });
    const selectedFileIds = useWatch({ control, name: 'selectedFileIds' }) || [];

    // Update courseId in form when it changes
    useEffect(() => {
        if (courseId) setValue('courseId', courseId);
    }, [courseId, setValue]);

    // Auto-distribute question types ONLY when totalQuestions changes
    // This provides a starting point but allows user to customize
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
        
        // 1. Define priorities
        const priorityMap = {
            mcq: ['trueFalse', 'written'],
            trueFalse: ['written', 'mcq'],
            written: ['mcq', 'trueFalse']
        } as const;

        const targets = priorityMap[type];
        
        // 2. Handle Lock
        if (lockedType && lockedType !== type) {
            // If one is locked, only the third field can adjust
            const thirdField = keys.find(k => k !== type && k !== lockedType)!;
            const lockedVal = currentTypes[lockedType];
            const remainingForPair = totalQuestions - lockedVal;
            
            const clampedCurrent = Math.max(0, Math.min(remainingForPair, newValue));
            const otherVal = remainingForPair - clampedCurrent;

            setValue(`questionTypes.${type}`, clampedCurrent, { shouldValidate: true });
            setValue(`questionTypes.${thirdField}`, otherVal, { shouldValidate: true });
            return;
        }

        // 3. No Lock: Priority adjustment
        const clampedNew = Math.max(0, Math.min(totalQuestions, newValue));
        const diff = clampedNew - (currentTypes[type] || 0);
        
        setValue(`questionTypes.${type}`, clampedNew, { shouldValidate: true });

        // Try to adjust targets in order
        let remainingDiff = diff;
        targets.forEach((targetKey, i) => {
            const currentTargetVal = currentTypes[targetKey] || 0;
            // If it's the first target, try to take the whole diff. 
            // If it's the second target, take whatever is left.
            const adjustment = i === 0 
                ? Math.min(currentTargetVal, remainingDiff)
                : remainingDiff;
            
            const nextTargetVal = Math.max(0, currentTargetVal - adjustment);
            setValue(`questionTypes.${targetKey}`, nextTargetVal, { shouldValidate: true });
            remainingDiff -= (currentTargetVal - nextTargetVal);
        });

        // Final safety check: if we couldn't balance it, re-clamp the source
        if (remainingDiff !== 0) {
            setValue(`questionTypes.${type}`, clampedNew - remainingDiff, { shouldValidate: true });
        }
    }, [totalQuestions, lockedType, getValues, setValue]);



    const toggleFileSelection = React.useCallback((id: string) => {
        const current = getValues('selectedFileIds') || [];
        const next = current.includes(id)
            ? current.filter(fid => fid !== id)
            : [...current, id];
        setValue('selectedFileIds', next, { shouldValidate: true });
    }, [getValues, setValue]);

    // Generation Mutation
    const generateMutation = useMutation({
        mutationFn: (data: GenerationFormData) => {
            // Mapping new payload to old service for now, or updating service
            // Based on user request "Submission Payload", I'll send exactly what they want
            return quizService.generateQuizQuestionsByAI(quizId as string, {
                fileIds: data.selectedFileIds,
                questionsCount: data.totalQuestions,
                questionTypeCounts: {
                    MCQ: data.questionTypes.mcq,
                    TrueFalse: data.questionTypes.trueFalse,
                    Written: data.questionTypes.written
                },
                questionDifficultyPercents: {
                    Easy: data.difficulty.easy,
                    Medium: data.difficulty.medium,
                    Hard: data.difficulty.hard
                },
                query: `${(data.options.topics || []).join(', ')} | ${data.options.instructions || ''}`.trim()
            } as any);
        },
        onSuccess: (data: any) => {
            // Handle generation response (questions)
            const questions = data?.questions ?? data?.data ?? [];
            if (questions.length > 0) {
                onGenerate(questions);
                onClose();
            } else {
                toast.error("No questions were generated. Please try again.");
            }
            setIsGenerating(false);
        },
        onError: (err) => {
            console.error(err);
            toast.error("Generation failed. Please check your connection or try again.");
            setIsGenerating(false);
        }
    });

    const onSubmit = (data: GenerationFormData) => {
        setIsGenerating(true);
        setGenerationProgress(10);
        
        // Simulated progress for better UX
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 5;
            });
        }, 1000);

        generateMutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => !isGenerating && onClose()} />

            <FormProvider {...formMethods}>
                <div 
                    className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4"
                >
                    {/* Header: Static */}
                    <header className="flex items-center justify-between px-10 py-7 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 z-20">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                <BrainCircuit className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    AI Assessment Generator
                                </h2>
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                                    Powered by Ailern Intelligence Engine
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isGenerating}
                            className="p-4 text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-slate-800 rounded-3xl transition-all disabled:opacity-50 active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    {/* Body: Scrollable Content ONLY */}
                    <div className="flex-1 overflow-y-auto overscroll-behavior-contain scroll-smooth will-change-transform px-10 py-10 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-12">
                        
                        {/* 1. Source Materials Selection */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        Step 1: Select Source Materials
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Choose the files the AI should analyze to generate questions.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setValue('selectedFileIds', resources.map(r => r.id))}
                                        className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setValue('selectedFileIds', [])}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {resourcesQuery.isLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
                                    ))}
                                </div>
                            ) : resources.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                                    <FileText className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">No materials found in this course</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {resources.map(file => (
                                        <AIResourceCard 
                                            key={file.id} 
                                            file={file} 
                                            isSelected={selectedFileIds.includes(file.id)}
                                            onToggle={toggleFileSelection}
                                        />
                                    ))}
                                </div>
                            )}
                            {errors.selectedFileIds && (
                                <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.selectedFileIds.message}
                                </p>
                            )}
                        </section>

                        {/* 2. Assessment Configuration */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                            
                            {/* Distribution Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <LayoutGrid className="w-5 h-5 text-indigo-500" />
                                        Step 2: Question Distribution
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Configure the total count and variety of questions.
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">Total Questions</label>
                                        <div className="relative group w-32">
                                            <input 
                                                type="number"
                                                {...register('totalQuestions', { valueAsNumber: true })}
                                                className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl text-center group-hover:text-left group-hover:pl-6 font-black text-xl text-indigo-600 dark:text-indigo-400 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const val = getValues('totalQuestions') || 0;
                                                        if (val < 100) setValue('totalQuestions', val + 1, { shouldValidate: true });
                                                    }}
                                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 rounded-md transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4 -rotate-90" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const val = getValues('totalQuestions') || 0;
                                                        if (val > 1) setValue('totalQuestions', val - 1, { shouldValidate: true });
                                                    }}
                                                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 rounded-md transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </button>
                                            </div>
                                            <div className="absolute -top-7 right-0 text-[10px] font-black text-gray-400 uppercase tracking-tighter">MAX 100</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                                        {[
                                            { id: 'mcq', label: 'Multiple Choice', color: 'blue' },
                                            { id: 'trueFalse', label: 'True / False', color: 'emerald' },
                                            { id: 'written', label: 'Written Response', color: 'amber' }
                                        ].map(type => {
                                            const isLocked = lockedType === type.id;
                                            const val = questionTypes[type.id as keyof typeof questionTypes] || 0;

                                            return (
                                                <div key={type.id} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLockedType(isLocked ? null : type.id as any)}
                                                            className={clsx(
                                                                "p-1 rounded-md transition-all active:scale-90",
                                                                isLocked ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" : "text-gray-300 hover:text-gray-600 dark:text-slate-700 dark:hover:text-slate-400"
                                                            )}
                                                        >
                                                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <div className={clsx(
                                                            "w-2 h-2 rounded-full",
                                                            type.color === 'blue' ? "bg-blue-500" : type.color === 'emerald' ? "bg-emerald-500" : "bg-amber-500"
                                                        )} />
                                                        <span className={clsx("text-sm font-bold transition-colors", isLocked ? "text-amber-600" : "text-gray-600 dark:text-slate-400")}>
                                                            {type.label}
                                                        </span>
                                                    </div>
                                                    <div className="relative group w-20">
                                                        <input 
                                                            type="number"
                                                            value={val}
                                                            disabled={isLocked}
                                                            onChange={(e) => handleQuestionTypeChange(type.id as any, Number(e.target.value))}
                                                            className={clsx(
                                                                "w-full px-2 py-2 bg-gray-50 dark:bg-slate-900 border rounded-xl text-center font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                isLocked 
                                                                    ? "border-amber-200 bg-amber-50/50 text-amber-600 cursor-not-allowed" 
                                                                    : "border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white group-hover:text-left group-hover:pl-4 focus:ring-2 focus:ring-indigo-500/50"
                                                            )}
                                                        />
                                                        {!isLocked && (
                                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleQuestionTypeChange(type.id as any, val + 1)}
                                                                    className="p-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 rounded transition-colors"
                                                                >
                                                                    <ChevronRight className="w-3 h-3 -rotate-90" />
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleQuestionTypeChange(type.id as any, val - 1)}
                                                                    className="p-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 rounded transition-colors"
                                                                >
                                                                    <ChevronRight className="w-3 h-3 rotate-90" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {errors.questionTypes && (
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                                            {errors.questionTypes.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Difficulty Section */}
                            <DifficultyDistribution />
                        </section>

                        {/* 3. Advanced Controls */}
                        <section className="pt-8 border-t border-gray-100 dark:border-slate-800">
                            <button 
                                type="button"
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-widest"
                            >
                                <Settings className={clsx("w-4 h-4 transition-transform duration-300", isAdvancedOpen ? "rotate-90" : "")} />
                                Advanced Controls
                                {isAdvancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {isAdvancedOpen && (
                                <div className="mt-6 p-8 bg-gray-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                                            Topics to Focus On
                                        </label>
                                        
                                        <div className="min-h-[120px] p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all cursor-text" onClick={() => (document.getElementById('topic-input') as HTMLInputElement)?.focus()}>
                                            <div className="flex flex-wrap gap-2">
                                                {formMethods.watch('options.topics').map((topic, index) => (
                                                    <span 
                                                        key={index} 
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black rounded-xl border border-indigo-100 dark:border-indigo-500/20 animate-in zoom-in-90 duration-200"
                                                    >
                                                        {topic}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const current = formMethods.getValues('options.topics');
                                                                formMethods.setValue('options.topics', current.filter((_, i) => i !== index));
                                                            }}
                                                            className="hover:bg-indigo-200 dark:hover:bg-indigo-500/30 p-0.5 rounded-md transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input 
                                                    id="topic-input"
                                                    type="text"
                                                    value={topicInput}
                                                    onChange={(e) => setTopicInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ',') {
                                                            e.preventDefault();
                                                            const val = topicInput.trim().replace(/,$/, '');
                                                            if (val) {
                                                                const current = formMethods.getValues('options.topics');
                                                                if (!current.includes(val)) {
                                                                    formMethods.setValue('options.topics', [...current, val]);
                                                                }
                                                                setTopicInput('');
                                                            }
                                                        }
                                                    }}
                                                    placeholder={formMethods.watch('options.topics').length === 0 ? "Type topic and press Enter..." : "Add more..."}
                                                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-bold text-gray-700 dark:text-white placeholder:text-gray-400 py-1"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">AI will prioritize these specific areas</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Settings className="w-3.5 h-3.5 text-amber-500" />
                                            Custom Instructions
                                        </label>
                                        <textarea 
                                            {...register('options.instructions')}
                                            placeholder="e.g. Make questions challenging, use professional tone..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                                        />
                                        <p className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Additional rules for the AI to follow</p>
                                    </div>
                                </div>
                            )}
                        </section>
                        </div>
                    </div>

                    {/* Footer: Static */}
                    <footer className="p-10 border-t border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 z-20">
                        <div className="max-w-4xl mx-auto">
                            {isGenerating ? (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                            <span>AI is composing your questions...</span>
                                        </div>
                                        <span className="text-xl tabular-nums">{generationProgress}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${generationProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                                        Analyzing content • Generating options • Validating answers
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Configuration</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{totalQuestions} Questions • {selectedFileIds.length} Materials</span>
                                        </div>
                                        <div className="w-px h-10 bg-gray-100 dark:bg-slate-800 hidden sm:block" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Estimation</span>
                                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">~{Math.ceil(totalQuestions / 5) * 5} Seconds</span>
                                        </div>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={handleSubmit(onSubmit)}
                                        disabled={!isValid || selectedFileIds.length === 0}
                                        className="w-full sm:w-auto flex items-center justify-center gap-4 px-14 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-3xl shadow-2xl shadow-indigo-500/25 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        <Sparkles className="w-6 h-6" />
                                        Generate Assessment
                                    </button>
                                </div>
                            )}
                        </div>
                    </footer>
                </div>
            </FormProvider>
        </div>
    );
}