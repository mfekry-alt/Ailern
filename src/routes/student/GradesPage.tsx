import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import {
    Award,
    BookOpen,
    Download,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    Target
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

    const grades: Grade[] = [];

    const courseGrades: CourseGrade[] = [];

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        if (percentage >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBgColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-green-100';
        if (percentage >= 80) return 'bg-blue-100';
        if (percentage >= 70) return 'bg-yellow-100';
        if (percentage >= 60) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'graded':
                return CheckCircle;
            case 'pending':
                return Clock;
            case 'late':
                return AlertCircle;
            default:
                return Clock;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'graded':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'late':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const filteredGrades = grades.filter(grade => {
        const courseMatch = selectedCourse === 'all' || grade.course.includes(selectedCourse);
        return courseMatch;
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
        const rows = [
            ['assignmentName', 'course', 'instructor', 'pointsEarned', 'totalPoints', 'percentage', 'letterGrade', 'status', 'gradedAt'],
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
        { label: 'Overall GPA', value: '0', icon: Award, color: 'text-purple-600' },
        { label: 'Courses Completed', value: '0', icon: BookOpen, color: 'text-blue-600' },
        { label: 'Credits Earned', value: '0', icon: Target, color: 'text-green-600' },
        { label: 'Assignments Graded', value: grades.filter(g => g.status === 'graded').length.toString(), icon: CheckCircle, color: 'text-orange-600' }
    ];



    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                            Grades & Feedback
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400 mt-1">
                            Track your academic progress and view instructor feedback
                        </p>
                    </div>
                    <button
                        onClick={exportGrades}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Export Grades
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-medium text-gray-600 dark:text-zinc-400 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Course Grades Overview */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 mb-6">
                            Course Grades Overview
                        </h2>
                        <div className="space-y-4">
                            {courseGrades.map((course) => (
                                <div key={course.courseId} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">
                                                {course.courseName}
                                            </h3>
                                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">
                                                Instructor: {course.instructor}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[14px] font-semibold ${getGradeBgColor(course.overallGrade)} ${getGradeColor(course.overallGrade)}`}>
                                                {course.letterGrade}
                                            </div>
                                            <p className="text-[12px] text-gray-600 dark:text-zinc-400 mt-1">
                                                {course.overallGrade}% • {course.credits} credits
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-[12px] text-gray-600 dark:text-zinc-400 mb-1">
                                            <span>Overall Progress</span>
                                            <span>{course.overallGrade}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getGradeBgColor(course.overallGrade).replace('bg-', 'bg-').replace('-100', '-500')}`}
                                                style={{ width: `${course.overallGrade}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Assignment Count */}
                                    <div className="flex items-center gap-4 text-[12px] text-gray-600 dark:text-zinc-400">
                                        <span>{course.assignments.length} assignments</span>
                                        <span>{course.assignments.filter(a => a.status === 'graded').length} graded</span>
                                        <span>{course.assignments.filter(a => a.status === 'pending').length} pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                >
                                    <option value="all">All Courses</option>
                                    <option value="CS101">CS101 - Introduction to Programming</option>
                                    <option value="CS202">CS202 - Data Structures</option>
                                    <option value="MA203">MA203 - Linear Algebra</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                >
                                    <option value="all">All Semesters</option>
                                    <option value="fall2024">Fall 2024</option>
                                    <option value="spring2024">Spring 2024</option>
                                    <option value="summer2024">Summer 2024</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Grades */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                            <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">
                                Assignment Grades
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Assignment
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Course
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Grade
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Status
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Graded
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGrades.map((grade, index) => {
                                        const StatusIcon = getStatusIcon(grade.status);
                                        return (
                                            <tr key={grade.id} className={`border-b border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${index === filteredGrades.length - 1 ? 'border-b-0' : ''}`}>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">
                                                            {grade.assignmentName}
                                                        </p>
                                                        <p className="text-[12px] text-gray-600 dark:text-zinc-400">
                                                            {grade.instructor}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    {grade.course}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[16px] font-bold ${getGradeColor(grade.percentage)}`}>
                                                            {grade.percentage}%
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-[12px] font-semibold ${getGradeBgColor(grade.percentage)} ${getGradeColor(grade.percentage)}`}>
                                                            {grade.letterGrade}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-gray-600 dark:text-zinc-400 mt-1">
                                                        {grade.pointsEarned}/{grade.totalPoints} points
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon className={`w-4 h-4 ${getStatusColor(grade.status)}`} />
                                                        <span className={`text-[12px] font-medium capitalize ${getStatusColor(grade.status)}`}>
                                                            {grade.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'Not graded'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedGrade(grade)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const summary = [
                                                                    `Assignment: ${grade.assignmentName}`,
                                                                    `Course: ${grade.course}`,
                                                                    `Instructor: ${grade.instructor}`,
                                                                    `Score: ${grade.pointsEarned}/${grade.totalPoints} (${grade.percentage}%)`,
                                                                    `Letter: ${grade.letterGrade}`,
                                                                    `Status: ${grade.status}`,
                                                                    grade.gradedAt ? `Graded At: ${new Date(grade.gradedAt).toLocaleString()}` : '',
                                                                    '',
                                                                    `Feedback:`,
                                                                    grade.feedback || '—',
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join('\n');
                                                                downloadText(`grade-${grade.id}.txt`, summary);
                                                            }}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                        >
                                                            <Download className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {selectedGrade && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100">Grade Details</h2>
                                    <p className="text-[14px] text-gray-600 dark:text-zinc-400">{selectedGrade.course}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedGrade(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">{selectedGrade.assignmentName}</div>
                                    <div className="text-[14px] text-gray-600 dark:text-zinc-400">Instructor: {selectedGrade.instructor}</div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">Score</div>
                                        <div className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">
                                            {selectedGrade.pointsEarned}/{selectedGrade.totalPoints} ({selectedGrade.percentage}%)
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                        <div className="text-[12px] text-gray-600 dark:text-zinc-400">Letter Grade</div>
                                        <div className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{selectedGrade.letterGrade}</div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                    <div className="text-[12px] text-gray-600 dark:text-zinc-400 mb-2">Feedback</div>
                                    <div className="text-[14px] text-gray-700 dark:text-zinc-300 whitespace-pre-line">
                                        {selectedGrade.feedback || '—'}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const summary = [
                                                `Assignment: ${selectedGrade.assignmentName}`,
                                                `Course: ${selectedGrade.course}`,
                                                `Instructor: ${selectedGrade.instructor}`,
                                                `Score: ${selectedGrade.pointsEarned}/${selectedGrade.totalPoints} (${selectedGrade.percentage}%)`,
                                                `Letter: ${selectedGrade.letterGrade}`,
                                                '',
                                                `Feedback:`,
                                                selectedGrade.feedback || '—',
                                            ].join('\n');
                                            downloadText(`grade-${selectedGrade.id}.txt`, summary);
                                        }}
                                        className="flex-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => setSelectedGrade(null)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Section */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 mb-6">
                            Recent Feedback
                        </h2>
                        <div className="space-y-4">
                            {grades.filter(g => g.feedback && g.status === 'graded').map((grade) => (
                                <div key={grade.id} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">
                                                {grade.assignmentName}
                                            </h3>
                                            <p className="text-[12px] text-gray-600 dark:text-zinc-400">
                                                {grade.course} • {new Date(grade.gradedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-[12px] font-semibold ${getGradeBgColor(grade.percentage)} ${getGradeColor(grade.percentage)}`}>
                                            {grade.letterGrade}
                                        </div>
                                    </div>
                                    <p className="text-[14px] text-gray-700 dark:text-zinc-300">
                                        {grade.feedback}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
