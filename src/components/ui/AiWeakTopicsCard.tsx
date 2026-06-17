import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react';

interface AiWeakTopicsCardProps {
    weakTopics?: string[];
}

/* ── Animated AI sparkle dots for the background ── */
const AiParticle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
    <div
        className="absolute rounded-full pointer-events-none"
        style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
            animation: `aiPulse ${2.5 + delay * 0.5}s ease-in-out ${delay}s infinite alternate`,
        }}
    />
);

export const AiWeakTopicsCard = ({ weakTopics }: AiWeakTopicsCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!weakTopics || weakTopics.length === 0) {
        return null;
    }

    const displayedTopics = isExpanded ? weakTopics : weakTopics.slice(0, 6);
    const hiddenCount = weakTopics.length - 6;

    /* Gradient accent colors per chip index for visual variety */
    const chipAccents = [
        'from-violet-500/15 to-purple-500/15 dark:from-violet-500/20 dark:to-purple-500/20 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/25',
        'from-fuchsia-500/15 to-pink-500/15 dark:from-fuchsia-500/20 dark:to-pink-500/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/60 dark:border-fuchsia-500/25',
        'from-indigo-500/15 to-blue-500/15 dark:from-indigo-500/20 dark:to-blue-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-500/25',
        'from-sky-500/15 to-cyan-500/15 dark:from-sky-500/20 dark:to-cyan-500/20 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/25',
        'from-rose-500/15 to-red-500/15 dark:from-rose-500/20 dark:to-red-500/20 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-500/25',
        'from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/25',
    ];

    return (
        <>
            {/* Inject keyframe animation */}
            <style>{`
                @keyframes aiPulse {
                    0%   { opacity: 0.2; transform: scale(0.8); }
                    100% { opacity: 0.8; transform: scale(1.3); }
                }
                @keyframes aiShimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes chipSlideIn {
                    0%   { opacity: 0; transform: translateY(8px) scale(0.92); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes badgeBreathe {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.08); }
                    50%      { box-shadow: 0 0 0 6px rgba(139,92,246,0.04); }
                }
            `}</style>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-violet-100/80 dark:border-violet-500/15 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl shadow-lg shadow-violet-500/5 dark:shadow-violet-500/5 transition-all duration-500 hover:shadow-xl hover:shadow-violet-500/10">

                {/* ─── Decorative ambient gradient blobs ─── */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-violet-400/10 via-fuchsia-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-indigo-400/10 via-purple-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Floating particles */}
                <AiParticle delay={0} x={85} y={15} size={6} />
                <AiParticle delay={0.7} x={10} y={75} size={5} />
                <AiParticle delay={1.2} x={70} y={80} size={4} />
                <AiParticle delay={1.8} x={30} y={20} size={5} />
                <AiParticle delay={2.2} x={55} y={50} size={3} />

                {/* ─── Top shimmer line ─── */}
                <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 30%, rgba(99,102,241,0.5) 50%, rgba(139,92,246,0.4) 70%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'aiShimmer 4s linear infinite',
                    }}
                />

                {/* ─── Header ─── */}
                <div className="relative z-10 p-6 pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {/* AI Icon with animated glow */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-lg opacity-30 animate-pulse" />
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                                    <Sparkles className="w-6 h-6 drop-shadow-sm" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    AI Learning Insights
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                                        AI
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                                    Topics where AI detected potential knowledge gaps based on your answers.
                                </p>
                            </div>
                        </div>

                        {/* Expand / Collapse button */}
                        {weakTopics.length > 6 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-indigo-50/80 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-100/50 dark:border-indigo-500/15 self-start sm:self-center"
                            >
                                {isExpanded ? (
                                    <>Show Less <ChevronUp className="w-3.5 h-3.5" /></>
                                ) : (
                                    <>View All <ChevronDown className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Topic Chips ─── */}
                <div className="relative z-10 px-6 pt-5 pb-2">
                    <div className="flex flex-wrap gap-2.5">
                        {displayedTopics.map((topic, index) => (
                            <span
                                key={index}
                                className={`
                                    inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                                    bg-gradient-to-r border backdrop-blur-sm
                                    hover:scale-[1.04] hover:-translate-y-0.5
                                    transition-all duration-200 cursor-default select-none
                                    ${chipAccents[index % chipAccents.length]}
                                `}
                                style={{
                                    animation: `chipSlideIn 0.4s ease-out ${index * 0.06}s both, badgeBreathe 3s ease-in-out ${index * 0.3}s infinite`,
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
                                {topic}
                            </span>
                        ))}

                        {/* "More" chip */}
                        {!isExpanded && hiddenCount > 0 && (
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-700/60 dark:to-slate-700/40 text-gray-600 dark:text-slate-300 border border-gray-200/60 dark:border-slate-600/40 hover:scale-105 hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
                                style={{ animation: 'chipSlideIn 0.4s ease-out 0.4s both' }}
                            >
                                +{hiddenCount} more
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Footer with insight summary ─── */}
                <div className="relative z-10 mx-6 mt-4 mb-5 pt-4 border-t border-gray-100/80 dark:border-slate-700/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                <BrainCircuit className="w-3.5 h-3.5 text-violet-400 dark:text-violet-500" />
                                <span>{weakTopics.length} {weakTopics.length === 1 ? 'topic' : 'topics'} identified</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                                <span>Focus areas</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500">
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                            <span>Review these topics to improve your score</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
