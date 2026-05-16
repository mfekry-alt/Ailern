import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, ArrowRight, Settings2 } from 'lucide-react';

interface AIRecommendationBannerProps {
    onConfigure: () => void;
}

export const AIRecommendationBanner: React.FC<AIRecommendationBannerProps> = ({ onConfigure }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 p-1 shadow-xl shadow-indigo-500/20"
        >
            <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.3rem] px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10 blur-3xl w-64 h-64 bg-white rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 opacity-10 blur-3xl w-64 h-64 bg-blue-400 rounded-full" />

                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] border border-white/20 flex items-center justify-center shrink-0 group">
                        <Brain className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">AI Engine Suggestion</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                            Improve AI Evaluation Accuracy
                        </h2>
                        <p className="text-indigo-100 text-sm font-medium max-w-xl leading-relaxed">
                            Enhance grading quality with instructor model answers, custom rubrics, and evaluation directives. Default AI settings are active, but a tailored configuration yields more precise results.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 shrink-0">
                    <button 
                        onClick={onConfigure}
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] hover:shadow-2xl shadow-white/10 active:scale-95"
                    >
                        <Settings2 className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
                        Configure AI Engine
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
