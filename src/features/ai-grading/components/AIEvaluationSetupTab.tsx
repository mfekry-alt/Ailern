import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { 
    Users, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    ChevronRight, 
    Sparkles, 
    Brain,
    FileText,
    ListChecks,
    AlertCircle,
    Info,
    ArrowLeft,
    Check,
    X,
    MoreHorizontal,
    Settings2,
    Play,
    Zap,
    Target,
    ListTodo,
    ChevronDown,
    Calendar,
    ArrowRight,
    SortAsc
} from 'lucide-react';
import { MOCK_SUBMISSIONS } from '../mock/data';
import { clsx } from 'clsx';
import { AIRubricBuilder } from '@/components/ui/AIRubricBuilder';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface AIEvaluationContext {
    isConfigured: boolean;
    setIsConfigured: (val: boolean) => void;
    showConfigEngine: boolean;
    setShowConfigEngine: (val: boolean) => void;
    onStartEvaluation: () => void;
}

export const AIEvaluationSetupTab = () => {
    const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
    const navigate = useNavigate();
    const { 
        onStartEvaluation, 
        setIsConfigured 
    } = useOutletContext<AIEvaluationContext>();

    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'name' | 'score'>('latest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'review'>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

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

    const handleConfigure = () => {
        navigate(`/instructor/courses/${courseId}/manage/quizzes/${quizId}/ai-evaluation/configure`);
    };



    // Mock data for essay questions
    const mockEssayQuestions = [
        { 
            id: 'q1', 
            text: 'Explain the concept of memory management in C++, focusing on stack vs heap allocation.', 
            mark: 10,
            aiConfig: { modelAnswer: '', rubric: [] }
        },
        { 
            id: 'q2', 
            text: 'Discuss the advantages and disadvantages of using recursion in large-scale applications.', 
            mark: 15,
            aiConfig: { modelAnswer: '', rubric: [] }
        }
    ];

    const toggleSelectAll = () => {
        if (selectedSubmissions.length === filteredSubmissions.length) {
            setSelectedSubmissions([]);
        } else {
            setSelectedSubmissions(filteredSubmissions.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedSubmissions(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        Submissions & Setup
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Select student submissions to evaluate and configure the AI grading engine.
                    </p>
                </div>

                    <button 
                        disabled={selectedSubmissions.length === 0}
                        onClick={onStartEvaluation}
                        className={clsx(
                            "flex items-center gap-3 px-10 py-5 rounded-[2.5rem] font-black text-sm transition-all shadow-xl active:scale-95 group relative overflow-hidden",
                            selectedSubmissions.length > 0 
                                ? "bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Play className={clsx("w-5 h-5", selectedSubmissions.length > 0 ? "fill-current" : "")} />
                        Start AI Evaluation ({selectedSubmissions.length})
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
            </div>

            {/* Recommendation Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] opacity-10 group-hover:opacity-20 blur transition duration-1000" />
                <div className="relative bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-8 xl:gap-10 items-center overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex-1 space-y-6 relative z-10 text-center xl:text-left w-full">
                        <div className="flex flex-col xl:flex-row items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center xl:justify-start gap-2">
                                    ✨ Recommended Setup
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                                    Improve grading accuracy and consistency with custom configuration.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { icon: FileText, label: 'Instructor Model Answers', desc: 'Define target criteria' },
                                { icon: Target, label: 'Assessment Rubrics', desc: 'Precise scoring points' },
                                { icon: ListTodo, label: 'Evaluation Directives', desc: 'Custom grading logic' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <item.icon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="shrink-0 relative z-10 w-full xl:w-auto">
                        <button 
                            onClick={handleConfigure}
                            className="w-full xl:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-indigo-700 active:scale-95 group shadow-lg shadow-indigo-500/25"
                        >
                            <Settings2 className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
                            Configure AI Engine
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
            {/* Selection UI */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                        <div className="relative w-full sm:flex-1 lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search student name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-[13px] transition-all outline-none focus:ring-0"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={clsx(
                                        "flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[13px] font-black transition-all border",
                                        statusFilter !== 'all'
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                                    )}
                                >
                                    <Filter className={clsx("w-4 h-4", statusFilter !== 'all' ? "text-indigo-600" : "text-indigo-500")} />
                                    <span className="uppercase tracking-widest text-[11px]">
                                        {statusFilter === 'all' ? 'All Statuses' : statusFilter === 'approved' ? 'Auto Approved' : 'Needs Review'}
                                    </span>
                                    <ChevronDown className={clsx("w-4 h-4 opacity-50 transition-transform duration-300", isStatusOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {isStatusOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 overflow-hidden"
                                            >
                                                {[
                                                    { id: 'all', label: 'All Statuses', icon: Filter },
                                                    { id: 'approved', label: 'Auto Approved', icon: CheckCircle2 },
                                                    { id: 'review', label: 'Needs Review', icon: Clock }
                                                ].map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setStatusFilter(option.id as any);
                                                            setIsStatusOpen(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                                                            statusFilter === option.id 
                                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <option.icon className={clsx("w-4 h-4", statusFilter === option.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                            <span className="text-[13px] font-bold">{option.label}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] font-black text-slate-600 dark:text-slate-400 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 shadow-sm active:scale-95"
                                >
                                    {sortBy === 'latest' && <Clock className="w-4 h-4 text-indigo-500" />}
                                    {sortBy === 'name' && <SortAsc className="w-4 h-4 text-indigo-500" />}
                                    {sortBy === 'score' && <Target className="w-4 h-4 text-indigo-500" />}
                                    <span className="uppercase tracking-widest text-[11px]">
                                        {sortBy === 'latest' ? 'Latest First' : sortBy === 'name' ? 'Student Name' : 'Score Match'}
                                    </span>
                                    <ChevronDown className={clsx("w-4 h-4 opacity-50 transition-transform duration-300", isSortOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {isSortOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 overflow-hidden"
                                            >
                                                {[
                                                    { id: 'latest', label: 'Latest First', icon: Clock },
                                                    { id: 'name', label: 'Name (A-Z)', icon: SortAsc },
                                                    { id: 'score', label: 'Top Scores', icon: Target }
                                                ].map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setSortBy(option.id as any);
                                                            setIsSortOpen(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                                                            sortBy === option.id 
                                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <option.icon className={clsx("w-4 h-4", sortBy === option.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                            <span className="text-[13px] font-bold">{option.label}</span>
                                                        </div>
                                                        {sortBy === option.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-slate-50 dark:border-slate-800 pt-6 lg:pt-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected</span>
                            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black">
                                {selectedSubmissions.length}
                            </div>
                        </div>
                        <button 
                            onClick={toggleSelectAll}
                            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all"
                        >
                            {selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-4 sm:px-8 py-5 w-12">
                                    <Checkbox checked={selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0} onChange={toggleSelectAll} />
                                </th>
                                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Info</th>
                                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Score</th>
                                <th className="hidden sm:table-cell px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub) => (
                                    <tr 
                                        key={sub.id} 
                                        className={clsx(
                                            "group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer",
                                            selectedSubmissions.includes(sub.id) && "bg-indigo-50/30 dark:bg-indigo-500/5"
                                        )}
                                        onClick={() => toggleSelect(sub.id)}
                                    >
                                        <td className="px-4 sm:px-8 py-5">
                                            <Checkbox 
                                                checked={selectedSubmissions.includes(sub.id)} 
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(sub.id);
                                                }} 
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        {sub.studentName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{sub.studentName}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="hidden xs:inline">SUBMITTED</span> {new Date(sub.submissionDate).toLocaleDateString()}
                                                        </div>
                                                        <span className="hidden xs:inline text-slate-300 text-[10px]">•</span>
                                                        <p className="hidden md:inline text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {sub.id.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                                    {sub.finalScore !== undefined ? sub.finalScore : '—'}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">POINTS</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-5 text-center">
                                            <span className={clsx(
                                                "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap",
                                                sub.status === 'Auto Approved' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                            )}>
                                                {sub.status === 'Auto Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                {sub.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-bold">No students found matching "{searchQuery}"</p>
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="text-indigo-500 text-sm font-black uppercase tracking-widest hover:underline mt-2"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// UI Helper Components
const Checkbox = ({ checked, onChange }: { checked: boolean, onChange: (e: any) => void }) => (
    <button 
        onClick={onChange}
        className={clsx(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-white dark:bg-slate-900"
        )}
    >
        {checked && <Check className="w-3.5 h-3.5" />}
    </button>
);
