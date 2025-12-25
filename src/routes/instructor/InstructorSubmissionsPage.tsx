import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Download, Search, Filter, CheckCircle2, XCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface Submission {
    id: number;
    studentName: string;
    studentEmail: string;
    submittedFile: string;
    submittedAt: string;
    dueDate: string;
    status: 'on_time' | 'late';
    grade?: number;
    maxGrade: number;
    feedback?: string;
    isGraded: boolean;
}

export const InstructorSubmissionsPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    
    const [submissions, setSubmissions] = useState<Submission[]>([
        {
            id: 1,
            studentName: 'John Doe',
            studentEmail: 'john.doe@university.edu',
            submittedFile: 'assignment1_john_doe.pdf',
            submittedAt: '2024-01-14T10:30:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'on_time',
            grade: 95,
            maxGrade: 100,
            feedback: 'Excellent work! Well-structured code and clear documentation.',
            isGraded: true,
        },
        {
            id: 2,
            studentName: 'Sarah Johnson',
            studentEmail: 'sarah.johnson@university.edu',
            submittedFile: 'assignment1_sarah_johnson.zip',
            submittedAt: '2024-01-15T22:45:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'on_time',
            grade: 88,
            maxGrade: 100,
            feedback: 'Good implementation. Consider adding more comments.',
            isGraded: true,
        },
        {
            id: 3,
            studentName: 'Michael Chen',
            studentEmail: 'michael.chen@university.edu',
            submittedFile: 'assignment1_michael_chen.pdf',
            submittedAt: '2024-01-16T08:15:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'late',
            isGraded: false,
            maxGrade: 100,
        },
        {
            id: 4,
            studentName: 'Emily Davis',
            studentEmail: 'emily.davis@university.edu',
            submittedFile: 'assignment1_emily_davis.docx',
            submittedAt: '2024-01-14T15:20:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'on_time',
            isGraded: false,
            maxGrade: 100,
        },
        {
            id: 5,
            studentName: 'David Wilson',
            studentEmail: 'david.wilson@university.edu',
            submittedFile: 'assignment1_david_wilson.pdf',
            submittedAt: '2024-01-16T10:30:00Z',
            dueDate: '2024-01-15T23:59:59Z',
            status: 'late',
            grade: 75,
            maxGrade: 100,
            feedback: 'Submitted late. Code needs improvement.',
            isGraded: true,
        },
    ]);

    const [filters, setFilters] = useState({
        status: 'all' as 'all' | 'on_time' | 'late',
        grading: 'all' as 'all' | 'graded' | 'ungraded',
        search: '',
    });

    const [sortBy, setSortBy] = useState<'date' | 'name' | 'grade'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredAndSortedSubmissions = useMemo(() => {
        let filtered = submissions.filter((submission) => {
            const statusMatch = filters.status === 'all' || submission.status === filters.status;
            const gradingMatch =
                filters.grading === 'all' ||
                (filters.grading === 'graded' && submission.isGraded) ||
                (filters.grading === 'ungraded' && !submission.isGraded);
            const searchMatch =
                filters.search === '' ||
                submission.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
                submission.studentEmail.toLowerCase().includes(filters.search.toLowerCase());

            return statusMatch && gradingMatch && searchMatch;
        });

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                    break;
                case 'name':
                    comparison = a.studentName.localeCompare(b.studentName);
                    break;
                case 'grade':
                    const gradeA = a.grade ?? 0;
                    const gradeB = b.grade ?? 0;
                    comparison = gradeA - gradeB;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [submissions, filters, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredAndSortedSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSubmissions = filteredAndSortedSubmissions.slice(startIndex, startIndex + itemsPerPage);

    const handleGradeChange = (id: number, grade: number, feedback: string) => {
        setSubmissions(
            submissions.map((s) =>
                s.id === id
                    ? { ...s, grade, feedback, isGraded: true }
                    : s
            )
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Assignments
                        </button>
                        <h1 className="text-[30px] font-bold text-gray-900">Assignment Submissions</h1>
                        <p className="text-[16px] text-gray-600 mt-1">Review and grade student submissions</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student name or email..."
                                    value={filters.search}
                                    onChange={(e) => {
                                        setFilters({ ...filters, search: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={filters.status}
                                    onChange={(e) => {
                                        setFilters({ ...filters, status: e.target.value as any });
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] appearance-none pr-8"
                                >
                                    <option value="all">All Status</option>
                                    <option value="on_time">On Time</option>
                                    <option value="late">Late</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Grading Filter */}
                            <div className="relative">
                                <select
                                    value={filters.grading}
                                    onChange={(e) => {
                                        setFilters({ ...filters, grading: e.target.value as any });
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] appearance-none pr-8"
                                >
                                    <option value="all">All</option>
                                    <option value="graded">Graded</option>
                                    <option value="ungraded">Ungraded</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                            <span className="text-[14px] text-gray-600">Sort by:</span>
                            <div className="flex gap-2">
                                {(['date', 'name', 'grade'] as const).map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => {
                                            if (sortBy === field) {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy(field);
                                                setSortOrder('desc');
                                            }
                                        }}
                                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                                            sortBy === field
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                        {sortBy === field && (
                                            sortOrder === 'asc' ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submissions Table */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Submitted File
                                        </th>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Submission Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Grade
                                        </th>
                                        <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedSubmissions.map((submission) => (
                                        <SubmissionRow
                                            key={submission.id}
                                            submission={submission}
                                            onGradeChange={handleGradeChange}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-[14px] text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedSubmissions.length)} of{' '}
                                    {filteredAndSortedSubmissions.length} submissions
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded-lg text-[14px] transition-colors ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {paginatedSubmissions.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <p className="text-gray-600">No submissions found matching your filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

interface SubmissionRowProps {
    submission: Submission;
    onGradeChange: (id: number, grade: number, feedback: string) => void;
}

const SubmissionRow = ({ submission, onGradeChange }: SubmissionRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [grade, setGrade] = useState(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');

    const handleSave = () => {
        const gradeNum = parseInt(grade);
        if (gradeNum >= 0 && gradeNum <= submission.maxGrade) {
            onGradeChange(submission.id, gradeNum, feedback);
            setIsEditing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div>
                    <div className="text-[14px] font-medium text-gray-900">{submission.studentName}</div>
                    <div className="text-[12px] text-gray-500">{submission.studentEmail}</div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gray-400" />
                    <button className="text-[14px] text-blue-600 hover:text-blue-700 hover:underline">
                        {submission.submittedFile}
                    </button>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-[14px] text-gray-900">{formatDate(submission.submittedAt)}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {submission.status === 'on_time' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3" />
                        On Time
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Late
                    </span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max={submission.maxGrade}
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-[14px]"
                        />
                        <span className="text-[14px] text-gray-600">/ {submission.maxGrade}</span>
                    </div>
                ) : (
                    <div className="text-[14px] text-gray-900">
                        {submission.grade !== undefined ? (
                            <span className="font-semibold">{submission.grade} / {submission.maxGrade}</span>
                        ) : (
                            <span className="text-gray-400">Not graded</span>
                        )}
                    </div>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-green-600 text-white rounded text-[12px] font-medium hover:bg-green-700 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setGrade(submission.grade?.toString() || '');
                                setFeedback(submission.feedback || '');
                            }}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-[12px] font-medium hover:bg-blue-700 transition-colors"
                    >
                        {submission.isGraded ? 'Edit Grade' : 'Grade'}
                    </button>
                )}
            </td>
        </tr>
    );
};


