import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AIGradingCriteriaResponseItem } from '../types/ai-grading.types';

interface AIQuestionStreamProps {
    items: AIGradingCriteriaResponseItem[];
    selectedQuestionId: string | null;
    onSelect: (id: string) => void;
}

export const AIQuestionStream: React.FC<AIQuestionStreamProps> = ({
    items,
    selectedQuestionId,
    onSelect,
}) => {
    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => {
                const hasModelAnswer = !!item.modelAnswer;
                const hasCriteria = item.criteriaList && item.criteriaList.length > 0;
                const isReady = hasModelAnswer && hasCriteria;

                const isSelected = selectedQuestionId === item.questionId;

                return (
                    <button
                        key={item.questionId}
                        onClick={() => onSelect(item.questionId)}
                        className={`group relative text-left w-full p-4 rounded-2xl border transition-all duration-300 ${
                            isSelected
                                ? 'bg-[#21A9FF]/5 border-[#21A9FF] shadow-sm shadow-[#21A9FF]/10'
                                : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                        }`}
                    >
                        {/* Active Selection Indicator */}
                        {isSelected && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#21A9FF] rounded-r-full" />
                        )}

                        <div className="flex flex-col gap-2 pl-2">
                            <p
                                className={`text-sm leading-snug line-clamp-2 transition-colors duration-300 ${
                                    isSelected
                                        ? 'font-black text-[#21A9FF] dark:text-[#21A9FF]'
                                        : 'font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                                }`}
                            >
                                {item.questionText}
                            </p>
                            
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {item.mark} Marks
                                </span>
                                
                                <div
                                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border ${
                                        isReady
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                    }`}
                                >
                                    {isReady ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    )}
                                    {isReady ? 'Ready' : 'Incomplete'}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
