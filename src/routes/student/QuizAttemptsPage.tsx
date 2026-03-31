import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Award, ChevronRight, AlertCircle, Loader2, CheckCircle2, History, LayoutGrid } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { getQuizAttempts, type StartAttemptResponse } from '@/api/services/attempts.service';

export const QuizAttemptsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // 1. جلب تفاصيل الكويز
    const { data: quiz, isLoading: quizLoading } = useQuery({
        queryKey: ['quiz', id],
        queryFn: async () => {
            const res = await api.get(`/Quizzes/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
    });

    // 2. جلب المحاولات
    const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
        queryKey: ['quiz-attempts', id],
        queryFn: () => getQuizAttempts(id!),
        enabled: !!id,
    });

    const isLoading = quizLoading || attemptsLoading;

    // --- Helpers ---
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const safeDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(safeDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const getScorePercentage = (attempt: StartAttemptResponse): number => {
        if (!attempt.totalMarks || attempt.totalMarks === 0) return attempt.score || 0;
        return Math.round(((attempt.score ?? 0) / attempt.totalMarks) * 100);
    };

    const getStatusStyle = (status?: string) => {
        const s = String(status || '').toLowerCase().replace('-', '');
        if (s === 'submitted' || s === 'graded') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s === 'inprogress') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-indigo-300 font-bold uppercase tracking-widest animate-pulse">Loading History...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-200 font-sans pb-20">
            <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white">{quiz?.title || 'Quiz History'}</h1>
                            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                <History className="w-4 h-4 text-indigo-500" /> Track your performance
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {attempts.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#151a2d] border border-slate-800 p-5 rounded-[1.5rem] shadow-xl text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Attempts</p>
                            <p className="text-2xl font-black text-white">{attempts.length}</p>
                        </div>
                        <div className="bg-[#151a2d] border border-slate-800 p-5 rounded-[1.5rem] shadow-xl text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Highest Score</p>
                            <p className="text-2xl font-black text-emerald-400">
                                {Math.max(0, ...attempts.map(a => getScorePercentage(a)))}%
                            </p>
                        </div>
                        <div className="bg-[#151a2d] border border-slate-800 p-5 rounded-[1.5rem] shadow-xl text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Avg Score</p>
                            <p className="text-2xl font-black text-blue-400">
                                {attempts.length > 0 ? Math.round(attempts.reduce((sum: number, a: StartAttemptResponse) => sum + getScorePercentage(a), 0) / attempts.length) : 0}%
                            </p>
                        </div>
                        <div className="bg-[#151a2d] border border-slate-800 p-5 rounded-[1.5rem] shadow-xl text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Status</p>
                            <p className="text-2xl font-black text-purple-400">{attempts.some(a => String(a.status).toLowerCase().includes('progress')) ? 'Active' : 'Done'}</p>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    {attempts.length === 0 ? (
                        <div className="text-center py-20 bg-[#151a2d] border border-slate-800 border-dashed rounded-[2.5rem] text-slate-500 font-bold">
                            No logs found for this quiz.
                        </div>
                    ) : (
                        attempts.map((attempt, idx) => {
                            const score = getScorePercentage(attempt);
                            const status = String(attempt.status);
                            const isFinished = status.toLowerCase() === 'submitted' || status.toLowerCase() === 'graded';

                            return (
                                <div
                                    key={attempt.id}
                                    onClick={() => navigate(isFinished ? `/quizzes/${id}/attempt/${attempt.id}` : `/quizzes/${id}/attempt`)}
                                    className="group bg-[#151a2d] border border-slate-800 rounded-[2rem] p-6 hover:border-indigo-500/50 transition-all cursor-pointer shadow-lg"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        <div className="flex items-center gap-4 lg:border-r lg:border-slate-800 lg:pr-8">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-indigo-400">
                                                #{attempts.length - idx}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(status)}`}>
                                                {status}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score</p>
                                                <p className="text-2xl font-black text-white">{isFinished ? `${score}%` : '---'}</p>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full ${score >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: isFinished ? `${score}%` : '0%' }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 lg:pl-8">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Started</p>
                                                <p className="text-sm font-bold text-slate-300">{formatDate(attempt.startAt)}</p>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-indigo-500 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};