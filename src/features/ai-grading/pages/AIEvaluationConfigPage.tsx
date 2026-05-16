import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
    ArrowLeft, 
    Sparkles, 
    Brain, 
    Users, 
    FileText, 
    ListChecks, 
    Info, 
    Check,
    Target,
    ListTodo,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AIRubricBuilder } from '@/components/ui/AIRubricBuilder';

interface RubricCriterion {
    id: string;
    name: string;
    weight: number;
    description: string;
}

interface QuestionConfig {
    id: string;
    text: string;
    mark: number;
    modelAnswer: string;
    rubric: RubricCriterion[];
}

interface AIEvaluationContext {
    onStartEvaluation: () => void;
    setIsConfigured: (val: boolean) => void;
}

export const AIEvaluationConfigPage = () => {
    const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
    const navigate = useNavigate();
    const { onStartEvaluation, setIsConfigured } = useOutletContext<AIEvaluationContext>();
    const [globalInstructions, setGlobalInstructions] = useState('');
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

    // Initial mock data for essay questions
    const [questionsConfig, setQuestionsConfig] = useState<QuestionConfig[]>([
        { 
            id: 'q1', 
            text: 'Explain the concept of memory management in C++, focusing on stack vs heap allocation.', 
            mark: 10,
            modelAnswer: '',
            rubric: []
        },
        { 
            id: 'q2', 
            text: 'Discuss the advantages and disadvantages of using recursion in large-scale applications.', 
            mark: 15,
            modelAnswer: '',
            rubric: []
        }
    ]);

    const handleModelAnswerChange = (content: string) => {
        const newConfigs = [...questionsConfig];
        newConfigs[activeQuestionIdx].modelAnswer = content;
        setQuestionsConfig(newConfigs);
    };

    const handleRubricChange = (newRubric: any[]) => {
        const newConfigs = [...questionsConfig];
        newConfigs[activeQuestionIdx].rubric = newRubric;
        setQuestionsConfig(newConfigs);
    };

    const handleBack = () => {
        navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/setup`);
    };

    const handleExecute = () => {
        setIsConfigured(true);
        onStartEvaluation();
    };

    const activeQuestion = questionsConfig[activeQuestionIdx];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 sm:p-8 space-y-8 animate-in slide-in-from-right-4 duration-500 pb-40 lg:pb-32">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* New Header: Global Directives */}
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={handleBack}
                                className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all border border-slate-100 dark:border-slate-700 active:scale-95 shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Directives</span>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Engine Configuration</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:block text-right mr-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evaluation Engine</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">Active Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/10">
                                    Behavioral Instructions
                                </span>
                            </div>
                            <textarea 
                                value={globalInstructions}
                                onChange={(e) => setGlobalInstructions(e.target.value)}
                                placeholder="e.g. Ignore minor spelling mistakes. Be strict on technical terminology. Focus on the student's reasoning path."
                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none min-h-[140px] resize-none"
                            />
                        </div>
                        <div className="h-full flex flex-col justify-center">
                            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 space-y-4">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <Info className="w-5 h-5" />
                                    <span className="text-sm font-black uppercase tracking-widest">How it works</span>
                                </div>
                                <p className="text-sm text-indigo-900/70 dark:text-indigo-300/70 font-medium leading-relaxed">
                                    These instructions apply to all questions being evaluated. They guide the AI's "personality" and strictness across the entire assessment.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {['Strict', 'Constructive', 'Technical'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white dark:bg-slate-900 text-[10px] font-bold text-indigo-500 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left: Question Selection */}
                    <div className="xl:col-span-4">
                        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm xl:sticky xl:top-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <ListTodo className="w-5 h-5 text-indigo-500" />
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Questions</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    {questionsConfig.length} Items
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {questionsConfig.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setActiveQuestionIdx(idx)}
                                        className={clsx(
                                            "w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden",
                                            activeQuestionIdx === idx 
                                                ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20" 
                                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <span className={clsx(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                activeQuestionIdx === idx ? "text-indigo-200" : "text-slate-400"
                                            )}>
                                                Question {idx + 1}
                                            </span>
                                            <span className={clsx(
                                                "text-[10px] font-black",
                                                activeQuestionIdx === idx ? "text-white" : "text-indigo-600"
                                            )}>
                                                {q.mark} pts
                                            </span>
                                        </div>
                                        <p className={clsx(
                                            "text-xs font-bold line-clamp-2 leading-relaxed relative z-10",
                                            activeQuestionIdx === idx ? "text-white" : "text-slate-700 dark:text-slate-200"
                                        )}>
                                            {q.text}
                                        </p>
                                        {activeQuestionIdx === idx && (
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Check className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Detailed Question Config */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-black text-indigo-500 border border-slate-200 dark:border-slate-700 uppercase tracking-[0.2em]">
                                        Active Workspace
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                                    {activeQuestion.text}
                                </h2>
                            </div>

                            <div className="p-4 sm:p-8 space-y-12 sm:space-y-16">
                                {/* Model Answer */}
                                <section className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                    1. Instructor Model Answer
                                                    {activeQuestion.modelAnswer.length > 50 && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] uppercase tracking-tighter rounded-full border border-emerald-500/10 font-bold">
                                                            <Check className="w-2.5 h-2.5" /> Complete
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium">Provide the ideal response the AI should use as a benchmark.</p>
                                            </div>
                                        </div>
                                        
                                    </div>
                                    
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                                        <div className="relative rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-white/5">
                                            <RichTextEditor 
                                                content={activeQuestion.modelAnswer} 
                                                onChange={handleModelAnswerChange} 
                                                placeholder="Type or paste the perfect answer here..."
                                                className="border-0 ring-0 focus-within:ring-0"
                                            />
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between px-6">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Word Count: {activeQuestion.modelAnswer.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Status: {activeQuestion.modelAnswer.length > 0 ? 'Drafting' : 'Empty'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-indigo-500/50 italic">Changes saved automatically</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Rubric Builder */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                            <ListChecks className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-900 dark:text-white">2. Assessment Criteria Rubric</h4>
                                            <p className="text-[11px] text-slate-500 font-medium">Define specific points for technical accuracy, logic, etc.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.25rem] border border-slate-100 dark:border-slate-700">
                                        <AIRubricBuilder 
                                            value={activeQuestion.rubric} 
                                            onChange={handleRubricChange} 
                                            maxPoints={activeQuestion.mark} 
                                        />
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 z-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Configure all questions to unlock full evaluation.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                        <button 
                            onClick={handleBack}
                            className="flex-1 md:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs sm:text-sm rounded-2xl transition-all hover:bg-slate-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                // Mock save
                                setIsConfigured(true);
                                navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/setup`);
                            }}
                            className="flex-[2] md:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-indigo-600 text-white font-black text-xs sm:text-sm rounded-2xl transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-500/25 active:scale-95 group whitespace-nowrap"
                        >
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
