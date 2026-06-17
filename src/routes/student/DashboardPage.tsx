import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getStudentDashboardData } from '@/api/services/student.service';
import { getUpcomingEvents } from '@/api/services/instructor.service';
import { StudentCourseCard } from '@/components/StudentCourseCard';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpcomingEventDto } from '@/types/api.types';

// Material Symbol Icon Component
const MaterialIcon = ({ name, className = '' }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

const formatDateForDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return {
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: date.getDate()
    };
};

// Course image URLs for variety
const COURSE_IMAGES = [
    'https://images.unsplash.com/photo-1516534775068-bb57e39c1a92?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
];

const getRandomCourseImage = () => {
    return COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)];
};

export const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.STUDENT_DASHBOARD,
        queryFn: getStudentDashboardData,
        staleTime: 5 * 60 * 1000
    });

    const { data: upcomingEvents, isLoading: eventsLoading, error: eventsError } = useQuery({
        queryKey: QUERY_KEYS.UPCOMING_EVENTS,
        queryFn: getUpcomingEvents,
        staleTime: 5 * 60 * 1000
    });

    if (isLoading || eventsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">Loading your learning space...</p>
                </div>
            </div>
        );
    }

    if (error || eventsError) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
                <div className="p-8 text-center bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl max-w-md backdrop-blur-sm">
                    <MaterialIcon name="error" className="text-5xl mb-4 text-red-500 dark:text-red-400" />
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Oops! Something went wrong.</h3>
                    <p className="text-sm opacity-80">Failed to load dashboard data. Please try refreshing the page.</p>
                </div>
            </div>
        );
    }

    const upcomingDeadlines = upcomingEvents?.slice(0, 3).map((event) => ({
        id: event.id || event.title,
        courseId: event.courseId,
        title: event.title,
        eventType: event.eventType,
        courseName: event.courseName,
        dueDate: formatDateForDeadline(event.availableUntil),
        fullDate: formatDate(event.availableUntil),
        daysLeft: Math.ceil((new Date(event.availableUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    })) || [];

    const continueLearningRows = Array.isArray(data?.continueLearning) ? data!.continueLearning : [];

    const courses = continueLearningRows.map((c) => ({
        id: c.courseId,
        title: c.name,
        instructor: c.instructorName || 'Course',
        progress: typeof c.progress === 'number' ? Math.min(100, Math.max(0, c.progress)) : 0,
        image: getRandomCourseImage(),
        imageUrl: c.imageUrl,
        description: c.subtitle,
        courseCode: c.code || '',
    }));

    const totalCourses = data?.stats?.totalCourses || 0;
    const pendingTasks = upcomingEvents?.filter((e) => e.eventType === 'Assignment').length || 0;
    const completedQuizzes = upcomingEvents?.filter((e) => e.eventType === 'Quiz').length || 0;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 font-sans selection:bg-blue-500/30">
            <main className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-8 lg:px-12 py-8 space-y-10 max-w-7xl mx-auto">

                    {/* Hero Banner Redesigned */}
                    <section className="relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between min-h-[300px] sm:min-h-[350px] border border-gray-200 dark:border-white/5 bg-gradient-to-br from-blue-100/80 via-white to-purple-100/80 dark:from-blue-900/40 dark:via-slate-800/80 dark:to-purple-900/20 backdrop-blur-xl shadow-2xl">
                        {/* Decorative background blurs */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="max-w-xl space-y-6 z-10 flex-1 w-full relative text-center md:text-left flex flex-col items-center md:items-start">
                            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight text-gray-900 dark:text-white tracking-tight">
                                Welcome back,<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                    {user?.firstName || 'Learner'}!
                                </span>
                            </h2>
                            <p className="text-sm sm:text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-md font-medium">
                                You have <strong className="text-gray-900 dark:text-white">{pendingTasks} tasks</strong> to catch up on. Ready to dive back into your learning journey?
                            </p>
                            <button
                                onClick={() => navigate('/courses')}
                                className="mt-2 sm:mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 shadow-[0_10px_25px_rgba(59,130,246,0.3)] hover:shadow-[0_10px_35px_rgba(59,130,246,0.5)] flex items-center space-x-3 w-fit hover:-translate-y-1 active:scale-95"
                            >
                                <MaterialIcon name="play_circle" className="text-xl" />
                                <span>Resume Learning</span>
                            </button>
                        </div>

                        {/* Abstract AI Graphic replacing the static text box */}
                        <div className="hidden md:flex w-[240px] lg:w-[300px] h-[240px] lg:h-[300px] relative items-center justify-center ml-8">
                            <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative z-10 w-40 lg:w-48 h-40 lg:h-48 rounded-full border border-gray-300 dark:border-white/10 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-xl">
                                <div className="w-28 lg:w-32 h-28 lg:h-32 rounded-full border border-blue-500/30 dark:border-blue-400/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full absolute top-0 shadow-[0_0_10px_#60a5fa]"></div>
                                    <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full absolute bottom-0 shadow-[0_0_10px_#c084fc]"></div>
                                </div>
                                <MaterialIcon name="school" className="absolute text-4xl lg:text-5xl text-blue-600 dark:text-blue-300 drop-shadow-lg" />
                            </div>
                        </div>
                    </section>

                    {/* KPI Cards Redesigned */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: 'Active Courses', value: totalCourses, icon: 'menu_book', color: 'indigo' },
                            { title: 'Pending Tasks', value: pendingTasks, icon: 'content_paste_go', color: 'blue' },
                            { title: 'Completed Quizzes', value: completedQuizzes, icon: 'task_alt', color: 'emerald' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/50 p-5 sm:p-6 rounded-3xl flex items-center justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}-500 opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                                <div className="space-y-1 z-10 pl-2">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.title}</p>
                                    <h3 className={`text-3xl sm:text-4xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</h3>
                                </div>
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-100 dark:border-${stat.color}-500/20 group-hover:bg-${stat.color}-100 transition-colors z-10`}>
                                    <MaterialIcon name={stat.icon} className={`text-2xl sm:text-3xl text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* Left Column - Courses */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700/50 pb-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MaterialIcon name="auto_stories" className="text-blue-600 dark:text-blue-500" />
                                    Continue Learning
                                </h2>
                                <button
                                    onClick={() => navigate('/courses')}
                                    className="text-gray-500 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm flex items-center gap-1 group"
                                >
                                    View All <MaterialIcon name="arrow_right_alt" className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {courses.length === 0 ? (
                                    <div className="col-span-full p-10 text-center bg-white dark:bg-slate-800/30 rounded-[2rem] border border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center">
                                        <MaterialIcon name="inbox" className="text-6xl text-gray-400 dark:text-slate-600 mb-4" />
                                        <p className="text-gray-600 dark:text-slate-400 text-lg">
                                            {totalCourses > 0
                                                ? 'Courses you have started will appear here once your progress is saved (watch a video or read a document).'
                                                : "You're not enrolled in any courses yet."}
                                        </p>
                                        <button
                                            onClick={() => navigate('/courses')}
                                            className="mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-6 py-2 rounded-xl transition-colors font-medium"
                                        >
                                            Browse Catalog
                                        </button>
                                    </div>
                                ) : (
                                    courses.map((course) => {
                                        // Find resume data for this course
                                        const resumeData = continueLearningRows.find(
                                            (row) => row.courseId === course.id
                                        );
                                        return (
                                            <div key={course.id} className="h-full">
                                                <StudentCourseCard 
                                                    course={course} 
                                                    resumeData={resumeData ? {
                                                        lastLearningItemId: resumeData.lastLearningItemId,
                                                        type: resumeData.type,
                                                        lastWatchedTime: resumeData.lastWatchedTime,
                                                        lastPageNumber: resumeData.lastPageNumber,
                                                    } : undefined}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right Column - Deadlines */}
                        <div className="w-full xl:w-96 space-y-6">
                            <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/50 rounded-[2rem] p-6 space-y-6 h-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <MaterialIcon name="alarm" className="text-xl font-bold" />
                                        </div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            Deadlines
                                        </h2>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">
                                        {upcomingDeadlines.length} Due
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {upcomingDeadlines.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                            <MaterialIcon name="done_all" className="text-5xl mb-2 text-slate-400 dark:text-slate-500" />
                                            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-bold">You're all caught up!<br />No upcoming deadlines.</p>
                                        </div>
                                    ) : (
                                        upcomingDeadlines.map((deadline) => (
                                            <div
                                                key={deadline.id}
                                                className="group flex items-start space-x-4 p-3.5 -mx-2 rounded-2xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                                                onClick={() => {
                                                    if (deadline.courseId) {
                                                        navigate(deadline.eventType === 'Quiz' ? `/courses/${deadline.courseId}/quizzes` : `/courses/${deadline.courseId}/assignments`);
                                                    } else {
                                                        navigate(deadline.eventType === 'Quiz' ? '/quizzes' : '/assignments');
                                                    }
                                                }}
                                            >
                                                {/* Enhanced Calendar Binder Tear-off Design */}
                                                <div className="relative flex-shrink-0">
                                                    {/* Calendar Binder Metallic Rings */}
                                                    <div className="absolute -top-1 left-2.5 w-1.5 h-3 bg-gradient-to-b from-slate-300 to-slate-500 dark:from-slate-500 dark:to-slate-700 rounded-full z-10 shadow-sm"></div>
                                                    <div className="absolute -top-1 right-2.5 w-1.5 h-3 bg-gradient-to-b from-slate-300 to-slate-500 dark:from-slate-500 dark:to-slate-700 rounded-full z-10 shadow-sm"></div>
                                                    
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl flex flex-col overflow-hidden border border-slate-200/70 dark:border-slate-700/60 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                        <div className={`${deadline.eventType === 'Quiz' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white text-[8px] sm:text-[9px] font-black text-center pt-1.5 pb-1 uppercase tracking-widest leading-none`}>
                                                            {deadline.dueDate.month}
                                                        </div>
                                                        <div className="flex-1 flex items-center justify-center text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/60">
                                                            {deadline.dueDate.day}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                                            deadline.eventType === 'Quiz' 
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300' 
                                                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                                                        }`}>
                                                            {deadline.eventType}
                                                        </span>
                                                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold truncate max-w-[120px] sm:max-w-none">{deadline.courseName}</span>
                                                    </div>
                                                    <h4 className="font-bold text-xs sm:text-sm leading-tight text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{deadline.title}</h4>
                                                    <div className="flex items-center justify-between pt-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                deadline.daysLeft <= 1 
                                                                    ? 'bg-rose-500 animate-pulse' 
                                                                    : deadline.daysLeft <= 3 
                                                                        ? 'bg-amber-500' 
                                                                        : 'bg-emerald-500'
                                                            }`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                                deadline.daysLeft <= 1 
                                                                    ? 'text-rose-600 dark:text-rose-400' 
                                                                    : deadline.daysLeft <= 3 
                                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                            }`}>
                                                                {deadline.daysLeft > 1 
                                                                    ? `${deadline.daysLeft} days left` 
                                                                    : deadline.daysLeft === 1 
                                                                        ? '1 day left' 
                                                                        : deadline.daysLeft === 0 
                                                                            ? 'Due Today' 
                                                                            : 'Overdue'}
                                                            </span>
                                                        </div>
                                                        <MaterialIcon name="arrow_forward" className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 group-hover:translate-x-1 text-sm sm:text-base" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};