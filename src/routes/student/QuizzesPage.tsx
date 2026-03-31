import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BrainCircuit, CheckCircle, Clock, AlertCircle, HelpCircle, LayoutGrid } from 'lucide-react';
import { getMyStudentQuizzes } from '@/api/services/student.service';
import { QuizCard } from '@/components/QuizCard';
import type { GetQuizDto } from '@/types/api.types';

// Parse server dates correctly
const parseServerDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(normalizedDate);
};

export const QuizzesPage = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCourse, setFilterCourse] = useState('all');
    const [showStats, setShowStats] = useState(true);
    const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

    const { data: quizzesData = [], isLoading, error } = useQuery({
        queryKey: ['student-quizzes'],
        queryFn: async () => {
            const data = await getMyStudentQuizzes();
            return Array.isArray(data) ? data : [];
        },
    });

    const getQuizComputedStatus = (quiz: GetQuizDto) => {
        const now = new Date();
        const from = parseServerDate(quiz.availableFrom);
        const until = parseServerDate(quiz.availableUntil);

        if (quiz.status !== 'Published') return 'draft';
        if (now < from) return 'upcoming';
        if (now > until) return 'expired';
        return 'available';
    };

    // Logic الفلترة - اتأكد إنه بيقرأ الحالتين مع بعض
    const filteredQuizzes = useMemo(() => {
        return quizzesData.filter((quiz: any) => {
            const statusMatch = filterStatus === 'all' || getQuizComputedStatus(quiz) === filterStatus;
            const courseMatch = filterCourse === 'all' || quiz.courseName === filterCourse;
            return statusMatch && courseMatch;
        });
    }, [quizzesData, filterStatus, filterCourse]);

    const rawStats = {
        total: quizzesData.length,
        completed: quizzesData.filter((q) => (q.studentAttemptCount || 0) > 0).length,
        pending: quizzesData.filter(
            (q) => (q.studentAttemptCount || 0) === 0 && getQuizComputedStatus(q) === 'available'
        ).length,
        available: quizzesData.filter((q) => getQuizComputedStatus(q) === 'available').length,
    };

    const stats = [
        { id: 'stat-total', label: 'Total Quizzes', value: rawStats.total, icon: LayoutGrid, color: 'blue' },
        { id: 'stat-available', label: 'Available Now', value: rawStats.available, icon: Clock, color: 'emerald' },
        { id: 'stat-pending', label: 'Pending Action', value: rawStats.pending, icon: AlertCircle, color: 'amber' },
        { id: 'stat-completed', label: 'Completed', value: rawStats.completed, icon: CheckCircle, color: 'purple' },
    ];

    const courseNames = useMemo(() => {
        const uniqueCourses = new Set<string>();
        quizzesData.forEach((quiz: any) => {
            if (quiz.courseName) uniqueCourses.add(quiz.courseName);
        });
        return Array.from(uniqueCourses).sort();
    }, [quizzesData]);

    const handleStartQuiz = async (quizId: string) => {
        setStartingQuizId(quizId);
        try {
            navigate(`/quizzes/${quizId}/attempt`);
        } catch (error) {
            console.error('Failed to start quiz:', error);
            alert('Failed to start quiz. Please try again.');
        } finally {
            setStartingQuizId(null);
        }
    };

    const handleViewAttempts = (quizId: string) => {
        navigate(`/quizzes/${quizId}/attempts`);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading your quizzes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">We couldn't fetch your quizzes. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-purple-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center border border-purple-200/50 dark:border-purple-800/50 shadow-sm shrink-0">
                            <BrainCircuit className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Quizzes</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Test your knowledge and track your assessments.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm text-sm"
                    >
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </button>
                </div>

                {/* Stats Cards */}
                {showStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-4">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 w-1 h-full bg-${stat.color}-500`}></div>
                                    <div>
                                        <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                                    </div>
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shrink-0`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">

                    {/* 1. Status Filters (على الشمال) */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-2 flex flex-wrap gap-2 shadow-sm relative z-10">
                        {['all', 'available', 'upcoming', 'expired'].map((status) => (
                            <button
                                key={`filter-status-${status}`}
                                onClick={() => setFilterStatus(status)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${filterStatus === status
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {status === 'all' ? 'All Quizzes' : status}
                            </button>
                        ))}
                    </div>

                    {/* 2. Course Filters (على اليمين) */}
                    {courseNames.length > 0 && (
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-2 flex flex-wrap gap-2 shadow-sm relative z-10">
                            {/* أسماء الكورسات تظهر الأول */}
                            {courseNames.map((course) => (
                                <button
                                    key={`filter-course-${course}`}
                                    onClick={() => setFilterCourse(course)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all truncate max-w-[150px] ${filterCourse === course
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                        }`}
                                    title={course}
                                >
                                    {course}
                                </button>
                            ))}
                            {/* زرار All Courses يظهر في الآخر (أقصى اليمين) */}
                            <button
                                onClick={() => setFilterCourse('all')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${filterCourse === 'all'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                All Courses
                            </button>
                        </div>
                    )}
                </div>

                {/* Quiz Grid */}
                {filteredQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz: any) => (
                            <div key={`quiz-container-${quiz.id}`}>
                                {/* تم حذف الـ span الخاص بـ courseName من هنا */}
                                <QuizCard
                                    quiz={quiz}
                                    onStartQuiz={handleStartQuiz}
                                    onViewAttempts={handleViewAttempts}
                                    isLoading={startingQuizId === quiz.id}
                                    parseServerDate={parseServerDate}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <HelpCircle className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No quizzes found</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mb-6">
                            You don't have any quizzes matching these filters.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
};