/**
 * Q&A Board — Instructor Reply Editor
 * TipTap-based rich text editor with code highlighting and KaTeX support.
 */
import { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ImagePlus,
    Maximize2,
    Minimize2,
    Send,
    Type,
    Quote,
    Code2,
    Sigma,
    Terminal,
} from 'lucide-react';
import { CodeEditorDrawer } from '@/components/ui/CodeEditorDrawer';
import { MathEditorModal } from '@/components/ui/MathEditorModal';

/* ─── Toolbar Button ───────────────────────────────────────────────────── */
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
                    layoutId="tool-active-indicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#21A9FF]"
                />
            )}
        </motion.button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />;
}

/* ─── Tool Tile ───────────────────────────────────────────────────────── */
function ToolTile({
    icon: Icon,
    label,
    description,
    onClick,
    color,
    active,
}: {
    icon: React.ElementType;
    label: string;
    description: string;
    onClick: () => void;
    color: string;
    active?: boolean;
}) {
    return (
        <motion.button
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border rounded-2xl transition-all text-left group
                ${active 
                    ? 'border-[#21A9FF] ring-4 ring-[#21A9FF]/10 dark:ring-[#21A9FF]/5' 
                    : 'border-slate-100 dark:border-slate-700/50'}
            `}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100">{label}</span>
                <span className="block text-[11px] text-slate-400 font-medium">{description}</span>
            </div>
        </motion.button>
    );
}

const lowlight = createLowlight(common);

/* ─── Main Editor ──────────────────────────────────────────────────────── */
interface InstructorReplyEditorProps {
    onSubmit: (html: string) => void;
    isSubmitting?: boolean;
}

export function InstructorReplyEditor({ onSubmit, isSubmitting }: InstructorReplyEditorProps) {
    const [fullscreen, setFullscreen] = useState(false);
    const [drawers, setDrawers] = useState({
        code: false,
        math: false,
    });

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
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-xl p-4 text-sm font-mono overflow-x-auto my-3 hljs',
                    style: 'background: #23241f; color: #f8f8f2;',
                },
            }),
            Placeholder.configure({
                placeholder: 'Write your reply... Use the toolbar for formatting, code blocks, and more.',
            }),
        ],
        editorProps: {
            attributes: {
                class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3 ${
                    fullscreen ? 'min-h-[50vh]' : ''
                }`,
            },
            handleKeyDown: (_view, event) => {
                // Ctrl+Enter to submit
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    handleSubmit();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getText());
        },
        onSelectionUpdate: ({ editor }) => {
            // Force a re-render to update toolbar button states
            setEditorStateCounter(s => s + 1);
        },
        onTransaction: () => {
            setEditorStateCounter(s => s + 1);
        },
    });

    const [editorContent, setEditorContent] = useState('');
    const [_, setEditorStateCounter] = useState(0);

    const handleSubmit = useCallback(() => {
        if (!editor || editorContent.trim().length === 0) return;
        onSubmit(editor.getHTML());
        editor.commands.clearContent();
        setEditorContent('');
    }, [editor, onSubmit, editorContent]);

    const handleInsertCode = useCallback((code: string, language: string) => {
        if (!editor) return;
        editor.chain().focus().toggleCodeBlock({ language }).insertContent(code).run();
    }, [editor]);

    const handleInsertMath = useCallback((latex: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(latex).run();
    }, [editor]);

    if (!editor) return null;

    const editorContainer = (
        <motion.div
            layout
            className={`rounded-2xl border bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden transition-all duration-300 ${
                fullscreen
                    ? 'fixed inset-4 z-50 flex flex-col shadow-2xl border-slate-200 dark:border-slate-700/60'
                    : 'border-slate-200 dark:border-slate-700/60 focus-within:border-[#21A9FF] focus-within:ring-4 focus-within:ring-[#21A9FF]/10'
            }`}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 flex-wrap sticky top-0 z-10">
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
                    onClick={() => setDrawers(d => ({ ...d, math: true }))}
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

            {/* Drawers */}
            <CodeEditorDrawer
                isOpen={drawers.code}
                onClose={() => setDrawers(d => ({ ...d, code: false }))}
                onApply={handleInsertCode}
            />
            <MathEditorModal
                isOpen={drawers.math}
                onClose={() => setDrawers(d => ({ ...d, math: false }))}
                onApply={handleInsertMath}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono">Ctrl</kbd>
                    {' + '}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono">Enter</kbd>
                    {' to submit'}
                </span>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !editor || editorContent.trim().length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#21A9FF] to-[#0094F2] text-white text-sm font-bold shadow-md shadow-[#21A9FF]/20 hover:shadow-lg hover:shadow-[#21A9FF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Reply'}
                </motion.button>
            </div>
        </motion.div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                .prose pre {
                    background-color: #0d1117 !important;
                    color: #e6edf3 !important;
                    padding: 1.5rem !important;
                    border-radius: 1rem !important;
                    border: 1px solid rgba(255,255,255,0.1);
                    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                    font-size: 0.85rem !important;
                    line-height: 1.6 !important;
                    position: relative;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
                }
                .prose pre code {
                    background: transparent !important;
                    padding: 0 !important;
                    color: inherit !important;
                }
                
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
