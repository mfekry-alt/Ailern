import { Card, CardContent } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Users,
    BookOpen,
    Clock,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Download,

    Settings,
    BarChart3,
    MessageSquare,
    Award
} from 'lucide-react';

import { useState, useEffect } from 'react';

interface Stat {
    label: string;
    value: string;
    icon: any;
    color: string;
    bgColor: string;
    change: string;
}

interface SystemMetric {
    label: string;
    value: string;
    icon: any;
    color: string;
}

interface Activity {
    activity: string;
    user: string;
    timestamp: string;
    type: 'enrollment' | 'approval' | 'course_creation' | 'completion' | 'system';
}

interface PendingApproval {
    id: number;
    type: 'Course' | 'User';
    title: string;
    instructor: string;
    submittedAt: string;
}

export const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stat[]>([]);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const downloadText = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const exportDashboardReport = () => {
        const rows: Array<Array<string>> = [
            ['section', 'label', 'value'],
            ...stats.map((s) => ['stats', s.label, s.value]),
            ...systemMetrics.map((m) => ['system_metrics', m.label, m.value]),
            ...pendingApprovals.map((p) => ['pending_approvals', `${p.type}: ${p.title}`, `${p.instructor} (${p.submittedAt})`]),
            ...recentActivity.map((a) => ['recent_activity', a.type, `${a.activity} | ${a.user} | ${a.timestamp}`]),
        ];
        const csv = rows
            .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadText('admin-dashboard-report.csv', csv);
    };

    const handleApprove = (id: number) => {
        setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    };

    const handleReview = (approval: PendingApproval) => {
        if (approval.type === 'Course') {
            navigate(ROUTES.ADMIN_COURSES);
            return;
        }
        navigate(ROUTES.ADMIN_USERS);
    };

    useEffect(() => {
        // Simulate API fetch
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // TODO: Replace with actual API calls
                await new Promise(resolve => setTimeout(resolve, 1000));

                setStats([
                    { label: 'Total Students', value: '0', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100', change: '+0%' },
                    { label: 'Total Instructors', value: '0', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100', change: '+0%' },
                    { label: 'Total Courses', value: '0', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100', change: '+0%' },
                    { label: 'Pending Approvals', value: '0', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', change: '-0%' },
                ]);

                setSystemMetrics([
                    { label: 'Active Users Today', value: '0', icon: TrendingUp, color: 'text-green-600' },
                    { label: 'Course Completions', value: '0', icon: CheckCircle, color: 'text-blue-600' },
                    { label: 'Messages Sent', value: '0', icon: MessageSquare, color: 'text-purple-600' },
                    { label: 'System Uptime', value: '99.9%', icon: BarChart3, color: 'text-green-600' }
                ]);

                setRecentActivity([
                    { activity: "User 'Sarah' enrolled in 'Introduction to Programming'", user: 'Sarah', timestamp: '2024-07-26 10:30 AM', type: 'enrollment' },
                    { activity: "Course 'Advanced Data Science' approved", user: 'Admin', timestamp: '2024-07-25 03:45 PM', type: 'approval' },
                    { activity: "Instructor 'David' created course 'Machine Learning Fundamentals'", user: 'David', timestamp: '2024-07-24 09:15 AM', type: 'course_creation' },
                    { activity: "User 'Emily' completed course 'Digital Marketing Essentials'", user: 'Emily', timestamp: '2024-07-23 05:00 PM', type: 'completion' },
                    { activity: "System backup completed successfully", user: 'System', timestamp: '2024-07-22 02:00 AM', type: 'system' },
                ]);

                setPendingApprovals([
                    { id: 1, type: 'Course', title: 'Advanced Machine Learning', instructor: 'Dr. Sarah Wilson', submittedAt: '2024-01-15' },
                    { id: 2, type: 'User', title: 'New Instructor ', instructor: 'Prof. John Smith', submittedAt: '2024-01-14' },
                    { id: 3, type: 'Course', title: 'Data Visualization Techniques', instructor: 'Dr. Maria Garcia', submittedAt: '2024-01-13' },
                ]);
            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="mb-3">
                            <span className="inline-block px-3 py-1 text-[12px] font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-md border border-teal-200 dark:border-teal-800">
                                v1.0 System Update Live
                            </span>
                        </div>
                        <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-white">
                            Manage Education <span className="text-blue-600 dark:text-blue-400">Intelligently.</span>
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 dark:text-gray-400 mt-2">
                            Ailern provides a comprehensive admin dashboard to oversee students, instructors, and course content with real-time analytics and seamless management tools.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportDashboardReport}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-6 bg-white dark:bg-gray-800 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900 dark:text-white">
                                                {stat.value}
                                            </p>
                                            <p className="text-[12px] text-green-600 dark:text-green-400 font-medium">
                                                {stat.change}
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
                    {/* System Metrics */}
                    <div className="lg:col-span-2">
                        <Card variant="elevated">
                            <CardContent className="p-6 bg-white dark:bg-gray-800 transition-colors">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">
                                            System overview
                                        </h2>
                                        <p className="text-[14px] text-gray-600 dark:text-gray-400">Live statistics</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-[14px] cursor-pointer">
                                            Export
                                        </button>
                                        <button
                                            onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}
                                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-[14px] cursor-pointer"
                                        >
                                            Settings
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {systemMetrics.map((metric) => {
                                        const IconComponent = metric.icon;
                                        return (
                                            <div key={metric.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center">
                                                        <IconComponent className={`w-5 h-5 ${metric.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[16px] font-bold text-gray-900 dark:text-white">{metric.value}</p>
                                                        <p className="text-[12px] text-gray-600 dark:text-gray-400">{metric.label}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Approvals */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Pending Approvals
                                    </h2>
                                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                                </div>

                                <div className="space-y-3">
                                    {pendingApprovals.map((approval) => (
                                        <div key={approval.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-[14px] font-semibold text-gray-900">
                                                        {approval.title}
                                                    </p>
                                                    <p className="text-[12px] text-gray-600">
                                                        {approval.instructor}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${approval.type === 'Course' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {approval.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mb-2">
                                                Submitted: {approval.submittedAt}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(approval.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReview(approval)}
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate(ROUTES.ADMIN_COURSES)}
                                    className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-[14px] py-2"
                                >
                                    View All Approvals
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Quick Actions */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <h2 className="text-[20px] font-bold text-gray-900 mb-6">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                                className="flex flex-col items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                <Users className="w-8 h-8 text-blue-600" />
                                <span className="text-[14px] font-medium text-blue-700">Manage Users</span>
                            </button>
                            <button
                                onClick={() => navigate(ROUTES.ADMIN_COURSES)}
                                className="flex flex-col items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                                <BookOpen className="w-8 h-8 text-green-600" />
                                <span className="text-[14px] font-medium text-green-700">Manage Courses</span>
                            </button>
                            <button
                                onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
                                className="flex flex-col items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                                <span className="text-[14px] font-medium text-purple-700">View Reports</span>
                            </button>
                            <button
                                onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}
                                className="flex flex-col items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-8 h-8 text-orange-600" />
                                <span className="text-[14px] font-medium text-orange-700">System Settings</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-[20px] font-bold text-gray-900">
                                Recent Activity
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Activity
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            User
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Type
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((activity, index) => (
                                        <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === recentActivity.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="py-4 px-6">
                                                <p className="text-[14px] text-gray-900">
                                                    {activity.activity}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-[14px] font-medium text-gray-900">
                                                    {activity.user}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${activity.type === 'enrollment' ? 'bg-blue-100 text-blue-800' :
                                                    activity.type === 'approval' ? 'bg-green-100 text-green-800' :
                                                        activity.type === 'course_creation' ? 'bg-purple-100 text-purple-800' :
                                                            activity.type === 'completion' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {activity.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-[14px] text-gray-600">
                                                    {activity.timestamp}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

