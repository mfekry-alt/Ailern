import React from 'react';
import { Trash2, Plus, ListChecks, Sparkles, CheckCircle2 } from 'lucide-react';
import type { AIGradingCriterion } from '../types/ai-grading.types';

interface AICriteriaEditorProps {
    criteria: AIGradingCriterion[];
    onChange: (criteria: AIGradingCriterion[]) => void;
}

export const AICriteriaEditor: React.FC<AICriteriaEditorProps> = ({ criteria, onChange }) => {
    const handleAdd = () => {
        const newCriterion: AIGradingCriterion = {
            id: null,
            criterion: '',
            mark: 1
        };
        onChange([...criteria, newCriterion]);
    };

    const handleRemove = (indexToRemove: number) => {
        const updated = criteria.filter((_, idx) => idx !== indexToRemove);
        onChange(updated);
    };

    const handleCriterionChange = (index: number, field: 'criterion' | 'mark', value: string | number) => {
        const updated = [...criteria];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                        <ListChecks className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            Grading Criteria
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                                {criteria.length} defined
                            </span>
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Specify exactly what the AI should award marks for.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex items-center gap-2 text-sm font-black text-[#21A9FF] hover:text-white bg-[#21A9FF]/10 hover:bg-[#21A9FF] px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:shadow-[#21A9FF]/25 w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" /> Add Criterion
                </button>
            </div>

            {/* Criteria List */}
            {criteria.length === 0 ? (
                <div className="w-full py-16 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/20 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No criteria defined yet</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm">
                        Add specific criteria to guide the AI on how to evaluate and distribute marks for this question.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {criteria.map((c, idx) => (
                        <div
                            key={idx}
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-[#21A9FF]/40 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden gap-4"
                        >
                            {/* Decorative accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-[#21A9FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="flex-1 w-full pl-2">
                                <input
                                    type="text"
                                    value={c.criterion}
                                    onChange={(e) => handleCriterionChange(idx, 'criterion', e.target.value)}
                                    placeholder="Enter criterion description..."
                                    className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#21A9FF] focus:outline-none py-1 text-base font-bold text-slate-800 dark:text-slate-200 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 dark:text-emerald-400 mt-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Automatically Evaluated
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={c.mark}
                                        onChange={(e) => handleCriterionChange(idx, 'mark', Number(e.target.value))}
                                        className="w-16 sm:w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#21A9FF] focus:ring-1 focus:ring-[#21A9FF] outline-none transition-all"
                                    />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Marks
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemove(idx)}
                                    className="p-2.5 text-slate-300 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-300 flex-shrink-0"
                                    title="Remove criterion"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};