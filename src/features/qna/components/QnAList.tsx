/**
 * Q&A Board — Question List (Feed)
 * Sticky toolbar with search, filter pills, and animated question cards.
 */
import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MessageSquarePlus, TrendingUp, Clock, CheckCircle2, Circle, Pin } from 'lucide-react';
import type { QnASortMode } from '../types/qna.types';
import { useQnAStore } from '../store/qna.store';
import { QnACard } from './QnACard';
import { QnAEmptyState } from './QnAEmptyState';

/* ─── Filter Pills ─────────────────────────────────────────────────────── */
const FILTERS: { key: QnASortMode; label: string; icon: React.ElementType }[] = [
    { key: 'votes', label: 'Most Votes', icon: TrendingUp },
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'answered', label: 'Answered', icon: CheckCircle2 },
    { key: 'unanswered', label: 'Unanswered', icon: Circle },
    { key: 'pinned', label: 'Pinned', icon: Pin },
];

function FilterPill({
    label,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                active
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </motion.button>
    );
}

/* ─── Main Feed ────────────────────────────────────────────────────────── */
interface QnAListProps {
    courseId: number;
    isInstructor: boolean;
    onOpenModal: () => void;
}

export function QnAList({ courseId, isInstructor, onOpenModal }: QnAListProps) {
    const {
        questions,
        isLoading,
        filter,
        setSort,
        setSearch,
        loadQuestions,
        toggleVote,
        togglePin,
        deleteQuestion,
    } = useQnAStore();

    // Load on mount and when filter changes
    useEffect(() => {
        if (courseId) loadQuestions(courseId);
    }, [courseId, filter.sort, filter.search, loadQuestions]);

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
        },
        [setSearch],
    );

    const navigate = useNavigate();

    const handleSelect = useCallback(
        (id: string) => {
            navigate(`${id}`);
        },
        [navigate],
    );

    const handleVote = useCallback(
        (id: string) => {
            toggleVote(courseId, id);
        },
        [courseId, toggleVote],
    );

    const isFiltered = filter.search.trim().length > 0 || filter.sort !== 'votes';

    return (
        <div className="space-y-6">
            {/* Sticky Toolbar */}
            <div className="sticky top-[136px] lg:top-[72px] z-20 -mx-4 px-4 pt-2 pb-4 sm:pb-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/40 dark:border-slate-800/40">
                {/* Search + Ask button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-0 bg-[#21A9FF]/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#21A9FF] transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={filter.search}
                            onChange={handleSearch}
                            placeholder="Search discussions..."
                            className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-2xl sm:rounded-[20px] border border-slate-200/80 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#21A9FF]/10 focus:border-[#21A9FF]/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                            aria-label="Search questions"
                        />
                    </div>

                    {!isInstructor && (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onOpenModal}
                            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-[20px] bg-[#21A9FF] text-white text-sm font-bold shadow-lg shadow-[#21A9FF]/20 hover:bg-[#0094F2] transition-all whitespace-nowrap"
                        >
                            <MessageSquarePlus className="w-4 h-4" />
                            <span>Ask Question</span>
                        </motion.button>
                    )}
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    {FILTERS.map((f) => (
                        <FilterPill
                            key={f.key}
                            label={f.label}
                            icon={f.icon}
                            active={filter.sort === f.key}
                            onClick={() => setSort(f.key)}
                        />
                    ))}
                </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-slate-100 dark:border-slate-700/40 bg-white dark:bg-slate-800/50 p-5 animate-pulse"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
                            <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700/50 mb-1" />
                            <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-700/50" />
                        </div>
                    ))}
                </div>
            )}

            {/* Question cards */}
            {!isLoading && questions.length > 0 && (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                        {questions.map((q) => (
                            <QnACard
                                key={q.id}
                                question={q}
                                onSelect={handleSelect}
                                onVote={handleVote}
                                onDelete={(id) => deleteQuestion(courseId, id)}
                                onTogglePin={(id) => togglePin(courseId, id)}
                                isInstructor={isInstructor}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Empty state */}
            {!isLoading && questions.length === 0 && (
                <QnAEmptyState onAskQuestion={onOpenModal} isFiltered={isFiltered} />
            )}

            {/* Results count */}
            {!isLoading && questions.length > 0 && (
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4">
                    Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}
