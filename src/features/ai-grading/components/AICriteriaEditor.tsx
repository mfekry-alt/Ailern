import React from 'react';
import { Trash2, Plus, ListChecks, Sparkles, CheckCircle2, Lock, Unlock } from 'lucide-react';
import type { AIGradingCriterion } from '../types/ai-grading.types';

interface AICriteriaEditorProps {
    criteria: AIGradingCriterion[];
    onChange: (criteria: AIGradingCriterion[]) => void;
    maxMark: number;
}

export const AICriteriaEditor: React.FC<AICriteriaEditorProps> = ({ criteria, onChange, maxMark }) => {
    const handleAdd = () => {
        const currentTotal = criteria.reduce((sum, c) => sum + Number(c.mark || 0), 0);
        const remaining = Math.max(0, maxMark - currentTotal);
        const newCriterion: AIGradingCriterion = {
            id: null,
            criterion: '',
            mark: criteria.length === 0 ? maxMark : (remaining > 0 ? Math.min(1, remaining) : 0)
        };
        onChange([...criteria, newCriterion]);
    };

    const handleRemove = (indexToRemove: number) => {
        const removedMark = Number(criteria[indexToRemove].mark || 0);
        let updated = criteria.filter((_, idx) => idx !== indexToRemove);
        
        if (updated.length > 0 && removedMark > 0) {
            // Give removed points to the first unlocked remaining criterion
            const firstUnlockedIdx = updated.findIndex(c => !(c as any).isLocked);
            const targetIdx = firstUnlockedIdx !== -1 ? firstUnlockedIdx : 0;
            updated[targetIdx] = { ...updated[targetIdx], mark: Number(updated[targetIdx].mark || 0) + removedMark };
        }
        onChange(updated);
    };

    const handleCriterionChange = (index: number, field: 'criterion' | 'mark' | 'isLocked', value: string | number | boolean) => {
        const updated = [...criteria];
        
        if (field === 'mark') {
            const newValue = Number(value);
            const oldValue = Number(updated[index].mark || 0);
            let diff = newValue - oldValue;
            
            if (diff === 0) return;
            
            updated[index] = { ...updated[index], mark: newValue };
            
            if (diff > 0) {
                // Steal diff from others
                for (let i = 0; i < updated.length; i++) {
                    if (i !== index && diff > 0 && !(updated[i] as any).isLocked) {
                        const otherMark = Number(updated[i].mark || 0);
                        if (otherMark > 0) {
                            const subtractAmount = Math.min(otherMark, diff);
                            updated[i] = { ...updated[i], mark: otherMark - subtractAmount };
                            diff -= subtractAmount;
                        }
                    }
                }
            } else if (diff < 0) {
                // Give absolute diff to another criterion
                let toAdd = Math.abs(diff);
                for (let i = 0; i < updated.length; i++) {
                    if (i !== index && toAdd > 0 && !(updated[i] as any).isLocked) {
                        const otherMark = Number(updated[i].mark || 0);
                        updated[i] = { ...updated[i], mark: otherMark + toAdd };
                        toAdd = 0;
                    }
                }
            }
        } else if (field === 'criterion') {
            updated[index] = { ...updated[index], criterion: value as string };
        } else if (field === 'isLocked') {
            if (value === true) {
                // Unlock all others if setting this one to locked
                for (let i = 0; i < updated.length; i++) {
                    if ((updated[i] as any).isLocked) {
                        updated[i] = { ...updated[i], isLocked: false } as any;
                    }
                }
            }
            updated[index] = { ...updated[index], isLocked: value } as any;
        }
        
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
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                Grading Criteria
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                                {criteria.length} defined
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none shadow-sm shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Automatically Evaluated
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Specify exactly what the AI should award marks for.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="group/add flex items-center gap-2 text-sm font-black text-[#21A9FF] hover:text-white bg-[#21A9FF]/10 hover:bg-[#21A9FF] px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:shadow-[#21A9FF]/25 w-full sm:w-auto justify-center border border-[#21A9FF]/25 hover:border-transparent"
                >
                    <Plus className="w-4 h-4 group-hover/add:rotate-90 transition-transform duration-300" /> Add Criterion
                </button>
            </div>

            {/* Criteria List */}
            {criteria.length === 0 ? (
                <div className="w-full py-16 px-6 border-2 border-dashed border-slate-200/80 dark:border-slate-850 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm text-center flex flex-col items-center justify-center space-y-4 shadow-sm animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150/40 dark:border-indigo-500/20 shadow-sm flex items-center justify-center text-indigo-500/80 dark:text-indigo-400 mb-2 animate-pulse">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">No criteria defined yet</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                        Add specific evaluation benchmarks so the AI engine knows exactly what factors merit points.
                    </p>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-indigo-600/15 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Define First Criterion
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5">
                    {criteria.map((c, idx) => {
                        const isLocked = !!(c as any).isLocked;
                        const isAnyOtherUnlocked = criteria.some((item, i) => i !== idx && !(item as any).isLocked);
                        const otherUnlockedSum = criteria.reduce((sum, item, i) => sum + ((i !== idx && !(item as any).isLocked) ? Number(item.mark || 0) : 0), 0);
                        const maxPossibleMark = isAnyOtherUnlocked ? Number(c.mark || 0) + otherUnlockedSum : Number(c.mark || 0);
                        const isMarkDisabled = !isAnyOtherUnlocked || isLocked || criteria.length === 1;

                        return (
                            <div
                                key={idx}
                                className={`group flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border ${isLocked ? 'border-[#21A9FF]/30 dark:border-[#21A9FF]/30 bg-[#21A9FF]/[0.02]' : 'border-slate-200/80 dark:border-slate-800 hover:border-[#21A9FF]/40'} rounded-2xl hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden gap-4`}
                            >
                                {/* Decorative Accent Stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#21A9FF] to-indigo-600 transition-opacity duration-300 ${isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                
                                <div className="flex-1 w-full flex gap-3.5 items-center">
                                    {/* Number Indicator Circle */}
                                    <div className={`w-10 h-10 rounded-xl ${isLocked ? 'bg-[#21A9FF]/10 text-[#21A9FF] border-[#21A9FF]/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/30 dark:border-slate-700/30'} font-extrabold text-sm flex items-center justify-center shrink-0 border shadow-sm transition-colors duration-300`}>
                                        #{idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={c.criterion}
                                        onChange={(e) => handleCriterionChange(idx, 'criterion', e.target.value)}
                                        placeholder="Enter criterion description..."
                                        className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-[#21A9FF] focus:ring-4 focus:ring-[#21A9FF]/10 focus:outline-none transition-all duration-300 placeholder:text-slate-400"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                                    <div className={`flex items-center bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 rounded-xl p-1 gap-1 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#21A9FF] focus-within:ring-4 focus-within:ring-[#21A9FF]/10 transition-all duration-300 shadow-sm ${isMarkDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                        <button
                                            type="button"
                                            disabled={Number(c.mark) <= 0 || isMarkDisabled}
                                            onClick={() => handleCriterionChange(idx, 'mark', Math.max(0, Number(c.mark) - 0.5))}
                                            className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/85 flex items-center justify-center transition-all text-xs font-black select-none disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title="Decrease mark"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            max={maxPossibleMark}
                                            step="0.5"
                                            value={c.mark}
                                            disabled={isMarkDisabled}
                                            onChange={(e) => handleCriterionChange(idx, 'mark', Math.min(maxPossibleMark, Math.max(0, Number(e.target.value))))}
                                            className="w-8 text-center text-xs font-black text-slate-800 dark:text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                                        />
                                        <button
                                            type="button"
                                            disabled={Number(c.mark) >= maxPossibleMark || isMarkDisabled}
                                            onClick={() => handleCriterionChange(idx, 'mark', Math.min(maxPossibleMark, Number(c.mark) + 0.5))}
                                            className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/85 flex items-center justify-center transition-all text-xs font-black select-none disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title="Increase mark"
                                        >
                                            +
                                        </button>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none border-l border-slate-200/60 dark:border-slate-800/80 pl-2 pr-1.5 select-none">
                                            Marks
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                                        <button
                                            onClick={() => handleCriterionChange(idx, 'isLocked', !isLocked)}
                                            className={`p-2 rounded-lg transition-all duration-300 ${isLocked ? 'bg-[#21A9FF]/10 text-[#21A9FF] hover:bg-[#21A9FF]/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
                                            title={isLocked ? "Unlock criterion" : "Lock criterion to prevent auto-adjustment"}
                                        >
                                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleRemove(idx)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all duration-300"
                                            title="Remove criterion"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};