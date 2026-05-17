/**
 * Q&A Board — Add Question Modal
 * Minimal, modern modal for students to create a new question.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Tag, Sparkles } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { QnATag } from '../types/qna.types';
import { fetchTags } from '../api/qna.service';

/* ─── Overlay animation ───────────────────────────────────────────────── */
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 350 } },
    exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.15 } },
};

/* ─── Tag Chip ─────────────────────────────────────────────────────────── */
function TagChip({
    tag,
    selected,
    onToggle,
}: {
    tag: QnATag;
    selected: boolean;
    onToggle: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onToggle(tag.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                selected
                    ? 'bg-[#21A9FF]/10 border-[#21A9FF]/30 text-[#21A9FF] dark:bg-[#21A9FF]/15 dark:border-[#21A9FF]/25'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
        >
            <Tag className="w-3 h-3" />
            {tag.label}
        </button>
    );
}

/* ─── Main Modal ───────────────────────────────────────────────────────── */
interface AddQuestionModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (title: string, content: string, tagIds: string[]) => void;
    isSubmitting?: boolean;
    initialData?: {
        title: string;
        content: string;
        tagIds: string[];
    };
}

export function AddQuestionModal({ 
    open, 
    onClose, 
    onSubmit, 
    isSubmitting,
    initialData
}: AddQuestionModalProps) {
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<QnATag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const [editorContent, setEditorContent] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [3] },
                codeBlock: {
                    HTMLAttributes: {
                        class: 'rounded-xl bg-slate-900 text-slate-100 p-4 text-sm font-mono overflow-x-auto my-2',
                    },
                },
            }),
            Placeholder.configure({
                placeholder: 'Describe your question in detail...',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[140px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getText());
        },
    });

    useEffect(() => {
        if (open) {
            fetchTags().then(setTags);
            if (initialData) {
                setTitle(initialData.title);
                setSelectedTags(initialData.tagIds || []);
                if (editor) {
                    editor.commands.setContent(initialData.content);
                }
            } else {
                setTitle('');
                setSelectedTags([]);
                if (editor) {
                    editor.commands.clearContent();
                }
            }
        }
    }, [open, initialData, editor]);

    const toggleTag = useCallback((id: string) => {
        setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        );
    }, []);

    const handleSubmit = useCallback(() => {
        if (!title.trim() || editorContent.trim().length === 0) return;
        onSubmit(title.trim(), editor?.getHTML() || '', selectedTags);
        // Reset
        setTitle('');
        setSelectedTags([]);
        setEditorContent('');
        editor?.commands.clearContent();
    }, [title, editor, selectedTags, onSubmit, editorContent]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Ask a question"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#21A9FF]/15 to-[#0094F2]/10 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-[#21A9FF]" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {initialData ? 'Edit Discussion' : 'Ask a Question'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Question Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. How does binary search achieve O(log n)?"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/30 focus:border-[#21A9FF]/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Description
                                </label>
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-[#21A9FF]/30 focus-within:border-[#21A9FF]/50 transition-all">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>

                            {/* Tags */}
                            {tags.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                        Tags (optional)
                                    </label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {tags.map((t) => (
                                            <TagChip
                                                key={t.id}
                                                tag={t}
                                                selected={selectedTags.includes(t.id)}
                                                onToggle={toggleTag}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={!title.trim() || editorContent.trim().length === 0 || isSubmitting}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#21A9FF] to-[#0094F2] text-white text-sm font-bold shadow-md shadow-[#21A9FF]/20 hover:shadow-lg hover:shadow-[#21A9FF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Post Question'}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
