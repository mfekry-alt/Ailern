import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, AlertTriangle } from 'lucide-react';
import type { AIGradingCriteriaResponseItem, AIGradingConfigUpdateRequest, AIGradingCriterion } from '../types/ai-grading.types';
import { AIReferenceAnswerEditor } from './AIReferenceAnswerEditor';
import { AICriteriaEditor } from './AICriteriaEditor';
import { QnARenderer } from '@/features/qna/components/QnARenderer';

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
        
        const validCriteria = criteria.filter(c => c.criterion.trim() !== '').map(c => {
            const { isLocked, ...rest } = c as any;
            return rest;
        });
        
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



    const cleanHtmlText = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').trim();
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header (Question Context) */}
            <div className="p-6 pb-5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#21A9FF] animate-pulse" />
                        Question Context
                    </span>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-[#21A9FF]/10 to-indigo-500/10 border border-[#21A9FF]/20 text-[#21A9FF] rounded-xl text-xs font-black uppercase tracking-wider shadow-sm">
                        {criteria.reduce((sum, c) => sum + Number(c.mark || 0), 0)} MARKS TOTAL
                    </span>
                </div>
                <div className="relative pl-6 py-2 bg-gradient-to-r from-[#21A9FF]/5 to-transparent rounded-2xl overflow-hidden">
                    {/* Floating active rounded indicator bar */}
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-[#21A9FF] to-indigo-600 rounded-full" />
                    <div className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed select-text">
                        <QnARenderer content={item.questionText} />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    <AIReferenceAnswerEditor
                        value={modelAnswer}
                        onChange={setModelAnswer}
                        isDirty={isDirty}
                    />

                    <AICriteriaEditor
                        criteria={criteria}
                        onChange={setCriteria}
                        maxMark={item.mark}
                    />
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] shrink-0">
                {validationError && (
                    <div className="mx-6 mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 leading-none">Marks Allocation Warning</h4>
                            <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-1.5 leading-relaxed">{validationError}</p>
                        </div>
                    </div>
                )}
                <div className="p-4 px-6 flex items-center justify-between gap-3">
                    {/* Live Unsaved / Saved status tracker */}
                    <div className="flex items-center gap-2 text-xs font-bold transition-all duration-300">
                        {isDirty ? (
                            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200/35 dark:border-amber-500/20 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Unsaved changes detected
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200/35 dark:border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Criteria synced
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={!isDirty || isSaving}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/40 dark:hover:border-slate-700/40 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white text-sm font-black rounded-xl transition-all shadow-md shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
