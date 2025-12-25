import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { TrendingUp, Users, BookOpen, Download, Calendar, BarChart3, Activity } from 'lucide-react';

export const AdminReportsPage = () => {
    const [range, setRange] = useState<'30d' | '90d'>('30d');

    const metrics = [
        { label: 'Active Users', value: '1,180', change: '+8.2%', icon: Users, color: 'text-blue-600' },
        { label: 'Course Completions', value: '2,450', change: '+15.3%', icon: BookOpen, color: 'text-purple-600' },
        { label: 'New Enrollments', value: '340', change: '+5.7%', icon: TrendingUp, color: 'text-orange-600' }
    ];

    const userGrowth = useMemo(() => {
        const base = range === '30d' ? [120, 150, 180, 210, 260, 310] : [540, 610, 720, 790, 860, 940];
        return [
            { label: 'Jan', value: base[0] },
            { label: 'Feb', value: base[1] },
            { label: 'Mar', value: base[2] },
            { label: 'Apr', value: base[3] },
            { label: 'May', value: base[4] },
            { label: 'Jun', value: base[5] },
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

    const topCourses = [
        { name: 'Introduction to Computer Science', enrollments: 245 },
        { name: 'Data Structures and Algorithms', enrollments: 198 },
        { name: 'Linear Algebra', enrollments: 156 },
        { name: 'Introduction to Psychology', enrollments: 134 },
        { name: 'Classical Mechanics', enrollments: 98 }
    ];

    const recentActivity = [
        { action: 'New course published', user: 'Dr. Emily Carter', time: '2 hours ago', type: 'course' },
        { action: 'Course completion', user: 'Sarah Johnson', time: '4 hours ago', type: 'completion' },
        { action: 'New enrollment', user: 'Mike Brown', time: '5 hours ago', type: 'enrollment' },
        { action: 'New instructor joined', user: 'Dr. Lisa Chen', time: '6 hours ago', type: 'instructor' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold p-1 text-gray-900">Reports & Analytics</h1>
                        <p className="text-[18px] text-gray-600 p-1 mt-1">View detailed platform analytics and insights</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRange((r) => (r === '30d' ? '90d' : '30d'))}
                            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
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
                                            <p className="text-[14px] text-gray-600 mb-1">{metric.label}</p>
                                            <p className="text-[28px] font-bold text-gray-900">{metric.value}</p>
                                            <p className={`text-[14px] font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                                {metric.change} from last month
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
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
                                <CardTitle className="text-[20px] font-bold text-gray-900">User Growth</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600">Monthly user growth trend</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 bg-gray-50 rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                                            <BarChart3 className="w-5 h-5" />
                                            New users
                                        </div>
                                        <div className="text-[14px] text-gray-600">
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
                                                    <div className="text-[12px] text-gray-600">{point.label}</div>
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
                                <CardTitle className="text-[20px] font-bold text-gray-900">Top Courses</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600">By enrollment count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topCourses.map((course, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="text-[14px] font-medium text-gray-900">{course.name}</p>
                                                <p className="text-[12px] text-gray-600">{course.enrollments} enrollments</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-gray-600">Top performer</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-[20px] font-bold text-gray-900">Recent Activity</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600">Latest platform events</CardDescription>
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
                                                <p className="text-[14px] font-medium text-gray-900">{activity.action}</p>
                                                <p className="text-[12px] text-gray-600">{activity.user}</p>
                                                <p className="text-[12px] text-gray-500">{activity.time}</p>
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

