/** Rich Text Editor — Tiptap-based editor for quiz question content */
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useState } from 'react';
import {
    Bold, Italic, List, ListOrdered, Quote, Code,
    Heading2, Strikethrough,
    Undo, Redo
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import 'highlight.js/styles/github-dark.css';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

const ToolBtn = ({
    icon: Icon,
    onClick,
    active = false,
    disabled = false,
    label
}: {
    icon: any;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label: string;
}) => (
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
        className={clsx(
            "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200",
            active
                ? "text-[#21A9FF] bg-[#21A9FF]/10 shadow-[0_0_15px_rgba(33,169,255,0.15)] ring-1 ring-[#21A9FF]/30"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        <Icon className={clsx("w-4 h-4 transition-transform", active && "scale-110")} />
        {active && (
            <motion.div
                layoutId="tool-active-indicator-quiz"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#21A9FF]"
            />
        )}
    </motion.button>
);

export const RichTextEditor = ({ content, onChange, placeholder, className }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start typing...',
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-sm my-4',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onSelectionUpdate: () => {
            setUpdateCounter(s => s + 1);
        },
        onTransaction: () => {
            setUpdateCounter(s => s + 1);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3',
            },
        },
    });

    const [_, setUpdateCounter] = useState(0);


    if (!editor) return null;

    return (
        <div className={clsx(
            "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
            className
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-sm">
                <ToolBtn
                    icon={Bold}
                    label="Bold"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolBtn
                    icon={Italic}
                    label="Italic"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolBtn
                    icon={Strikethrough}
                    label="Strike"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolBtn
                    icon={Heading2}
                    label="Heading"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
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

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolBtn
                    icon={Quote}
                    label="Blockquote"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <ToolBtn
                    icon={Code}
                    label="Code Block"
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                />

                <div className="flex-1" />

                <ToolBtn
                    icon={Undo}
                    label="Undo"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                />
                <ToolBtn
                    icon={Redo}
                    label="Redo"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                />
            </div>


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
                .ProseMirror:focus {
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}} />
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
