import React, { useCallback, useMemo, useState, useRef } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import { Zap, Lock, Unlock } from 'lucide-react';
import { clsx } from 'clsx';

interface DifficultyData {
    easy: number;
    medium: number;
    hard: number;
}

export const DifficultyDistribution = () => {
    const { control, setValue } = useFormContext();
    const difficulty = useWatch({ control, name: 'difficulty' }) as DifficultyData;
    
    // Lock state: Only one field can be locked at a time
    const [lockedField, setLockedField] = useState<keyof DifficultyData | null>(null);
    
    // Tracking the last edited field to determine which one to adjust next
    const lastEditedField = useRef<keyof DifficultyData | null>(null);

    const toggleLock = (field: keyof DifficultyData) => {
        setLockedField(prev => prev === field ? null : field);
    };

    /**
     * Requirement: Logic to determine which field should auto-balance
     */
    const getAdjustableField = useCallback((currentField: keyof DifficultyData) => {
        const keys = ['easy', 'medium', 'hard'] as Array<keyof DifficultyData>;
        
        // Potential targets are fields that are NOT the current one and NOT locked
        const potentialTargets = keys.filter(k => k !== currentField && k !== lockedField);

        if (potentialTargets.length === 0) return null;
        if (potentialTargets.length === 1) return potentialTargets[0];

        // If two potential targets, use priority logic
        // 1. Prefer last edited field
        if (lastEditedField.current && potentialTargets.includes(lastEditedField.current)) {
            return lastEditedField.current;
        }

        // 2. Otherwise prefer the largest one
        const [target1, target2] = potentialTargets;
        return (difficulty[target1] || 0) >= (difficulty[target2] || 0) ? target1 : target2;
    }, [difficulty, lockedField]);

    /**
     * Requirement: Handle change with auto-balancing
     */
    const handleValueChange = useCallback((field: keyof DifficultyData, newValue: number) => {
        if (field === lockedField) return;

        // 1. Determine the target for adjustment
        const targetField = getAdjustableField(field);
        if (!targetField) return;

        // 2. Calculate current total of others (locked or independent)
        const keys = ['easy', 'medium', 'hard'] as Array<keyof DifficultyData>;
        const fixedSum = keys
            .filter(k => k !== field && k !== targetField)
            .reduce((sum, k) => sum + (difficulty[k] || 0), 0);

        // 3. Clamp newValue so target doesn't go below 0
        const maxForField = 100 - fixedSum;
        const clampedVal = Math.max(0, Math.min(maxForField, newValue));
        
        // 4. Calculate new target value
        const targetVal = 100 - fixedSum - clampedVal;

        // 5. Update both fields to maintain exactly 100%
        setValue(`difficulty.${field}`, clampedVal, { shouldValidate: true });
        setValue(`difficulty.${targetField}`, targetVal, { shouldValidate: true });

        // 6. Record interaction for next time
        lastEditedField.current = field;
    }, [difficulty, lockedField, getAdjustableField, setValue]);

    return (
        <div className="space-y-6">
            {/* Title Section (UNCHANGED) */}
            <div>
                <h3 className="text-xl font-black text-[#0f172a] dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Step 3: Difficulty Balance
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Specify the complexity level of the assessment.
                </p>
            </div>

            {/* Design Container (UNCHANGED STRUCTURE) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm space-y-10">
                
                {/* 1. Multicolored Progress Bar (UNCHANGED) */}
                <div className="space-y-4">
                    <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                        <div className="bg-[#4ade80] transition-all duration-500" style={{ width: `${difficulty.easy}%` }} />
                        <div className="bg-[#3b82f6] transition-all duration-500" style={{ width: `${difficulty.medium}%` }} />
                        <div className="bg-[#f43f5e] transition-all duration-500" style={{ width: `${difficulty.hard}%` }} />
                    </div>
                    <div className="flex justify-between px-1 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-[#16a34a]">Easy {difficulty.easy}%</span>
                        <span className="text-[#2563eb]">Medium {difficulty.medium}%</span>
                        <span className="text-[#e11d48]">Hard {difficulty.hard}%</span>
                    </div>
                </div>

                {/* 2. Sliders & Inputs */}
                <div className="space-y-8">
                    {[
                        { id: 'easy', label: 'BEGINNER / EASY' },
                        { id: 'medium', label: 'INTERMEDIATE / MED' },
                        { id: 'hard', label: 'ADVANCED / HARD' }
                    ].map((lvl) => {
                        const val = difficulty[lvl.id as keyof DifficultyData] || 0;
                        const isLocked = lockedField === lvl.id;
                        
                        // Current value + whatever is left in the pool (excluding locked sum)
                        const keys = ['easy', 'medium', 'hard'] as Array<keyof DifficultyData>;
                        const otherLockedSum = keys
                            .filter(k => k !== lvl.id && lockedField === k)
                            .reduce((sum, k) => sum + (difficulty[k] || 0), 0);
                        const sliderMax = 100 - otherLockedSum;

                        return (
                            <div key={lvl.id} className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-black text-[#334155] dark:text-slate-200 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => toggleLock(lvl.id as any)}
                                            className={clsx(
                                                "p-1 rounded-md transition-colors",
                                                isLocked ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-400"
                                            )}
                                        >
                                            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        <label className={clsx(isLocked && "text-amber-600 font-bold")}>{lvl.label}</label>
                                    </div>
                                    
                                    {/* Manual Input Support */}
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number"
                                            min={0}
                                            max={sliderMax}
                                            value={val}
                                            onChange={(e) => handleValueChange(lvl.id as any, Number(e.target.value))}
                                            className="w-12 bg-transparent text-right font-black outline-none border-b border-transparent focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span>%</span>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <input 
                                        type="range"
                                        min={0}
                                        max={sliderMax}
                                        value={val}
                                        disabled={isLocked}
                                        onChange={(e) => handleValueChange(lvl.id as any, Number(e.target.value))}
                                        className={clsx(
                                            "w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none transition-all",
                                            isLocked ? "cursor-not-allowed opacity-40 grayscale" : "cursor-pointer accent-blue-600"
                                        )}
                                    />
                                    {!isLocked && (
                                        <div className="absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100" style={{ width: `${(val / Math.max(1, sliderMax)) * 100}%` }}>
                                            <div className="h-1.5 bg-blue-500/20 blur-md rounded-full" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
