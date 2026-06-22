import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Star, 
    Sparkles, 
    Frown, 
    Meh, 
    Smile, 
    ThumbsUp, 
    CheckCircle2, 
    MessageSquare, 
    Brain,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { submitAIEvaluation, evaluateAiGradingQuestion, type EvaluateAiGradingQuestionPayload } from '@/api/services/attempts.service';
import { useMe } from '@/features/auth/api';
import { toast } from 'sonner';

interface AIGradingQualityAssessmentProps {
    questionId: string;
    attemptId: string;
    aiScore: number;
    instructorFinalScore: number;
    aiFeedbackSummary: string;
    onSubmitSuccess?: () => void;
}

interface RatingOption {
    value: number;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    glowClass: string;
}

const RATING_OPTIONS: RatingOption[] = [
    {
        value: 1,
        label: 'Poor',
        description: 'The grading was inaccurate.',
        icon: Frown,
        colorClass: 'text-red-500 dark:text-red-400',
        bgClass: 'bg-red-50/50 dark:bg-red-950/20',
        borderClass: 'border-red-200 dark:border-red-500/30',
        glowClass: 'shadow-red-500/10'
    },
    {
        value: 2,
        label: 'Fair',
        description: 'Several issues were found.',
        icon: Meh,
        colorClass: 'text-orange-500 dark:text-orange-400',
        bgClass: 'bg-orange-50/50 dark:bg-orange-950/20',
        borderClass: 'border-orange-200 dark:border-orange-500/30',
        glowClass: 'shadow-orange-500/10'
    },
    {
        value: 3,
        label: 'Good',
        description: 'Mostly acceptable with minor issues.',
        icon: Smile,
        colorClass: 'text-yellow-500 dark:text-yellow-400',
        bgClass: 'bg-yellow-50/50 dark:bg-yellow-950/20',
        borderClass: 'border-yellow-200 dark:border-yellow-500/30',
        glowClass: 'shadow-yellow-500/10'
    },
    {
        value: 4,
        label: 'Very Good',
        description: 'Accurate with only small adjustments needed.',
        icon: ThumbsUp,
        colorClass: 'text-blue-500 dark:text-blue-400',
        bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
        borderClass: 'border-blue-200 dark:border-blue-500/30',
        glowClass: 'shadow-blue-500/10'
    },
    {
        value: 5,
        label: 'Excellent',
        description: 'Highly accurate and aligned with instructor expectations.',
        icon: Sparkles,
        colorClass: 'text-violet-500 dark:text-violet-400',
        bgClass: 'bg-violet-50/50 dark:bg-violet-950/20',
        borderClass: 'border-violet-200 dark:border-violet-500/30',
        glowClass: 'shadow-violet-500/10'
    }
];

const FEEDBACK_THEMES = [
    'Accurate Rubric Alignment',
    'Model Strictness on Synonyms',
    'Feedback Detail is Exceptional',
    'Minor Over-crediting on Length',
    'Accurate Partial Marks',
    'Generic Feedback',
    'Score Too High',
    'Score Too Low',
    'Missed Key Concepts',
    'Strong Explanation Quality',
    'Other'
];

const RATING_MAP: Record<number, 'Poor' | 'Fair' | 'Good' | 'VeryGood' | 'Excellent'> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'VeryGood',
    5: 'Excellent'
};

const THEME_MAP: Record<string, 'AccurateRubricAlignment' | 'GenericFeedback' | 'ModelStrictnessOnSynonyms' | 'ScoreTooHigh' | 'ScoreTooLow' | 'FeedbackDetailIsExceptional' | 'MissedKeyConcepts' | 'MinorOverCreditingOnLength' | 'StrongExplanationQuality' | 'AccuratePartialMarks' | 'Other'> = {
    'Accurate Rubric Alignment': 'AccurateRubricAlignment',
    'Generic Feedback': 'GenericFeedback',
    'Model Strictness on Synonyms': 'ModelStrictnessOnSynonyms',
    'Score Too High': 'ScoreTooHigh',
    'Score Too Low': 'ScoreTooLow',
    'Feedback Detail is Exceptional': 'FeedbackDetailIsExceptional',
    'Missed Key Concepts': 'MissedKeyConcepts',
    'Minor Over-crediting on Length': 'MinorOverCreditingOnLength',
    'Strong Explanation Quality': 'StrongExplanationQuality',
    'Accurate Partial Marks': 'AccuratePartialMarks',
    'Other': 'Other'
};

export const AIGradingQualityAssessment = ({
    questionId,
    attemptId,
    aiScore,
    instructorFinalScore,
    aiFeedbackSummary,
    onSubmitSuccess
}: AIGradingQualityAssessmentProps) => {
    const queryClient = useQueryClient();
    const { data: currentUser } = useMe();
    
    const [rating, setRating] = useState<number | null>(null);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const evaluationMutation = useMutation({
        mutationFn: async () => {
            if (!rating) throw new Error('Please select a rating level.');
            
            const selectedTheme = selectedThemes[0];
            const mappedRating = RATING_MAP[rating];
            const mappedTheme = selectedTheme ? THEME_MAP[selectedTheme] : undefined;

            const payload: EvaluateAiGradingQuestionPayload = {
                instructorId: currentUser?.id ?? 'unknown-instructor',
                aiRating: mappedRating,
                instructorComment: mappedTheme,
                additionalFeedback: selectedTheme === 'Other' ? comment.trim() : '',
                aiScore,
                createdAt: new Date().toISOString()
            };
            
            await evaluateAiGradingQuestion(attemptId, questionId, payload);
        },
        onSuccess: () => {
            setIsSubmitted(true);
            toast.success('AI evaluation submitted successfully.');
            queryClient.invalidateQueries({ queryKey: ['ai-evaluations-analytics'] });
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
        },
        onError: (err) => {
            const msg = err instanceof Error ? err.message : 'Failed to submit evaluation.';
            toast.error(msg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        evaluationMutation.mutate();
    };

    if (isSubmitted) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[2rem] p-8 text-center shadow-md animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10 dark:shadow-none border border-emerald-100 dark:border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Thank you!</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm max-w-md mx-auto">
                    Your evaluation will help improve future AI grading performance. We appreciate your human-in-the-loop insights.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-violet-100 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Top background glow for visual distinction */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            {/* Header Accordion Toggle */}
            <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
            >
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <Brain className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                AI Grading Quality Assessment
                            </h3>
                            {rating && isCollapsed && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                    {RATING_OPTIONS.find(o => o.value === rating)?.label} ⭐
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                            Help improve future AI grading by evaluating the accuracy of this result.
                        </p>
                    </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-100 dark:border-slate-750 transition-colors shrink-0">
                    {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronUp className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Collapsible Content */}
            <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100 mt-6'}`}>
                <div className="overflow-hidden space-y-6">
                    {/* Scores & Feedback Display */}
                    <div className={`grid grid-cols-1 ${instructorFinalScore && instructorFinalScore !== 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80`}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">AI Estimated Score</p>
                            <p className="text-base font-black text-violet-600 dark:text-violet-400">{aiScore} <span className="text-xs font-normal text-gray-400">marks</span></p>
                        </div>
                        {instructorFinalScore && instructorFinalScore !== 0 ? (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Instructor Final Score</p>
                                <p className="text-base font-black text-[#21A9FF]">
                                    {instructorFinalScore}{' '}
                                    <span className="text-xs font-normal text-gray-400">marks</span>
                                </p>
                            </div>
                        ) : null}
                        <div className="space-y-1 md:col-span-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">AI Feedback Summary</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate max-w-xs" title={aiFeedbackSummary}>
                                {aiFeedbackSummary || 'No feedback text available.'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Rating Interactive Cards */}
                        <div className="space-y-3">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
                                Accuracy Rating
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                {RATING_OPTIONS.map((opt) => {
                                    const IconComponent = opt.icon;
                                    const isSelected = rating === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRating(opt.value)}
                                            className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
                                                isSelected
                                                    ? `bg-gradient-to-b ${opt.bgClass} ${opt.borderClass} ${opt.glowClass} border-2 scale-[1.02] shadow-lg`
                                                    : 'bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700 hover:shadow-md'
                                            }`}
                                        >
                                            {/* Icon with animated color */}
                                            <div className={`p-2.5 rounded-xl mb-3 transition-colors ${
                                                isSelected ? opt.colorClass : 'text-gray-400 group-hover:text-violet-500'
                                            }`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            
                                            {/* Stars display */}
                                            <div className="flex gap-0.5 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${
                                                            i < opt.value
                                                                ? isSelected
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'fill-gray-300 text-gray-300 group-hover:fill-amber-400 group-hover:text-amber-400 transition-colors'
                                                                : 'text-gray-200 dark:text-slate-700'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">
                                                {opt.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 leading-tight">
                                                {opt.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Predefined Feedback Themes Section */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
                                    Feedback Themes
                                </label>
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 mt-0.5">
                                    Select a feedback theme that applies to this AI grading result.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {FEEDBACK_THEMES.map(theme => {
                                    const isSelected = selectedThemes.includes(theme);
                                    return (
                                        <button
                                            key={theme}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedThemes([]);
                                                } else {
                                                    setSelectedThemes([theme]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border duration-200 active:scale-95 ${
                                                isSelected
                                                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-500/25 border-violet-600'
                                                    : 'bg-white dark:bg-slate-800/40 border-gray-205 dark:border-slate-800 text-gray-700 dark:text-slate-350 hover:border-violet-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            {theme}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conditional Additional Feedback Section */}
                        {selectedThemes.includes('Other') && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex justify-between items-center">
                                    <label htmlFor={`comment-${questionId}`} className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
                                        Additional Feedback
                                    </label>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Required</span>
                                </div>
                                <div className="relative group">
                                    <MessageSquare className="w-4 h-4 text-gray-400 absolute left-4 top-4 group-focus-within:text-violet-500 transition-colors" />
                                    <textarea
                                        id={`comment-${questionId}`}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Describe feedback not covered by the predefined themes."
                                        className="w-full min-h-[100px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all resize-y"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Action */}
                        <button
                            type="submit"
                            disabled={!rating || evaluationMutation.isPending}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-100 disabled:to-gray-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white disabled:text-gray-400 dark:disabled:text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-violet-500/25 active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {evaluationMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {evaluationMutation.isPending ? 'Submitting...' : 'Submit AI Evaluation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
