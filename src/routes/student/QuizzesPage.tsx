import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getMyStudentQuizzes } from '@/api/services/student.service';
import { getQuizAttempts, type StartAttemptResponse } from '@/api/services/attempts.service';
import { QuizCard } from '@/components/QuizCard';
import type { GetQuizDto } from '@/types/api.types';

// Parse server dates correctly by treating them as UTC if they don't have timezone info
const parseServerDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    // Add 'Z' suffix if not present to ensure the browser interprets it as UTC
    const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(normalizedDate);
};

export const QuizzesPage = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCourse, setFilterCourse] = useState('all');
    const [showStats, setShowStats] = useState(false);
    const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

    const { data: quizzesData = [], isLoading, error } = useQuery({
        queryKey: ['student-quizzes'],
        queryFn: async () => {
            const data = await getMyStudentQuizzes();
            return Array.isArray(data) ? data : [];
        },
    });

    // Fetch attempts for all quizzes in parallel
    const attemptsQueries = useQueries({
        queries: quizzesData.map((quiz) => ({
            queryKey: ['quiz-attempts', quiz.id],
            queryFn: () => getQuizAttempts(quiz.id),
            enabled: !!quiz.id && !isLoading,
        })),
    });

    // Map attempts by quiz ID for easy lookup
    const attemptsByQuizId = new Map<string, StartAttemptResponse[]>();
    quizzesData.forEach((quiz, index) => {
        const attemptsData = attemptsQueries[index]?.data ?? [];
        attemptsByQuizId.set(quiz.id, Array.isArray(attemptsData) ? attemptsData : []);
    });

    // Determine quiz computed status with proper timezone handling
    const getQuizComputedStatus = (quiz: GetQuizDto) => {
        const now = new Date();
        const from = parseServerDate(quiz.availableFrom);
        const until = parseServerDate(quiz.availableUntil);

        if (quiz.status !== 'Published') return 'draft';
        if (now < from) return 'upcoming';
        if (now > until) return 'expired';
        return 'available';
    };

    // Get time status string with proper timezone handling
    const getTimeStatus = (availableFrom: string, availableUntil: string): string => {
        const now = new Date();
        const from = parseServerDate(availableFrom);
        const until = parseServerDate(availableUntil);

        if (now < from) {
            const daysUntil = Math.ceil((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `Available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        }
        if (now > until) {
            const daysSince = Math.ceil((now.getTime() - until.getTime()) / (1000 * 60 * 60 * 24));
            return `Expired ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;
        }
        const daysLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
    };

    const filteredQuizzes = useMemo(() => {
        return quizzesData.filter((quiz) => {
            if (filterStatus !== 'all' && getQuizComputedStatus(quiz) !== filterStatus) {
                return false;
            }
            // Course filtering removed - courseName not available in GetQuizDto
            return true;
        });
    }, [quizzesData, filterStatus]);

    // Get unique course names
    const uniqueCourses = useMemo(() => {
        // TODO: Implement course name filtering when course data is available
        return [];
    }, []);

    // Calculate stats
    const stats = {
        total: quizzesData.length,
        completed: quizzesData.filter((q) => (q.submissionsCount || 0) > 0).length,
        pending: quizzesData.filter(
            (q) =>
                (q.submissionsCount || 0) === 0 &&
                getQuizComputedStatus(q) === 'available'
        ).length,
        available: quizzesData.filter((q) => getQuizComputedStatus(q) === 'available').length,
    };

    // Handle start/resume quiz
    const handleStartQuiz = async (quizId: string) => {
        setStartingQuizId(quizId);
        try {
            // Navigate to quiz attempt page
            navigate(`/quizzes/${quizId}/attempt`);
        } catch (error) {
            console.error('Failed to start quiz:', error);
            alert('Failed to start quiz. Please try again.');
        } finally {
            setStartingQuizId(null);
        }
    };

    // Handle view attempts
    const handleViewAttempts = (quizId: string) => {
        navigate(`/quizzes/${quizId}/attempts`);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 text-red-400 rounded-lg mx-auto max-w-2xl mt-8 border border-red-500/20">
                <p>Failed to load quizzes. Please try refreshing.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 p-8 bg-slate-950">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span>Dashboard</span>
                            <span className="text-slate-600">›</span>
                            <span className="text-indigo-400">Quizzes</span>
                        </nav>
                        <h1 className="text-4xl font-extrabold text-white mb-2">
                            Quizzes
                        </h1>
                        <p className="text-slate-400 max-w-lg">
                            Track your upcoming assessments, test your knowledge, and review your performance across all enrolled courses.
                        </p>
                    </div>

                    {/* Filter and Stats */}
                    <div className="flex flex-col gap-3">
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
                            {['all', 'available', 'upcoming', 'expired'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filterStatus === status
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {status === 'all' ? 'All' : status}
                                </button>
                            ))}
                        </div>

                        {/* Course Filter */}
                        {uniqueCourses.length > 0 && (
                            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 flex-wrap">
                                <button
                                    onClick={() => setFilterCourse('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filterCourse === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    All Courses
                                </button>
                                {uniqueCourses.map((course) => (
                                    <button
                                        key={course}
                                        onClick={() => setFilterCourse(course)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterCourse === course
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {course}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center justify-end gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                            {showStats ? 'Hide' : 'Show'} Stats
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {showStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            {
                                label: 'Total Quizzes',
                                value: stats.total,
                                color: 'from-blue-600/20 to-blue-600/10',
                                textColor: 'text-blue-400',
                            },
                            {
                                label: 'Available',
                                value: stats.available,
                                color: 'from-emerald-600/20 to-emerald-600/10',
                                textColor: 'text-emerald-400',
                            },
                            {
                                label: 'Pending',
                                value: stats.pending,
                                color: 'from-yellow-600/20 to-yellow-600/10',
                                textColor: 'text-yellow-400',
                            },
                            {
                                label: 'Completed',
                                value: stats.completed,
                                color: 'from-purple-600/20 to-purple-600/10',
                                textColor: 'text-purple-400',
                            },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className={`bg-gradient-to-br ${stat.color} border border-slate-700 rounded-xl p-4`}
                            >
                                <p className="text-xs uppercase text-slate-400 font-bold mb-2">
                                    {stat.label}
                                </p>
                                <p className={`text-3xl font-black ${stat.textColor}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quiz Grid */}
                {filteredQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz) => (
                            <QuizCard
                                key={quiz.id}
                                quiz={quiz}
                                onStartQuiz={handleStartQuiz}
                                onViewAttempts={handleViewAttempts}
                                isLoading={startingQuizId === quiz.id}
                                attempts={attemptsByQuizId.get(quiz.id) ?? []}
                                parseServerDate={parseServerDate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-400 text-lg mb-4">
                            No quizzes found in this category
                        </p>
                        <button
                            onClick={() => setFilterStatus('all')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                        >
                            View All Quizzes
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};
