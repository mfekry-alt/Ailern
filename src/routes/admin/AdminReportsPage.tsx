import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { TrendingUp, Users, BookOpen, Download, Calendar, BarChart3, Activity } from 'lucide-react';

export const AdminReportsPage = () => {
    const [range, setRange] = useState<'30d' | '90d'>('30d');

    const metrics = [
        { label: 'Active Users', value: '0', change: '+0%', icon: Users, color: 'text-blue-600' },
        { label: 'Course Completions', value: '0', change: '+0%', icon: BookOpen, color: 'text-purple-600' },
        { label: 'New Enrollments', value: '0', change: '+0%', icon: TrendingUp, color: 'text-orange-600' }
    ];

    const userGrowth = useMemo(() => {
        return [
            { label: 'Jan', value: 0 },
            { label: 'Feb', value: 0 },
            { label: 'Mar', value: 0 },
            { label: 'Apr', value: 0 },
            { label: 'May', value: 0 },
            { label: 'Jun', value: 0 },
        ];
    }, [range]);

    // Removed revenue breakdown per request

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

    const exportReport = () => {
        const rows = [
            ['range', range],
            ['metric', 'value', 'change'],
            ...metrics.map((m) => [m.label, m.value, m.change]),
            [],
            ['user_growth_month', 'new_users'],
            ...userGrowth.map((u) => [u.label, String(u.value)])
        ];
        const csv = rows
            .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadText('admin-report.csv', csv);
    };

    const topCourses: { name: string; enrollments: number }[] = [];

    const recentActivity: { action: string; user: string; time: string; type: string }[] = [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold p-1 text-gray-900 dark:text-zinc-100">Reports & Analytics</h1>
                        <p className="text-[18px] text-gray-600 dark:text-zinc-400 p-1 mt-1">View detailed platform analytics and insights</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRange((r) => (r === '30d' ? '90d' : '30d'))}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            {range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                        </button>
                        <button
                            onClick={exportReport}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={metric.label} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] text-gray-600 dark:text-zinc-400 mb-1">{metric.label}</p>
                                            <p className="text-[28px] font-bold text-gray-900 dark:text-zinc-100">{metric.value}</p>
                                            <p className={`text-[14px] font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                                {metric.change} from last month
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${metric.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* User Growth Chart */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">User Growth</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600 dark:text-zinc-400">Monthly user growth trend</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 font-medium">
                                            <BarChart3 className="w-5 h-5" />
                                            New users
                                        </div>
                                        <div className="text-[14px] text-gray-600 dark:text-zinc-400">
                                            Total: {userGrowth.reduce((sum, v) => sum + v.value, 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="mt-6 h-[220px] flex items-end gap-3">
                                        {userGrowth.map((point) => {
                                            const max = Math.max(...userGrowth.map((p) => p.value));
                                            const height = max ? Math.round((point.value / max) * 100) : 0;
                                            return (
                                                <div key={point.label} className="flex-1 flex flex-col items-center gap-2">
                                                    <div className="w-full flex-1 flex items-end">
                                                        <div
                                                            className="w-full rounded-md bg-blue-600/80"
                                                            style={{ height: `${height}%` }}
                                                            title={`${point.value} new users`}
                                                        />
                                                    </div>
                                                    <div className="text-[12px] text-gray-600 dark:text-zinc-400">{point.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Removed revenue chart per request */}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Top Courses */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">Top Courses</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600 dark:text-zinc-400">By enrollment count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topCourses.map((course, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                            <div className="flex-1">
                                                <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">{course.name}</p>
                                                <p className="text-[12px] text-gray-600 dark:text-zinc-400">{course.enrollments} enrollments</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-gray-600 dark:text-zinc-400">Top performer</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">Recent Activity</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600 dark:text-zinc-400">Latest platform events</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'course' ? 'bg-blue-100' :
                                                activity.type === 'user' ? 'bg-green-100' :
                                                    activity.type === 'completion' ? 'bg-purple-100' :
                                                        activity.type === 'enrollment' ? 'bg-orange-100' :
                                                            'bg-gray-100'
                                                }`}>
                                                <Activity className={`w-4 h-4 ${activity.type === 'course' ? 'text-blue-600' :
                                                    activity.type === 'user' ? 'text-green-600' :
                                                        activity.type === 'completion' ? 'text-purple-600' :
                                                            activity.type === 'enrollment' ? 'text-orange-600' :
                                                                'text-gray-600'
                                                    }`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">{activity.action}</p>
                                                <p className="text-[12px] text-gray-600 dark:text-zinc-400">{activity.user}</p>
                                                <p className="text-[12px] text-gray-500 dark:text-zinc-500">{activity.time}</p>
                                            </div>
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

