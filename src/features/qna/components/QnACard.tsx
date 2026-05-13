/**
 * Q&A Board — Question Card
 * Premium card with vote animation, glow effects, and tiny avatars.
 */
import { motion } from 'framer-motion';
import { ChevronUp, MessageCircle, GraduationCap, Pin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { QnAQuestion } from '../types/qna.types';
import { TRENDING_VOTE_THRESHOLD } from '../types/qna.types';
import { StatusBadge, TagPill } from './QnABadges';

/* ─── Avatar helper ────────────────────────────────────────────────────── */
function UserAvatar({ name, avatar, size = 32 }: { name: string; avatar?: string; size?: number }) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (avatar?.trim()) {
        return (
            <img
                src={avatar}
                alt={name}
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
            />
        );
    }

    // Deterministic gradient
    const colors = [
        'from-violet-500 to-purple-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-rose-500 to-pink-500',
        'from-amber-500 to-orange-500',
        'from-indigo-500 to-blue-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const gradient = colors[Math.abs(hash) % colors.length];

    return (
        <div
            className={`rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-bold select-none shrink-0`}
            style={{ width: size, height: size, fontSize: size * 0.36 }}
            title={name}
        >
            {initials}
        </div>
    );
}



/* ─── Vote Box ─────────────────────────────────────────────────────────── */
function VoteBox({
    votes,
    votedByMe,
    onVote,
}: {
    votes: number;
    votedByMe: boolean;
    onVote: (e: React.MouseEvent) => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onVote}
            className={`flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 min-w-[60px] sm:min-w-[70px] px-3 py-1.5 sm:py-4 rounded-xl border transition-all duration-300 ${
                votedByMe
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                    : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/60 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
            }`}
        >
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest mb-1">Vote</span>
            <div className={`p-1 sm:p-1.5 rounded-lg sm:rounded-full ${votedByMe ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' : 'bg-slate-200/50 text-slate-400 dark:bg-slate-700'}`}>
                <ChevronUp className={`w-3 h-3 sm:w-4 sm:h-4 ${votedByMe ? 'stroke-[3]' : ''}`} />
            </div>
            <span className="text-sm sm:text-2xl font-black tabular-nums leading-none">{votes}</span>
        </motion.button>
    );
}

/* ─── Main Card ────────────────────────────────────────────────────────── */
interface QnACardProps {
    question: QnAQuestion;
    onSelect: (id: string) => void;
    onVote: (id: string) => void;
    onDelete?: (id: string) => void;
    onTogglePin?: (id: string) => void;
    isInstructor?: boolean;
}

export function QnACard({ 
    question, 
    onSelect, 
    onVote, 
    onDelete, 
    onTogglePin, 
    isInstructor 
}: QnACardProps) {
    const q = question;
    const isHighVote = q.votes >= TRENDING_VOTE_THRESHOLD;

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(q.id)}
            className={`group relative cursor-pointer rounded-[24px] border transition-all duration-300
                bg-white dark:bg-slate-800/50
                hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-black/40
                hover:-translate-y-1
                ${
                    q.isPinned
                        ? 'border-amber-200/80 dark:border-amber-700/40 shadow-sm shadow-amber-100/40 dark:shadow-amber-900/10'
                        : isHighVote
                          ? 'border-blue-100 dark:border-blue-900/30'
                          : 'border-slate-100 dark:border-slate-800'
                }
            `}
        >
            <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Vote Box Container */}
                <div className="flex sm:block">
                    <VoteBox
                        votes={q.votes}
                        votedByMe={q.votedByMe}
                        onVote={(e) => {
                            e.stopPropagation();
                            if (!isInstructor) onVote(q.id);
                        }}
                    />
                </div>

                {/* Right: Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Top row: Type + Actions + Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                {q.author.role === 'instructor' ? 'Instructor Post' : 'Student Post'}
                            </span>
                            
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                {isInstructor && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTogglePin?.(q.id);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            q.isPinned
                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                        title={q.isPinned ? "Unpin" : "Pin"}
                                    >
                                        <Pin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${q.isPinned ? 'fill-current' : ''}`} />
                                    </button>
                                )}

                                {(isInstructor || q.status !== 'answered') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete?.(q.id);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="ml-auto sm:ml-0">
                            <StatusBadge status={q.status} isPinned={q.isPinned} />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-blue-500 transition-colors">
                        {q.title}
                    </h3>

                    {/* Author & Meta */}
                    <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar name={q.author.name} avatar={q.author.avatar} size={28} />
                            <div className="min-w-0">
                                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 leading-none mb-1 truncate">
                                    {q.author.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Reply count */}
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs font-bold">{q.replyCount}</span>
                            </div>

                            {/* Tags preview (max 2) */}
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                {q.tags.slice(0, 1).map((t) => (
                                    <TagPill key={t.id} tag={t} />
                                ))}
                                {q.tags.length > 1 && (
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">+{q.tags.length - 1} more</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pinned glow effect */}
            {q.isPinned && (
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/5 dark:to-transparent pointer-events-none" />
            )}
        </motion.article>
    );
}

