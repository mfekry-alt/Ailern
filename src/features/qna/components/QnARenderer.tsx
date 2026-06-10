import { useEffect, useRef } from 'react';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import hljs from 'highlight.js';
import 'katex/dist/katex.min.css';
import '@/styles/code-highlight.css';

interface QnARendererProps {
    content: string;
    className?: string;
}

export function QnARenderer({ content, className = '' }: QnARendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = content;

            // Auto-wrap LaTeX commands that are missing $ delimiters
            // This handles cases where Tiptap/backend strips the $ signs
            const wrapMathInTextNodes = (element: HTMLElement) => {
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
                const nodesToProcess: Text[] = [];
                let n: Node | null;
                while ((n = walker.nextNode())) {
                    if (n.textContent) nodesToProcess.push(n as Text);
                }
                
                // LaTeX command pattern: detects \frac, \sqrt, \sum, \int, etc.
                const latexPattern = /\\(frac|sqrt|sum|int|lim|vec|pm|cdot|times|div|leq|geq|neq|approx|infty|to|text|left|right|begin|end|alpha|beta|gamma|delta|theta|lambda|sigma|pi|omega|phi|epsilon|mu|nu|rho|tau|chi|psi|zeta|eta|over|bar|hat|tilde|dot|ddot|binom|tbinom|dbinom|log|ln|sin|cos|tan|cot|sec|csc|max|min|sup|inf|det|exp|ker|dim|hom|arg|deg|Pr|gcd|lcm|mod|bmod|pmod|equiv|sim|simeq|cong|propto|perp|parallel|subset|supset|subseteq|supseteq|in|notin|cup|cap|vee|wedge|oplus|otimes|forall|exists|nabla|partial|prime|circ|bullet|star|dagger|ddagger|ell|hbar|imath|jmath|Re|Im|wp|aleph)\b/;
                
                for (const textNode of nodesToProcess) {
                    const text = textNode.textContent || '';
                    // Skip if already has $ delimiters or is inside a KaTeX element
                    if (text.includes('$') || !latexPattern.test(text)) continue;
                    // Skip nodes inside code/pre blocks
                    let parent = textNode.parentElement;
                    let insideCode = false;
                    while (parent && parent !== element) {
                        if (parent.tagName === 'CODE' || parent.tagName === 'PRE') { insideCode = true; break; }
                        parent = parent.parentElement;
                    }
                    if (insideCode) continue;
                    
                    // Wrap the entire text content with $ delimiters for KaTeX
                    textNode.textContent = `$${text.trim()}$`;
                }
            };
            
            wrapMathInTextNodes(containerRef.current);

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
                
                // Explicitly highlight code blocks
                containerRef.current.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block as HTMLElement);
                });

                // Add premium features to code blocks
                const preBlocks = containerRef.current.querySelectorAll('pre');
                preBlocks.forEach((pre) => {
                    if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

                    // Clean up the pre element to ensure it fits perfectly in our wrapper
                    pre.style.margin = '0';
                    pre.style.borderRadius = '0';
                    pre.style.boxShadow = 'none';
                    pre.style.border = 'none';

                    const wrapper = document.createElement('div');
                    wrapper.className = 'code-block-wrapper relative my-8 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-[#1e1e1e]';

                    const header = document.createElement('div');
                    header.className = 'flex items-center justify-between px-5 py-3 bg-[#181818] border-b border-white/5 select-none';

                    const dots = `
                        <div class="flex gap-2">
                            <div class="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner"></div>
                            <div class="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner"></div>
                            <div class="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner"></div>
                        </div>
                    `;

                    const codeElem = pre.querySelector('code');
                    const lang = codeElem?.className.replace('language-', '') || 'code';
                    
                    header.innerHTML = `
                        ${dots}
                        <div class="flex items-center gap-4">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">${lang}</span>
                            <button class="copy-btn p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-90 group" title="Copy Code">
                                <svg class="w-4 h-4 text-slate-500 group-hover:text-slate-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
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
            {/* Syntax highlighting styles are provided by @/styles/code-highlight.css */}
            <div
                ref={containerRef}
                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1"
            />
        </div>
    );
}
