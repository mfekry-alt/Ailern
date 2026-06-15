import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QnARenderer } from '@/features/qna/components/QnARenderer';

interface AnswerPreviewerProps {
    value: string;
    label?: string;
    className?: string;
}

/** Aggressive html decoding helper */
const decodeHtml = (html: string) => {
    if (!html) return '';
    let result = html;
    const decoder = document.createElement('textarea');
    for (let i = 0; i < 3; i++) {
        if (!result.includes('&')) break;
        decoder.innerHTML = result;
        result = decoder.value;
    }
    return result;
};

export function AnswerPreviewer({
    value,
    label = 'ANSWER PREVIEW',
    className = '',
}: AnswerPreviewerProps) {
    const [isOpen, setIsOpen] = useState(true);

    const hasContent = value && value.replace(/<[^>]*>/g, '').trim().length > 0;

    return (
        <div className={`bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {label}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    title={isOpen ? 'Hide Preview' : 'Show Preview'}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                    {isOpen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
            </div>

            {/* Content Body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-900 p-6 shadow-inner min-h-[100px]">
                            {hasContent ? (
                                <QnARenderer content={decodeHtml(value)} className="prose dark:prose-invert max-w-none" />
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[80px] text-slate-300 dark:text-slate-700">
                                    <span className="text-xs font-semibold tracking-wider uppercase">Live Preview Area</span>
                                    <span className="text-[10px] opacity-75 mt-1 font-medium">Your formatted answer will render here in real time.</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
