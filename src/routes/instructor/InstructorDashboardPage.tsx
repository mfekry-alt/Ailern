import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Edit2, Trash2, Plus, Users, BookOpen, Clock, TrendingUp, AlertCircle, CheckSquare, FileText, Calendar } from 'lucide-react';
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
    enrollmentCount: number
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
        enrollmentCount: 4
        
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
        enrollmentCount: 78
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
        enrollmentCount: 56
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
        enrollmentCount: 34
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

    // Submissions to grade
    const submissionsToGrade = [
        { id: 1, course: 'CS101', assignment: 'Assignment 1: Variables & Data Types', submissions: 12, dueDate: '2025-12-26' },
        { id: 2, course: 'CS202', assignment: 'Assignment 2: Linked Lists', submissions: 8, dueDate: '2025-12-28' },
        { id: 3, course: 'MA203', assignment: 'Problem Set 3: Matrix Operations', submissions: 15, dueDate: '2025-12-27' },
    ];

    // Course approval updates
    const approvalUpdates = [
        { id: 1, course: 'PHY105 - Classical Mechanics', status: 'Pending', submittedDate: '2025-12-20', daysWaiting: 5 },
        { id: 2, course: 'BIO110 - General Biology', status: 'Under Review', submittedDate: '2025-12-18', daysWaiting: 7 },
        { id: 3, course: 'CHEM101 - Chemistry Basics', status: 'Pending', submittedDate: '2025-12-24', daysWaiting: 1 },
    ];

    // Upcoming deadlines
    const upcomingDeadlines = [
        { id: 1, course: 'CS101', item: 'Quiz 2: Control Flow', dueDate: '2025-12-26', daysLeft: 1, priority: 'high' },
        { id: 2, course: 'CS202', item: 'Project Submission: Graph Algorithms', dueDate: '2025-12-28', daysLeft: 3, priority: 'high' },
        { id: 3, course: 'MA203', item: 'Exam Review Session', dueDate: '2025-12-29', daysLeft: 4, priority: 'medium' },
        { id: 4, course: 'PHY105', item: 'Lab Report Due', dueDate: '2025-12-31', daysLeft: 6, priority: 'low' },
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

                                            <div className="flex items-center gap-4 mb-3">
                                                <p className="text-[14px] text-gray-600">
                                                    Course ID: {course.courseId}
                                                </p>
                                                <div className="flex items-center gap-4 text-[14px]">
                                                    <span className="text-gray-600">
                                                        <span className="font-semibold">Enrolled:</span> {course.enrollmentCount}
                                                    </span>

                                                </div>
                                            </div>

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
                                        Announcements Overview
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

                {/* Pending Tasks Section */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Submissions to Grade */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Submissions to Grade
                                    </h2>
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                </div>

                                <div className="space-y-4">
                                    {submissionsToGrade.map((submission) => (
                                        <div key={submission.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-[13px] font-semibold text-gray-600">
                                                        {submission.course}
                                                    </p>
                                                    <p className="text-[14px] font-medium text-gray-900 mt-1">
                                                        {submission.assignment}
                                                    </p>
                                                </div>
                                                <span className="bg-blue-600 text-white text-[12px] font-bold px-2.5 py-1 rounded-full">
                                                    {submission.submissions}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-gray-600">
                                                Due: {new Date(submission.dueDate).toLocaleDateString()}
                                            </p>
                                            <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[12px] py-1.5 rounded-md transition-colors">
                                                Grade Submissions
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-[14px] py-2">
                                    View All Submissions
                                </button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Approval Updates */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Course Approval Updates
                                    </h2>
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>

                                <div className="space-y-4">
                                    {approvalUpdates.map((update) => (
                                        <div key={update.id} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[14px] font-medium text-gray-900 flex-1">
                                                    {update.course}
                                                </p>
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                                    update.status === 'Pending' 
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {update.status}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-gray-600 mb-2">
                                                Submitted: {new Date(update.submittedDate).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12px] text-gray-600">
                                                    Waiting: {update.daysWaiting} days
                                                </p>
                                                <button className="text-blue-600 hover:text-blue-700 font-medium text-[12px]">
                                                    View Status
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-[14px] py-2">
                                    View All Updates
                                </button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Upcoming Deadlines
                                    </h2>
                                    <Calendar className="w-5 h-5 text-red-600" />
                                </div>

                                <div className="space-y-3">
                                    {upcomingDeadlines.map((deadline) => (
                                        <div key={deadline.id} className={`rounded-lg p-3 border ${
                                            deadline.priority === 'high'
                                                ? 'bg-red-50 border-red-100'
                                                : deadline.priority === 'medium'
                                                ? 'bg-orange-50 border-orange-100'
                                                : 'bg-gray-50 border-gray-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[13px] font-semibold text-gray-600">
                                                    {deadline.course}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                    deadline.priority === 'high'
                                                        ? 'bg-red-200 text-red-800'
                                                        : deadline.priority === 'medium'
                                                        ? 'bg-orange-200 text-orange-800'
                                                        : 'bg-gray-200 text-gray-800'
                                                }`}>
                                                    {deadline.daysLeft}d
                                                </span>
                                            </div>
                                            <p className="text-[13px] font-medium text-gray-900 mb-1">
                                                {deadline.item}
                                            </p>
                                            <p className="text-[11px] text-gray-600">
                                                Due: {new Date(deadline.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-[14px] py-2">
                                    View All Deadlines
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

