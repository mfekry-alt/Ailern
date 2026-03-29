import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Search, Edit, Trash2, Filter, Download, Plus,
    BookOpen, CheckCircle2, AlertTriangle, Eye, Video,
    Users, Star, TrendingUp, Archive
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Mock Data ---
const enrollmentTrends = [
    { month: 'Jan', enrollments: 1200 }, { month: 'Feb', enrollments: 1900 },
    { month: 'Mar', enrollments: 1500 }, { month: 'Apr', enrollments: 2800 },
    { month: 'May', enrollments: 3200 }, { month: 'Jun', enrollments: 4100 },
];

const categoryDistribution = [
    { name: 'Programming', value: 45, color: '#3b82f6' },
    { name: 'Design', value: 25, color: '#10b981' },
    { name: 'Business', value: 20, color: '#8b5cf6' },
    { name: 'Marketing', value: 10, color: '#f59e0b' },
];

const initialCourses = [
    { id: 101, title: 'Complete React Developer in 2024', category: 'Programming', instructor: 'Dr. Ahmed', status: 'Published', students: 1250, rating: 4.8, price: '$49.99' },
    { id: 102, title: 'UI/UX Design Masterclass', category: 'Design', instructor: 'Sarah Jenkins', status: 'Published', students: 840, rating: 4.9, price: '$59.99' },
    { id: 103, title: 'Python for Data Science', category: 'Programming', instructor: 'Dr. Ahmed', status: 'Draft', students: 0, rating: 0, price: 'Free' },
    { id: 104, title: 'Digital Marketing 101', category: 'Marketing', instructor: 'Mike Ross', status: 'Archived', students: 320, rating: 4.2, price: '$29.99' },
    { id: 105, title: 'Business Administration', category: 'Business', instructor: 'Emma Stone', status: 'Published', students: 2100, rating: 4.7, price: '$89.99' },
];

export const AdminCoursesPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courses, setCourses] = useState(initialCourses);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const toggleStatus = (id: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'Published' ? 'Draft' : currentStatus === 'Draft' ? 'Published' : 'Published';
        setCourses(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        showToast(`Course status updated to ${nextStatus}.`);
    };

    const deleteCourse = (id: number) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
        setCourses(prev => prev.filter(c => c.id !== id));
        showToast('Course deleted permanently.', 'error');
    };

    const filteredCourses = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return courses.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [courses, searchQuery, statusFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
            case 'Draft': return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700';
            case 'Archived': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
            default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const stats = [
        { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'blue' },
        { label: 'Published', value: courses.filter(c => c.status === 'Published').length, icon: CheckCircle2, color: 'emerald' },
        { label: 'Total Enrollments', value: '14.5k', icon: Users, color: 'purple' },
        { label: 'Avg Rating', value: '4.7', icon: Star, color: 'amber' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Toast Notification --- */}
                {statusMessage && (
                    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
                        <div className={`px-6 py-3 rounded-full border backdrop-blur-md font-bold text-sm flex items-center gap-2 shadow-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {statusMessage.text}
                        </div>
                    </div>
                )}

                {/* --- Header --- */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Video className="w-8 h-8 text-blue-600" /> Course Management
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Oversee platform content, review drafts, and track course metrics.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-2xl font-bold transition-all text-sm shadow-sm">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 text-sm active:scale-95">
                            <Plus className="w-4 h-4" /> New Course
                        </button>
                    </div>
                </div>

                {/* --- Stats Grid --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4 group hover:shadow-lg hover:border-blue-500/30 transition-all">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Enrollments Chart */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Enrollment Trends
                                </h2>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Platform-wide student enrollments over time</p>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={enrollmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontWeight: 'bold' }} />
                                    <Area type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEnroll)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Categories Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Content Distribution</h2>
                            <p className="text-xs font-semibold text-gray-500 mt-1">Courses by category</p>
                        </div>
                        <div className="h-[220px] w-full flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {categoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {categoryDistribution.map((d) => (
                                <div key={d.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase truncate">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Filters & Search --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search courses by title or instructor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex w-full lg:w-auto gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all cursor-pointer shadow-sm appearance-none min-w-[150px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                            <option value="Archived">Archived</option>
                        </select>

                        <button className="px-4 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                    </div>
                </div>

                {/* --- Courses Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Course Info</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Metrics</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{course.title}</p>
                                                    <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">{course.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {course.instructor.split(' ')[0][0]}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{course.instructor}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusBadge(course.status)}`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300 text-sm font-bold">
                                                    <Users className="w-4 h-4 text-blue-500" /> {course.students}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300 text-sm font-bold">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {course.rating || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 rounded-xl transition-colors" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-600 rounded-xl transition-colors" title="Edit Course">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => toggleStatus(course.id, course.status)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 rounded-xl transition-colors" title="Toggle Status">
                                                    {course.status === 'Published' ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => deleteCourse(course.id)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 text-gray-500 rounded-xl transition-colors" title="Delete Course">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredCourses.length === 0 && (
                        <div className="text-center py-20 bg-gray-50/30 dark:bg-slate-900/30">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No courses found</h3>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};