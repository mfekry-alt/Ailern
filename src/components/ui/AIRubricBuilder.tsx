import React, { useEffect, useRef } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { clsx } from 'clsx';

interface RubricCriterion {
    name: string;
    weight: number;
    locked?: boolean;
}

interface AIRubricBuilderProps {
    value: RubricCriterion[];
    onChange: (value: RubricCriterion[]) => void;
    maxPoints: number;
}

export const AIRubricBuilder: React.FC<AIRubricBuilderProps> = ({ value = [], onChange, maxPoints }) => {
    const criteria = value || [];
    const prevMaxPointsRef = useRef(maxPoints);
    const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    const isValid = Math.abs(totalWeight - maxPoints) < 0.01;

    // Auto-rescale rubric criteria when question mark changes
    useEffect(() => {
        if (prevMaxPointsRef.current !== maxPoints && prevMaxPointsRef.current > 0 && criteria.length > 0) {
            const ratio = maxPoints / prevMaxPointsRef.current;
            const rescaled = criteria.map(c => ({
                ...c,
                weight: Number((c.weight * ratio).toFixed(2))
            }));
            
            // Fix rounding issues to ensure total matches exactly
            const rescaledTotal = rescaled.reduce((sum, c) => sum + c.weight, 0);
            const diff = maxPoints - rescaledTotal;
            if (Math.abs(diff) > 0 && rescaled.length > 0) {
                rescaled[0].weight = Number((rescaled[0].weight + diff).toFixed(2));
            }

            onChange(rescaled);
        }
        prevMaxPointsRef.current = maxPoints;
    }, [maxPoints, criteria, onChange]);

    const addCriterion = () => {
        if (criteria.length === 0) {
            onChange([{ name: '', weight: maxPoints, locked: false }]);
            return;
        }

        const next = [...criteria];
        const unlockedIndices = next.map((_, i) => i).filter(i => !next[i].locked);
        
        let newWeight = 0;
        if (unlockedIndices.length > 0) {
            const sourceIdx = unlockedIndices[0];
            const taken = Math.min(next[sourceIdx].weight, Math.max(0.5, Number((maxPoints * 0.1).toFixed(1))));
            next[sourceIdx].weight = Number((next[sourceIdx].weight - taken).toFixed(2));
            newWeight = taken;
        }

        onChange([...next, { name: '', weight: newWeight, locked: false }]);
    };

    const removeCriterion = (index: number) => {
        const removedWeight = criteria[index].weight;
        const remaining = criteria.filter((_, i) => i !== index);
        
        if (remaining.length > 0) {
            const unlockedIndices = remaining.map((_, i) => i).filter(i => !remaining[i].locked);
            const targetIdx = unlockedIndices.length > 0 ? unlockedIndices[0] : 0;
            remaining[targetIdx].weight = Number((remaining[targetIdx].weight + removedWeight).toFixed(2));
        }
        
        onChange(remaining);
    };

    const updateCriterion = (index: number, patch: Partial<RubricCriterion>) => {
        const next = criteria.map(c => ({ ...c }));
        
        if (patch.locked === true) {
            next.forEach((c, i) => { if (i !== index) c.locked = false; });
        }

        if (patch.weight !== undefined) {
            if (criteria.length === 1) return;

            const oldWeight = next[index].weight;
            let newWeight = Math.min(maxPoints, Math.max(0, Number(patch.weight)));
            const delta = newWeight - oldWeight;

            const otherUnlockedIndices = next.map((_, i) => i).filter(i => i !== index && !next[i].locked);

            if (otherUnlockedIndices.length > 0 && delta !== 0) {
                let remainingDelta = -delta;
                const sortedOthers = [...otherUnlockedIndices].sort((a, b) => next[b].weight - next[a].weight);
                
                for (let i = 0; i < sortedOthers.length && Math.abs(remainingDelta) > 0; i++) {
                    const idx = sortedOthers[i];
                    const currentVal = next[idx].weight;
                    
                    if (remainingDelta < 0) { 
                        const take = Math.min(currentVal, Math.abs(remainingDelta));
                        next[idx].weight = Number((next[idx].weight - take).toFixed(2));
                        remainingDelta += take;
                    } else { 
                        next[idx].weight = Number((next[idx].weight + remainingDelta).toFixed(2));
                        remainingDelta = 0;
                    }
                }
                
                newWeight = oldWeight - (-delta - remainingDelta);
            } else if (otherUnlockedIndices.length === 0 && delta !== 0) {
                newWeight = oldWeight;
            }

            next[index].weight = Number(newWeight.toFixed(2));
        }

        if (patch.name !== undefined) next[index].name = patch.name;
        if (patch.locked !== undefined) next[index].locked = patch.locked;

        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Grading Rubric <span className="text-red-500">*</span>
                    </label>
                    <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter whitespace-nowrap">
                        Smart Balance Active
                    </div>
                </div>
                <button
                    type="button"
                    onClick={addCriterion}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto sm:ml-0"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Criterion
                </button>
            </div>

            {criteria.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No criteria added yet. Add at least one to enable AI grading.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {criteria.map((criterion, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className={clsx(
                                "flex-1 flex items-center gap-3 p-2 px-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/10",
                                criterion.locked ? "border-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-slate-700"
                            )}>
                                {criteria.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => updateCriterion(idx, { locked: !criterion.locked })}
                                        className={clsx(
                                            "p-1.5 rounded-lg transition-all",
                                            criterion.locked 
                                                ? "bg-amber-500 text-white" 
                                                : "text-slate-300 hover:text-slate-500"
                                        )}
                                        title={criterion.locked ? "Unlock score" : "Lock score"}
                                    >
                                        {criterion.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                                <input
                                    type="text"
                                    placeholder="Criterion Name (e.g. Logic)"
                                    value={criterion.name}
                                    onChange={(e) => updateCriterion(idx, { name: e.target.value })}
                                    className="flex-1 min-w-[120px] bg-transparent border-0 outline-none focus:ring-0 text-sm font-semibold text-slate-900 dark:text-white"
                                />
                                <div className="h-6 w-px bg-slate-100 dark:bg-slate-700" />
                                <div className="flex items-center gap-2 min-w-[90px] sm:min-w-[100px]">
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder="0"
                                        value={criterion.weight}
                                        disabled={criteria.length === 1}
                                        onChange={(e) => updateCriterion(idx, { weight: Number(e.target.value) })}
                                        className={clsx(
                                            "w-10 sm:w-12 bg-transparent border-0 outline-none focus:ring-0 text-sm font-black text-right transition-all",
                                            criteria.length === 1 ? "opacity-40 cursor-not-allowed" : 
                                            criterion.locked ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                                        )}
                                    />
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">/ {maxPoints}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCriterion(idx)}
                                className="self-end sm:self-auto p-2 text-slate-400 hover:text-rose-500 transition-all"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rubric Score:</span>
                    <span className={clsx(
                        "text-xs font-black",
                        isValid ? "text-emerald-500" : "text-amber-500"
                    )}>
                        {totalWeight.toFixed(1)} / {maxPoints}
                    </span>
                </div>
                {isValid ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        <AlertCircle className="w-3.5 h-3.5" /> Needs {Math.abs(maxPoints - totalWeight).toFixed(1)} {totalWeight < maxPoints ? 'more' : 'less'}
                    </div>
                )}
            </div>
        </div>
    );
};


