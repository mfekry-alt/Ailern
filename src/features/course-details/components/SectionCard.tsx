import { memo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Layers, Loader2, Check } from 'lucide-react';

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
                    <div className="flex items-center gap-4 min-w-0">
                        <div
                            className={cn(
                                'w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-sm font-extrabold tabular-nums transition-all duration-300',
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
                                    'font-semibold transition-colors',
                                    isExpanded
                                        ? 'text-[#0094F2] dark:text-[#5ec5ff]'
                                        : 'text-gray-900 dark:text-white'
                                )}
                            >
                                {section.title}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
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
                        <button
                            type="button"
                            aria-pressed={done}
                            disabled={completion.isPending}
                            onClick={() => completion.mutate(!done)}
                            className={cn(
                                'group/finish rounded-xl outline-none transition-transform duration-200',
                                !completion.isPending && 'hover:scale-[1.04] active:scale-[0.97]',
                                'disabled:opacity-55 disabled:pointer-events-none',
                                'focus-visible:ring-2 focus-visible:ring-[#21A9FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900'
                            )}
                        >
                            {completion.isPending ? (
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#21A9FF]/30 bg-[#21A9FF]/[0.06] dark:bg-[#21A9FF]/12">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#21A9FF]" aria-hidden />
                                </span>
                            ) : (
                                <span
                                    className={cn(
                                        'relative flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-300',
                                        done
                                            ? 'border-[#21A9FF] bg-[#21A9FF] text-white shadow-[0_14px_36px_-10px_rgba(33,169,255,0.5)] dark:shadow-[0_14px_40px_-10px_rgba(33,169,255,0.35)]'
                                            : cn(
                                                  'border-slate-200/95 bg-white dark:border-slate-600 dark:bg-slate-950/92',
                                                  'hover:border-[#21A9FF]/50 hover:bg-[#21A9FF]/[0.06]'
                                              )
                                    )}
                                >
                                    <span className="sr-only">Section completion</span>
                                    {done ? (
                                        <Check className="h-5 w-5 stroke-[2.75]" strokeLinecap="round" aria-hidden />
                                    ) : (
                                        <span
                                            className="h-[8px] w-[8px] rounded-full bg-slate-300/90 opacity-95 dark:bg-slate-500 group-hover/finish:bg-[#21A9FF] group-hover/finish:scale-110 transition-all duration-300"
                                            aria-hidden
                                        />
                                    )}
                                </span>
                            )}
                        </button>
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
