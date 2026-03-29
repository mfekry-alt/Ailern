import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Trash2, Plus, Users, BookOpen, Clock, TrendingUp,
    AlertCircle, CheckSquare, Calendar, Loader2, ArrowRight, LayoutGrid, Bell, AlertTriangle
} from 'lucide-react';
import { useInstructorCourses } from '@/features/courses/api';
import { useAuthStore } from '@/features/auth/store';
import type { GetAllCoursesDto } from '@/types/api.types';

// --- Interfaces ---
interface Course {
    id: string;
    title: string;
    courseId: string;
    instructor: string;
    status: string;
    badgeBg: string;
    badgeText: string;
    primaryAction?: string;
    secondaryAction?: string;
    enrollmentCount: number;
}

const getStatusConfig = (apiStatus: string): Pick<Course, 'status' | 'badgeBg' | 'badgeText' | 'primaryAction' | 'secondaryAction'> => {
    const isPublished = apiStatus?.toLowerCase() === 'published' || true; // Defaulting to true for now

    if (isPublished) {
        return {
            status: 'Published',
            badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
            badgeText: 'text-emerald-700 dark:text-emerald-400',
            primaryAction: 'Manage',
            secondaryAction: 'Edit',
        };
    }

    return {
        status: apiStatus || 'Draft',
        badgeBg: 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
        badgeText: 'text-gray-700 dark:text-slate-300',
        primaryAction: 'Edit Content',
    };
};

const mapCourseToUI = (dto: GetAllCoursesDto): Course => {
    const statusConfig = getStatusConfig(dto.courseStatus);

    return {
        id: dto.id.toString(),
        title: dto.name,
        courseId: dto.code,
        instructor: `Instructor #${dto.instructorId}`,
        enrollmentCount: 0,
        ...statusConfig,
    };
};

export const InstructorDashboardPage = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const instructorId = useMemo(() => {
        if (typeof user?.id === 'number') return user.id;
        const parsedId = Number(user?.id);
        return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
    }, [user?.id]);

    const {
        data: coursesData,
        isLoading: isCoursesLoading,
        error: coursesError,
    } = useInstructorCourses(instructorId, { PageNumber: 1, PageSize: 4 });

    const courses = useMemo(() => {
        if (!coursesData?.items) return [];
        return coursesData.items.map(mapCourseToUI);
    }, [coursesData]);

    // Dashboard statistics
    const stats = [
        { label: 'Total Students', value: '128', icon: Users, color: 'blue' },
        { label: 'Active Courses', value: coursesData?.items?.length.toString() || '0', icon: BookOpen, color: 'emerald' },
        { label: 'Pending Grades', value: '12', icon: CheckSquare, color: 'amber' },
        { label: 'Avg. Rating', value: '4.8', icon: TrendingUp, color: 'purple' },
    ];

    // Mock Data for Widgets
    const notifications = [
        { id: 1, message: 'New student enrolled in "Data Structures".', time: '2 hours ago', type: 'info' },
        { id: 2, message: 'System maintenance scheduled for tonight.', time: '5 hours ago', type: 'warning' },
        { id: 3, message: 'Your course "React Basics" was approved!', time: '1 day ago', type: 'success' },
    ];

    const submissionsToGrade = [
        { id: 1, course: 'Machine Learning', assignment: 'Final Project Phase 1', submissions: 12, dueDate: '2024-03-10' },
        { id: 2, course: 'Data Structures', assignment: 'Binary Trees Quiz', submissions: 5, dueDate: '2024-03-08' },
    ];

    const upcomingDeadlines = [
        { id: 1, course: 'Machine Learning', item: 'Midterm Grading', dueDate: '2024-03-12', daysLeft: 2, priority: 'high' },
        { id: 2, course: 'Web Dev Bootcamp', item: 'Publish Week 4 Content', dueDate: '2024-03-15', daysLeft: 5, priority: 'medium' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Greeting Hero & Action */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Instructor!</span> 👋
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-2 text-lg">
                            Here's what's happening with your courses today.
                        </p>
                    </div>
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className={`absolute left-0 top-0 w-1.5 h-full bg-${stat.color}-500`}></div>
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

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: My Courses (Takes up 2 columns) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-blue-500" /> Recent Courses
                                </h2>
                                <Link to={ROUTES.INSTRUCTOR_COURSES}>
                                    <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group">
                                        View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>

                            <div className="grid gap-4">
                                {isCoursesLoading && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                                        <span className="text-sm font-medium">Loading your courses...</span>
                                    </div>
                                )}

                                {!isCoursesLoading && coursesError && (
                                    <div className="text-center py-10 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-dashed border-red-200 dark:border-red-500/30">
                                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Failed to load courses</p>
                                    </div>
                                )}

                                {!isCoursesLoading && !coursesError && courses.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                        <BookOpen className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                                        <p className="text-base font-bold text-gray-900 dark:text-white mb-1">No courses yet</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Create your first course to start teaching.</p>
                                    </div>
                                ) : courses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-slate-500 transition-all group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${course.badgeBg} ${course.badgeText}`}>
                                                    {course.status}
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 dark:text-slate-500">ID: {course.courseId}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                                <Users className="w-4 h-4" /> {course.enrollmentCount} Enrolled Students
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-200 dark:border-slate-700 pt-4 sm:pt-0">
                                            <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id)}>
                                                <button className="p-2 text-gray-500 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors border border-gray-200 dark:border-slate-600 shadow-sm" title="Edit Settings">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            {course.primaryAction && (
                                                <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT_CONTENT.replace(':id', course.id)}>
                                                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 active:scale-95 flex items-center gap-1">
                                                        {course.primaryAction}
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grading Tasks */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-emerald-500" /> Tasks to Grade
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {submissionsToGrade.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckSquare className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">All caught up! No submissions pending.</p>
                                    </div>
                                ) : submissionsToGrade.map((submission) => (
                                    <div key={submission.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">{submission.course}</p>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">{submission.assignment}</h4>
                                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Due: {new Date(submission.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{submission.submissions}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-1">Pending</p>
                                            </div>
                                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-emerald-500/25 active:scale-95">
                                                Grade Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Notifications & Deadlines (Takes up 1 column) */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Notifications Widget */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-purple-500" /> Notifications
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Bell className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 dark:text-slate-400">You're all caught up!</p>
                                    </div>
                                ) : notifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'info' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                notif.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                            }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-slate-200 leading-tight mb-1">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                                                {notif.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deadlines Widget */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-rose-500" /> Upcoming Deadlines
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {upcomingDeadlines.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Calendar className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 dark:text-slate-400">No upcoming deadlines</p>
                                    </div>
                                ) : upcomingDeadlines.map((deadline) => (
                                    <div key={deadline.id} className={`rounded-xl p-4 border ${deadline.priority === 'high'
                                            ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'
                                            : 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${deadline.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {deadline.course}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${deadline.priority === 'high'
                                                    ? 'bg-rose-200 text-rose-800 dark:bg-rose-500/30 dark:text-rose-300'
                                                    : 'bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300'
                                                }`}>
                                                {deadline.daysLeft} Days Left
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                            {deadline.item}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Due {new Date(deadline.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};