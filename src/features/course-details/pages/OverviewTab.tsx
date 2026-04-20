import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCourseOverview, useCourseSections, useCourseAssignments } from '../api';
import {
    User,
    Layers,
    ListChecks,
    CheckCircle2,
    FileText,
    AlertCircle,
    RefreshCw,
    ArrowRight,
} from 'lucide-react';

interface CourseContext {
    courseId: string;
    numericCourseId: number | null;
}

export const OverviewTab = () => {
    const { numericCourseId } = useOutletContext<CourseContext>();
    const cId = numericCourseId ?? 0;

    const { data: course, isLoading, error, refetch } = useCourseOverview(cId);
    const { data: sections } = useCourseSections(cId);
    const { data: assignments } = useCourseAssignments(cId);

    const courseData = course as any;

    const stats = useMemo(
        () => [
            {
                label: 'Sections',
                value: sections?.length ?? 0,
                icon: Layers,
                color: 'purple',
            },
            {
                label: 'Assignments',
                value: assignments?.length ?? 0,
                icon: ListChecks,
                color: 'blue',
            },
            {
                label: 'Status',
                value: courseData?.courseStatus || 'Active',
                icon: CheckCircle2,
                color: 'emerald',
                isText: true,
            },
        ],
        [sections, assignments, courseData]
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Failed to load course
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                    Something went wrong. Please try again.
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

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-slate-800 rounded-[2rem]" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />

                <div className="relative z-10 p-8 sm:p-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white mb-6 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            {courseData?.courseStatus || 'Active'}
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
                            {courseData?.name || 'Course'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm sm:text-base font-medium">
                            <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                                {courseData?.code || 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <span>{courseData?.instructorName || 'Instructor'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group"
                        >
                            <div className={`absolute left-0 top-0 w-1 h-full bg-${stat.color}-500`} />
                            <div>
                                <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    {stat.label}
                                </p>
                                <h3
                                    className={`font-black text-gray-900 dark:text-white ${
                                        stat.isText ? 'text-xl mt-1' : 'text-3xl'
                                    }`}
                                >
                                    {stat.value}
                                </h3>
                            </div>
                            <div
                                className={`w-14 h-14 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}
                            >
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        About This Course
                    </h2>
                </div>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-sm">
                    {courseData?.description || 'No description available for this course.'}
                </p>
            </div>
        </div>
    );
};
