import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getStudentDashboardData } from '@/api/services/student.service';
import { useState } from 'react';

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
    'https://images.unsplash.com/photo-1554075798-d5239fdc5b04?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531315396756-fca67e49b002?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1432405972618-c60b0b63c898?w=600&h=400&fit=crop',
];

const getRandomCourseImage = () => {
    return COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)];
};

export const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: getStudentDashboardData,
        staleTime: 5 * 60 * 1000
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f172a]">
                <div className="text-center text-[#3b82f6]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-[#1e3a8a] text-blue-300 rounded-lg mx-auto max-w-2xl mt-8">
                <p>Failed to load dashboard data. Please try refreshing.</p>
            </div>
        );
    }

    const upcomingDeadlines = data?.upcomingAssignments?.slice(0, 2).map(a => ({
        id: a.id,
        title: a.title,
        dueDate: formatDateForDeadline(a.dueDate),
        fullDate: formatDate(a.dueDate),
        daysLeft: Math.ceil((new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    })) || [];

    const courses = Array.isArray(data?.courses)
        ? data.courses.slice(0, 2).map(c => ({
            id: c.id,
            title: c.name,
            instructor: c.instructorName,
            progress: Math.floor(Math.random() * 100),
            image: getRandomCourseImage()
        }))
        : [];

    const totalCourses = data?.stats?.totalCourses || 0;
    const pendingTasks = data?.stats?.pendingAssignments || 0;
    const completedQuizzes = Array.isArray(data?.pendingQuizzes) ? data.pendingQuizzes.length : 0;

    return (
        <div className="dashboard-warm min-h-screen flex flex-col bg-[#0f172a]">
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#0f172a]">
                <div className="px-4 sm:px-10 py-10 space-y-10 max-w-full">
                    {/* Hero Banner */}
                    <section className="hero-banner-warm rounded-[2.5rem] p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between min-h-[350px] sm:min-h-[450px]">
                        <div className="max-w-xl space-y-8 z-10 flex-1">
                            <h2 className="text-4xl sm:text-6xl font-bold leading-tight text-blue-100">
                                Welcome back, {user?.firstName || 'Learner'}!<br />
                                <span className="text-[#3b82f6]">Ready to dive back into your learning journey?</span>
                            </h2>
                            <p className="text-lg sm:text-xl text-blue-100/80 leading-relaxed">
                                You have {pendingTasks} tasks to catch up on and an AI learning companion waiting for you.
                            </p>
                            <button
                                onClick={() => navigate('/my-courses')}
                                className="bg-[#3b82f6] text-[#0f172a] px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:scale-105 transition-transform flex items-center space-x-2 accent-glow w-fit"
                            >
                                <MaterialIcon name="play_circle" className="text-xl" />
                                <span>Resume Learning</span>
                            </button>
                        </div>
                        <div className="hidden md:block w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] relative">
                            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="relative z-10 w-full h-full bg-gradient-to-br from-[#3b82f6]/20 to-[#a855f7]/5 rounded-3xl flex items-center justify-center text-blue-400/30 font-bold">
                                Learning Awaits
                            </div>
                        </div>
                    </section>

                    {/* KPI Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        <div className="card-warm p-6 sm:p-8 rounded-3xl flex items-center justify-between border-l-4 border-l-blue-500 hover:translate-y-[-4px] transition-transform">
                            <div className="space-y-1">
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Active Courses</p>
                                <h3 className="text-5xl font-black text-white">{totalCourses}</h3>
                            </div>
                            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <MaterialIcon name="menu_book" className="text-4xl text-blue-400" />
                            </div>
                        </div>
                        <div className="card-warm p-6 sm:p-8 rounded-3xl flex items-center justify-between border-l-4 border-l-purple-500 hover:translate-y-[-4px] transition-transform">
                            <div className="space-y-1">
                                <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Pending Tasks</p>
                                <h3 className="text-5xl font-black text-white">{pendingTasks}</h3>
                            </div>
                            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <MaterialIcon name="content_paste_go" className="text-4xl text-purple-400" />
                            </div>
                        </div>
                        <div className="card-warm p-6 sm:p-8 rounded-3xl flex items-center justify-between border-l-4 border-l-indigo-500 hover:translate-y-[-4px] transition-transform">
                            <div className="space-y-1">
                                <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Completed Quizzes</p>
                                <h3 className="text-5xl font-black text-white">{completedQuizzes}</h3>
                            </div>
                            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <MaterialIcon name="task_alt" className="text-4xl text-indigo-400" />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col xl:flex-row gap-8 sm:gap-10">
                        {/* Left Column - Courses */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl sm:text-3xl font-bold text-blue-100">My Courses</h2>
                                <button
                                    onClick={() => navigate('/my-courses')}
                                    className="text-[#3b82f6] font-medium hover:underline text-sm sm:text-base"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {courses.length === 0 ? (
                                    <div className="col-span-full p-8 text-center bg-[#1e3a8a] rounded-lg border border-dashed border-slate-700">
                                        <p className="text-blue-100/70">You're not enrolled in any courses yet.</p>
                                        <button
                                            onClick={() => navigate('/courses')}
                                            className="mt-4 text-[#3b82f6] font-medium hover:underline"
                                        >
                                            Browse Courses
                                        </button>
                                    </div>
                                ) : (
                                    courses.map((course) => (
                                        <div
                                            key={course.id}
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                            className="bg-[#1e3a8a] rounded-[2rem] overflow-hidden group hover:ring-2 hover:ring-[#3b82f6] transition-all cursor-pointer"
                                        >
                                            <div className="h-48 sm:h-64 relative bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/10">
                                                <img
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                    src={course.image}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%231e3a8a" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23dbeafe" text-anchor="middle" dy=".3em"%3ECourse Thumbnail%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                                <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                                    Active
                                                </div>
                                            </div>
                                            <div className="p-6 sm:p-8 space-y-6">
                                                <div>
                                                    <h3 className="text-xl sm:text-2xl font-bold text-blue-100 line-clamp-2">{course.title}</h3>
                                                    <p className="text-blue-100/50 mt-1 line-clamp-1">{course.instructor}</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-blue-100/60">Progress</span>
                                                        <span className="text-[#3b82f6] font-bold">{course.progress}%</span>
                                                    </div>
                                                    <div className="h-2.5 bg-[#0f172a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#3b82f6] rounded-full accent-glow"
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Column - Deadlines */}
                        <div className="w-full xl:w-96 space-y-8">
                            <div className="card-warm rounded-[2rem] p-6 sm:p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-blue-100">Upcoming Deadlines</h2>
                                    <MaterialIcon name="calendar_month" className="text-blue-100/40" />
                                </div>
                                <div className="space-y-4 sm:space-y-6">
                                    {upcomingDeadlines.length === 0 ? (
                                        <p className="text-blue-100/50 text-center py-4">No upcoming deadlines 🎉</p>
                                    ) : (
                                        upcomingDeadlines.map((deadline) => (
                                            <div
                                                key={deadline.id}
                                                className="flex space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/assignments/${deadline.id}`)}
                                            >
                                                <div className="w-12 sm:w-14 h-12 sm:h-14 bg-[#5b21b6] rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-[#3b82f6] text-xs sm:text-sm font-bold">
                                                    <span className="uppercase leading-tight">{deadline.dueDate.month}</span>
                                                    <span className="text-lg sm:text-xl">{deadline.dueDate.day}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-sm leading-tight text-blue-100 line-clamp-2">{deadline.title}</h4>
                                                    <p className="text-[10px] text-blue-100/40">
                                                        {deadline.daysLeft > 0
                                                            ? `${deadline.daysLeft} days left`
                                                            : `Due: ${deadline.fullDate}`}
                                                    </p>
                                                    <button className="text-xs text-[#3b82f6] flex items-center font-bold hover:underline">
                                                        Start Task
                                                        <MaterialIcon name="arrow_forward" className="text-sm ml-1" />
                                                    </button>
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

            {/* Floating Chat Button */}
            <button className="fixed bottom-6 sm:bottom-10 right-6 sm:right-10 w-14 sm:w-16 h-14 sm:h-16 bg-[#3b82f6] text-[#0f172a] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 accent-glow">
                <MaterialIcon name="chat" className="text-3xl" />
            </button>
        </div>
    );
};
