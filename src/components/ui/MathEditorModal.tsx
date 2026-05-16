import { useState } from 'react';
import { Modal } from './Modal';
import { Sigma, Save, HelpCircle } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (latex: string) => void;
}

const PRESETS = [
    { label: 'Fraction', latex: '\\frac{a}{b}' },
    { label: 'Root', latex: '\\sqrt{x}' },
    { label: 'Exponent', latex: 'x^{n}' },
    { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Sum', latex: '\\sum_{i=1}^{n}' },
    { label: 'Limit', latex: '\\lim_{x \\to \\infty}' },
    { label: 'Derivative', latex: '\\frac{dy}{dx}' },
    { label: 'Vector', latex: '\\vec{v}' },
];

export const MathEditorModal = ({ isOpen, onClose, onApply }: MathEditorModalProps) => {
    const [latex, setLatex] = useState('');

    const handleApply = () => {
        if (!latex.trim()) return;
        onApply(`$${latex}$`); // Wrap in $ for markdown-style math
        onClose();
        setLatex(''); // Clear after apply
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mathematical Equation"
            maxWidth="3xl"
            footer={
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!latex.trim()}
                        className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                    >
                        <Save className="w-5 h-5" /> Insert into Editor
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Editor & Preview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Side */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">LaTeX Input</label>
                        <textarea
                            value={latex}
                            onChange={(e) => setLatex(e.target.value)}
                            placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none text-sm font-mono min-h-[160px] resize-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex gap-3">
                            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                            <p className="text-[11px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed font-medium">
                                Use standard LaTeX syntax. You can type directly or use the presets below.
                            </p>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Live Preview</label>
                        <div className="w-full h-full min-h-[220px] p-8 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden group">
                            {latex.trim() ? (
                                <div 
                                    dangerouslySetInnerHTML={{ 
                                        __html: katex.renderToString(latex, { throwOnError: false, displayMode: true }) 
                                    }} 
                                    className="text-3xl text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
                                />
                            ) : (
                                <div className="text-slate-200 dark:text-slate-800 flex flex-col items-center gap-4 transition-all duration-500 group-hover:scale-110">
                                    <Sigma className="w-16 h-16 opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ready to render</span>
                                </div>
                            )}
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Presets */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 text-center">Quick Equation Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => setLatex(prev => prev + p.latex)}
                                className="px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all flex flex-col items-center gap-1 active:scale-95 group shadow-sm hover:shadow-md"
                            >
                                <span className="uppercase tracking-widest">{p.label}</span>
                                <span className="text-[9px] opacity-40 font-mono group-hover:opacity-100 transition-opacity">{p.latex}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
