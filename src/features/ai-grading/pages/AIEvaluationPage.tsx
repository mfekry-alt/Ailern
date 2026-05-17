import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    ArrowLeft, 
    Settings, 
    Users, 
    BarChart2, 
    CheckCircle2, 
    ChevronRight,
    Sparkles,
    LayoutDashboard,
    GraduationCap
} from 'lucide-react';
import { clsx } from 'clsx';

export const AIEvaluationPage = () => {
    const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [isConfigured, setIsConfigured] = useState(false);
    const [showConfigEngine, setShowConfigEngine] = useState(false);
    
    // Determine active tab from URL path
    const activeTab = location.pathname.endsWith('/setup') ? 'setup' : 
                      location.pathname.endsWith('/configure') ? 'configure' : 'results';

    const handleConfigure = () => {
        navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/configure`);
    };

    const handleStartEvaluation = () => {
        setShowConfigEngine(false);
        navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/results`);
    };
    const sidebarItems = [
        { 
            id: 'setup', 
            label: 'Setup Submissions', 
            icon: Users, 
            description: 'Select students to evaluate',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        { 
            id: 'configure', 
            label: 'AI Engine', 
            icon: Brain, 
            description: 'Build rubrics & answers',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10'
        },
        { 
            id: 'results', 
            label: 'Evaluation Results', 
            icon: BarChart2, 
            description: 'AI analytics & reviews',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes`)}
                            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Assessment Studio</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Evaluation Center</h1>
                        </div>
                    </div>

                    {/* Top Tab Navigation */}
                    <div className="flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/${item.id}`)}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === item.id 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet context={{ 
                            isConfigured, 
                            setIsConfigured, 
                            showConfigEngine, 
                            setShowConfigEngine,
                            onConfigure: handleConfigure,
                            onStartEvaluation: handleStartEvaluation
                        }} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
