import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import {
    Award, BookOpen, Download, Eye, Clock, CheckCircle, AlertCircle,
    Target, GraduationCap, ChevronDown, Inbox, MessageSquare, X, User
} from 'lucide-react';

interface Grade {
    id: string;
    assignmentName: string;
    course: string;
    instructor: string;
    pointsEarned: number;
    totalPoints: number;
    percentage: number;
    letterGrade: string;
    feedback: string;
    submittedAt: string;
    gradedAt: string;
    status: 'graded' | 'pending' | 'late';
}

interface CourseGrade {
    courseId: string;
    courseName: string;
    instructor: string;
    assignments: Grade[];
    overallGrade: number;
    letterGrade: string;
    credits: number;
}

export const GradesPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

    // TODO: Replace with actual data fetching
    const grades: Grade[] = [];
    const courseGrades: CourseGrade[] = [];

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-emerald-700 dark:text-emerald-400';
        if (percentage >= 80) return 'text-blue-700 dark:text-blue-400';
        if (percentage >= 70) return 'text-yellow-700 dark:text-yellow-400';
        if (percentage >= 60) return 'text-orange-700 dark:text-orange-400';
        return 'text-red-700 dark:text-red-400';
    };

    const getGradeBgColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
        if (percentage >= 80) return 'bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
        if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
        if (percentage >= 60) return 'bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
        return 'bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'graded': return CheckCircle;
            case 'pending': return Clock;
            case 'late': return AlertCircle;
            default: return Clock;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'graded': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
            case 'pending': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
            case 'late': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const filteredGrades = grades.filter(grade => {
        return selectedCourse === 'all' || grade.course.includes(selectedCourse);
    });

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

    const exportGrades = () => {
        if (filteredGrades.length === 0) return; // Add simple validation
        const rows = [
            ['Assignment Name', 'Course', 'Instructor', 'Points Earned', 'Total Points', 'Percentage', 'Letter Grade', 'Status', 'Graded At'],
            ...filteredGrades.map((g) => [
                g.assignmentName,
                g.course,
                g.instructor,
                String(g.pointsEarned),
                String(g.totalPoints),
                String(g.percentage),
                g.letterGrade,
                g.status,
                g.gradedAt,
            ]),
        ];

        const csv = rows
            .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        downloadText('grades-export.csv', csv);
    };

    const stats = [
        { label: 'Overall GPA', value: '0.0', icon: Award, color: 'purple' },
        { label: 'Courses Completed', value: '0', icon: BookOpen, color: 'blue' },
        { label: 'Credits Earned', value: '0', icon: Target, color: 'emerald' },
        { label: 'Graded Assignments', value: grades.filter(g => g.status === 'graded').length.toString(), icon: CheckCircle, color: 'amber' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-600/20 dark:border-indigo-500/30 shrink-0">
                            <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Grades & Feedback</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Track your academic progress and instructor feedback.</p>
                        </div>
                    </div>
                    <button
                        onClick={exportGrades}
                        disabled={filteredGrades.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 w-1 h-full bg-${stat.color}-500`}></div>
                                <div>
                                    <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                                </div>
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shrink-0`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-4 shadow-sm relative z-10">
                    <div className="flex-1 relative group">
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium cursor-pointer"
                        >
                            <option value="all">All Courses</option>
                            <option value="CS101">CS101 - Introduction to Programming</option>
                            <option value="CS202">CS202 - Data Structures</option>
                            <option value="MA203">MA203 - Linear Algebra</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative group">
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium cursor-pointer"
                        >
                            <option value="all">All Semesters</option>
                            <option value="fall2024">Fall 2024</option>
                            <option value="spring2024">Spring 2024</option>
                            <option value="summer2024">Summer 2024</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Course Grades Overview */}
                <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            Course Overview
                        </h2>

                        {courseGrades.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                <Target className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No course grades available yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {courseGrades.map((course) => (
                                    <div key={course.courseId} className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 hover:border-blue-200 dark:hover:border-slate-600 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{course.courseName}</h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Instructor: {course.instructor}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Overall Grade</p>
                                                    <p className={`text-xl font-black ${getGradeColor(course.overallGrade)}`}>{course.overallGrade}%</p>
                                                </div>
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-xl font-black border ${getGradeBgColor(course.overallGrade)} ${getGradeColor(course.overallGrade)}`}>
                                                    {course.letterGrade}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full relative"
                                                    style={{ width: `${course.overallGrade}%` }}
                                                >
                                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                            <span className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">{course.credits} Credits</span>
                                            <span className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">{course.assignments.length} Tasks</span>
                                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">{course.assignments.filter(a => a.status === 'graded').length} Graded</span>
                                            <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20">{course.assignments.filter(a => a.status === 'pending').length} Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Grades Table */}
                <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardContent className="p-0">
                        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-500" />
                                Assignment Grades
                            </h2>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
                                {filteredGrades.length} Records
                            </span>
                        </div>

                        {filteredGrades.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Grades Found</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm">There are no graded assignments matching your filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4">Assignment</th>
                                            <th className="px-6 py-4">Course</th>
                                            <th className="px-6 py-4">Grade</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Date Graded</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                        {filteredGrades.map((grade) => {
                                            const StatusIcon = getStatusIcon(grade.status);
                                            return (
                                                <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{grade.assignmentName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">{grade.instructor}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-medium">
                                                        {grade.course}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-black ${getGradeColor(grade.percentage)}`}>
                                                                {grade.percentage}%
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getGradeBgColor(grade.percentage)} ${getGradeColor(grade.percentage)}`}>
                                                                {grade.letterGrade}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
                                                            {grade.pointsEarned}/{grade.totalPoints} pts
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold capitalize border ${getStatusColor(grade.status)}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {grade.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                                        {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedGrade(grade)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mx-auto"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Feedback Section */}
                <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-amber-500" />
                            Recent Feedback
                        </h2>

                        {grades.filter(g => g.feedback && g.status === 'graded').length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                <MessageSquare className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium">No feedback available yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grades.filter(g => g.feedback && g.status === 'graded').map((grade) => (
                                    <div key={grade.id} className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {grade.assignmentName}
                                                </h3>
                                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                    {grade.course} • {new Date(grade.gradedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded-md text-[11px] font-bold border ${getGradeBgColor(grade.percentage)} ${getGradeColor(grade.percentage)}`}>
                                                {grade.letterGrade}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl">
                                            <p className="text-sm text-gray-700 dark:text-slate-300 italic">
                                                "{grade.feedback}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Grade Detail Modal */}
                {selectedGrade && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedGrade(null)} />

                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between bg-gray-50/50 dark:bg-slate-800/30">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{selectedGrade.course}</p>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Grade Details</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedGrade(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{selectedGrade.assignmentName}</h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Instructor: {selectedGrade.instructor}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Score</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                                            {selectedGrade.pointsEarned}<span className="text-base text-gray-400">/{selectedGrade.totalPoints}</span>
                                        </p>
                                        <p className={`text-sm font-bold mt-1 ${getGradeColor(selectedGrade.percentage)}`}>{selectedGrade.percentage}%</p>
                                    </div>
                                    <div className={`rounded-2xl border p-5 flex flex-col justify-center items-center text-center ${getGradeBgColor(selectedGrade.percentage)}`}>
                                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${getGradeColor(selectedGrade.percentage)}`}>Letter Grade</p>
                                        <p className={`text-4xl font-black ${getGradeColor(selectedGrade.percentage)}`}>{selectedGrade.letterGrade}</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" /> Instructor Feedback
                                    </p>
                                    {selectedGrade.feedback ? (
                                        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line italic">
                                            "{selectedGrade.feedback}"
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400 dark:text-slate-500 italic">No feedback provided.</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 shrink-0">
                                <button
                                    onClick={() => setSelectedGrade(null)}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-colors text-sm"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        const summary = [
                                            `Assignment: ${selectedGrade.assignmentName}`,
                                            `Course: ${selectedGrade.course}`,
                                            `Instructor: ${selectedGrade.instructor}`,
                                            `Score: ${selectedGrade.pointsEarned}/${selectedGrade.totalPoints} (${selectedGrade.percentage}%)`,
                                            `Letter: ${selectedGrade.letterGrade}`,
                                            `Status: ${selectedGrade.status}`,
                                            selectedGrade.gradedAt ? `Graded At: ${new Date(selectedGrade.gradedAt).toLocaleString()}` : '',
                                            '',
                                            `Feedback:`,
                                            selectedGrade.feedback || 'No feedback provided.',
                                        ].filter(Boolean).join('\n');
                                        downloadText(`grade-${selectedGrade.id}.txt`, summary);
                                    }}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Summary
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};