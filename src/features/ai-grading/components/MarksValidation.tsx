import React from 'react';
import { Scale, AlertTriangle } from 'lucide-react';

interface MarksValidationProps {
    questionTotalMarks: number;
    criteriaTotalMarks: number;
}

export const MarksValidation: React.FC<MarksValidationProps> = ({ questionTotalMarks, criteriaTotalMarks }) => {
    const isBalanced = questionTotalMarks === criteriaTotalMarks;
    const difference = Math.abs(questionTotalMarks - criteriaTotalMarks);

    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-3xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${
                isBalanced
                    ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/10'
            }`}
        >
            <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isBalanced
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                    }`}
                >
                    {isBalanced ? <Scale className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h4
                        className={`text-lg font-black ${
                            isBalanced ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                        }`}
                    >
                        {isBalanced ? 'Marks Balanced' : 'Marks Mismatch'}
                    </h4>
                    <p
                        className={`text-sm font-medium ${
                            isBalanced ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-700 dark:text-amber-500'
                        }`}
                    >
                        {isBalanced
                            ? 'Criteria total equals question total.'
                            : `Difference of ${difference} mark${difference !== 1 ? 's' : ''}.`}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-white/50 dark:border-slate-700 w-full sm:w-auto shadow-sm">
                <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Question
                    </span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none mt-1">
                        {questionTotalMarks}
                    </span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Criteria
                    </span>
                    <span
                        className={`text-lg font-black leading-none mt-1 ${
                            isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                    >
                        {criteriaTotalMarks}
                    </span>
                </div>
            </div>
        </div>
    );
};
