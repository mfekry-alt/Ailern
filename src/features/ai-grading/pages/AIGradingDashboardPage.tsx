import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { AIGradingSummaryCards } from '../components/AIGradingSummaryCards';
import { SubmissionList } from '../components/SubmissionList';
import { MOCK_QUIZ_STATS, MOCK_SUBMISSIONS } from '../mock/data';

export const AIGradingDashboardPage = () => {
    const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 space-y-8 font-sans transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-500 hover:text-blue-500 transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/10">
                                AI Grading Portal
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            Programming Fundamentals <span className="text-gray-300 dark:text-slate-700 font-light">/</span> Quiz 1
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                            Review and manage AI-generated evaluations for student submissions.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-all hover:shadow-md active:scale-95">
                        <Download className="w-4 h-4 text-gray-400" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-bold text-sm rounded-xl transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95">
                        <RefreshCw className="w-4 h-4" /> Re-run AI Grading
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <AIGradingSummaryCards stats={MOCK_QUIZ_STATS} />

            {/* Analytics Section Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Student Submissions</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {MOCK_SUBMISSIONS.length} Results
                        </span>
                    </div>
                    
                    <SubmissionList 
                        submissions={MOCK_SUBMISSIONS} 
                        courseId={courseId || ''} 
                        quizId={quizId || ''} 
                    />
                </div>

                {/* Sidebar Widget Area */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                            <Brain className="w-32 h-32" />
                        </div>
                        <h3 className="text-xl font-black mb-2 relative z-10">AI Insights</h3>
                        <p className="text-blue-100 text-sm font-medium mb-6 relative z-10 leading-relaxed">
                            Most students struggle with "Recursion" and "Memory Management". Consider a dedicated review session.
                        </p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold transition-all border border-white/10 relative z-10">
                            View Topic Analysis
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800/40 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Grading Progress</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                                <span>Auto-Graded</span>
                                <span className="text-blue-500">100%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                All submissions have been processed by the AI engine. Manual review is pending for 8 submissions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
