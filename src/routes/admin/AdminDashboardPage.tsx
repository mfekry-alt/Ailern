import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services';
import type { AdminDashboardData, TopCourseDto, UserGrowthMonthDto } from '@/types/api.types';
import {
    Users, BookOpen, GraduationCap, Settings, Download,
    BarChart3, MessageSquare, Award, ShieldCheck, Layers,
    TrendingUp, UserCheck, Crown
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    LineChart, Line, PieChart, Pie, Cell, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Colors for charts
const CHART_COLORS = {
    students: '#3B82F6',
    instructors: '#10B981',
    admins: '#8B5CF6',
    courses: '#F59E0B',
    enrollments: '#EC4899',
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const StatCard = ({ label, value, icon: Icon, color, bgColor }: StatCardProps) => (
    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all group">
        <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center ${color} group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
        </div>
    </div>
);

// Skeleton loader for stat cards
const StatCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-700" />
            <div className="space-y-2">
                <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
        </div>
    </div>
);

// Format number with commas
const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

export const AdminDashboardPage = () => {
    const navigate = useNavigate();

    // Fetch admin dashboard data
    const { data: dashboardData, isLoading, error } = useQuery<AdminDashboardData>({
        queryKey: ['admin', 'dashboard'],
        queryFn: () => dashboardService.getAdminDashboard(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const exportReport = () => {
        if (!dashboardData) return;

        const csvData = [
            ['Metric', 'Value'],
            ['Total Students', dashboardData.totalStudents],
            ['Total Instructors', dashboardData.totalInstructors],
            ['Total Admins', dashboardData.totalAdmins],
            ['Total Courses', dashboardData.totalCourses],
            ['Total Enrollments', dashboardData.totalEnrollments],
            [],
            ['Top Courses'],
            ['Rank', 'Course Name', 'Instructor', 'Students'],
            ...dashboardData.topCourses.map((course, idx) => [idx + 1, course.courseName, course.instructorName, course.totalStudents]),
        ];

        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "admin_dashboard_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10">
                <div className="max-w-[1920px] mx-auto space-y-8">
                    {/* Header Skeleton */}
                    <div className="h-24 bg-white dark:bg-slate-800/40 rounded-[2.5rem] animate-pulse" />
                    
                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </div>

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="h-[400px] bg-white dark:bg-slate-800/40 rounded-[2.5rem] animate-pulse" />
                        <div className="h-[400px] bg-white dark:bg-slate-800/40 rounded-[2.5rem] animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800/40 p-8 rounded-2xl border border-red-200 dark:border-red-700/50 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to Load Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                        {error instanceof Error ? error.message : 'An error occurred while fetching dashboard data.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const data = dashboardData!;
    const totalUsers = data.totalStudents + data.totalInstructors;

    // User Demographics Data for Pie Chart
    const userDemographicsData = [
        { name: 'Students', value: data.totalStudents, color: CHART_COLORS.students },
        { name: 'Instructors', value: data.totalInstructors, color: CHART_COLORS.instructors },
        { name: 'Admins', value: data.totalAdmins, color: CHART_COLORS.admins },
    ].filter(item => item.value > 0); // Filter out zero values

    // User Growth Data for Line Chart
    const userGrowthData = data.userGrowthPerMonths || [];

    // Top 3 Courses
    const topThreeCourses = (data.topCourses || []).slice(0, 3);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-blue-600" /> Admin Control Center
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Overview of platform health, user activity, and course metrics.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={exportReport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-2xl font-bold transition-all text-sm">
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                        <button onClick={() => navigate(ROUTES.ADMIN_SETTINGS)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 text-sm active:scale-95">
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                    </div>
                </div>

                {/* --- Summary Cards (3 cards as requested) --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        label="Total Courses"
                        value={formatNumber(data.totalCourses)}
                        icon={Layers}
                        color="text-amber-500"
                        bgColor="bg-amber-500/10"
                    />
                    <StatCard
                        label="Total Enrollments"
                        value={formatNumber(data.totalEnrollments)}
                        icon={GraduationCap}
                        color="text-pink-500"
                        bgColor="bg-pink-500/10"
                    />
                    <StatCard
                        label="Total Users"
                        value={formatNumber(totalUsers)}
                        icon={UserCheck}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                    />
                </div>

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* User Growth Line Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">User Growth</h2>
                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                                    Monthly new students and instructors
                                </p>
                            </div>
                            <button className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                <BarChart3 className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            {userGrowthData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: '#64748b' }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: '#64748b' }} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                color: '#fff', 
                                                fontWeight: 'bold' 
                                            }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '15px' }}
                                            iconType="circle"
                                            iconSize={10}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="studentsCount" 
                                            name="Students" 
                                            stroke={CHART_COLORS.students} 
                                            strokeWidth={3} 
                                            dot={{ r: 4, fill: CHART_COLORS.students }} 
                                            activeDot={{ r: 8 }}
                                            animationDuration={1000}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="instructorsCount" 
                                            name="Instructors" 
                                            stroke={CHART_COLORS.instructors} 
                                            strokeWidth={3} 
                                            dot={{ r: 4, fill: CHART_COLORS.instructors }} 
                                            activeDot={{ r: 8 }}
                                            animationDuration={1000}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">No growth data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Demographics Donut Pie Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">User Demographics</h2>
                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
                                    Distribution by user role
                                </p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            {userDemographicsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={userDemographicsData} 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={70} 
                                            outerRadius={100} 
                                            paddingAngle={3} 
                                            dataKey="value"
                                            animationDuration={1000}
                                            animationBegin={0}
                                        >
                                            {userDemographicsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                color: '#fff',
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(value, name) => [`${formatNumber(value as number || 0)}`, name as string]}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '15px' }}
                                            iconSize={10}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">No user data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Top Courses Section --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-200 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Crown className="w-6 h-6 text-amber-500" /> Top Courses
                            </h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">
                                Best performing courses by enrollment
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate(ROUTES.ADMIN_COURSES)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="p-8">
                        {topThreeCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {topThreeCourses.map((course, index) => {
                                    const rank = index + 1;
                                    const rankColors = [
                                        'bg-amber-100 text-amber-700 border-amber-200',
                                        'bg-slate-100 text-slate-700 border-slate-200',
                                        'bg-orange-100 text-orange-700 border-orange-200',
                                    ];
                                    const rankIcons = [
                                        <Crown key="1" className="w-5 h-5 text-amber-600" />,
                                        <Award key="2" className="w-5 h-5 text-slate-600" />,
                                        <TrendingUp key="3" className="w-5 h-5 text-orange-600" />,
                                    ];

                                    return (
                                        <div 
                                            key={index} 
                                            className="relative bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-gray-100 dark:border-slate-700/30 hover:shadow-lg hover:border-blue-500/20 transition-all group"
                                        >
                                            {/* Rank Badge */}
                                            <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center border-2 font-black text-lg ${rankColors[index] || rankColors[2]}`}>
                                                #{rank}
                                            </div>

                                            <div className="pt-2">
                                                {/* Course Name */}
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {course.courseName}
                                                </h3>

                                                {/* Instructor */}
                                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                                    by {course.instructorName}
                                                </p>

                                                {/* Student Count Badge */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">
                                                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                            {formatNumber(course.totalStudents)} students
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-300 dark:text-slate-600">
                                                        {rankIcons[index]}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-slate-400">No course data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};