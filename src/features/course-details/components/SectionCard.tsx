import { memo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Layers, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { FileItem } from './FileItem';

import type { SectionDto } from '../types';

import { useAuth } from '@/hooks/useAuth';
import { updateStudentSectionProgress } from '@/api/services/section.service';
import { QUERY_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SectionCardProps {
    section: SectionDto;
    /** 1-based index from sorted API order — not raw `sectionNumber` which may be 0 */
    sectionOrder: number;
    courseId: string;
    numericCourseId: number;
}

export const SectionCard = memo(({ section, sectionOrder, courseId, numericCourseId }: SectionCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const files = section.sectionFiles ?? [];
    const { hasRole } = useAuth();
    const student = hasRole('Student');
    const queryClient = useQueryClient();

    const completion = useMutation({
        mutationFn: (completed: boolean) => updateStudentSectionProgress(section.id, completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSE_SECTIONS(numericCourseId.toString()) });
        },
    });

    const done = Boolean(section.isCompleted);

    return (
        <div
            className={cn(
                'border rounded-2xl overflow-hidden transition-all duration-300',
                isExpanded &&
                    'border-[#21A9FF]/35 bg-gradient-to-br from-[#21A9FF]/[0.08] via-white to-slate-50/85 shadow-[0_2px_24px_-8px_rgba(33,169,255,0.22)] dark:from-[#21A9FF]/10 dark:via-slate-900/55 dark:to-slate-900/35',
                !isExpanded &&
                    done &&
                    'border-[#21A9FF]/30 bg-[#21A9FF]/[0.04] dark:bg-[#21A9FF]/[0.07]',
                !isExpanded &&
                    !done &&
                    'border-slate-200/95 dark:border-slate-700/85 bg-white dark:bg-slate-900/40 hover:border-[#21A9FF]/28 hover:shadow-[0_2px_20px_-10px_rgba(33,169,255,0.18)]'
            )}
        >
            <div className="flex items-stretch gap-0">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 flex items-center justify-between p-4 sm:p-5 transition-colors text-left min-w-0"
                >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                            className={cn(
                                'w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-extrabold tabular-nums transition-all duration-300',
                                'ring-1 shadow-sm',
                                isExpanded &&
                                    'bg-[#21A9FF] text-white ring-[#21A9FF]/35 shadow-[0_10px_26px_-10px_rgba(33,169,255,0.55)]',
                                !isExpanded &&
                                    done &&
                                    'bg-[#21A9FF]/12 text-[#0094F2] dark:text-[#5ec5ff] ring-[#21A9FF]/28',
                                !isExpanded &&
                                    !done &&
                                    'bg-slate-100 text-slate-800 ring-slate-200/90 dark:bg-slate-800/95 dark:text-slate-100 dark:ring-slate-600'
                            )}
                            aria-hidden
                        >
                            {sectionOrder}
                        </div>

                        <div className="min-w-0">
                            <h3
                                className={cn(
                                    'text-sm sm:text-base font-bold transition-colors truncate',
                                    isExpanded
                                        ? 'text-[#0094F2] dark:text-[#5ec5ff]'
                                        : 'text-gray-900 dark:text-white'
                                )}
                            >
                                {section.title}
                            </h3>

                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                                {files.length} {files.length === 1 ? 'file' : 'files'}
                            </p>
                        </div>
                    </div>

                    <div
                        className={cn(
                            'w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors',
                            isExpanded
                                ? 'bg-[#21A9FF]/14 text-[#0094F2] dark:bg-[#21A9FF]/22 dark:text-[#5ec5ff]'
                                : 'text-slate-400 dark:text-slate-500'
                        )}
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-[18px] h-[18px]" />
                        ) : (
                            <ChevronDown className="w-[18px] h-[18px]" />
                        )}
                    </div>
                </button>
                {student && (
                    <div className="relative flex shrink-0 items-center pr-4 pl-3 sm:pr-5">
                        <div
                            className="absolute left-0 top-1/2 hidden h-[55%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200/95 to-transparent dark:via-slate-600 sm:block"
                            aria-hidden
                        />
                        {completion.isPending ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#21A9FF]/30 bg-[#21A9FF]/[0.06] dark:bg-[#21A9FF]/12">
                                <Loader2 className="h-4 w-4 animate-spin text-[#21A9FF]" aria-hidden />
                            </div>
                        ) : (
                            <label className="progress-checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() => completion.mutate(!done)}
                                    disabled={completion.isPending}
                                />
                                <div className="progress-checkmark" />
                            </label>
                        )}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="px-5 py-5 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/55 space-y-2.5">
                    {files.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Layers className="w-4 h-4" />
                            No files in this section
                        </div>
                    ) : (
                        files.map((file) => <FileItem key={file.id} file={file} courseId={courseId} />)
                    )}
                </div>
            )}
        </div>
    );
});

SectionCard.displayName = 'SectionCard';
