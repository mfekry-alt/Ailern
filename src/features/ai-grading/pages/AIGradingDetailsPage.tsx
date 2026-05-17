import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Printer, CheckCircle, ShieldCheck, MessageSquare, ExternalLink, Clock, Calendar, Brain } from 'lucide-react';
import { FeedbackPanel, TopicAnalysis, QuestionEvaluationCard } from '../components/DetailComponents';
import { ConfidenceBadge, ConfidenceProgressBar } from '../components/ConfidenceComponents';
import { MOCK_SUBMISSIONS } from '../mock/data';
import { clsx } from 'clsx';

export const AIGradingDetailsPage = () => {
    const { id: courseId, quizId, submissionId } = useParams<{ id: string; quizId: string; submissionId: string }>();
    const navigate = useNavigate();
    
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);

    if (!submission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Submission not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation`)}
                        className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-blue-500 transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-gray-400 hover:text-blue-500 transition-all shadow-sm">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-gray-400 hover:text-blue-500 transition-all shadow-sm">
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Column - Main Report */}
                    <div className="lg:col-span-3 space-y-8">
                        
                        {/* Summary Header Card */}
                        <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110" />
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl shrink-0">
                                    <img src={submission.studentAvatar} alt={submission.studentName} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                                                {submission.studentName}
                                            </h1>
                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(submission.submissionDate).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {submission.timeTakenMinutes} mins taken</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right px-4 border-r border-gray-100 dark:border-slate-700/50">
                                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Final Score</span>
                                                <span className="text-3xl font-black text-blue-500">{submission.finalScore}%</span>
                                            </div>
                                            <div className="text-right px-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">AI Verdict</span>
                                                <span className={clsx(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    submission.status === 'Auto Approved' ? 'text-emerald-500' : 'text-amber-500'
                                                )}>{submission.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <ConfidenceProgressBar confidence={submission.overallConfidence} showLabel height="h-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topics Analysis - Only Weak Topics restored */}
                        <TopicAnalysis 
                            weak={submission.weakTopics} 
                        />

                        {/* Detailed Question List */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Question-by-Question Analysis</h3>
                                <button className="text-xs font-bold text-blue-500 hover:underline">Expand All</button>
                            </div>
                            <div className="space-y-4">
                                {submission.questionEvaluations.map((evalItem, idx) => (
                                    <QuestionEvaluationCard key={idx} evaluation={evalItem} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sticky Sidebar Metadata */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Metadata Card */}
                            <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl shadow-slate-900/10 overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 p-4 opacity-5">
                                    <Brain className="w-24 h-24" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Submission Context</h4>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase font-black block">Quiz Title</span>
                                        <span className="text-sm font-bold text-white">Programming Fundamentals</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase font-black block">Course</span>
                                        <span className="text-sm font-bold text-white">CS101: Introduction to CS</span>
                                    </div>
                                    <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors mt-2">
                                        View Quiz Settings <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
