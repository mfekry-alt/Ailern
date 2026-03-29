import { useState } from 'react';
import {
    Download, Calendar, TrendingUp, DollarSign, Users,
    BookOpen, Award, FileText, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Mock Data ---
const revenueData = [
    { month: 'Jan', revenue: 12500, profit: 9800 },
    { month: 'Feb', revenue: 15800, profit: 12000 },
    { month: 'Mar', revenue: 14200, profit: 11000 },
    { month: 'Apr', revenue: 22400, profit: 18500 },
    { month: 'May', revenue: 28900, profit: 23000 },
    { month: 'Jun', revenue: 35600, profit: 29000 },
];

const engagementData = [
    { week: 'W1', completions: 450, dropouts: 120 },
    { week: 'W2', completions: 520, dropouts: 90 },
    { week: 'W3', completions: 610, dropouts: 105 },
    { week: 'W4', completions: 850, dropouts: 80 },
];

const topCourses = [
    { id: 1, title: 'Complete Web Development Bootcamp', instructor: 'Dr. Ahmed', revenue: '$14,500', enrollments: 1250, rating: 4.9 },
    { id: 2, title: 'Advanced Machine Learning', instructor: 'Sarah Jenkins', revenue: '$9,800', enrollments: 840, rating: 4.8 },
    { id: 3, title: 'UI/UX Design Masterclass', instructor: 'Mike Ross', revenue: '$7,200', enrollments: 620, rating: 4.7 },
    { id: 4, title: 'Python for Finance', instructor: 'Emma Stone', revenue: '$5,400', enrollments: 410, rating: 4.6 },
];

export const AdminReportsPage = () => {
    const [dateRange, setDateRange] = useState('Last 6 Months');
    const [reportType, setReportType] = useState('Financial');

    const stats = [
        { label: 'Total Revenue', value: '$129,400', trend: '+24.5%', isUp: true, icon: DollarSign, color: 'emerald' },
        { label: 'Active Enrollments', value: '14,250', trend: '+12.2%', isUp: true, icon: Users, color: 'blue' },
        { label: 'Avg. Completion Rate', value: '68%', trend: '-2.4%', isUp: false, icon: Award, color: 'purple' },
        { label: 'Total Courses Sold', value: '8,420', trend: '+18.1%', isUp: true, icon: BookOpen, color: 'amber' },
    ];

    const exportPDF = () => {
        alert("Generating PDF Report...");
        // Logic to generate and download PDF
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Header --- */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-8 h-8 text-purple-600" /> Analytics & Reports
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Deep dive into financial metrics, user engagement, and course performance.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-5 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all cursor-pointer shadow-sm appearance-none min-w-[160px]"
                        >
                            <option>Last 30 Days</option>
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                            <option>All Time</option>
                        </select>

                        <button onClick={exportPDF} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/25 text-sm active:scale-95 shrink-0">
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                    </div>
                </div>

                {/* --- Report Type Toggles --- */}
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {['Financial', 'Engagement', 'Course Performance'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setReportType(type)}
                            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap border-2 ${reportType === type
                                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25'
                                    : 'bg-white dark:bg-slate-800/50 border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {type} Reports
                        </button>
                    ))}
                </div>

                {/* --- KPI Stats Grid --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-purple-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-[1.2rem] bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shadow-inner`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                    {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stat.trend}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Revenue Area Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Revenue Growth</h2>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Gross revenue vs Net profit</p>
                            </div>
                            <button className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                <Filter className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontWeight: 'bold' }} formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : value} />
                                    <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Bar Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Student Engagement</h2>
                            <p className="text-xs font-semibold text-gray-500 mt-1">Course completions vs Dropouts (Weekly)</p>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip cursor={{ fill: '#334155', opacity: 0.1 }} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                    <Bar dataKey="completions" name="Completed" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                                    <Bar dataKey="dropouts" name="Dropped Out" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- Top Performing Courses Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Top Performing Courses</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1">Based on revenue and enrollments</p>
                        </div>
                        <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                            View Full List
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Course Name</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Enrollments</th>
                                    <th className="py-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {topCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                                                    #{course.id}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{course.title}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Award className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="text-[11px] font-bold text-gray-500">{course.rating} Avg Rating</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">{course.instructor}</p>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                                <Users className="w-3.5 h-3.5" /> {course.enrollments.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{course.revenue}</p>
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