import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Sparkles, 
    TrendingUp, 
    Award, 
    MessageSquare, 
    ChevronDown, 
    ChevronUp,
    AlertCircle,
    Info,
    RefreshCw
} from 'lucide-react';
import { api } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';

interface AnalyticsData {
    totalEvaluations: number;
    averageRating: number;
    satisfactionRate: number;
    averageDiscrepancy: number;
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    recentEvaluations: Array<{
        questionId: string;
        attemptId: string;
        aiRating: number;
        instructorComment: string;
        aiScore: number;
        instructorFinalScore: number;
        createdAt: string;
    }>;
}

export const AIGradingAnalyticsDashboard = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading, isError, refetch, isFetching } = useQuery<AnalyticsData>({
        queryKey: ['ai-evaluations-analytics'],
        queryFn: async () => {
            const response = await api.get<ApiResponse<AnalyticsData>>('/Attempts/ai-evaluations/analytics');
            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Failed to fetch analytics.');
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl border border-gray-100 dark:border-slate-700/50 rounded-[2rem] p-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                    <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading AI performance analytics...</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return null;
    }

    const {
        totalEvaluations,
        averageRating,
        satisfactionRate,
        averageDiscrepancy,
        distribution,
        recentEvaluations
    } = data;

    // SVG parameters for circular score ring
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (satisfactionRate / 100) * circumference;

    return (
        <div className="bg-white dark:bg-slate-850/50 border border-violet-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300">
            {/* Header Accordion Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 dark:hover:bg-slate-800/10 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            AI Grading Performance & Calibration
                            <span className="text-[8px] font-black uppercase tracking-widest bg-violet-500 text-white px-2.5 py-0.5 rounded-full">
                                Live Insights
                            </span>
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">
                            Real-time statistics of AI accuracy feedback from instructors.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            refetch();
                        }}
                        disabled={isFetching}
                        className="p-2 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-100 dark:border-slate-750 transition-colors"
                        title="Refresh analytics data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Accordion Content */}
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        
                        {/* Circular Satisfaction Meter */}
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2.5">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="currentColor"
                                        className="text-gray-200 dark:text-slate-800"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="url(#satisfactionGrad)"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                    <defs>
                                        <linearGradient id="satisfactionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                                        {satisfactionRate}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">Satisfaction Rate</h4>
                                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 mt-0.5">Rating levels Good to Excellent</p>
                            </div>
                        </div>

                        {/* Numeric Metrics */}
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-1.5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/5 to-transparent rounded-full blur-xl" />
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Award className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Average AI Rating</span>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{averageRating} <span className="text-xs font-bold text-gray-400">/ 5.0</span></h3>
                            <p className="text-[9px] font-semibold text-gray-400 dark:text-slate-500">From {totalEvaluations} manual reviews</p>
                        </div>

                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-1.5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-xl" />
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Sparkles className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Average Score Discrepancy</span>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{averageDiscrepancy} <span className="text-xs font-bold text-gray-400">marks</span></h3>
                            <p className="text-[9px] font-semibold text-gray-400 dark:text-slate-500">Deviation from instructor final scores</p>
                        </div>

                        {/* Rating Distribution list */}
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-2.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Rating Distribution</span>
                            <div className="space-y-1.5">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = distribution[stars as 1|2|3|4|5] || 0;
                                    const pct = totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0;
                                    const barColor = 
                                        stars === 5 ? 'bg-violet-500' : 
                                        stars === 4 ? 'bg-blue-500' : 
                                        stars === 3 ? 'bg-yellow-500' : 
                                        stars === 2 ? 'bg-orange-500' : 'bg-red-500';
                                    return (
                                        <div key={stars} className="flex items-center gap-2 text-[10px] font-bold">
                                            <span className="w-3 text-right">{stars}⭐</span>
                                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="w-5 text-gray-400 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Discrepancy Insight Banner */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4 flex gap-3 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="leading-relaxed">
                            {averageDiscrepancy <= 0.5 
                                ? "Excellent calibration. The AI Estimated Score deviates very little from the final scores assigned by instructors."
                                : `Average discrepancy of ${averageDiscrepancy} marks indicates scope for rubric optimization. Consider reviewing expected answer points.`}
                        </p>
                    </div>

                    {/* Instructor Comment Reports */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-violet-500" />
                            Model Improvement Reports (Recent Comments)
                        </h4>
                        
                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                            {recentEvaluations.length === 0 ? (
                                <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-500 italic">No feedback comments submitted yet.</p>
                            ) : (
                                recentEvaluations.map((evalItem, i) => {
                                    const ratingColors = 
                                        evalItem.aiRating === 5 ? 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' : 
                                        evalItem.aiRating === 4 ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' : 
                                        evalItem.aiRating === 3 ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 
                                        evalItem.aiRating === 2 ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 
                                        'text-red-500 bg-red-50 dark:bg-red-500/10';
                                    
                                    return (
                                        <div key={i} className="bg-gray-50/50 dark:bg-slate-900/35 border border-gray-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ratingColors}`}>
                                                        Rating: {evalItem.aiRating} ⭐
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                                                        {new Date(evalItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-700 dark:text-slate-300 italic">
                                                    "{evalItem.instructorComment || "No comment provided."}"
                                                </p>
                                            </div>
                                            
                                            <div className="shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 leading-none">AI Score</p>
                                                    <p className="text-sm font-black text-violet-600 dark:text-violet-400 mt-1">{evalItem.aiScore} pts</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 leading-none">Final Score</p>
                                                    <p className="text-sm font-black text-[#21A9FF] mt-1">{evalItem.instructorFinalScore} pts</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
