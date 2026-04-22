import { useMemo, useState } from 'react';
import { FileText, CheckCircle, Clock, Download } from 'lucide-react';

export const InstructorGradebookPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [activeTab, setActiveTab] = useState<'pending' | 'graded' | 'all'>('pending');

    const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
    const [gradeValue, setGradeValue] = useState<number>(100);

    const [submissions, setSubmissions] = useState<
        Array<{
            id: number;
            student: string;
            course: string;
            assignment: string;
            submitted: string;
            status: 'pending' | 'graded';
            grade?: number;
        }>
    >([]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((s) => {
            const courseMatch = selectedCourse === 'all' || s.course === selectedCourse;
            const tabMatch = activeTab === 'all' || s.status === activeTab;
            return courseMatch && tabMatch;
        });
    }, [activeTab, selectedCourse, submissions]);

    const selectedSubmission = useMemo(() => {
        if (!selectedSubmissionId) return null;
        return submissions.find((s) => s.id === selectedSubmissionId) ?? null;
    }, [selectedSubmissionId, submissions]);

    const openGradeModal = (id: number) => {
        const sub = submissions.find((s) => s.id === id);
        setSelectedSubmissionId(id);
        setGradeValue(sub?.grade ?? 100);
    };

    const closeModal = () => {
        setSelectedSubmissionId(null);
    };

    const saveGrade = () => {
        if (!selectedSubmissionId) return;
        setSubmissions((prev) =>
            prev.map((s) =>
                s.id === selectedSubmissionId
                    ? {
                        ...s,
                        status: 'graded',
                        grade: gradeValue,
                    }
                    : s
            )
        );
        closeModal();
    };

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

    const downloadSubmission = (id: number) => {
        const s = submissions.find((x) => x.id === id);
        if (!s) return;
        const summary = [
            `Student: ${s.student}`,
            `Course: ${s.course}`,
            `Assignment: ${s.assignment}`,
            `Submitted: ${s.submitted}`,
            `Status: ${s.status}`,
            s.grade != null ? `Grade: ${s.grade}%` : '',
        ]
            .filter(Boolean)
            .join('\n');
        downloadText(`submission-${s.id}.txt`, summary);
    };

    const stats = useMemo(() => {
        const pending = submissions.filter((s) => s.status === 'pending').length;
        const graded = submissions.filter((s) => s.status === 'graded').length;
        const grades = submissions.filter((s) => s.status === 'graded' && typeof s.grade === 'number').map((s) => s.grade as number);
        const avg = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
        return {
            pending,
            graded,
            total: submissions.length,
            avg,
        };
    }, [submissions]);

    return (
        <div className="px-48 py-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-[30px] leading-[36px] text-azure-8 dark:text-zinc-100 mb-2">Gradebook</h1>
                <p className="text-[16px] text-azure-46 dark:text-zinc-400">Review and grade student submissions</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] mb-6">
                <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-azure-8 dark:text-zinc-100">Filter by Course:</span>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#21A9FF] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                    >
                        <option value="all">All Courses</option>
                        <option value="CS101">CS101 - Introduction to Programming</option>
                        <option value="CS202">CS202 - Data Structures</option>
                        <option value="MA203">MA203 - Linear Algebra</option>
                    </select>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${activeTab === 'pending'
                                ? 'bg-[#21A9FF] text-white'
                                : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-azure-8 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveTab('graded')}
                            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${activeTab === 'graded'
                                ? 'bg-[#21A9FF] text-white'
                                : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-azure-8 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Graded ({stats.graded})
                        </button>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Student
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Course
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Assignment
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Submitted
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Status
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8 dark:text-zinc-100">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubmissions.map((submission) => (
                            <tr key={submission.id} className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800">
                                <td className="py-4 px-6 text-[14px] text-azure-8 dark:text-zinc-100 font-medium">
                                    {submission.student}
                                </td>
                                <td className="py-4 px-6 text-[14px] text-azure-46 dark:text-zinc-400">{submission.course}</td>
                                <td className="py-4 px-6 text-[14px] text-azure-8 dark:text-zinc-100">{submission.assignment}</td>
                                <td className="py-4 px-6 text-[14px] text-azure-46 dark:text-zinc-400">{submission.submitted}</td>
                                <td className="py-4 px-6">
                                    {submission.status === 'pending' ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning-100 text-warning-700 text-[12px] font-medium">
                                            <Clock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-100 text-success-700 text-[12px] font-medium">
                                            <CheckCircle className="w-3 h-3" />
                                            Graded {submission.grade && `(${submission.grade}%)`}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => downloadSubmission(submission.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-[#21A9FF]" />
                                        </button>
                                        {submission.status === 'pending' ? (
                                            <button
                                                onClick={() => openGradeModal(submission.id)}
                                                className="px-4 py-2 bg-[#21A9FF] text-white rounded-md text-[14px] font-medium hover:bg-[#0094F2] transition-colors"
                                            >
                                                Grade
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openGradeModal(submission.id)}
                                                className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-azure-8 dark:text-zinc-300 rounded-md text-[14px] font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                Review
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-6 mt-6">
                {[
                    { label: 'Pending Reviews', value: String(stats.pending), icon: Clock, color: '#f59e0b' },
                    { label: 'Graded', value: String(stats.graded), icon: CheckCircle, color: '#22c55e' },
                    { label: 'Total Submissions', value: String(stats.total), icon: FileText, color: '#21A9FF' },
                    { label: 'Avg. Grade', value: `${stats.avg}%`, icon: CheckCircle, color: '#8b5cf6' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex items-center gap-4"
                        >
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <Icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-[24px] font-bold text-azure-8 dark:text-zinc-100">{stat.value}</p>
                                <p className="text-[12px] text-azure-46 dark:text-zinc-400">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-[18px] text-azure-8 dark:text-zinc-100">
                                    {selectedSubmission.status === 'pending' ? 'Grade Submission' : 'Review Grade'}
                                </h2>
                                <p className="text-[14px] text-azure-46 dark:text-zinc-400">
                                    {selectedSubmission.student} • {selectedSubmission.course}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-azure-46 hover:text-azure-8 dark:text-zinc-400 dark:hover:text-zinc-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                <div className="text-[12px] text-azure-46 dark:text-zinc-400 mb-1">Assignment</div>
                                <div className="text-[14px] font-medium text-azure-8 dark:text-zinc-100">{selectedSubmission.assignment}</div>
                                <div className="text-[12px] text-azure-46 dark:text-zinc-400 mt-1">Submitted: {selectedSubmission.submitted}</div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 dark:text-zinc-100 mb-2">Grade (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#21A9FF] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => downloadSubmission(selectedSubmission.id)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-azure-8 dark:text-zinc-300 rounded-md text-[14px] font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={saveGrade}
                                    className="flex-1 px-4 py-2 bg-[#21A9FF] text-white rounded-md text-[14px] font-medium hover:bg-[#0094F2] transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

