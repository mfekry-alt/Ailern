import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, AlertTriangle } from 'lucide-react';
import type { AIGradingCriteriaResponseItem, AIGradingConfigUpdateRequest, AIGradingCriterion } from '../types/ai-grading.types';
import { AIReferenceAnswerEditor } from './AIReferenceAnswerEditor';
import { AICriteriaEditor } from './AICriteriaEditor';

interface AIGradingWorkspaceProps {
    item: AIGradingCriteriaResponseItem;
    onSave: (payload: AIGradingConfigUpdateRequest) => void;
    isSaving: boolean;
    onDirtyChange: (isDirty: boolean) => void;
}

export const AIGradingWorkspace: React.FC<AIGradingWorkspaceProps> = ({
    item,
    onSave,
    isSaving,
    onDirtyChange,
}) => {
    const [modelAnswer, setModelAnswer] = useState<string>('');
    const [criteria, setCriteria] = useState<AIGradingCriterion[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setModelAnswer(item.modelAnswer || '');
        setCriteria(item.criteriaList || []);
        setIsDirty(false);
        onDirtyChange(false);
        setValidationError(null);
    }, [item.questionId, item.modelAnswer, item.criteriaList]);

    useEffect(() => {
        let dirty = false;
        
        if (modelAnswer !== (item.modelAnswer || '')) {
            dirty = true;
        }

        const initialCriteriaList = item.criteriaList || [];
        if (criteria.length !== initialCriteriaList.length) {
            dirty = true;
        } else {
            for (let i = 0; i < criteria.length; i++) {
                const current = criteria[i];
                const original = initialCriteriaList.find(c => c.id === current.id);
                if (!original || original.criterion !== current.criterion || original.mark !== current.mark) {
                    dirty = true;
                    break;
                }
            }
        }

        setIsDirty(dirty);
        onDirtyChange(dirty);
        setValidationError(null);
    }, [modelAnswer, criteria, item.modelAnswer, item.criteriaList]);

    const handleSave = () => {
        const criteriaTotalMarks = criteria.reduce((sum, c) => sum + Number(c.mark || 0), 0);
        if (criteriaTotalMarks !== item.mark) {
            setValidationError(
                `Criteria total (${criteriaTotalMarks}) does not match question total (${item.mark} marks). Please adjust your criteria before saving.`
            );
            return;
        }
        setValidationError(null);
        
        const validCriteria = criteria.filter(c => c.criterion.trim() !== '');
        
        const payload: AIGradingConfigUpdateRequest = {
            modelAnswer,
            criteria: validCriteria,
        };
        onSave(payload);
    };

    const handleCancel = () => {
        setModelAnswer(item.modelAnswer || '');
        setValidationError(null);
        setCriteria(item.criteriaList || []);
    };



    return (
        <div className="flex flex-col h-full relative">
            {/* Header (Question Context) */}
            <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Question Context
                    </span>
                    <span className="px-3 py-1 bg-[#21A9FF]/10 text-[#21A9FF] rounded-lg text-xs font-black uppercase tracking-wider">
                        {item.mark} Marks Total
                    </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.questionText}
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-28 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    <AIReferenceAnswerEditor
                        value={modelAnswer}
                        onChange={setModelAnswer}
                        isDirty={isDirty}
                    />

                    <AICriteriaEditor
                        criteria={criteria}
                        onChange={setCriteria}
                    />
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-b-[2.5rem] z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                {validationError && (
                    <div className="px-4 pt-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{validationError}</p>
                    </div>
                )}
                <div className="p-4 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={!isDirty || isSaving}
                        className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white text-sm font-black rounded-xl transition-all shadow-md shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
