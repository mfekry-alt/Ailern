import { useMemo } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useCourseQuizzes, useCourseSections } from '../api';
import { SectionCard } from '../components/SectionCard';
import { EmptyState } from '../components/EmptyState';
import { TabLoadingState } from '../components/TabLoadingState';
import { CourseSectionsAccessBlockedPanel } from '../components/CourseSectionsAccessBlockedPanel';
import { ROUTES } from '@/lib/constants';
import {
    getFirstQuizWithActiveAttempt,
    getHttpErrorMessage,
    hasActiveInProgressAttemptInCourse,
} from '../utils/courseContentAccess';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export const SectionsTab = () => {
    const { courseId, numericCourseId } = useOutletContext<CourseContext>();
    const courseKey = numericCourseId ?? 0;
    const quizzesQuery = useCourseQuizzes(courseKey);

    const blockByInProgressAttempt = useMemo(
        () => (quizzesQuery.isSuccess ? hasActiveInProgressAttemptInCourse(quizzesQuery.data) : false),
        [quizzesQuery.isSuccess, quizzesQuery.data]
    );

    const activeQuiz = useMemo(
        () => (quizzesQuery.isSuccess ? getFirstQuizWithActiveAttempt(quizzesQuery.data) : undefined),
        [quizzesQuery.isSuccess, quizzesQuery.data]
    );

    const sectionsEnabled =
        courseKey > 0 &&
        (quizzesQuery.isError || quizzesQuery.isSuccess) &&
        !blockByInProgressAttempt;

    const { data: sections, isLoading, error, refetch, isFetching } = useCourseSections(courseKey, {
        enabled: sectionsEnabled,
    });

    if (quizzesQuery.isLoading) return <TabLoadingState />;

    if (blockByInProgressAttempt) {
        const quizListPath = `/courses/${courseId}/quizzes`;
        return (
            <CourseSectionsAccessBlockedPanel
                courseId={courseId}
                activeQuizId={activeQuiz?.id}
                quizListPath={quizListPath}
            />
        );
    }

    if (isAxiosError(error) && error.response?.status === 403) {
        return (
            <Navigate
                to={ROUTES.FORBIDDEN}
                replace
                state={{
                    title: 'Access denied',
                    message: getHttpErrorMessage(
                        error,
                        'Course content is not available right now. If you have a quiz in progress, complete it first.'
                    ),
                    backTo: `/courses/${courseId}/quizzes`,
                }}
            />
        );
    }

    const showSectionsLoading = isLoading || (sectionsEnabled && isFetching && !sections);

    if (showSectionsLoading) return <TabLoadingState />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Failed to load sections
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                    Could not fetch course sections. Please try again.
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

    if (!sections || sections.length === 0) {
        return (
            <EmptyState
                icon={Layers}
                title="No sections yet"
                description="This course doesn't have any sections or materials yet. Check back later."
            />
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                    <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Course Sections
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                        {sections.length} {sections.length === 1 ? 'section' : 'sections'} available
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {sections.map((section) => (
                    <SectionCard key={section.id} section={section} />
                ))}
            </div>
        </div>
    );
};
