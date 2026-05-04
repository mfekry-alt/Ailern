import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

interface CourseProgressOverviewProps {
    hasCourses?: boolean;
}

const mockCourses = [
    {
        id: '1',
        title: 'Introduction to Programming',
        progress: 80,
        students: 120,
        quizzes: 3,
    },
    {
        id: '2',
        title: 'ASP.NET Fundamentals',
        progress: 55,
        students: 85,
        quizzes: 5,
    },
    {
        id: '3',
        title: 'Entity Framework Core',
        progress: 25,
        students: 42,
        quizzes: 2,
    }
];

export const CourseProgressOverview: React.FC<CourseProgressOverviewProps> = ({ hasCourses = true }) => {
    const [animatedProgress, setAnimatedProgress] = useState<number[]>(mockCourses.map(() => 0));

    useEffect(() => {
        if (hasCourses) {
            const timer = setTimeout(() => {
                setAnimatedProgress(mockCourses.map(c => c.progress));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [hasCourses]);

    const getProgressColor = (progress: number) => {
        if (progress >= 70) return 'bg-emerald-500 shadow-emerald-500/30';
        if (progress >= 40) return 'bg-amber-500 shadow-amber-500/30';
        return 'bg-rose-500 shadow-rose-500/30';
    };

    const getProgressBgColor = (progress: number) => {
        if (progress >= 70) return 'bg-emerald-50 dark:bg-emerald-500/10';
        if (progress >= 40) return 'bg-amber-50 dark:bg-amber-500/10';
        return 'bg-rose-50 dark:bg-rose-500/10';
    };

    const getProgressTextColor = (progress: number) => {
        if (progress >= 70) return 'text-emerald-700 dark:text-emerald-400';
        if (progress >= 40) return 'text-amber-700 dark:text-amber-400';
        return 'text-rose-700 dark:text-rose-400';
    };

    return (
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] shadow-sm flex flex-col h-full transition-all duration-300 relative overflow-hidden group/container">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#21A9FF]" /> Course Progress Overview
                </h2>
                {hasCourses && (
                    <Link to={ROUTES.INSTRUCTOR_COURSES}>
                        <button className="text-sm font-bold text-[#21A9FF] dark:text-[#21A9FF] hover:text-[#0094F2] dark:hover:text-[#0094F2] flex items-center gap-1 group transition-colors">
                            Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative flex flex-col">
                {hasCourses ? (
                    <div className="absolute inset-0 p-6 sm:px-8 flex flex-col gap-4 overflow-y-auto">
                        {mockCourses.map((course, idx) => (
                            <div 
                                key={course.id}
                                className="group relative bg-gray-50 dark:bg-slate-900/50 rounded-2xl py-4 px-4 pr-16 border border-gray-100 dark:border-slate-700/50 hover:shadow-md hover:border-[#21A9FF]/30 dark:hover:border-slate-500 transition-all duration-300 flex flex-col justify-center gap-2.5 overflow-hidden hover:-translate-y-0.5"
                            >
                                {/* Title - Shifted down slightly */}
                                <h3 className="mt-0.5 font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight group-hover:text-[#21A9FF] transition-colors">
                                    {course.title}
                                </h3>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700/70 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-[1500ms] ease-out shadow-sm ${getProgressColor(course.progress)}`}
                                        style={{ width: `${animatedProgress[idx]}%` }}
                                    />
                                </div>
                                
                                {/* Metadata */}
                                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        {course.students} Students
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                        {course.quizzes} Quizzes
                                    </div>
                                </div>

                                {/* Percentage Badge - Absolute positioned at right-center */}
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 shrink-0 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-sm border border-transparent group-hover:border-current transition-all ${getProgressBgColor(course.progress)} ${getProgressTextColor(course.progress)}`}>
                                    {animatedProgress[idx]}%
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-gray-50/50 dark:bg-slate-900/20">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-5 shadow-sm border border-gray-100 dark:border-slate-700">
                            <BarChart3 className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No course progress available yet
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-8 max-w-[300px]">
                            Progress will appear once courses and student activity are added
                        </p>
                        <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                            <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-[#21A9FF] dark:hover:border-[#21A9FF] hover:text-[#21A9FF] dark:hover:text-[#21A9FF] text-gray-700 dark:text-slate-300 font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 group">
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Create Course
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
