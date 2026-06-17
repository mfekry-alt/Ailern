import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAIGradingConfigurations, useUpdateQuestionGradingConfiguration } from '../api/ai-grading.hooks';
import { AIQuestionStream } from '../components/AIQuestionStream';
import { AIGradingWorkspace } from '../components/AIGradingWorkspace';
import type { AIGradingConfigUpdateRequest } from '../types/ai-grading.types';
import { toast } from 'sonner';

import { 
    ArrowLeft, 
    Sparkles, 
    HelpCircle, 
    FileText, 
    Loader2, 
    AlertCircle,
    Layers
} from 'lucide-react';

export const AIGradingCenterPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [isWorkspaceDirty, setIsWorkspaceDirty] = useState(false);

    // Fetch AI grading criteria
    const { data: configurations = [], isLoading, error: isError } = useGetAIGradingConfigurations(quizId!);

    // Mutation
    const { mutate: updateConfig, isPending: isUpdating } = useUpdateQuestionGradingConfiguration(quizId!);

    // Set initial selected question when data loads
    useEffect(() => {
        if (!isLoading && configurations.length > 0 && !selectedQuestionId) {
            setSelectedQuestionId(configurations[0].questionId);
        }
    }, [isLoading, configurations, selectedQuestionId]);

    const handleSelectQuestion = (id: string) => {
        if (isWorkspaceDirty) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to switch questions without saving?');
            if (!confirmed) return;
        }
        setSelectedQuestionId(id);
        setIsWorkspaceDirty(false); // Reset dirty state when switching
    };

    const handleSave = (payload: AIGradingConfigUpdateRequest) => {
        if (!selectedQuestionId) return;

        updateConfig({ questionId: selectedQuestionId, payload }, {
            onSuccess: () => {
                toast.success('AI grading criteria saved.');
                setIsWorkspaceDirty(false);
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to save criteria.');
            }
        });
    };

    // Full-Screen Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col items-center justify-center p-6 transition-colors duration-500">
                <div className="relative flex items-center justify-center mb-4">
                    <Loader2 className="w-12 h-12 text-[#21A9FF] animate-spin" />
                    <Sparkles className="w-5 h-5 text-amber-500 absolute animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">Syncing Grading Engine</h3>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">Assembling your criteria...</p>
            </div>
        );
    }

    // Full-Screen Error State
    if (isError) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center p-6 transition-colors duration-500">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-100 dark:border-red-950/30 p-8 rounded-[2.5rem] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Failed to load rules</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            We couldn't initialize your AI Grading Criteria. Please check your network and try again.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    const selectedQuestion = configurations.find((c) => c.questionId === selectedQuestionId);

    return (
        <div className="h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500 font-sans selection:bg-[#21A9FF]/30 overflow-hidden flex flex-col relative">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#21A9FF]/8 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/8 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-tr from-amber-500/3 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0 overflow-hidden gap-6 relative z-10">
                
                {/* Header Section Banner */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-gray-200/60 dark:border-slate-800/60 rounded-3xl p-5 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Glowing blobs inside header */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#21A9FF]/8 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-violet-400/6 to-transparent rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="group/back w-11 h-11 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-[#21A9FF] hover:border-[#21A9FF]/50 dark:hover:text-[#21A9FF] dark:hover:border-[#21A9FF]/50 transition-all duration-300 shadow-sm active:scale-90 hover:shadow-[#21A9FF]/10 shrink-0"
                                aria-label="Go Back"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-0.5 transition-transform duration-300" />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#21A9FF]" />
                                    AI Grading <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#21A9FF] to-indigo-600">Criteria</span>
                                </h1>
                                <p className="text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
                                    Configure rubrics, reference answers, and evaluation weights.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Split Area */}
                {configurations.length === 0 ? (
                    /* Empty State Container */
                    <div className="w-full bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[450px] animate-in fade-in zoom-in-95 duration-500 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-2xl bg-[#21A9FF]/10 flex items-center justify-center text-[#21A9FF]">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Written Questions</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-medium">
                            AI assisted grading is exclusively applicable to <span className="text-slate-800 dark:text-slate-200 underline decoration-[#21A9FF] decoration-2 font-bold">Written prompt formats</span>. Please add a descriptive question to your quiz architecture first.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
                        
                        {/* Left Column: Question Stream List Selection (4 Cols) */}
                        <div className="lg:col-span-4 bg-white/70 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-sm p-4 backdrop-blur-sm space-y-4 h-full flex flex-col min-h-0">
                            <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-[#21A9FF]/10 flex items-center justify-center text-indigo-500">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                        Questions <span className="text-xs text-slate-400 font-medium ml-1">({configurations.length})</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a question to configure.</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                <AIQuestionStream
                                    items={configurations}
                                    selectedQuestionId={selectedQuestionId}
                                    onSelect={handleSelectQuestion}
                                />
                            </div>
                        </div>

                        {/* Right Column: Rule Config Interactive Workspace (8 Cols) */}
                        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                            {selectedQuestion ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden backdrop-blur-sm">
                                    <AIGradingWorkspace
                                        key={selectedQuestion.questionId}
                                        item={selectedQuestion}
                                        onSave={handleSave}
                                        isSaving={isUpdating}
                                        onDirtyChange={setIsWorkspaceDirty}
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 bg-white/30 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center text-slate-400 backdrop-blur-sm">
                                    <Sparkles className="w-10 h-10 mb-3 text-[#21A9FF] animate-pulse" />
                                    <p className="font-bold text-slate-500 dark:text-slate-400">
                                        Select a query node from the left index stream to load its engine metrics.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
