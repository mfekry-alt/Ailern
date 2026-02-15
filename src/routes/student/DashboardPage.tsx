import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui';
import { Calendar, BookOpen, Bell } from 'lucide-react';

export const DashboardPage = () => {
    const { user } = useAuth();

    const upcomingDeadlines: { id: number; title: string; dueDate: string; status: string; statusColor: string }[] = [];

    const recentCourses: { id: number; title: string; instructor: string; progress: number; image: string }[] = [];

    const notifications: { id: number; title: string; date: string; icon: any }[] = [];

    const enrollmentRequests: { id: number; course: string; instructor: string; status: string; statusColor: string }[] = [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="font-bold text-[30px] leading-[36px] text-gray-900 dark:text-zinc-100">
                        Hi, {user?.firstName || 'Mazen'}!
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400 mt-1">
                        Here's what's happening with your courses today.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column */}
                    <div className="flex-1 space-y-8">
                        {/* Upcoming Deadlines */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 dark:text-zinc-100 mb-6">
                                    Upcoming Deadlines
                                </h2>
                                <div className="space-y-6">
                                    {upcomingDeadlines.length === 0 ? (
                                        <p className="text-[14px] text-gray-500 dark:text-zinc-500 text-center py-4">No upcoming deadlines</p>
                                    ) : upcomingDeadlines.map((deadline) => (
                                        <div key={deadline.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-[16px] leading-[24px] text-gray-900 dark:text-zinc-100">
                                                    {deadline.title}
                                                </h3>
                                                <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400">
                                                    Due: {deadline.dueDate}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${deadline.statusColor}`}>
                                                {deadline.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Courses */}
                        <div>
                            <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 dark:text-zinc-100 mb-4">
                                Enrolled Courses
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recentCourses.length === 0 && (
                                    <p className="text-[14px] text-gray-500 dark:text-zinc-500 col-span-3 text-center py-4">No enrolled courses</p>
                                )}
                                {recentCourses.map((course) => (
                                    <Card key={course.id} variant="elevated">
                                        <CardContent className="p-0">
                                            <div className="aspect-video bg-gray-200 dark:bg-zinc-700 rounded-t-lg overflow-hidden">
                                                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-[16px] leading-[24px] text-gray-900 dark:text-zinc-100">
                                                    {course.title}
                                                </h3>
                                                <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400 mb-2">
                                                    Instructor: {course.instructor}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[14px] font-medium text-gray-600 dark:text-zinc-400">
                                                        {course.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Notifications & Enrollment Requests */}
                    <div className="w-full lg:w-[405px]">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 dark:text-zinc-100 mb-6">
                                    Notifications
                                </h2>
                                <div className="space-y-6">
                                    {notifications.length === 0 && (
                                        <p className="text-[14px] text-gray-500 dark:text-zinc-500 text-center py-4">No notifications</p>
                                    )}
                                    {notifications.map((notification) => {
                                        const Icon = notification.icon;
                                        return (
                                            <div key={notification.id} className="flex gap-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-[16px] leading-[24px] text-gray-900 dark:text-zinc-100">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400">
                                                        {notification.date}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated" className="mt-6">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 dark:text-zinc-100 mb-6">
                                    Enrollment Requests
                                </h2>
                                <div className="space-y-4">
                                    {enrollmentRequests.length === 0 && (
                                        <p className="text-[14px] text-gray-500 dark:text-zinc-500 text-center py-4">No enrollment requests</p>
                                    )}
                                    {enrollmentRequests.map((request) => (
                                        <div key={request.id} className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="font-medium text-[16px] leading-[24px] text-gray-900 dark:text-zinc-100">
                                                    {request.course}
                                                </p>
                                                <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400">
                                                    Instructor: {request.instructor}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${request.statusColor}`}
                                            >
                                                {request.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

