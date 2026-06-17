import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AIGradingCriteriaResponseItem } from '../types/ai-grading.types';

interface AIQuestionStreamProps {
    items: AIGradingCriteriaResponseItem[];
    selectedQuestionId: string | null;
    onSelect: (id: string) => void;
}

const cleanHtmlText = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

export const AIQuestionStream: React.FC<AIQuestionStreamProps> = ({
    items,
    selectedQuestionId,
    onSelect,
}) => {
    return (
        <div className="flex flex-col gap-3">
            {items.map((item, index) => {
                const hasModelAnswer = !!item.modelAnswer;
                const hasCriteria = item.criteriaList && item.criteriaList.length > 0;
                const isReady = hasModelAnswer && hasCriteria;

                const isSelected = selectedQuestionId === item.questionId;

                return (
                    <button
                        key={item.questionId}
                        onClick={() => onSelect(item.questionId)}
                        className={`group relative overflow-hidden text-left w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                            isSelected
                                ? 'bg-gradient-to-r from-[#21A9FF]/8 to-indigo-500/5 dark:from-[#21A9FF]/12 dark:to-indigo-500/8 border-[#21A9FF] shadow-md shadow-[#21A9FF]/10 translate-x-1'
                                : 'bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80 hover:border-[#21A9FF]/50 dark:hover:border-[#21A9FF]/50 hover:shadow-md hover:shadow-[#21A9FF]/5 hover:translate-x-1'
                        }`}
                    >
                        {/* Active Selection Indicator Accent Line */}
                        {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#21A9FF] to-indigo-600 animate-in fade-in duration-300" />
                        )}

                        <div className="flex items-center justify-between pl-1">
                            <div className="flex flex-col gap-1">
                                <span
                                    className={`text-sm tracking-tight transition-colors duration-300 ${
                                        isSelected
                                            ? 'font-black text-[#21A9FF] dark:text-[#21A9FF]'
                                            : 'font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                                    }`}
                                >
                                    Question {index + 1}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {item.mark} Marks
                                </span>
                            </div>
                            
                            <div
                                className={`flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-xl border transition-colors duration-300 ${
                                    isReady
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                                        : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm shadow-amber-500/5'
                                }`}
                            >
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        isReady ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}></span>
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                        isReady ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}></span>
                                </span>
                                {isReady ? 'Ready' : 'Incomplete'}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
