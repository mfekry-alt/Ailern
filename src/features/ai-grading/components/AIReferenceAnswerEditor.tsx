import React, { useState } from 'react';
import { Sparkles, Edit3 } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { MathEditorModal } from '@/components/ui/MathEditorModal';

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
    const [isMathOpen, setIsMathOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="group/sparkle w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100/80 dark:border-amber-500/20 shadow-sm">
                        <Sparkles className="w-5 h-5 text-amber-500 group-hover/sparkle:rotate-12 transition-transform duration-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                            AI Reference Answer
                            {isDirty && (
                                <span className="text-[9px] tracking-wider font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-250/30 px-2 py-0.5 rounded-md">
                                    Unsaved Changes
                                </span>
                            )}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            The gold standard for comparing student responses.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-3.5 py-2 rounded-xl border border-indigo-200/20 dark:border-indigo-500/20 self-start sm:self-auto shrink-0 shadow-sm">
                    <Edit3 className="w-3.5 h-3.5" />
                    {value ? value.replace(/<[^>]*>/g, '').length : 0} characters
                </div>
            </div>

            <div className="relative group">
                {/* Subtle gradient border effect on hover/focus */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#21A9FF] to-indigo-500 rounded-2xl blur opacity-0 transition duration-500 group-hover:opacity-15 group-focus-within:opacity-100 group-focus-within:from-[#21A9FF] group-focus-within:to-indigo-500 group-focus-within:blur-[6px]" />
                
                <RichTextEditor
                    content={value || ''}
                    onChange={onChange}
                    placeholder="E.g., The ideal answer would demonstrate a clear understanding of the core concepts, providing specific examples..."
                    onMathAction={() => setIsMathOpen(true)}
                    className="relative w-full"
                />
            </div>

            <MathEditorModal
                isOpen={isMathOpen}
                onClose={() => setIsMathOpen(false)}
                onApply={(latex) => {
                    const current = value || '';
                    const formatted = `${current} ${latex} `;
                    onChange(formatted);
                }}
            />
        </div>
    );
};
