import { useEffect, useRef } from 'react';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/monokai-sublime.css';

interface QnARendererProps {
    content: string;
    className?: string;
}

export function QnARenderer({ content, className = '' }: QnARendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = content;

            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });

                // Add premium features to code blocks
                const preBlocks = containerRef.current.querySelectorAll('pre');
                preBlocks.forEach((pre) => {
                    if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'code-block-wrapper relative my-6 rounded-2xl overflow-hidden border border-slate-200/10 shadow-2xl';

                    const header = document.createElement('div');
                    header.className = 'flex items-center justify-between px-4 py-2.5 bg-[#1a1b17] border-b border-white/5';

                    const dots = `
                        <div class="flex gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                            <div class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                            <div class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                        </div>
                    `;

                    const lang = pre.querySelector('code')?.className.replace('language-', '') || 'code';
                    header.innerHTML = `
                        ${dots}
                        <div class="flex items-center gap-3">
                            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${lang}</span>
                            <button class="copy-btn p-1.5 hover:bg-white/5 rounded-md transition-colors group" title="Copy Code">
                                <svg class="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    `;

                    pre.parentNode?.insertBefore(wrapper, pre);
                    wrapper.appendChild(header);
                    wrapper.appendChild(pre);

                    // Add copy functionality
                    const copyBtn = header.querySelector('.copy-btn');
                    copyBtn?.addEventListener('click', () => {
                        const text = pre.innerText;
                        navigator.clipboard.writeText(text);
                        const svg = copyBtn.querySelector('svg');
                        if (svg) {
                            const original = svg.innerHTML;
                            svg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                            setTimeout(() => { svg.innerHTML = original; }, 2000);
                        }
                    });
                });
            } catch (error) {
                console.error('QnA Rendering error:', error);
            }
        }
    }, [content]);

    return (
        <div className={`relative ${className}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .prose pre {
                    background-color: #23241f !important;
                    color: #f8f8f2 !important;
                    padding: 1.5rem !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    font-size: 13px !important;
                    line-height: 1.6 !important;
                }
                .hljs-keyword, .hljs-built_in { color: #a6e22e !important; }
                .hljs-string { color: #e6db74 !important; }
                .hljs-comment { color: #75715e !important; }
                .hljs-number, .hljs-attr { color: #ae81ff !important; }
                .hljs-title { color: #66d9ef !important; }
                
                .code-block-wrapper pre::-webkit-scrollbar {
                    height: 8px;
                }
                .code-block-wrapper pre::-webkit-scrollbar-track {
                    background: #1a1b17;
                }
                .code-block-wrapper pre::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }
                .code-block-wrapper pre::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            `}} />
            <div
                ref={containerRef}
                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1"
            />
        </div>
    );
}
