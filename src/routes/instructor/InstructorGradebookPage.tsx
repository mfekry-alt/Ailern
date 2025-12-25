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
    >([
        {
            id: 1,
            student: 'John Doe',
            course: 'CS101',
            assignment: 'Week 3 - Variables and Data Types',
            submitted: '2 hours ago',
            status: 'pending',
        },
        {
            id: 2,
            student: 'Jane Smith',
            course: 'CS202',
            assignment: 'Assignment 2 - Binary Trees',
            submitted: '5 hours ago',
            status: 'pending',
        },
        {
            id: 3,
            student: 'Bob Johnson',
            course: 'CS101',
            assignment: 'Week 2 - Introduction',
            submitted: 'Yesterday',
            status: 'graded',
            grade: 95,
        },
        {
            id: 4,
            student: 'Alice Brown',
            course: 'MA203',
            assignment: 'Matrix Operations',
            submitted: '2 days ago',
            status: 'graded',
            grade: 88,
        },
    ]);

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
        <div className="px-48 py-8 max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-[30px] leading-[36px] text-azure-8 mb-2">Gradebook</h1>
                <p className="text-[16px] text-azure-46">Review and grade student submissions</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] mb-6">
                <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-azure-8">Filter by Course:</span>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
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
                                ? 'bg-azure-50 text-white hover:bg-azure-53'
                                : 'bg-white border border-gray-300 text-azure-8 hover:bg-gray-50'
                                }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveTab('graded')}
                            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${activeTab === 'graded'
                                ? 'bg-azure-50 text-white hover:bg-azure-53'
                                : 'bg-white border border-gray-300 text-azure-8 hover:bg-gray-50'
                                }`}
                        >
                            Graded ({stats.graded})
                        </button>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Student
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Course
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Assignment
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Submitted
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Status
                            </th>
                            <th className="text-left py-4 px-6 text-[14px] font-semibold text-azure-8">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubmissions.map((submission) => (
                            <tr key={submission.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-6 text-[14px] text-azure-8 font-medium">
                                    {submission.student}
                                </td>
                                <td className="py-4 px-6 text-[14px] text-azure-46">{submission.course}</td>
                                <td className="py-4 px-6 text-[14px] text-azure-8">{submission.assignment}</td>
                                <td className="py-4 px-6 text-[14px] text-azure-46">{submission.submitted}</td>
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
                                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-azure-50" />
                                        </button>
                                        {submission.status === 'pending' ? (
                                            <button
                                                onClick={() => openGradeModal(submission.id)}
                                                className="px-4 py-2 bg-azure-50 text-white rounded-md text-[14px] font-medium hover:bg-azure-53 transition-colors"
                                            >
                                                Grade
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openGradeModal(submission.id)}
                                                className="px-4 py-2 bg-white border border-gray-300 text-azure-8 rounded-md text-[14px] font-medium hover:bg-gray-50 transition-colors"
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
                    { label: 'Total Submissions', value: String(stats.total), icon: FileText, color: '#0d7ff2' },
                    { label: 'Avg. Grade', value: `${stats.avg}%`, icon: CheckCircle, color: '#8b5cf6' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-lg p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex items-center gap-4"
                        >
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <Icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-[24px] font-bold text-azure-8">{stat.value}</p>
                                <p className="text-[12px] text-azure-46">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-[18px] text-azure-8">
                                    {selectedSubmission.status === 'pending' ? 'Grade Submission' : 'Review Grade'}
                                </h2>
                                <p className="text-[14px] text-azure-46">
                                    {selectedSubmission.student} • {selectedSubmission.course}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-azure-46 hover:text-azure-8">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="text-[12px] text-azure-46 mb-1">Assignment</div>
                                <div className="text-[14px] font-medium text-azure-8">{selectedSubmission.assignment}</div>
                                <div className="text-[12px] text-azure-46 mt-1">Submitted: {selectedSubmission.submitted}</div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">Grade (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => downloadSubmission(selectedSubmission.id)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-azure-8 rounded-md text-[14px] font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={saveGrade}
                                    className="flex-1 px-4 py-2 bg-azure-50 text-white rounded-md text-[14px] font-medium hover:bg-azure-53 transition-colors"
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

