import React, { useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Download, 
    RefreshCw, 
    BarChart2, 
    ShieldCheck, 
    AlertCircle, 
    Search, 
    Filter, 
    ChevronDown, 
    Clock, 
    SortAsc, 
    Target,
    CheckCircle2,
    Zap,
    ChevronRight,
    ArrowUpRight,
    Sparkles
} from 'lucide-react';
import { AIGradingSummaryCards } from './AIGradingSummaryCards';
import { MOCK_QUIZ_STATS, MOCK_SUBMISSIONS } from '../mock/data';
import { clsx } from 'clsx';

interface AIEvaluationContext {
    isConfigured: boolean;
}

export const AIEvaluationResultsTab = () => {
    const navigate = useNavigate();
    const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
    const { isConfigured } = useOutletContext<AIEvaluationContext>();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'review'>('all');
    const [sortBy, setSortBy] = useState<'latest' | 'name' | 'score'>('latest');
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const filteredSubmissions = [...MOCK_SUBMISSIONS]
        .filter(sub => {
            const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'approved' && sub.status === 'Auto Approved') ||
                (statusFilter === 'review' && sub.status === 'Needs Manual Review');
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
            if (sortBy === 'score') return (b.finalScore || 0) - (a.finalScore || 0);
            return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            Evaluation Results Dashboard
                        </h1>
                        <div className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                            isConfigured 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/10"
                                : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                            {isConfigured ? (
                                <><ShieldCheck className="w-3 h-3" /> AI Engine Configured</>
                            ) : (
                                <><AlertCircle className="w-3 h-3" /> Default Evaluation Mode</>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Review and manage AI-generated evaluations for student submissions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold text-sm rounded-xl transition-all hover:shadow-md active:scale-95">
                        <Download className="w-4 h-4 text-slate-400" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95">
                        <RefreshCw className="w-4 h-4" /> Re-run AI Evaluation
                    </button>
                </div>
            </div>
            
            {/* Summary Stats */}
            <AIGradingSummaryCards stats={MOCK_QUIZ_STATS} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content: Student Evaluations */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Student Evaluations</h2>
                        </div>
                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {filteredSubmissions.length} RESULTS
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search student name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm transition-all outline-none focus:ring-0"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Status Filter Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl text-xs font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-all"
                                >
                                    <span className="capitalize">{statusFilter === 'all' ? 'All Statuses' : statusFilter === 'approved' ? 'Auto Approved' : 'Needs Review'}</span>
                                    <ChevronDown className={clsx("w-3.5 h-3.5 opacity-50 transition-transform", isStatusOpen && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {isStatusOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 overflow-hidden">
                                                {[
                                                    { id: 'all', label: 'All Statuses', icon: Filter },
                                                    { id: 'approved', label: 'Auto Approved', icon: CheckCircle2 },
                                                    { id: 'review', label: 'Needs Review', icon: Clock }
                                                ].map((option) => (
                                                    <button key={option.id} onClick={() => { setStatusFilter(option.id as any); setIsStatusOpen(false); }} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group", statusFilter === option.id ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                                        <option.icon className="w-4 h-4" />
                                                        <span className="text-[13px] font-bold">{option.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl text-xs font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-all"
                                >
                                    <span className="capitalize">{sortBy === 'latest' ? 'Latest First' : sortBy === 'name' ? 'Name (A-Z)' : 'Top Scores'}</span>
                                    <ChevronDown className={clsx("w-3.5 h-3.5 opacity-50 transition-transform", isSortOpen && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {isSortOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 overflow-hidden">
                                                {[
                                                    { id: 'latest', label: 'Latest First', icon: Clock },
                                                    { id: 'name', label: 'Name (A-Z)', icon: SortAsc },
                                                    { id: 'score', label: 'Top Scores', icon: Target }
                                                ].map((option) => (
                                                    <button key={option.id} onClick={() => { setSortBy(option.id as any); setIsSortOpen(false); }} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group", sortBy === option.id ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                                                        <option.icon className="w-4 h-4" />
                                                        <span className="text-[13px] font-bold">{option.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Student Evaluation List */}
                    <div className="space-y-4">
                        {filteredSubmissions.map((sub, i) => {
                            const confidence = Math.floor(Math.random() * 40) + 60; // Mock confidence
                            const isLowConfidence = confidence < 75;

                            return (
                                <motion.div 
                                    key={sub.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/${sub.id}`)}
                                    className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-8 group hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                                            {sub.studentName.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{sub.studentName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(sub.submissionDate).toLocaleDateString()}
                                                </div>
                                                <span className="text-slate-300 text-[10px]">•</span>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {sub.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12 shrink-0">
                                        <div className="text-center w-20">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Score</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{sub.finalScore}<span className="text-xs text-slate-400 font-medium ml-0.5">/100</span></p>
                                        </div>

                                        <div className="hidden md:block text-center min-w-[120px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border",
                                                isLowConfidence 
                                                    ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                            )}>
                                                {isLowConfidence ? <AlertCircle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                {confidence}% CONFIDENCE
                                            </div>
                                        </div>

                                        <div className="hidden lg:block text-center w-32">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                                sub.status === 'Auto Approved' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                            )}>
                                                {sub.status}
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: AI Insights & Progress */}
                <div className="space-y-8">
                    {/* AI Insights Card */}
                    <div className="relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem]" />
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Brain className="w-32 h-32 text-white rotate-12" />
                        </div>
                        <div className="relative p-8 space-y-6">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">AI Insights</h3>
                                <p className="text-indigo-100/70 text-sm mt-2 leading-relaxed">
                                    Most students struggle with "Recursion" and "Memory Management". Consider a dedicated review session.
                                </p>
                            </div>
                            <button className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                View Topic Analysis
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Evaluation Progress Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Evaluation Progress</h3>
                            <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                <span>Auto-Evaluated</span>
                                <span className="text-indigo-600">100%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                All submissions have been processed by the AI engine. You can now review the results and finalize the grades.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
