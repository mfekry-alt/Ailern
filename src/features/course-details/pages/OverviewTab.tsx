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
                label: 'Course Sections',
                value: sections?.length ?? 0,
                icon: Layers,
                colorClasses: {
                    bg: 'bg-purple-50 dark:bg-purple-500/10',
                    text: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-100 dark:border-purple-500/20'
                }
            },
            {
                label: 'Assignments',
                value: assignments?.length ?? 0,
                icon: ListChecks,
                colorClasses: {
                    bg: 'bg-blue-50 dark:bg-blue-500/10',
                    text: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-100 dark:border-blue-500/20'
                }
            },
            {
                label: 'Course Status',
                value: courseData?.courseStatus || 'Active',
                icon: CheckCircle2,
                isText: true,
                colorClasses: {
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    border: 'border-emerald-100 dark:border-emerald-500/20'
                }
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
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Hero Banner */}
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xl border border-gray-800/50">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
                
                {/* Colorful Glow Effects */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 p-8 sm:p-12 lg:p-14 flex flex-col justify-end min-h-[280px]">
                    <div className="max-w-3xl">
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl mb-6 shadow-sm backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {courseData?.courseStatus || 'Active'}
                        </div>
                        
                        {/* Course Title */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-5 leading-[1.15] tracking-tight">
                            {courseData?.name || 'Course Overview'}
                        </h1>
                        
                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-300 font-semibold">
                            <span className="bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/50 shadow-sm uppercase tracking-wider text-sm text-slate-200">
                                {courseData?.code || 'NO-CODE'}
                            </span>
                            <div className="flex items-center gap-2.5 bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/50 shadow-sm">
                                <User className="w-4 h-4 text-blue-400" />
                                <span className="text-sm tracking-wide text-slate-200 font-bold">{courseData?.instructorName || 'Instructor'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-2xl p-5 flex items-center gap-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${stat.colorClasses.bg} ${stat.colorClasses.text} ${stat.colorClasses.border} group-hover:scale-105 transition-transform duration-300`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1 truncate">
                                    {stat.label}
                                </p>
                                <h3 className={`font-black text-slate-800 dark:text-white truncate ${stat.isText ? 'text-lg' : 'text-2xl'}`}>
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-slate-700/50">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">
                                About This Course
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Description & Details</p>
                        </div>
                    </div>
                    
                    <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {courseData?.description || 'No description available for this course. Your instructor has not provided additional details yet.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
