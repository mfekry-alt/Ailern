import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    BrainCircuit, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ChevronDown, 
    ChevronUp, 
    Save, 
    Play, 
    RotateCcw, 
    History, 
    UserCheck,
    MoreHorizontal,
    ExternalLink,
    Filter,
    Search,
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuiz } from '@/features/quizzes/api';

// --- Mock Data ---
const MOCK_QUIZ = {
    title: 'Advanced Software Engineering Quiz',
    questionsCount: 12,
    submissionsCount: 45,
    description: 'Final evaluation for the Software Architecture module.'
};

const MOCK_WRITTEN_QUESTIONS = [
    {
        id: 'q1',
        index: 3,
        text: 'Explain Dependency Injection and its benefits in large-scale applications.',
        rubricConfigured: true,
        modelAnswer: 'Dependency Injection (DI) is a design pattern where an object receives other objects that it depends on. Benefits include loose coupling, easier testing (mocking), and better code maintainability.',
        criteria: [
            { id: 'c1', label: 'Definition accuracy', weight: 30 },
            { id: 'c2', label: 'Benefits listed', weight: 40 },
            { id: 'c3', label: 'Real-world example', weight: 30 },
        ]
    },
    {
        id: 'q2',
        index: 7,
        text: 'Compare and contrast Microservices vs Monolithic architectures.',
        rubricConfigured: false,
        modelAnswer: '',
        criteria: []
    }
];

const MOCK_SUBMISSIONS = [
    { id: 's1', student: 'Ahmed Ali', time: '2024-05-10 10:30', status: 'AI Graded', score: 85, confidence: 92, needsReview: false },
    { id: 's2', student: 'Sara Hassan', time: '2024-05-10 10:45', status: 'Needs Manual Review', score: 72, confidence: 45, needsReview: true },
    { id: 's3', student: 'John Doe', time: '2024-05-10 11:00', status: 'Pending', score: null, confidence: null, needsReview: false },
    { id: 's4', student: 'Maria Garcia', time: '2024-05-10 11:15', status: 'Failed', score: null, confidence: null, needsReview: false },
    { id: 's5', student: 'Omar Khalid', time: '2024-05-10 11:30', status: 'Submitted', score: null, confidence: null, needsReview: false },
];

const MOCK_HISTORY = [
    { id: 'h1', date: '2024-05-10 12:00', triggeredBy: 'Instructor', count: 15, avgConfidence: 88, duration: '45s', status: 'Completed' },
    { id: 'h2', date: '2024-05-09 15:30', triggeredBy: 'Auto-Trigger', count: 10, avgConfidence: 91, duration: '32s', status: 'Completed' },
];

// --- Sub-components ---

const KpiCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
            <div className={clsx("p-2 rounded-xl", color)}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
);

const Badge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        'AI Graded': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
        'Needs Manual Review': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
        'Pending': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
        'Failed': 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20',
        'Submitted': 'bg-gray-50 text-gray-700 dark:bg-slate-700 dark:text-slate-300 border-gray-100 dark:border-slate-600',
        'Completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    };

    return (
        <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm", styles[status] || styles['Submitted'])}>
            {status}
        </span>
    );
};


export const InstructorQuizAiGraderPage = () => {
    const { quizId = '' } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { data: quiz, isLoading } = useQuiz(quizId);
    
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-slate-400 font-bold animate-pulse">Loading AI Grader...</p>
                </div>
            </div>
        );
    }

    const toggleQuestion = (id: string) => setExpandedQuestion(expandedQuestion === id ? null : id);

    const toggleSelectAll = () => {
        if (selectedSubmissions.length === MOCK_SUBMISSIONS.length) {
            setSelectedSubmissions([]);
        } else {
            setSelectedSubmissions(MOCK_SUBMISSIONS.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedSubmissions(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-24">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Header Section */}
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Grader</h1>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">{quiz?.title || MOCK_QUIZ.title}</p>
                    </div>
                </div>

                {/* 2. Context / KPI Overview */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <BrainCircuit className="w-64 h-64 rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Grading Settings
                                </span>
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                            <p className="text-indigo-100 max-w-xl text-sm font-medium leading-relaxed">
                                “Configure AI-powered grading settings and manage grading runs for this quiz.”
                            </p>
                            <div className="flex gap-6 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Questions</span>
                                    <span className="text-xl font-bold">{MOCK_QUIZ.questionsCount}</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Submissions</span>
                                    <span className="text-xl font-bold">{MOCK_QUIZ.submissionsCount}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="px-5 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 min-w-[140px]">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1">Graded</span>
                                <span className="text-2xl font-black">32 / 45</span>
                            </div>
                            <div className="px-5 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 min-w-[140px]">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-1">Confidence</span>
                                <span className="text-2xl font-black">89.4%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Detailed KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title="AI Graded Submissions" value="32 / 45" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <KpiCard title="Pending AI Review" value="8" icon={Clock} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
                <KpiCard title="Average Confidence" value="89.4%" icon={BrainCircuit} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" />
                <KpiCard title="Average Score" value="76.2 / 100" icon={UserCheck} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
            </div>

            {/* 3. Written Questions Rubric Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-indigo-500" />
                        Written Questions Rubric Configuration
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Only Essay Questions</p>
                </div>

                <div className="space-y-4">
                    {MOCK_WRITTEN_QUESTIONS.map((q) => (
                        <div key={q.id} className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <button 
                                onClick={() => toggleQuestion(q.id)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 font-black group-hover:text-indigo-500 transition-colors">
                                        {q.index}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{q.text}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {q.rubricConfigured ? (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> AI Rubric Configured
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Rubric Missing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedQuestion === q.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>

                            {expandedQuestion === q.id && (
                                <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-slate-700/50 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Model Answer</label>
                                        <textarea 
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                                            placeholder="Provide the ideal answer for AI comparison..."
                                            defaultValue={q.modelAnswer}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2 ml-1">
                                            <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Grading Criteria & Weights</label>
                                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">+ Add Criterion</button>
                                        </div>
                                        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700/50">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 dark:bg-slate-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3">Criterion</th>
                                                        <th className="px-4 py-3 w-32">Weight (%)</th>
                                                        <th className="px-4 py-3 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {q.criteria.length > 0 ? q.criteria.map((c) => (
                                                        <tr key={c.id}>
                                                            <td className="px-4 py-3 font-medium text-gray-700 dark:text-slate-300">{c.label}</td>
                                                            <td className="px-4 py-3">
                                                                <input type="number" defaultValue={c.weight} className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-indigo-500 outline-none py-1 font-bold text-gray-900 dark:text-white" />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <button className="text-gray-400 hover:text-red-500 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400 font-medium italic">No criteria defined. AI will use general reasoning.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs">
                                            <Save className="w-4 h-4" /> Save Rubric
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. AI Grading Actions */}
            <section className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Grading Actions</h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Trigger AI grading for selected or all submissions.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 transition-all">
                            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" defaultChecked />
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Skip already graded</span>
                        </label>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white font-bold rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-slate-600 active:scale-95 text-xs shadow-sm">
                            <RotateCcw className="w-4 h-4" /> Re-grade
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 text-xs shadow-sm">
                            <Play className="w-4 h-4" /> Grade Selected ({selectedSubmissions.length})
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 text-xs">
                            <Play className="w-4 h-4 fill-current" /> Grade All Submissions
                        </button>
                    </div>
                </div>
            </section>

            {/* 6. Submission Selection Table */}
            <section className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Submissions for AI Grading</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search student..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64" />
                        </div>
                        <button className="p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 hover:text-indigo-500 transition-colors"><Filter className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-50/50 dark:bg-slate-900/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
                                        checked={selectedSubmissions.length === MOCK_SUBMISSIONS.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Submission Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">AI Score</th>
                                <th className="px-6 py-4">Confidence</th>
                                <th className="px-6 py-4">Review</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {MOCK_SUBMISSIONS.map((s) => (
                                <tr key={s.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
                                            checked={selectedSubmissions.includes(s.id)}
                                            onChange={() => toggleSelect(s.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                                                {s.student.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">{s.student}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-slate-400">{s.time}</td>
                                    <td className="px-6 py-4"><Badge status={s.status} /></td>
                                    <td className="px-6 py-4">
                                        {s.score !== null ? (
                                            <span className="font-black text-indigo-600 dark:text-indigo-400">{s.score}/100</span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.confidence !== null ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={clsx("h-full rounded-full transition-all", s.confidence < 60 ? 'bg-amber-500' : 'bg-emerald-500')} 
                                                        style={{ width: `${s.confidence}%` }} 
                                                    />
                                                </div>
                                                <span className={clsx("text-[10px] font-black", s.confidence < 60 ? 'text-amber-500' : 'text-emerald-500')}>{s.confidence}%</span>
                                            </div>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.needsReview && (
                                            <button 
                                                onClick={() => navigate(`/instructor/quizzes/${quizId}/submissions/${s.id}`)}
                                                className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline"
                                            >
                                                <AlertCircle className="w-3 h-3" /> Review
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 7. AI Grading History */}
                <section className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" />
                            Grading History
                        </h3>
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">Clear All</button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {MOCK_HISTORY.map((h) => (
                            <div key={h.id} className="p-4 bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 text-indigo-500">
                                        <Play className="w-4 h-4 fill-current" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{h.date}</span>
                                            <Badge status={h.status} />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
                                            {h.count} Subs • {h.duration} • Triggered by {h.triggeredBy}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="View Details">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 8. Low Confidence / Review Queue */}
                <section className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-amber-500" />
                            Review Queue
                        </h3>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Low Confidence: 2
                        </span>
                    </div>
                    <div className="space-y-4">
                        {MOCK_SUBMISSIONS.filter(s => s.needsReview).map((s) => (
                            <div key={s.id} className="p-4 bg-amber-50/20 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                                        {s.student.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{s.student}</h4>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Confidence: {s.confidence}%</span>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Score: {s.score}/100</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/instructor/quizzes/${quizId}/submissions/${s.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Manual Review
                                </button>
                            </div>
                        ))}
                        <button className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-slate-700/50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:border-indigo-500/30 hover:text-indigo-500 transition-all mt-2">
                            View All Queue
                        </button>
                    </div>
                </section>
            </div>
            </div>
        </div>
    );
};
