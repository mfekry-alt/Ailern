import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/api/services';
import {
    Users, BookOpen, TrendingUp, CheckCircle, Download,
    Settings, BarChart3, MessageSquare, Award, Activity, ShieldCheck
} from 'lucide-react';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Mock Data for Charts & Activity ---
const activityData = [
    { name: 'Mon', visits: 4000, enrollments: 2400 },
    { name: 'Tue', visits: 3000, enrollments: 1398 },
    { name: 'Wed', visits: 2000, enrollments: 9800 },
    { name: 'Thu', visits: 2780, enrollments: 3908 },
    { name: 'Fri', visits: 1890, enrollments: 4800 },
    { name: 'Sat', visits: 2390, enrollments: 3800 },
    { name: 'Sun', visits: 3490, enrollments: 4300 },
];

const userDistribution = [
    { name: 'Students', value: 8500, color: '#3b82f6' },
    { name: 'Instructors', value: 450, color: '#10b981' },
    { name: 'Admins', value: 12, color: '#8b5cf6' },
];

interface Stat {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
    change: string;
    isUp: boolean;
}

interface ActivityLog {
    id: number;
    activity: string;
    user: string;
    timestamp: string;
    type: 'enrollment' | 'course_creation' | 'completion' | 'security';
}

const mockRecentActivity: ActivityLog[] = [
    { id: 1, activity: 'New course created: Advanced React', user: 'Dr. Ahmed', timestamp: '10 mins ago', type: 'course_creation' },
    { id: 2, activity: 'Mass enrollment in Python 101', user: 'System', timestamp: '1 hour ago', type: 'enrollment' },
    { id: 3, activity: 'Security scan completed', user: 'Admin Router', timestamp: '3 hours ago', type: 'security' },
    { id: 4, activity: 'Graduated 150 students', user: 'System', timestamp: 'Yesterday', type: 'completion' },
];

export const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stat[]>([]);

    // Fetch real data (Courses)
    const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
        queryKey: ['admin', 'courses', 'stats'],
        queryFn: () => courseService.getAllCourses({ PageNumber: 1, PageSize: 500 }),
    });

    const totalCourses = coursesData?.totalResults ?? 0;

    useEffect(() => {
        setStats([
            { label: 'Total Students', value: '8,500', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10', change: '+12%', isUp: true },
            { label: 'Active Instructors', value: '450', icon: BookOpen, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', change: '+5%', isUp: true },
            { label: 'Total Courses', value: totalCourses || '...', icon: Award, color: 'text-purple-500', bgColor: 'bg-purple-500/10', change: '+2', isUp: true },
            { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-amber-500', bgColor: 'bg-amber-500/10', change: 'Stable', isUp: true },
        ]);
    }, [totalCourses]);

    const exportReport = () => {
        const csv = 'Type,Activity,User,Timestamp\n' +
            mockRecentActivity.map(a => `${a.type},"${a.activity}","${a.user}",${a.timestamp}`).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "admin_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoadingCourses) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-slate-400 font-bold tracking-widest uppercase">Loading Dashboard...</p>
            </div>
        </div>
    );

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

                {/* --- KPI Stats Grid --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-[1.2rem] ${stat.bgColor} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                    <TrendingUp className={`w-3 h-3 ${!stat.isUp && 'rotate-180'}`} /> {stat.change}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Charts & Actions Section --- */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Main Chart */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Platform Traffic</h2>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Weekly visits vs new enrollments</p>
                            </div>
                            <button className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                <BarChart3 className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontWeight: 'bold' }} />
                                    <Line type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#3b82f6' }} />
                                    <Line type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column: User Distribution & Quick Links */}
                    <div className="space-y-8">
                        {/* Pie Chart */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col items-center">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white w-full text-left mb-2">User Demographics</h2>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                            {userDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 w-full justify-center mt-2">
                                {userDistribution.map((d) => (
                                    <div key={d.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Users', icon: Users, color: 'blue', route: ROUTES.ADMIN_USERS },
                                { label: 'Courses', icon: BookOpen, color: 'green', route: ROUTES.ADMIN_COURSES },
                                { label: 'Reports', icon: BarChart3, color: 'purple', route: ROUTES.ADMIN_REPORTS },
                                { label: 'Messages', icon: MessageSquare, color: 'orange', route: '#' }, // Placeholder
                            ].map((btn) => (
                                <button
                                    key={btn.label}
                                    onClick={() => navigate(btn.route)}
                                    className="flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[2rem] hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 group"
                                >
                                    <btn.icon className={`w-8 h-8 text-${btn.color}-500 group-hover:scale-110 transition-transform`} />
                                    <span className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Recent Activity Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-200 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">System Logs</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">Live feed of platform events</p>
                        </div>
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Initiator</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {mockRecentActivity.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-5 px-8">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{log.activity}</p>
                                        </td>
                                        <td className="py-5 px-8">
                                            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">{log.user}</p>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${log.type === 'enrollment' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' :
                                                    log.type === 'course_creation' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                                        log.type === 'security' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                                                            'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                                                }`}>
                                                {log.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{log.timestamp}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};