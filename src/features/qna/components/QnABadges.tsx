/**
 * Q&A Board — Status Badges & Tags
 */
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Pin, TrendingUp } from 'lucide-react';
import type { QnAQuestion, QnATag } from '../types/qna.types';
import { TRENDING_VOTE_THRESHOLD } from '../types/qna.types';

/* ─── Status Badge ─────────────────────────────────────────────────────── */
export function StatusBadge({ status, isPinned }: Pick<QnAQuestion, 'status' | 'isPinned'>) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/40">
                    <Pin className="w-3 h-3" />
                    Pinned
                </span>
            )}
            {status === 'answered' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-700/40">
                    <CheckCircle2 className="w-3 h-3" />
                    Answered
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-600/40">
                    <Clock className="w-3 h-3" />
                    Unanswered
                </span>
            )}
        </div>
    );
}

/* ─── Trending Badge ───────────────────────────────────────────────────── */
export function TrendingBadge({ votes }: { votes: number }) {
    if (votes < TRENDING_VOTE_THRESHOLD) return null;
    return (
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-orange-100 to-rose-100 dark:from-orange-900/40 dark:to-rose-900/30 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200/60 dark:ring-orange-700/40"
        >
            <TrendingUp className="w-3 h-3" />
            Trending
        </motion.span>
    );
}

/* ─── Tag Pill ─────────────────────────────────────────────────────────── */
const TAG_COLORS: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 ring-blue-200/60 dark:ring-blue-700/40',
    red: 'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 ring-red-200/60 dark:ring-red-700/40',
    amber: 'bg-amber-50 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-700/40',
    purple: 'bg-purple-50 dark:bg-purple-900/25 text-purple-600 dark:text-purple-400 ring-purple-200/60 dark:ring-purple-700/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-700/40',
    rose: 'bg-rose-50 dark:bg-rose-900/25 text-rose-600 dark:text-rose-400 ring-rose-200/60 dark:ring-rose-700/40',
};

export function TagPill({ tag }: { tag: QnATag }) {
    const cls = TAG_COLORS[tag.color ?? 'blue'] ?? TAG_COLORS.blue;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold ring-1 ${cls}`}>
            {tag.label}
        </span>
    );
}
