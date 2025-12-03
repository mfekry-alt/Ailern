import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { TrendingUp, Users, BookOpen, DollarSign, Download, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';

export const AdminReportsPage = () => {
    const metrics = [
        { label: 'Total Revenue', value: '$125,430', change: '+12.5%', icon: DollarSign, color: 'text-green-600' },
        { label: 'Active Users', value: '1,180', change: '+8.2%', icon: Users, color: 'text-blue-600' },
        { label: 'Course Completions', value: '2,450', change: '+15.3%', icon: BookOpen, color: 'text-purple-600' },
        { label: 'New Enrollments', value: '340', change: '+5.7%', icon: TrendingUp, color: 'text-orange-600' }
    ];

    const topCourses = [
        { name: 'Introduction to Computer Science', enrollments: 245, revenue: '$12,250' },
        { name: 'Data Structures and Algorithms', enrollments: 198, revenue: '$9,900' },
        { name: 'Linear Algebra', enrollments: 156, revenue: '$7,800' },
        { name: 'Introduction to Psychology', enrollments: 134, revenue: '$6,700' },
        { name: 'Classical Mechanics', enrollments: 98, revenue: '$4,900' }
    ];

    const recentActivity = [
        { action: 'New course published', user: 'Dr. Emily Carter', time: '2 hours ago', type: 'course' },
        { action: 'User registration', user: 'John Doe', time: '3 hours ago', type: 'user' },
        { action: 'Course completion', user: 'Sarah Johnson', time: '4 hours ago', type: 'completion' },
        { action: 'Payment received', user: 'Mike Brown', time: '5 hours ago', type: 'payment' },
        { action: 'New instructor joined', user: 'Dr. Lisa Chen', time: '6 hours ago', type: 'instructor' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-[18px] text-gray-600 mt-1">View detailed platform analytics and insights</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
                            <Calendar className="w-4 h-4" />
                            Last 30 Days
                        </button>
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
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
                                <CardDescription className="text-[16px] text-gray-600">Monthly user registration trend</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-[16px] text-gray-600 mb-2">User Growth Chart</p>
                                        <p className="text-[14px] text-gray-500">Chart visualization will be implemented here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue Chart */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-[20px] font-bold text-gray-900">Revenue Breakdown</CardTitle>
                                <CardDescription className="text-[16px] text-gray-600">Monthly revenue by course category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                        <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-[16px] text-gray-600 mb-2">Revenue Chart</p>
                                        <p className="text-[14px] text-gray-500">Chart visualization will be implemented here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                                <p className="text-[14px] font-bold text-gray-900">{course.revenue}</p>
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
                                                            activity.type === 'payment' ? 'bg-yellow-100' :
                                                                'bg-gray-100'
                                                }`}>
                                                <Activity className={`w-4 h-4 ${activity.type === 'course' ? 'text-blue-600' :
                                                        activity.type === 'user' ? 'text-green-600' :
                                                            activity.type === 'completion' ? 'text-purple-600' :
                                                                activity.type === 'payment' ? 'text-yellow-600' :
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

