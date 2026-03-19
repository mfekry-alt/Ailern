import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Trash2, Plus, Users, BookOpen, Clock, TrendingUp,
    AlertCircle, CheckSquare, FileText, Calendar, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useInstructorCourses } from '@/features/courses/api';
import { useAuthStore } from '@/features/auth/store';
import type { GetAllCoursesDto } from '@/types/api.types';

// --- Interfaces ---
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
    enrollmentCount: number;
}

// --- Helper Functions (Extracted to fix S3358) ---
const getStatusConfig = (apiStatus: string): Pick<Course, 'status' | 'statusColor' | 'statusBg' | 'primaryAction' | 'secondaryAction'> => {
    switch (apiStatus) {
        case 'Approved':
            return {
                status: 'Approved',
                statusColor: '#166534',
                statusBg: '#dcfce7',
                primaryAction: 'Go to Content',
                secondaryAction: 'Edit',
            };
        case 'Pending':
            return {
                status: 'Pending Review',
                statusColor: '#1d4ed8',
                statusBg: '#dbeafe',
                primaryAction: 'Go to Content',
                secondaryAction: 'Edit',
            };
        case 'Rejected':
            return {
                status: 'Draft',
                statusColor: '#854d0e',
                statusBg: '#fef9c3',
                primaryAction: 'Continue Editing',
                secondaryAction: 'Edit',
            };
        default:
            return {
                status: 'Draft',
                statusColor: '#854d0e',
                statusBg: '#fef9c3',
                primaryAction: 'Go to Content',
                secondaryAction: 'Edit',
            };
    }
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

const getNotificationColor = (type: string) => {
    if (type === 'info') return 'bg-blue-600';
    if (type === 'warning') return 'bg-yellow-500';
    return 'bg-green-600';
};

const getApprovalUpdateBadgeClasses = (status: string) => {
    if (status === 'Pending') {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
};

const getDeadlineCardClasses = (priority: string) => {
    if (priority === 'high') {
        return 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30';
    }
    return 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/30';
};

const getDeadlineBadgeClasses = (priority: string) => {
    if (priority === 'high') {
        return 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
};

// --- Component ---
export const InstructorDashboardPage = () => {
    const user = useAuthStore((state) => state.user);

    const instructorId = useMemo(() => {
        if (typeof user?.id === 'number') {
            return user.id;
        }

        const parsedId = Number(user?.id);
        return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
    }, [user?.id]);

    const {
        data: coursesData,
        isLoading: isCoursesLoading,
        error: coursesError,
    } = useInstructorCourses(instructorId, { PageNumber: 1, PageSize: 5 });

    const courses = useMemo(() => {
        if (!coursesData?.items) return [];
        return coursesData.items.map(mapCourseToUI);
    }, [coursesData]);

    // Dashboard statistics
    const stats = [
        { label: 'Total Students', value: '0', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { label: 'Active Courses', value: '0', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100' },
        { label: 'Pending Reviews', value: '0', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { label: 'Avg. Rating', value: '0.0', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ];

    // Recent notifications
    const notifications: { id: number; message: string; time: string; type: string }[] = [];

    // Submissions to grade
    const submissionsToGrade: { id: number; course: string; assignment: string; submissions: number; dueDate: string }[] = [];

    // Course approval updates
    const approvalUpdates: { id: number; course: string; status: string; submittedDate: string; daysWaiting: number }[] = [];

    // Upcoming deadlines
    const upcomingDeadlines: { id: number; course: string; item: string; dueDate: string; daysLeft: number; priority: string }[] = [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-zinc-100">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[30px] font-bold leading-[36px]">
                            Instructor Dashboard
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400 mt-1">
                            Manage your courses and track student progress
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                            <button
                                type="button"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Course
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-medium text-gray-600 dark:text-zinc-400 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold">
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
                        <Card variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold">
                                        My Courses
                                    </h2>
                                    <Link to={ROUTES.INSTRUCTOR_COURSES}>
                                        <button
                                            type="button"
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-[14px] cursor-pointer"
                                        >
                                            View All
                                        </button>
                                    </Link>
                                </div>

                                <div className="grid gap-4">
                                    {isCoursesLoading && (
                                        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-zinc-400">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span className="text-[14px]">Loading courses...</span>
                                        </div>
                                    )}

                                    {!isCoursesLoading && coursesError && (
                                        <div className="text-center py-6">
                                            <AlertCircle className="w-10 h-10 text-red-300 dark:text-red-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-red-600 dark:text-red-400">Failed to load courses</p>
                                        </div>
                                    )}

                                    {!isCoursesLoading && !coursesError && courses.length === 0 ? (
                                        <div className="text-center py-8">
                                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-gray-500 dark:text-zinc-400">No courses yet</p>
                                            <p className="text-[12px] text-gray-400 dark:text-zinc-500 mt-1">Create your first course to get started</p>
                                        </div>
                                    ) : courses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-[16px] flex-1">
                                                    {course.title}
                                                </h3>
                                                <div
                                                    className="px-2.5 py-0.5 rounded-full shrink-0 ml-2"
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

                                            <div className="flex items-center gap-4 mb-3">
                                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">
                                                    Course ID: {course.courseId}
                                                </p>
                                                <div className="flex items-center gap-4 text-[14px]">
                                                    <span className="text-gray-600 dark:text-zinc-400">
                                                        <span className="font-semibold text-gray-900 dark:text-zinc-100">Enrolled:</span> {course.enrollmentCount}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id)}>
                                                        <button
                                                            type="button"
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-gray-600 dark:text-zinc-400 cursor-pointer"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-gray-600 dark:text-zinc-400 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    {course.secondaryAction && (
                                                        <button
                                                            type="button"
                                                            className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[12px] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            {course.secondaryAction}
                                                        </button>
                                                    )}
                                                    {course.primaryAction && (
                                                        <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT_CONTENT.replace(':id', course.id)}>
                                                            <button
                                                                type="button"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[12px] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                                                            >
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
                        <Card variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold">
                                        Notifications
                                    </h2>
                                    <AlertCircle className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-6">
                                            <AlertCircle className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-gray-500 dark:text-zinc-400">No notifications</p>
                                        </div>
                                    ) : notifications.map((notification) => (
                                        <div key={notification.id} className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getNotificationColor(notification.type)}`}></div>
                                            <div className="flex-1">
                                                <p className="text-[14px] text-gray-900 dark:text-zinc-100 mb-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[12px] text-gray-500 dark:text-zinc-500">
                                                    {notification.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="w-full mt-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-[14px] py-2 border-t border-gray-100 dark:border-zinc-800 cursor-pointer"
                                >
                                    View All
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Pending Tasks Section */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Submissions to Grade */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold">
                                        To Grade
                                    </h2>
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                </div>

                                <div className="space-y-4">
                                    {submissionsToGrade.length === 0 ? (
                                        <div className="text-center py-6">
                                            <CheckSquare className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-gray-500 dark:text-zinc-400">No submissions to grade</p>
                                        </div>
                                    ) : submissionsToGrade.map((submission) => (
                                        <div key={submission.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-[13px] font-semibold text-gray-600 dark:text-zinc-400">
                                                        {submission.course}
                                                    </p>
                                                    <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100 mt-1">
                                                        {submission.assignment}
                                                    </p>
                                                </div>
                                                <span className="bg-blue-600 text-white text-[12px] font-bold px-2.5 py-1 rounded-full">
                                                    {submission.submissions}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-gray-600 dark:text-zinc-400 mb-3">
                                                Due: {new Date(submission.dueDate).toLocaleDateString()}
                                            </p>
                                            <button
                                                type="button"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[12px] py-1.5 rounded-md transition-colors cursor-pointer"
                                            >
                                                Grade Submissions
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Approval Updates */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold">
                                        Approvals
                                    </h2>
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>

                                <div className="space-y-4">
                                    {approvalUpdates.length === 0 ? (
                                        <div className="text-center py-6">
                                            <FileText className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-gray-500 dark:text-zinc-400">No pending approvals</p>
                                        </div>
                                    ) : approvalUpdates.map((update) => (
                                        <div key={update.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-900/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100 flex-1">
                                                    {update.course}
                                                </p>
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getApprovalUpdateBadgeClasses(update.status)}`}>
                                                    {update.status}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-gray-600 dark:text-zinc-400 mb-2">
                                                Submitted: {new Date(update.submittedDate).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12px] text-gray-600 dark:text-zinc-400">
                                                    Waiting: {update.daysWaiting} days
                                                </p>
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-[12px] font-medium cursor-pointer"
                                                >
                                                    Status
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold">
                                        Deadlines
                                    </h2>
                                    <Calendar className="w-5 h-5 text-red-600" />
                                </div>

                                <div className="space-y-3">
                                    {upcomingDeadlines.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Calendar className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                            <p className="text-[14px] text-gray-500 dark:text-zinc-400">No upcoming deadlines</p>
                                        </div>
                                    ) : upcomingDeadlines.map((deadline) => (
                                        <div key={deadline.id} className={`rounded-lg p-3 border ${getDeadlineCardClasses(deadline.priority)}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[13px] font-semibold text-gray-600 dark:text-zinc-300">
                                                    {deadline.course}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getDeadlineBadgeClasses(deadline.priority)}`}>
                                                    {deadline.daysLeft}d
                                                </span>
                                            </div>
                                            <p className="text-[13px] font-medium text-gray-900 dark:text-zinc-100 mb-1">
                                                {deadline.item}
                                            </p>
                                            <p className="text-[11px] text-gray-600 dark:text-zinc-400">
                                                Due: {new Date(deadline.dueDate).toLocaleDateString()}
                                            </p>
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