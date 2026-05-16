import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Brain, AlertCircle, ClipboardCheck, Activity } from 'lucide-react';
import type { AIQuizGradingStats } from '../types';
import { clsx } from 'clsx';

interface AIGradingSummaryCardsProps {
    stats: AIQuizGradingStats;
}

export const AIGradingSummaryCards: React.FC<AIGradingSummaryCardsProps> = ({ stats }) => {
    const cards = [
        {
            label: 'Total Submissions',
            value: stats.totalSubmissions,
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            trend: '+12% from last quiz'
        },
        {
            label: 'Avg. AI Confidence',
            value: `${stats.averageConfidence}%`,
            icon: Brain,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            trend: 'Stable performance'
        },
        {
            label: 'Average Score',
            value: `${stats.averageScore}%`,
            icon: Target,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            trend: 'Above course average'
        },
        {
            label: 'Needs Review',
            value: stats.needsReviewCount,
            icon: AlertCircle,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            trend: `${stats.lowConfidenceCount} low confidence`
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="p-5 bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={clsx("p-2.5 rounded-xl transition-colors group-hover:scale-110 duration-300", card.bgColor, card.color)}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                {card.label}
                            </span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                {card.value}
                            </span>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 dark:border-slate-700/30">
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
                                {card.trend}
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
