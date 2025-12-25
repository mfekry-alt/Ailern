import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import {
    Plus,
    Edit,
    Eye,
    Download,
    Upload,
    Clock,
    Users,
    FileText,
    CheckCircle,
    AlertCircle,
    Star,
    Calendar
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    totalPoints: number;
    submissions: number;
    graded: number;
    status: 'draft' | 'published' | 'closed';
    description: string;
    attachments: string[];
    createdAt: string;
}

interface Submission {
    id: string;
    studentName: string;
    studentEmail: string;
    submittedAt: string;
    status: 'submitted' | 'graded' | 'late';
    grade?: number;
    feedback?: string;
    attachments: string[];
}

export const InstructorAssignmentsPage = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    const [assignments, setAssignments] = useState<Assignment[]>([
        {
            id: '1',
            title: 'Programming Assignment 1: Basic Algorithms',
            course: 'CS101 - Introduction to Programming',
            dueDate: '2024-01-15',
            totalPoints: 100,
            submissions: 45,
            graded: 42,
            status: 'published',
            description: 'Implement basic sorting algorithms including bubble sort, selection sort, and insertion sort.',
            attachments: ['assignment1.pdf', 'rubric.pdf'],
            createdAt: '2024-01-01'
        },
        {
            id: '2',
            title: 'Data Structures Lab: Linked Lists',
            course: 'CS202 - Data Structures',
            dueDate: '2024-01-20',
            totalPoints: 150,
            submissions: 38,
            graded: 35,
            status: 'published',
            description: 'Create a comprehensive linked list implementation with all basic operations.',
            attachments: ['lab2.pdf'],
            createdAt: '2024-01-05'
        },
        {
            id: '3',
            title: 'Linear Algebra Problem Set 3',
            course: 'MA203 - Linear Algebra',
            dueDate: '2024-01-18',
            totalPoints: 80,
            submissions: 0,
            graded: 0,
            status: 'draft',
            description: 'Solve problems related to eigenvalues, eigenvectors, and diagonalization.',
            attachments: ['ps3.pdf'],
            createdAt: '2024-01-10'
        }
    ]);

    const [submissions, setSubmissions] = useState<Submission[]>([
        {
            id: '1',
            studentName: 'John Doe',
            studentEmail: 'john.doe@university.edu',
            submittedAt: '2024-01-14T10:30:00Z',
            status: 'graded',
            grade: 95,
            feedback: 'Excellent implementation! Your code is well-documented and efficient.',
            attachments: ['solution.py', 'analysis.pdf']
        },
        {
            id: '2',
            studentName: 'Sarah Johnson',
            studentEmail: 'sarah.johnson@university.edu',
            submittedAt: '2024-01-15T09:15:00Z',
            status: 'graded',
            grade: 88,
            feedback: 'Good work! Consider optimizing the bubble sort algorithm.',
            attachments: ['assignment1.py']
        },
        {
            id: '3',
            studentName: 'Mike Wilson',
            studentEmail: 'mike.wilson@university.edu',
            submittedAt: '2024-01-16T14:20:00Z',
            status: 'submitted',
            attachments: ['solution.py']
        }
    ]);

    const courseOptions = useMemo(
        () => [
            'CS101 - Introduction to Programming',
            'CS202 - Data Structures',
            'MA203 - Linear Algebra',
        ],
        []
    );

    const editingAssignment = useMemo(() => {
        if (!editingAssignmentId) return null;
        return assignments.find((a) => a.id === editingAssignmentId) ?? null;
    }, [assignments, editingAssignmentId]);

    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        course: 'CS101 - Introduction to Programming',
        dueDate: '',
        totalPoints: 100,
        status: 'draft' as Assignment['status'],
        description: '',
    });

    const openCreate = () => {
        navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE);
    };

    const openEdit = (assignment: Assignment) => {
        navigate(`/instructor/assignments/${assignment.id}/edit`);
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

    const exportAssignment = (assignment: Assignment) => {
        const rows = [
            ['id', 'title', 'course', 'dueDate', 'totalPoints', 'submissions', 'graded', 'status', 'createdAt'],
            [
                assignment.id,
                assignment.title,
                assignment.course,
                assignment.dueDate,
                String(assignment.totalPoints),
                String(assignment.submissions),
                String(assignment.graded),
                assignment.status,
                assignment.createdAt,
            ],
        ];
        const csv = rows
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadText(`assignment-${assignment.id}.csv`, csv);
    };

    const handleSaveAssignment = () => {
        if (!assignmentForm.title.trim()) return;

        if (editingAssignmentId) {
            setAssignments((prev) =>
                prev.map((a) =>
                    a.id === editingAssignmentId
                        ? {
                            ...a,
                            title: assignmentForm.title.trim(),
                            course: assignmentForm.course,
                            dueDate: assignmentForm.dueDate,
                            totalPoints: assignmentForm.totalPoints,
                            status: assignmentForm.status,
                            description: assignmentForm.description,
                        }
                        : a
                )
            );
        } else {
            const id = String(Date.now());
            setAssignments((prev) => [
                {
                    id,
                    title: assignmentForm.title.trim(),
                    course: assignmentForm.course,
                    dueDate: assignmentForm.dueDate,
                    totalPoints: assignmentForm.totalPoints,
                    submissions: 0,
                    graded: 0,
                    status: assignmentForm.status,
                    description: assignmentForm.description,
                    attachments: [],
                    createdAt: new Date().toISOString().slice(0, 10),
                },
                ...prev,
            ]);
        }

        setShowCreateModal(false);
        setEditingAssignmentId(null);
    };

    const gradeSubmission = (submissionId: string) => {
        setSubmissions((prev) =>
            prev.map((s) => {
                if (s.id !== submissionId) return s;
                if (s.status === 'graded') return s;
                return {
                    ...s,
                    status: 'graded',
                    grade: 100,
                    feedback: 'Graded.',
                };
            })
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return { text: 'Draft', className: 'bg-gray-100 text-gray-800', icon: FileText };
            case 'published':
                return { text: 'Published', className: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'closed':
                return { text: 'Closed', className: 'bg-red-100 text-red-800', icon: AlertCircle };
            default:
                return { text: 'Unknown', className: 'bg-gray-100 text-gray-800', icon: FileText };
        }
    };

    const getSubmissionStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return { text: 'Submitted', className: 'bg-blue-100 text-blue-800', icon: Upload };
            case 'graded':
                return { text: 'Graded', className: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'late':
                return { text: 'Late', className: 'bg-red-100 text-red-800', icon: AlertCircle };
            default:
                return { text: 'Unknown', className: 'bg-gray-100 text-gray-800', icon: Upload };
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        const courseMatch = selectedCourse === 'all' || assignment.course.includes(selectedCourse);
        const statusMatch = selectedStatus === 'all' || assignment.status === selectedStatus;
        return courseMatch && statusMatch;
    });

    const stats = [
        { label: 'Total Assignments', value: assignments.length, icon: FileText, color: 'text-blue-600' },
        { label: 'Published', value: assignments.filter(a => a.status === 'published').length, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Total Submissions', value: assignments.reduce((sum, a) => sum + a.submissions, 0), icon: Upload, color: 'text-purple-600' },
        { label: 'Pending Grading', value: assignments.reduce((sum, a) => sum + (a.submissions - a.graded), 0), icon: Clock, color: 'text-yellow-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                            Assignment Management
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 mt-1">
                            Create and manage assignments for your courses
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Assignment
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
                                            <p className="text-[14px] font-medium text-gray-600 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Courses</option>
                                    <option value="CS101">CS101 - Introduction to Programming</option>
                                    <option value="CS202">CS202 - Data Structures</option>
                                    <option value="MA203">MA203 - Linear Algebra</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.map((assignment) => {
                        const statusBadge = getStatusBadge(assignment.status);
                        const StatusIcon = statusBadge.icon;

                        return (
                            <Card key={assignment.id} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Assignment Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-[18px] font-bold text-gray-900 flex-1">
                                                    {assignment.title}
                                                </h3>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${statusBadge.className}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusBadge.text}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Star className="w-4 h-4" />
                                                    <span>{assignment.totalPoints} points</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>{assignment.submissions} submissions</span>
                                                </div>
                                            </div>

                                            <p className="text-[14px] text-gray-700 mb-3">
                                                {assignment.description}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-[12px] text-gray-600 mb-1">
                                                    <span>Grading Progress</span>
                                                    <span>{assignment.graded}/{assignment.submissions}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${assignment.submissions > 0 ? (assignment.graded / assignment.submissions) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                            <button
                                                onClick={() => navigate(`/instructor/assignments/${assignment.id}/submissions`)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Submissions
                                            </button>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEdit(assignment)}
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[12px] px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => exportAssignment(assignment)}
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[12px] px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    Export
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Submissions Modal */}
                {selectedAssignment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        Submissions for {selectedAssignment.title}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedAssignment(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                <div className="space-y-4">
                                    {submissions.map((submission) => {
                                        const submissionStatusBadge = getSubmissionStatusBadge(submission.status);
                                        const SubmissionIcon = submissionStatusBadge.icon;

                                        return (
                                            <Card key={submission.id} variant="elevated">
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <span className="text-[12px] font-semibold text-blue-700">
                                                                        {submission.studentName.split(' ').map(n => n[0]).join('')}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[14px] font-medium text-gray-900">
                                                                        {submission.studentName}
                                                                    </p>
                                                                    <p className="text-[12px] text-gray-600">
                                                                        {submission.studentEmail}
                                                                    </p>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${submissionStatusBadge.className}`}>
                                                                    <SubmissionIcon className="w-2 h-2" />
                                                                    {submissionStatusBadge.text}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-4 text-[12px] text-gray-600 mb-2">
                                                                <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                                                                {submission.grade && (
                                                                    <span className="font-semibold text-green-600">
                                                                        Grade: {submission.grade}%
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {submission.feedback && (
                                                                <p className="text-[12px] text-gray-700 bg-gray-50 p-2 rounded">
                                                                    Feedback: {submission.feedback}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => gradeSubmission(submission.id)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[12px] px-3 py-2 rounded-lg transition-colors"
                                                            >
                                                                Grade
                                                            </button>
                                                            <button
                                                                onClick={() => downloadText(`submission-${submission.id}.txt`, submission.attachments.join('\n') || 'No attachments')}
                                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[12px] px-3 py-2 rounded-lg transition-colors"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredAssignments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No assignments found</h3>
                        <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
                        <button
                            onClick={openCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Create Assignment
                        </button>
                    </div>
                )}
            </div>
            {/* Create Assignment Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    value={assignmentForm.title}
                                    onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Course</label>
                                <select
                                    value={assignmentForm.course}
                                    onChange={(e) => setAssignmentForm((p) => ({ ...p, course: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {courseOptions.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm((p) => ({ ...p, dueDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Points</label>
                                    <input
                                        type="number"
                                        value={assignmentForm.totalPoints}
                                        onChange={(e) =>
                                            setAssignmentForm((p) => ({
                                                ...p,
                                                totalPoints: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={assignmentForm.status}
                                    onChange={(e) =>
                                        setAssignmentForm((p) => ({ ...p, status: e.target.value as Assignment['status'] }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={assignmentForm.description}
                                    onChange={(e) => setAssignmentForm((p) => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingAssignmentId(null);
                                }}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={!assignmentForm.title.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};
