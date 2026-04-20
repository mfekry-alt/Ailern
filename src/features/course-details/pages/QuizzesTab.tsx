import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCourseQuizzes } from '../api';
import { EmptyState } from '../components/EmptyState';
import { TabLoadingState } from '../components/TabLoadingState';
import { QuizCard } from '@/components/QuizCard';
import { HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { GetQuizDto } from '../types';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

const parseServerDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    const normalizedDate = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(normalizedDate);
};

export const QuizzesTab = () => {
    const { numericCourseId } = useOutletContext<CourseContext>();
    const navigate = useNavigate();

    const { data: quizzes, isLoading, error, refetch } = useCourseQuizzes(numericCourseId ?? 0);
    const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

    const publishedQuizzes = useMemo(
        () => (quizzes ?? []).filter((q: GetQuizDto) => q.status === 'Published'),
        [quizzes]
    );

    const handleStartQuiz = (quizId: string) => {
        setStartingQuizId(quizId);
        navigate(`/quizzes/${quizId}/attempt`);
        setStartingQuizId(null);
    };

    const handleViewAttempts = (quizId: string) => {
        navigate(`/quizzes/${quizId}/attempts`);
    };

    if (isLoading) return <TabLoadingState />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Failed to load quizzes
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                    Could not fetch course quizzes. Please try again.
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    if (publishedQuizzes.length === 0) {
        return (
            <EmptyState
                icon={HelpCircle}
                title="No quizzes yet"
                description="This course doesn't have any published quizzes yet. Check back later."
            />
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center border border-purple-200/50 dark:border-purple-800/50">
                    <HelpCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Quizzes
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                        {publishedQuizzes.length}{' '}
                        {publishedQuizzes.length === 1 ? 'quiz' : 'quizzes'} available
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publishedQuizzes.map((quiz: GetQuizDto) => (
                    <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onStartQuiz={handleStartQuiz}
                        onViewAttempts={handleViewAttempts}
                        isLoading={startingQuizId === quiz.id}
                        parseServerDate={parseServerDate}
                    />
                ))}
            </div>
        </div>
    );
};
