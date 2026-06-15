import React from 'react';
import { Sparkles, Edit3 } from 'lucide-react';

interface AIReferenceAnswerEditorProps {
    value: string;
    onChange: (val: string) => void;
    isDirty?: boolean;
}

export const AIReferenceAnswerEditor: React.FC<AIReferenceAnswerEditorProps> = ({
    value,
    onChange,
    isDirty,
}) => {
    return (
        <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            AI Reference Answer
                            {isDirty && (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                                    Unsaved
                                </span>
                            )}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            The golden standard for comparing student responses.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Edit3 className="w-3.5 h-3.5" />
                    {value.length} chars
                </div>
            </div>

            <div className="relative group">
                {/* Subtle gradient border effect on hover/focus */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21A9FF]/0 to-indigo-500/0 rounded-3xl blur opacity-0 transition duration-500 group-hover:opacity-30 group-focus-within:from-[#21A9FF] group-focus-within:to-indigo-500 group-focus-within:opacity-100" />
                
                <textarea
                    className="relative w-full min-h-[160px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-y shadow-sm transition-colors duration-300 custom-scrollbar"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="E.g., The ideal answer would demonstrate a clear understanding of the core concepts, providing specific examples..."
                />
            </div>
        </div>
    );
};
