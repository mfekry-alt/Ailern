import { useState, useMemo } from 'react';
import { 
    Users, CheckCircle, BarChart3, Clock, Download, 
    Search, TrendingUp, AlertTriangle, BookOpen, 
    FileText, HelpCircle, Award, Star, EyeOff, Eye
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { 
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
    ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// --- Mock Data ---
const coursesData = [
    { id: '1', title: 'Machine Learning Basics', students: 450, ratings: 4.8, completionRate: 85 },
    { id: '2', title: 'Advanced Data Structures', students: 320, ratings: 4.5, completionRate: 72 },
    { id: '3', title: 'JavaScript Mastery', students: 510, ratings: 4.9, completionRate: 90 },
    { id: '4', title: 'React Performance', students: 280, ratings: 4.6, completionRate: 78 },
];

const studentsData = [
    { id: '1', name: 'Alex Kim', email: 'alex@example.com', course: 'Machine Learning Basics', progress: 92, grade: 'A', status: 'Exceling', gradePoints: 3.9, dateEnrolled: '2023-01-15' },
    { id: '2', name: 'Jordan Miles', email: 'jordan@example.com', course: 'Advanced Data Structures', progress: 45, grade: 'C-', status: 'At Risk', gradePoints: 2.1, dateEnrolled: '2023-02-20' },
    { id: '3', name: 'Taylor Smith', email: 'taylor@example.com', course: 'JavaScript Mastery', progress: 78, grade: 'B', status: 'On Track', gradePoints: 3.2, dateEnrolled: '2023-01-10' },
    { id: '4', name: 'Morgan Lee', email: 'morgan@example.com', course: 'React Performance', progress: 88, grade: 'B+', status: 'On Track', gradePoints: 3.4, dateEnrolled: '2023-03-05' },
    { id: '5', name: 'Casey Jones', email: 'casey@example.com', course: 'JavaScript Mastery', progress: 30, grade: 'F', status: 'At Risk', gradePoints: 1.2, dateEnrolled: '2023-02-15' },
];

const quizzesData = [
    { id: '1', title: 'Midterm Exam: Neural Networks', course: 'ML101', avgScore: 82, passRate: 90, totalAttempts: 145, difficulty: 'Hard' },
    { id: '2', title: 'Week 3: Binary Trees', course: 'CS202', avgScore: 65, passRate: 60, totalAttempts: 110, difficulty: 'Medium' },
    { id: '3', title: 'HTML & CSS Basics', course: 'WEB101', avgScore: 94, passRate: 98, totalAttempts: 200, difficulty: 'Easy' },
];

const assignmentsData = [
    { id: '1', title: 'Project Phase 1: Data Cleaning', course: 'Machine Learning Basics', submitted: 120, pending: 10, graded: 100, late: 5 },
    { id: '2', title: 'Implement AVL Tree', course: 'Advanced Data Structures', submitted: 85, pending: 25, graded: 50, late: 12 },
    { id: '3', title: 'Responsive Portfolio', course: 'JavaScript Mastery', submitted: 190, pending: 5, graded: 190, late: 2 },
];

// --- Recharts Data Formats ---
const gradePieData = [
    { name: 'Grade A', value: 35, color: '#10b981' },
    { name: 'Grade B', value: 40, color: '#3b82f6' },
    { name: 'Grade C', value: 15, color: '#eab308' },
    { name: 'Grade D', value: 7, color: '#f97316' },
    { name: 'Grade F', value: 3, color: '#ef4444' },
];

const enrollmentsLineData = [
    { month: 'Jan', students: 120 }, { month: 'Feb', students: 250 },
    { month: 'Mar', students: 180 }, { month: 'Apr', students: 390 },
    { month: 'May', students: 300 }, { month: 'Jun', students: 550 },
];

const submissionsAreaData = [
    { week: 'Week 1', submissions: 45 }, { week: 'Week 2', submissions: 85 },
    { week: 'Week 3', submissions: 65 }, { week: 'Week 4', submissions: 110 },
];

const studentComposedData = [
    { student: 'Alex', grade: 92, engagement: 85 },
    { student: 'Jordan', grade: 45, engagement: 30 },
    { student: 'Taylor', grade: 78, engagement: 80 },
    { student: 'Morgan', grade: 88, engagement: 95 },
    { student: 'Casey', grade: 30, engagement: 20 },
];

// Custom Tooltip for Glassmorphism look
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 p-3 rounded-xl shadow-xl">
                <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-semibold flex items-center gap-2" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


export const InstructorStatisticsPage = () => {
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState<'Students' | 'Quizzes' | 'Assignments' | 'Courses'>('Students');
    const [timeRange, setTimeRange] = useState('This Month');
    const [searchQuery, setSearchQuery] = useState('');
    const [showStats, setShowStats] = useState(true);

    // --- Export Logic ---
    const handleExportProgress = () => {
        const headers = ['Student Name', 'Course', 'Progress (%)', 'Grade', 'Status'];
        const rows = studentsData.map(s => [s.name, s.course, s.progress, s.grade, s.status]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        downloadCSV(csvContent, 'Student_Progress_Report.csv');
    };

    const handleExportCSV = () => {
        let headers: string[] = []; let rows: any[] = []; let filename = '';
        if (activeTab === 'Students') {
            headers = ['Name', 'Email', 'Course', 'Progress (%)', 'Grade', 'Status'];
            rows = studentsData.map(s => [s.name, s.email, s.course, s.progress, s.grade, s.status]);
            filename = 'Students_Analytics.csv';
        } else if (activeTab === 'Quizzes') {
            headers = ['Quiz Title', 'Course', 'Avg Score (%)', 'Pass Rate (%)', 'Total Attempts'];
            rows = quizzesData.map(q => [q.title, q.course, q.avgScore, q.passRate, q.totalAttempts]);
            filename = 'Quizzes_Analytics.csv';
        } else if (activeTab === 'Assignments') {
            headers = ['Assignment Title', 'Course', 'Submitted', 'Pending', 'Graded', 'Late Submissions'];
            rows = assignmentsData.map(a => [a.title, a.course, a.submitted, a.pending, a.graded, a.late]);
            filename = 'Assignments_Analytics.csv';
        } else {
            headers = ['Course Title', 'Students', 'Rating', 'Completion Rate (%)'];
            rows = coursesData.map(c => [c.title, c.students, c.ratings, c.completionRate]);
            filename = 'Courses_Analytics.csv';
        }
        const csvContent = [headers.join(','), ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
        downloadCSV(csvContent, filename);
    };

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };


    // --- TABS CONTENT ---
    const renderStudentsTab = () => {
        const filteredStudents = studentsData.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.course.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* 1. Pie Chart - Grade Distribution */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Grade Distribution (Pie)</h3>
                        <p className="text-xs text-gray-500 mb-2">Percentage of students across grade brackets.</p>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie data={gradePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" animationDuration={1500}>
                                    {gradePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* 2. Column-Line Chart - Engagement vs Grades */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Engagement vs Grades (Col-Line)</h3>
                        <p className="text-xs text-gray-500 mb-2">Comparing engagement (yellow line) to grades (blue bars).</p>
                        <ResponsiveContainer width="100%" height="85%">
                            <ComposedChart data={studentComposedData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="student" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="grade" name="Grade (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308', strokeWidth: 2, stroke: '#fff' }} animationDuration={1500} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Progress Tracking</h3>
                            <p className="text-sm text-gray-500 mt-1">Monitor individual student performance and risk status.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full text-gray-900 dark:text-white" />
                            </div>
                            <button onClick={handleExportProgress} className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors shrink-0 flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Export Progress
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Student</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Course</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Progress</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">{s.name.charAt(0)}</div>
                                            <div><p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p><p className="text-[10px] text-gray-500 dark:text-slate-400">{s.email}</p></div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 font-medium whitespace-nowrap">{s.course}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${s.progress < 50 ? 'bg-red-500' : s.progress < 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${s.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{s.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${s.status === 'Exceling' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : s.status === 'At Risk' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'}`}>{s.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuizzesTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* 3. Column Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quiz Performance by Course (Column)</h3>
                        <p className="text-xs text-gray-500 mb-2">Comparing Avg Score (Blue) vs Pass Rate (Green).</p>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={quizzesData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="avgScore" name="Avg Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 4. Line Chart */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">New Enrollments (Line)</h3>
                        <p className="text-xs text-gray-500 mb-2">Monthly trend of students participating in quizzes.</p>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={enrollmentsLineData} margin={{ top: 20, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="students" name="Students" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} animationDuration={1500} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Detailed Quizzes Stats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzesData.map((quiz) => (
                            <div key={quiz.id} className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md hover:border-purple-300 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">{quiz.course}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${quiz.difficulty === 'Hard' ? 'text-red-600 bg-red-50 border-red-200' : quiz.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>{quiz.difficulty}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-4 line-clamp-2 h-12">{quiz.title}</h4>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 text-center">
                                        <p className="text-[10px] font-bold uppercase text-gray-500">Avg Score</p>
                                        <p className={`text-xl font-black ${quiz.avgScore < 70 ? 'text-red-500' : 'text-blue-600'}`}>{quiz.avgScore}%</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 text-center">
                                        <p className="text-[10px] font-bold uppercase text-gray-500">Pass Rate</p>
                                        <p className="text-xl font-black text-emerald-500">{quiz.passRate}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderAssignmentsTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 5. Area Chart */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Submission Rates over Time (Area)</h3>
                    <p className="text-xs text-gray-500 mb-2">Volume of assignments submitted per week.</p>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={submissionsAreaData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubmissions)" animationDuration={1500} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Pending Grading</h3>
                    <div className="space-y-4">
                        {assignmentsData.map((a) => (
                            <div key={a.id} className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">{a.course}</p>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{a.title}</h4>
                                </div>
                                <div className="flex items-center gap-5 shrink-0">
                                    <div className="text-center"><p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{a.pending}</p><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">Pending</p></div>
                                    <div className="text-center"><p className="text-2xl font-black text-red-500 leading-none">{a.late}</p><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">Late</p></div>
                                    <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-amber-500/25 active:scale-95 ml-2">Grade Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderCoursesTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 6. Bar Chart (Horizontal) */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Student Enrollment (Bar)</h3>
                        <p className="text-xs text-gray-500 mb-2">Compare active student counts across courses.</p>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart layout="vertical" data={coursesData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="students" name="Students" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* KPI cards inside the tab */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Courses', value: '12', icon: BookOpen, color: 'blue' },
                            { label: 'Avg Rating', value: '4.7', icon: Star, color: 'amber' },
                            { label: 'Completion', value: '81%', icon: CheckCircle, color: 'emerald' },
                            { label: 'New Signups', value: '340', icon: Users, color: 'purple' },
                        ].map(kpi => renderKPI(kpi.label, kpi.value, kpi.icon, kpi.color))}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Courses Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coursesData.map(c => (
                            <div key={c.id} className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 hover:border-blue-300 transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-base text-gray-900 dark:text-white">{c.title}</h4>
                                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {c.students} Students</p>
                                </div>
                                <div className="flex items-center gap-4 text-center shrink-0 sm:border-l border-gray-200 dark:border-slate-700 sm:pl-5">
                                    <div><p className="text-lg font-black text-gray-900 dark:text-white leading-none">{c.completionRate}%</p><p className="text-[10px] font-bold text-gray-500 uppercase mt-1.5">Completion</p></div>
                                    <div className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-amber-600 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
                                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{c.ratings}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderKPI = (label: string, value: string | number, icon: any, color: string, trend?: string, trendPositive?: boolean) => {
        const Icon = icon;
        return (
            <div key={label} className={`bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                <div className={`absolute left-0 top-0 w-1.5 h-full bg-${color}-500`}></div>
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${trendPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                            {trend}
                        </span>
                    )}
                </div>
                <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-500" />
                            Statistics & Figures
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-2 text-lg">
                            Deep dive into comprehensive data analytics.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button 
                            onClick={() => setShowStats(!showStats)} 
                            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showStats ? 'Hide KPIs' : 'Show KPIs'}
                        </button>
                        <div className="bg-white dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm shrink-0 w-full sm:w-auto flex">
                            {['All Time', 'This Month', 'This Week'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        timeRange === range
                                            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-md'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 shrink-0 h-full min-h-[44px]"
                        >
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 p-2 bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm animate-fade-in">
                    {[{ id: 'Students', icon: Users, label: 'Students Analytics' }, { id: 'Quizzes', icon: HelpCircle, label: 'Quizzes Analytics' }, { id: 'Assignments', icon: FileText, label: 'Assignments Analytics' }, { id: 'Courses', icon: BookOpen, label: 'Courses Analytics' }].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 min-w-[180px] ${
                                    activeTab === tab.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Top KPI Cards (Toggleable) */}
                {showStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in slide-in-from-top-4 fade-in">
                        {activeTab === 'Students' && renderKPI('Active Students', '1,248', Users, 'blue', '+12%', true)}
                        {activeTab === 'Quizzes' && renderKPI('Avg Quiz Score', '76%', BarChart3, 'blue')}
                        {activeTab === 'Assignments' && renderKPI('Pending Grading', '124', Clock, 'amber')}
                        {activeTab === 'Courses' && renderKPI('Total Courses', '12', BookOpen, 'blue')}
                        {renderKPI('Exceling Students', '240', Users, 'emerald', '+5%', true)}
                        {renderKPI('Avg Pass Rate', '84%', CheckCircle, 'emerald')}
                        {renderKPI('Late Submissions', '45', AlertTriangle, 'red')}
                        {renderKPI('Study Hours', '3,210', Clock, 'amber', '+18%', true)}
                    </div>
                )}

                {/* Content */}
                {activeTab === 'Students' && renderStudentsTab()}
                {activeTab === 'Quizzes' && renderQuizzesTab()}
                {activeTab === 'Assignments' && renderAssignmentsTab()}
                {activeTab === 'Courses' && renderCoursesTab()}

            </div>
        </div>
    );
};