import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, AlertCircle, Sparkles, HelpCircle, ChevronDown, ChevronUp, User } from 'lucide-react';
import type { AIQuestionEvaluation, AIWeakTopic, AIStrengthTopic, AIRubricScore } from '../types';
import { ConfidenceBadge, ConfidenceProgressBar } from './ConfidenceComponents';
import { clsx } from 'clsx';

// --- Feedback & Topics ---

export const FeedbackPanel: React.FC<{ feedback: string; recommendation: string }> = ({ feedback, recommendation }) => (
    <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">AI Executive Summary</h2>
        </div>
        <div className="space-y-6">
            <div className="p-5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Overall Observations</span>
                <p className="text-gray-700 dark:text-slate-300 font-medium leading-relaxed italic">"{feedback}"</p>
            </div>
            <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-3">AI Recommendation</span>
                <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300">{recommendation}</p>
                </div>
            </div>
        </div>
    </div>
);

export const TopicAnalysis: React.FC<{ weak: AIWeakTopic[] }> = ({ weak }) => (
    <div className="bg-rose-50/30 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 rounded-3xl p-6">
        <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Weak Topics
        </h3>
        <div className="flex flex-wrap gap-2">
            {weak.length > 0 ? weak.map(t => (
                <span key={t.id} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl shadow-sm">
                    {t.name}
                </span>
            )) : <span className="text-gray-400 text-xs font-medium italic">No major weaknesses detected.</span>}
        </div>
    </div>
);

// --- Question Evaluation ---

export const QuestionEvaluationCard: React.FC<{ evaluation: AIQuestionEvaluation }> = ({ evaluation }) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            {/* Header */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="p-5 flex items-center justify-between cursor-pointer group select-none"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-black rounded-xl text-sm border border-gray-200 dark:border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        Q{evaluation.questionNumber}
                    </div>
                    <div>
                        <h4 className="text-base font-black text-gray-900 dark:text-white line-clamp-1">
                            {evaluation.questionType} Question Evaluation
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                            <ConfidenceBadge confidence={evaluation.confidence} className="scale-90 origin-left" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                Awarded Score: <span className="text-gray-900 dark:text-white">{evaluation.awardedScore} / {evaluation.maxScore}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-8 w-px bg-gray-100 dark:bg-slate-700" />
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Question Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <HelpCircle className="w-3 h-3" /> Question Text
                            </span>
                            <div className="p-5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-sm text-gray-700 dark:text-slate-300 font-medium leading-relaxed">
                                {evaluation.questionText}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Student Answer
                            </span>
                            <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-sm text-blue-900 dark:text-blue-200 font-medium leading-relaxed italic">
                                "{evaluation.studentAnswer}"
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/80 rounded-[2rem] border border-gray-100 dark:border-slate-800 space-y-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h5 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">AI Technical Evaluation</h5>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                            {evaluation.feedback}
                        </p>

                        {/* Rubric Breakdown */}
                        {evaluation.rubricScores && evaluation.rubricScores.length > 0 && (
                            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-700/50">
                                <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assessment Criteria Breakdown</h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {evaluation.rubricScores.map((score, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-black text-gray-700 dark:text-slate-200 uppercase tracking-tight">{score.criterionName}</span>
                                                <span className="text-xs font-black text-blue-500">{score.score} <span className="text-gray-400">/ {score.weight}</span></span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(score.score / score.weight) * 100}%` }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


