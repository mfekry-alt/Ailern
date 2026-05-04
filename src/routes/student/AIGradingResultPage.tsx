import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    Target, 
    Sparkles, 
    Percent, 
    MessageSquare,
    AlertCircle
} from 'lucide-react';

const MOCK_DATA = {
    totalScore: 8,
    maxScore: 10,
    percentage: 80,
    aiFeedback: "You demonstrated a strong understanding of core concepts. However, you should review the differences between abstract classes and interfaces, as this was your primary area of difficulty. Your explanations for the correct answers were clear and concise.",
    questions: [
        {
            id: '1',
            type: "mcq",
            question: "Which of the following is NOT a core concept of Object-Oriented Programming?",
            studentAnswer: "Compilation",
            correctAnswer: "Compilation",
            options: ["Encapsulation", "Inheritance", "Compilation", "Polymorphism"],
            isCorrect: true,
            explanation: "Correct. Compilation is a process that translates source code into machine code, whereas Encapsulation, Inheritance, and Polymorphism are fundamental pillars of OOP."
        },
        {
            id: '2',
            type: "true_false",
            question: "An interface in TypeScript can contain implementation details for its methods.",
            studentAnswer: "True",
            correctAnswer: "False",
            isCorrect: false,
            explanation: "Incorrect. Unlike some other languages (like Java with default methods), TypeScript interfaces are purely for compile-time type checking and cannot contain implementation details."
        },
        {
            id: '3',
            type: "written",
            question: "Explain what the 'readonly' modifier does in TypeScript.",
            studentAnswer: "It makes a property unchangeable after it has been initialized in the constructor.",
            correctAnswer: "It prevents a property from being reassigned after its initial assignment.",
            isCorrect: true,
            explanation: "Correct. The 'readonly' modifier ensures that properties can only be assigned during declaration or inside the class constructor."
        }
    ]
};

export const AIGradingResultPage = () => {
    const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Top Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    AI has successfully evaluated this attempt
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/quizzes/${id}/attempts`)}
                            className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">AI Grading Result</h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-violet-100 to-fuchsia-100 text-fuchsia-700 dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-500/30 shadow-sm">
                                    <Sparkles className="w-3 h-3" /> AI Evaluated
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold mt-2">
                                Attempt #{attemptId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/quizzes/${id}/attempts`)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        Back to Attempts
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-[#21A9FF]" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Score</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900 dark:text-white">{MOCK_DATA.totalScore}</span>
                            <span className="text-xl font-bold text-gray-400 dark:text-slate-500">/ {MOCK_DATA.maxScore}</span>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-fuchsia-500" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
                                <Percent className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Percentage</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900 dark:text-white">{MOCK_DATA.percentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-violet-500" />
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Overall AI Feedback</h3>
                            <p className="text-gray-800 dark:text-slate-200 font-medium leading-relaxed">
                                {MOCK_DATA.aiFeedback}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Questions Breakdown */}
                <div className="space-y-6 pt-4">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Question Breakdown</h2>
                    
                    {MOCK_DATA.questions.map((q, index) => (
                        <div 
                            key={q.id}
                            className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-6 shadow-sm overflow-hidden transition-all ${
                                q.isCorrect 
                                    ? 'border-emerald-200/60 dark:border-emerald-700/30' 
                                    : 'border-red-200/60 dark:border-red-700/30'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                                            Question {index + 1}
                                        </span>
                                        <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 uppercase tracking-wider">
                                            {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'true_false' ? 'True / False' : 'Written'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
                                        {q.question}
                                    </h3>
                                </div>
                                <div className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                                    q.isCorrect
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                }`}>
                                    {q.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {q.isCorrect ? 'Correct' : 'Incorrect'}
                                </div>
                            </div>

                            {/* Question Content based on type */}
                            {q.type === 'mcq' && q.options && (
                                <div className="space-y-3 mb-6">
                                    {q.options.map((opt: string, i: number) => {
                                        const isStudentAnswer = opt === q.studentAnswer;
                                        const isCorrectAnswer = opt === q.correctAnswer;
                                        
                                        let borderClass = "border-gray-100 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-300";
                                        let icon = null;

                                        if (isCorrectAnswer) {
                                            borderClass = "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm";
                                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
                                        } else if (isStudentAnswer && !q.isCorrect) {
                                            borderClass = "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 shadow-sm";
                                            icon = <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />;
                                        }

                                        return (
                                            <div key={i} className={`flex items-center justify-between p-4 rounded-[1.25rem] border ${borderClass} transition-colors`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-gray-400 dark:text-slate-500 shadow-sm border border-gray-100 dark:border-slate-700">
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                    <span className="font-semibold text-[15px]">{opt}</span>
                                                </div>
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'true_false' && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {['True', 'False'].map((opt) => {
                                        const isStudentAnswer = String(opt).toLowerCase() === String(q.studentAnswer).toLowerCase();
                                        const isCorrectAnswer = String(opt).toLowerCase() === String(q.correctAnswer).toLowerCase();
                                        
                                        let borderClass = "border-gray-100 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-300";
                                        let icon = null;

                                        if (isCorrectAnswer) {
                                            borderClass = "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm";
                                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
                                        } else if (isStudentAnswer && !q.isCorrect) {
                                            borderClass = "border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 shadow-sm";
                                            icon = <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />;
                                        }

                                        return (
                                            <div key={opt} className={`flex items-center justify-between p-4 rounded-[1.25rem] border ${borderClass} transition-colors`}>
                                                <span className="font-extrabold text-[15px]">{opt}</span>
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'written' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700/60 rounded-[1.5rem] p-5 shadow-inner">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Student Answer</p>
                                        <p className="text-[15px] text-gray-800 dark:text-slate-200 font-medium italic">
                                            "{q.studentAnswer}"
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-[1.5rem] p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2">Correct Answer</p>
                                        <p className="text-[15px] text-gray-800 dark:text-slate-200 font-medium">
                                            {q.correctAnswer}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/5 rounded-2xl p-5 border border-violet-100/50 dark:border-violet-500/20 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-violet-100 dark:border-violet-500/30">
                                    <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-1.5">AI Explanation</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-relaxed">
                                        {q.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
