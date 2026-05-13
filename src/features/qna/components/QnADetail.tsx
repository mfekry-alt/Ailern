/**
 * Q&A Board — Question Detail View
 * Full question content + Instructor replies + Reply editor.
 */
import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
    ArrowLeft,
    ChevronUp,
    GraduationCap,
    Pin,
    PinOff,
    CheckCircle2,
    Circle,
    MoreHorizontal,
    MessageCircle,
    Clock,
    Trash2,
    Edit2,
} from 'lucide-react';
import type { QnAQuestion, QnAReply } from '../types/qna.types';
import { StatusBadge, TagPill } from './QnABadges';
import { InstructorReplyEditor } from './InstructorReplyEditor';
import { QnARenderer } from './QnARenderer';

/* ─── Avatar helper ────────────────────────────────────────────────────── */
function Avatar({ name, avatar, size = 40 }: { name: string; avatar?: string; size?: number }) {
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
                className="rounded-full object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }

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
            style={{ width: size, height: size, fontSize: size * 0.34 }}
        >
            {initials}
        </div>
    );
}

/* ─── Instructor Dropdown ──────────────────────────────────────────────── */
function InstructorActionsMenu({
    question,
    onTogglePin,
    onToggleAnswered,
    onEdit,
    onDelete,
}: {
    question: QnAQuestion;
    onTogglePin: () => void;
    onToggleAnswered: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Question actions"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute right-0 top-10 z-40 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5"
                    >
                        <button
                            onClick={() => {
                                onTogglePin();
                                setOpen(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                        >
                            {question.isPinned ? (
                                <>
                                    <PinOff className="w-4 h-4 text-slate-400" />
                                    Unpin Question
                                </>
                            ) : (
                                <>
                                    <Pin className="w-4 h-4 text-amber-500" />
                                    Pin Question
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                onDelete();
                                setOpen(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Discussion
                        </button>
                    </motion.div>
                </>
            )}
        </div>
    );
}

/* ─── Reply Card ───────────────────────────────────────────────────────── */
function ReplyCard({ reply }: { reply: QnAReply }) {
    const isInstructor = reply.author.role === 'instructor';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 ${
                isInstructor
                    ? 'bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-slate-800/50 border-emerald-200/60 dark:border-emerald-700/30'
                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/40'
            }`}
        >
            {/* Author header */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar name={reply.author.name} avatar={reply.author.avatar} size={36} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {reply.author.name}
                        </span>
                        {isInstructor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-700/40">
                                <GraduationCap className="w-3 h-3" />
                                Instructor
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {format(new Date(reply.createdAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                </div>

                {isInstructor && (
                    <div className="shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                )}
            </div>

            {/* Reply content */}
            <QnARenderer
                content={reply.content}
                className="text-slate-700 dark:text-slate-300 leading-relaxed
                    prose-headings:text-slate-800 dark:prose-headings:text-slate-100
                    prose-code:before:content-none prose-code:after:content-none
                    prose-pre:rounded-xl"
            />
        </motion.div>
    );
}

/* ─── Main Detail View ─────────────────────────────────────────────────── */
interface QnADetailProps {
    question: QnAQuestion;
    isInstructor: boolean;
    onBack: () => void;
    onVote: (id: string) => void;
    onTogglePin: (id: string) => void;
    onMarkAnswered: (id: string, answered: boolean) => void;
    onEdit: (q: QnAQuestion) => void;
    onDelete: (id: string) => void;
    onSubmitReply: (id: string, html: string) => void;
}

export function QnADetail({
    question,
    isInstructor,
    onBack,
    onVote,
    onTogglePin,
    onMarkAnswered,
    onEdit,
    onDelete,
    onSubmitReply,
}: QnADetailProps) {
    const q = question;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReply = useCallback(
        async (html: string) => {
            setIsSubmitting(true);
            try {
                await onSubmitReply(q.id, html);
            } finally {
                setIsSubmitting(false);
            }
        },
        [q.id, onSubmitReply],
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
        >
            {/* Back button */}
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Discussions
            </button>

            {/* Question Card */}
            <div className="relative rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-black/20 overflow-hidden">
                <div className="p-8 sm:p-10">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                            <Avatar name={q.author.name} avatar={q.author.avatar} size={52} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="block text-base font-bold text-slate-900 dark:text-white truncate">
                                        {q.author.name}
                                    </span>
                                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">Student</span>
                                </div>
                                <span className="block text-[11px] text-slate-400 font-medium">
                                    Posted {format(new Date(q.createdAt), 'MMM d, yyyy · h:mm a')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-slate-800/50">
                            <StatusBadge status={q.status} isPinned={q.isPinned} />
                            {isInstructor && (
                                <InstructorActionsMenu
                                    question={q}
                                    onTogglePin={() => onTogglePin(q.id)}
                                    onToggleAnswered={() =>
                                        onMarkAnswered(q.id, q.status !== 'answered')
                                    }
                                    onEdit={() => onEdit(q)}
                                    onDelete={() => onDelete(q.id)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-6">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                            {q.title}
                        </h1>

                        {/* Tags */}
                        {q.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {q.tags.map((t) => (
                                    <TagPill key={t.id} tag={t} />
                                ))}
                            </div>
                        )}

                        {/* Full content */}
                        <QnARenderer
                            content={q.content}
                            className="prose-lg text-slate-700 dark:text-slate-300 leading-relaxed
                                prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-black
                                prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                                prose-code:before:content-none prose-code:after:content-none
                                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:text-blue-500 dark:prose-code:text-blue-400 prose-code:text-[14px] prose-code:font-mono
                                prose-pre:rounded-2xl prose-pre:p-6
                                prose-img:rounded-2xl prose-img:shadow-lg"
                        />
                    </div>

                    {/* Vote + meta footer */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => !isInstructor && onVote(q.id)}
                            disabled={isInstructor}
                            className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black transition-all ${
                                q.votedByMe
                                    ? 'bg-[#21A9FF] text-white shadow-lg shadow-[#21A9FF]/25'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-700/50'
                            } ${isInstructor ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ChevronUp className={`w-5 h-5 ${q.votedByMe ? 'stroke-[3]' : ''}`} />
                            <span className="tabular-nums">{q.votes}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] opacity-70 font-black">
                                {q.votes === 1 ? 'Vote' : 'Votes'}
                            </span>
                        </motion.button>

                        <div className="flex items-center justify-around sm:justify-start gap-6">
                            <span className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-slate-400" />
                                </div>
                                <span>{q.replyCount} {q.replyCount === 1 ? 'Reply' : 'Replies'}</span>
                            </span>

                            <span className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                </div>
                                <span>Active {formatDistanceToNow(new Date(q.lastActivityAt), { addSuffix: true })}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies section */}
            {q.replies.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                            Discussion ({q.replies.length})
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {q.replies.map((r) => (
                            <ReplyCard key={r.id} reply={r} />
                        ))}
                    </div>
                </div>
            )}

            {/* Instructor Reply Section */}
            {isInstructor && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            Instructor's Response
                        </h2>
                        <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                            Official Reply
                        </span>
                    </div>
                    <InstructorReplyEditor
                        onSubmit={(html) => handleReply(html)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}

            {/* Student notice */}
            {!isInstructor && q.replies.length === 0 && (
                <div className="rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Awaiting Response</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                        The instructor has been notified and will reply to your question soon.
                    </p>
                </div>
            )}
        </motion.div>
    );
}

