import { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import '@/styles/code-highlight.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Maximize2,
    Minimize2,
    Send,
    Type,
    Quote,
    Sigma,
    Terminal,
} from 'lucide-react';
import { MathEditorModal } from '@/components/ui/MathEditorModal';

const lowlight = createLowlight(common);

function ToolBtn({
    icon: Icon,
    label,
    active,
    onClick,
    disabled,
}: {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.05, backgroundColor: 'rgba(33, 169, 255, 0.08)' } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            title={label}
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
                ${
                    active
                        ? 'text-[#21A9FF] bg-[#21A9FF]/10 shadow-[0_0_15px_rgba(33,169,255,0.15)] ring-1 ring-[#21A9FF]/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <Icon className={`w-4.5 h-4.5 transition-transform ${active ? 'scale-110' : ''}`} />
            {active && (
                <motion.div
                    layoutId="tool-active-indicator-exam"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#21A9FF]"
                />
            )}
        </motion.button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />;
}

interface ExamAnswerEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onNext?: () => void;
    isLastQuestion?: boolean;
}

export function ExamAnswerEditor({
    value,
    onChange,
    placeholder = 'Write your answer here... Use the toolbar for formatting, code blocks, and more.',
    className = '',
    onNext,
    isLastQuestion = false,
}: ExamAnswerEditorProps) {
    const [fullscreen, setFullscreen] = useState(false);
    const [mathModalOpen, setMathModalOpen] = useState(false);

    const onNextRef = useRef(onNext);
    useEffect(() => {
        onNextRef.current = onNext;
    }, [onNext]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                codeBlock: false, // Use lowlight instead
                code: {
                    HTMLAttributes: {
                        class: 'px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 text-[13px] font-mono',
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: 'border-l-4 border-[#21A9FF]/40 pl-4 italic text-slate-600 dark:text-slate-400 my-3',
                    },
                },
            }),
            Underline,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-xl p-4 text-sm font-mono overflow-x-auto my-3 hljs',
                    style: 'background: #1e1e1e; color: #d4d4d4;',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        editorProps: {
            attributes: {
                class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[180px] px-5 py-4 ${
                    fullscreen ? 'min-h-[50vh]' : ''
                }`,
            },
            handleKeyDown: (_view, event) => {
                // Ctrl+Enter to save & proceed / submit
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    if (onNextRef.current) {
                        onNextRef.current();
                        return true;
                    }
                }
                return false;
            },
        },
        content: value,
        onUpdate: ({ editor }) => {
            // Note: We use getHTML() to support rich styling & KaTeX
            onChange(editor.getHTML());
        },
        onSelectionUpdate: () => {
            setEditorStateCounter(s => s + 1);
        },
        onTransaction: () => {
            setEditorStateCounter(s => s + 1);
        },
    });

    const [_, setEditorStateCounter] = useState(0);
    const lastContentRef = useRef(value);

    // Update parent when editor content changes
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const html = editor.getHTML();
            if (html !== lastContentRef.current) {
                lastContentRef.current = html;
                onChange(html);
            }
        };

        editor.on('update', handleUpdate);
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, onChange]);

    // Sync content from prop only if different from editor and lastContentRef
    useEffect(() => {
        if (editor && value !== editor.getHTML() && value !== lastContentRef.current) {
            lastContentRef.current = value;
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const handleInsertMath = useCallback((latex: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(latex).run();
    }, [editor]);

    if (!editor) return null;

    const editorContainer = (
        <motion.div
            layout
            className={`rounded-2xl border bg-white dark:bg-slate-900/50 overflow-hidden transition-all duration-300 ${
                fullscreen
                    ? 'fixed inset-4 z-50 flex flex-col shadow-2xl border-slate-200 dark:border-slate-700/60'
                    : 'border-slate-200 dark:border-slate-700/60 focus-within:border-[#21A9FF] focus-within:ring-4 focus-within:ring-[#21A9FF]/10'
            } ${className}`}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex-wrap sticky top-0 z-10">
                <ToolBtn
                    icon={Bold}
                    label="Bold (Ctrl+B)"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolBtn
                    icon={Italic}
                    label="Italic (Ctrl+I)"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolBtn
                    icon={Strikethrough}
                    label="Strikethrough"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />
                <ToolBtn
                    icon={Code}
                    label="Inline Code"
                    active={editor.isActive('code')}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                />

                <Divider />

                <ToolBtn
                    icon={Heading2}
                    label="Heading 2"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <ToolBtn
                    icon={Heading3}
                    label="Heading 3"
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                />
                <ToolBtn
                    icon={Type}
                    label="Paragraph"
                    active={editor.isActive('paragraph') && !editor.isActive('heading')}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                />

                <Divider />

                <ToolBtn
                    icon={List}
                    label="Bullet List"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <ToolBtn
                    icon={ListOrdered}
                    label="Numbered List"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
                <ToolBtn
                    icon={Quote}
                    label="Block Quote"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <ToolBtn
                    icon={Terminal}
                    label="Code Block"
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                />

                <ToolBtn
                    icon={Sigma}
                    label="Math Equation"
                    onClick={() => setMathModalOpen(true)}
                />

                <div className="flex-1" />

                <ToolBtn
                    icon={fullscreen ? Minimize2 : Maximize2}
                    label={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    onClick={() => setFullscreen((f) => !f)}
                />
            </div>

            {/* Editor Content */}
            <div className={`overflow-y-auto ${fullscreen ? 'flex-1' : 'max-h-[50vh]'}`}>
                <EditorContent editor={editor} />
            </div>

            {/* Math Editor Modal */}
            <MathEditorModal
                isOpen={mathModalOpen}
                onClose={() => setMathModalOpen(false)}
                onApply={handleInsertMath}
                compact={true}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">Ctrl</kbd>
                    {' + '}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">Enter</kbd>
                    {isLastQuestion ? ' to submit exam' : ' to next question'}
                </span>
                {onNext && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onNext}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#21A9FF] to-[#0094F2] text-white text-sm font-bold shadow-md shadow-[#21A9FF]/20 hover:shadow-lg hover:shadow-[#21A9FF]/30 transition-all cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        {isLastQuestion ? 'Submit Exam' : 'Next Question'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                /* Selection colors */
                .prose ::selection {
                    background-color: rgba(33, 169, 255, 0.2);
                }

                /* TipTap Focus styling */
                .ProseMirror:focus {
                    outline: none;
                }
                
                /* Better placeholder */
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}} />
            {editorContainer}
            {/* Fullscreen backdrop */}
            <AnimatePresence>
                {fullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setFullscreen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
