import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Edit2, Trash2, Plus, Users, BookOpen, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface Course {
    id: string;
    title: string;
    courseId: string;
    instructor: string;
    status: 'Draft' | 'Approved' | 'Ready to Submit' | 'Pending Review';
    statusColor: string;
    statusBg: string;
    primaryAction?: string;
    secondaryAction?: string;
}

const courses: Course[] = [
    {
        id: '1',
        title: 'CS101 - Introduction to Programming',
        courseId: 'CS101',
        instructor: 'Dr. Emily Carter',
        status: 'Draft',
        statusColor: '#854d0e',
        statusBg: '#fef9c3',
        secondaryAction: 'Mark as Ready',
        primaryAction: 'Open Course',
    },
    {
        id: '2',
        title: 'CS202 - Data Structures',
        courseId: 'CS202',
        instructor: 'Dr. Emily Carter',
        status: 'Approved',
        statusColor: '#166534',
        statusBg: '#dcfce7',
        primaryAction: 'Open Course',
    },
    {
        id: '3',
        title: 'MA203 - Linear Algebra',
        courseId: 'MA203',
        instructor: 'Dr. Emily Carter',
        status: 'Ready to Submit',
        statusColor: '#166534',
        statusBg: '#dcfce7',
        secondaryAction: 'Submit for Approval',
        primaryAction: 'Open Course',
    },
    {
        id: '4',
        title: 'PHY105 - Classical Mechanics',
        courseId: 'PHY105',
        instructor: 'Dr. Emily Carter',
        status: 'Pending Review',
        statusColor: '#6b21a8',
        statusBg: '#f0f1f4',
        primaryAction: 'Open Course',
    },
];

export const InstructorDashboardPage = () => {
    // Dashboard statistics
    const stats = [
        { label: 'Total Students', value: '245', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: 'Active Courses', value: '8', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100' },
        { label: 'Pending Reviews', value: '12', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { label: 'Avg. Rating', value: '4.8', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ];

    // Recent notifications
    const notifications = [
        { id: 1, message: 'New student enrolled in CS101', time: '2 hours ago', type: 'enrollment' },
        { id: 2, message: 'Assignment submission pending review', time: '4 hours ago', type: 'assignment' },
        { id: 3, message: 'Course CS202 approved by admin', time: '1 day ago', type: 'approval' },
        { id: 4, message: 'Student question in CS101 discussion', time: '2 days ago', type: 'question' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                            Instructor Dashboard
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 mt-1">
                            Manage your courses and track student progress
                        </p>
                    </div>
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-medium text-gray-600 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                            <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* My Courses */}
                    <div className="lg:col-span-2">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        My Courses
                                    </h2>
                                    <Link to={ROUTES.INSTRUCTOR_COURSES}>
                                        <button className="text-blue-600 hover:text-blue-700 font-medium text-[14px]">
                                            View All
                                        </button>
                                    </Link>
                                </div>

                                <div className="grid gap-4">
                                    {courses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-[16px] text-gray-900 flex-1">
                                                    {course.title}
                                                </h3>
                                                <div
                                                    className="px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                                                    style={{ backgroundColor: course.statusBg }}
                                                >
                                                    <span
                                                        className="font-medium text-[12px] leading-4"
                                                        style={{ color: course.statusColor }}
                                                    >
                                                        {course.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-[14px] text-gray-600 mb-3">
                                                Course ID: {course.courseId}
                                            </p>

                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                                                        <Trash2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    {course.secondaryAction && (
                                                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[12px] px-3 py-1.5 rounded-md transition-colors">
                                                            {course.secondaryAction}
                                                        </button>
                                                    )}
                                                    {course.primaryAction && (
                                                        <Link to={`/instructor/courses/${course.id}/content`}>
                                                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[12px] px-3 py-1.5 rounded-md transition-colors">
                                                                {course.primaryAction}
                                                            </button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notifications */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Recent Activity
                                    </h2>
                                    <AlertCircle className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <p className="text-[14px] text-gray-900 mb-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[12px] text-gray-500">
                                                    {notification.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-[14px] py-2">
                                    View All Notifications
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

