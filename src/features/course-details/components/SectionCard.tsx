import { memo, useState } from 'react';
import { ChevronDown, Layers, FileText, Sparkles } from 'lucide-react';
import { FileItem } from './FileItem';
import type { SectionDto } from '../types';

interface SectionCardProps {
    section: SectionDto;
    courseId: string;
}

export const SectionCard = memo(({ section, courseId }: SectionCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const files = section.sectionFiles ?? [];

    return (
        <div
            className={`group border rounded-2xl overflow-hidden transition-all duration-500 bg-white dark:bg-slate-800/40 ${
                isExpanded
                    ? 'border-indigo-200/60 dark:border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                    : 'border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5'
            }`}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 sm:p-6 transition-all duration-300 relative overflow-hidden"
            >
                {/* Active Hover Background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-[#21A9FF]/5 to-transparent transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 shadow-sm group-hover:scale-105 transition-transform">
                        <Layers className={`w-5 h-5 transition-colors duration-300 ${isExpanded ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <h3
                                className={`text-lg sm:text-xl font-black tracking-tight transition-colors duration-300 ${
                                    isExpanded
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                }`}
                            >
                                {section.title}
                            </h3>
                            {isExpanded && <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{files.length} {files.length === 1 ? 'Material' : 'Materials'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative z-10 border ${
                        isExpanded
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 rotate-180'
                            : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/10 dark:group-hover:border-indigo-500/20 dark:group-hover:text-indigo-400 shadow-sm'
                    }`}
                >
                    <ChevronDown className="w-5 h-5 transition-transform duration-500" />
                </div>
            </button>

            {/* Smooth Expandable Content */}
            <div 
                className={`grid transition-all duration-500 ease-in-out ${
                    isExpanded ? 'grid-template-rows-[1fr] opacity-100' : 'grid-template-rows-[0fr] opacity-0 overflow-hidden'
                }`}
                style={{ display: 'grid', gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/10 mt-2">
                        <div className="mt-5 space-y-3">
                            {files.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50 flex flex-col items-center gap-2">
                                    <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No materials uploaded for this section.</p>
                                </div>
                            ) : (
                                files.map((file) => (
                                    <FileItem key={file.id} file={file} courseId={courseId} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

SectionCard.displayName = 'SectionCard';
