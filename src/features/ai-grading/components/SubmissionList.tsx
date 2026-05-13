import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpRight, Clock, User, ChevronRight, BarChart3 } from 'lucide-react';
import type { AISubmissionResult } from '../types';
import { ConfidenceBadge } from './ConfidenceComponents';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface SubmissionListProps {
    submissions: AISubmissionResult[];
    courseId: string;
    quizId: string;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({ submissions, courseId, quizId }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'date'>('date');

    const filteredSubmissions = useMemo(() => {
        return submissions
            .filter(sub => {
                const nameMatch = sub.studentName.toLowerCase().includes(search.toLowerCase());
                const statusMatch = statusFilter === 'all' || sub.status === statusFilter;
                return nameMatch && statusMatch;
            })
            .sort((a, b) => {
                if (sortBy === 'score') return b.finalScore - a.finalScore;
                if (sortBy === 'confidence') return a.overallConfidence - b.overallConfidence;
                return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
            });
    }, [submissions, search, statusFilter, sortBy]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Auto Approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Needs Manual Review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Instructor Reviewed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search student name..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Auto Approved">Auto Approved</option>
                        <option value="Needs Manual Review">Needs Review</option>
                        <option value="Instructor Reviewed">Reviewed</option>
                    </select>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="date">Latest First</option>
                        <option value="score">Highest Score</option>
                        <option value="confidence">Lowest Confidence</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredSubmissions.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800"
                        >
                            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No matching submissions found.</p>
                        </motion.div>
                    ) : (
                        filteredSubmissions.map((sub, idx) => (
                            <motion.div
                                key={sub.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/${sub.id}`)}
                                className="group flex flex-col md:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                        <img src={sub.studentAvatar} alt={sub.studentName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                            {sub.studentName}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {new Date(sub.submissionDate).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> ID: {sub.studentId.substring(0, 6)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto px-4 md:px-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50 dark:border-slate-700/50">
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">AI Score</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-white">
                                            {sub.finalScore}<span className="text-xs text-gray-400 ml-0.5">/{sub.maxScore}</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center min-w-[120px]">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Confidence</span>
                                        <ConfidenceBadge confidence={sub.overallConfidence} />
                                    </div>

                                    <div className="flex flex-col items-center min-w-[140px]">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Status</span>
                                        <span className={clsx(
                                            "px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider text-center w-full",
                                            getStatusStyle(sub.status)
                                        )}>
                                            {sub.status}
                                        </span>
                                    </div>

                                    <div className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
