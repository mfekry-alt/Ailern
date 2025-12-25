import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui';
import { Calendar, BookOpen, Bell } from 'lucide-react';

export const DashboardPage = () => {
    const { user } = useAuth();

    const upcomingDeadlines = [
        {
            id: 1,
            title: 'Essay on Modern Literature',
            dueDate: 'Oct 26, 11:59 PM',
            status: 'In Progress',
            statusColor: 'bg-yellow-100 text-yellow-800'
        },
        {
            id: 2,
            title: 'Math Quiz 2',
            dueDate: 'Oct 27, 11:59 PM',
            status: 'Not Started',
            statusColor: 'bg-red-100 text-red-800'
        },
        {
            id: 3,
            title: 'History Presentation',
            dueDate: 'Oct 29, 11:59 PM',
            status: 'Not Started',
            statusColor: 'bg-red-100 text-red-800'
        }
    ];

    const recentCourses = [
        {
            id: 1,
            title: 'Modern Literature',
            instructor: 'Dr. Sarah Wilson',
            progress: 80,
            image: '/test material/testimg.png',
        },
        {
            id: 2,
            title: 'Calculus II',
            instructor: 'Prof. John Smith',
            progress: 50,
            image: '/test material/testimg.png',
        },
        {
            id: 3,
            title: 'World History',
            instructor: 'Dr. Emily Carter',
            progress: 20,
            image: '/test material/testimg.png',
        },
    ];

    const notifications = [
        {
            id: 1,
            title: 'New material added to Calculus II',
            date: 'Oct 25, 2024',
            icon: BookOpen
        },
        {
            id: 2,
            title: 'Quiz 1 for World History is now available',
            date: 'Oct 24, 2024',
            icon: Calendar
        },
        {
            id: 3,
            title: 'Announcement: Essay on Modern Literature',
            date: 'Oct 23, 2024',
            icon: Bell
        }
    ];

    const enrollmentRequests = [
        {
            id: 1,
            course: 'Data Structures',
            instructor: 'Prof. Alan Turing',
            status: 'Pending',
            statusColor: 'bg-yellow-100 text-yellow-800',
        },
        {
            id: 2,
            course: 'Physics I',
            instructor: 'Dr. Marie Curie',
            status: 'Approved',
            statusColor: 'bg-green-100 text-green-800',
        },
        {
            id: 3,
            course: 'Art History',
            instructor: 'Dr. Leonardo Rossi',
            status: 'Rejected',
            statusColor: 'bg-red-100 text-red-800',
        },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="font-bold text-[30px] leading-[36px] text-gray-900">
                        Hi, {user?.firstName || 'Mazen'}!
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600 mt-1">
                        Here's what's happening with your courses today.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column */}
                    <div className="flex-1 space-y-8">
                        {/* Upcoming Deadlines */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 mb-6">
                                    Upcoming Deadlines
                                </h2>
                                <div className="space-y-6">
                                    {upcomingDeadlines.map((deadline) => (
                                        <div key={deadline.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-[16px] leading-[24px] text-gray-900">
                                                    {deadline.title}
                                                </h3>
                                                <p className="text-[14px] leading-[20px] text-gray-600">
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
                            <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 mb-4">
                                Enrolled Courses
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recentCourses.map((course) => (
                                    <Card key={course.id} variant="elevated">
                                        <CardContent className="p-0">
                                            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                                                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-[16px] leading-[24px] text-gray-900">
                                                    {course.title}
                                                </h3>
                                                <p className="text-[14px] leading-[20px] text-gray-600 mb-2">
                                                    Instructor: {course.instructor}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[14px] font-medium text-gray-600">
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
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 mb-6">
                                    Notifications
                                </h2>
                                <div className="space-y-6">
                                    {notifications.map((notification) => {
                                        const Icon = notification.icon;
                                        return (
                                            <div key={notification.id} className="flex gap-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-[16px] leading-[24px] text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[14px] leading-[20px] text-gray-600">
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
                                <h2 className="font-bold text-[20px] leading-[28px] text-gray-900 mb-6">
                                    Enrollment Requests
                                </h2>
                                <div className="space-y-4">
                                    {enrollmentRequests.map((request) => (
                                        <div key={request.id} className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="font-medium text-[16px] leading-[24px] text-gray-900">
                                                    {request.course}
                                                </p>
                                                <p className="text-[14px] leading-[20px] text-gray-600">
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

