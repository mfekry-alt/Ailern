import { useState, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui';
import {
    FileText,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle,
    Download,
    Calendar,
    User,
    Star,
    Eye
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    course: string;
    instructor: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded' | 'late';
    points: number;
    description: string;
    attachments: string[];
    allowedFileTypes?: string[];
    maxFileSize?: string;
    grade?: number;
    feedback?: string;
    submittedAt?: string;
}

export const AssignmentsPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [assignments, setAssignments] = useState<Assignment[]>([
        {
            id: '1',
            title: 'Programming Assignment 1: Basic Algorithms',
            course: 'CS101 - Introduction to Programming',
            instructor: 'Dr. Emily Carter',
            dueDate: '2024-01-15',
            status: 'graded',
            points: 100,
            description: 'Implement basic sorting algorithms including bubble sort, selection sort, and insertion sort. Include time complexity analysis.',
            attachments: ['assignment1.pdf', 'rubric.pdf'],
            allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'],
            maxFileSize: '10 MB',
            grade: 95,
            feedback: 'Excellent implementation! Your code is well-documented and efficient. Consider optimizing the bubble sort algorithm.',
            submittedAt: '2024-01-14T10:30:00Z'
        },
        {
            id: '2',
            title: 'Data Structures Lab: Linked Lists',
            course: 'CS202 - Data Structures',
            instructor: 'Prof. Michael Brown',
            dueDate: '2024-01-20',
            status: 'submitted',
            points: 150,
            description: 'Create a comprehensive linked list implementation with all basic operations.',
            attachments: ['lab2.pdf'],
            allowedFileTypes: ['PDF', 'ZIP'],
            maxFileSize: '15 MB',
            submittedAt: '2024-01-19T15:45:00Z'
        },
        {
            id: '3',
            title: 'Linear Algebra Problem Set 3',
            course: 'MA203 - Linear Algebra',
            instructor: 'Dr. Sarah Wilson',
            dueDate: '2024-01-18',
            status: 'pending',
            points: 80,
            description: 'Solve problems related to eigenvalues, eigenvectors, and diagonalization.',
            attachments: ['ps3.pdf'],
            allowedFileTypes: ['PDF', 'DOC', 'DOCX'],
            maxFileSize: '5 MB'
        },
        {
            id: '4',
            title: 'Physics Lab Report: Mechanics',
            course: 'PHY105 - Classical Mechanics',
            instructor: 'Dr. James Lee',
            dueDate: '2024-01-12',
            status: 'late',
            points: 120,
            description: 'Write a comprehensive lab report on projectile motion experiments.',
            attachments: ['lab_report_template.pdf'],
            allowedFileTypes: ['PDF', 'DOC', 'DOCX'],
            maxFileSize: '20 MB',
            submittedAt: '2024-01-13T08:00:00Z'
        }
    ]);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitNotes, setSubmitNotes] = useState<string>('');
    const [submitError, setSubmitError] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

    const allowedExtensions = useMemo(() => {
        const map: Record<string, string[]> = {
            PDF: ['pdf'],
            DOC: ['doc'],
            DOCX: ['docx'],
            ZIP: ['zip'],
        };
        const types = currentAssignment?.allowedFileTypes || [];
        return types.flatMap((t) => map[t] || []);
    }, [currentAssignment]);

    const maxBytes = useMemo(() => {
        const label = currentAssignment?.maxFileSize || '';
        const match = label.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
        if (!match) return Infinity;
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'KB') return Math.round(val * 1024);
        if (unit === 'MB') return Math.round(val * 1024 * 1024);
        if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
        return Infinity;
    }, [currentAssignment]);

    const openSubmitModal = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        setSelectedFile(null);
        setSubmitNotes('');
        setSubmitError('');
        setProgress(0);
        setShowSubmitModal(true);
    };

    const closeSubmitModal = () => {
        if (submittingId) return; // prevent closing during submit
        setShowSubmitModal(false);
        setCurrentAssignment(null);
        setSelectedFile(null);
        setSubmitNotes('');
        setSubmitError('');
        setProgress(0);
    };

    const onFileSelected = (file: File | null) => {
        setSubmitError('');
        setSelectedFile(file);
        if (!file || !currentAssignment) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (allowedExtensions.length && (!ext || !allowedExtensions.includes(ext))) {
            setSubmitError(`Invalid file type. Allowed: ${allowedExtensions.join(', ').toUpperCase()}`);
            setSelectedFile(null);
            return;
        }
        if (file.size > maxBytes) {
            setSubmitError(`File too large. Max: ${currentAssignment.maxFileSize}`);
            setSelectedFile(null);
        }
    };

    const submitAssignment = async () => {
        if (!currentAssignment) return;
        setSubmitError('');
        if (!selectedFile) {
            setSubmitError('Please select a file to submit.');
            return;
        }
        setSubmittingId(currentAssignment.id);
        setProgress(0);
        // Simulate upload progress
        await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                setProgress((p) => {
                    const next = Math.min(p + 10, 100);
                    if (next >= 100) {
                        clearInterval(interval);
                        resolve();
                    }
                    return next;
                });
            }, 120);
        });
        // Simulate server response and update state
        const submittedAt = new Date().toISOString();
        setAssignments((prev) =>
            prev.map((a) =>
                a.id === currentAssignment.id
                    ? { ...a, status: 'submitted', submittedAt }
                    : a
            )
        );
        setSubmittingId(null);
        setShowSubmitModal(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock };
            case 'submitted':
                return { text: 'Submitted', className: 'bg-blue-100 text-blue-800', icon: Upload };
            case 'graded':
                return { text: 'Graded', className: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'late':
                return { text: 'Late', className: 'bg-red-100 text-red-800', icon: AlertCircle };
            default:
                return { text: 'Unknown', className: 'bg-gray-100 text-gray-800', icon: Clock };
        }
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600';
        if (grade >= 80) return 'text-blue-600';
        if (grade >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getDeadlineStatus = (assignment: Assignment) => {
        if (!assignment.submittedAt) return null;

        const dueDate = new Date(assignment.dueDate);
        const submittedDate = new Date(assignment.submittedAt);

        if (submittedDate <= dueDate) {
            return {
                text: 'Submitted on time',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            };
        } else {
            return {
                text: 'Submitted after deadline',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
            };
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        const courseMatch = selectedCourse === 'all' || assignment.course.includes(selectedCourse);
        const statusMatch = selectedStatus === 'all' || assignment.status === selectedStatus;
        return courseMatch && statusMatch;
    });

    const stats = [
        { label: 'Total Assignments', value: assignments.length, icon: FileText, color: 'text-blue-600' },
        { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
        { label: 'Submitted', value: assignments.filter(a => a.status === 'submitted').length, icon: Upload, color: 'text-blue-600' },
        { label: 'Graded', value: assignments.filter(a => a.status === 'graded').length, icon: CheckCircle, color: 'text-green-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                        Assignments
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600">
                        Manage your assignments and track submission status
                    </p>
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
                                    <option value="PHY105">PHY105 - Classical Mechanics</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="graded">Graded</option>
                                    <option value="late">Late</option>
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{assignment.instructor}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Star className="w-4 h-4" />
                                                    <span>{assignment.points} points</span>
                                                </div>
                                                {assignment.grade && (
                                                    <div className="flex items-center gap-2 text-[14px]">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className={`font-semibold ${getGradeColor(assignment.grade)}`}>
                                                            Grade: {assignment.grade}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-[14px] text-gray-700 mb-3">
                                                {assignment.description}
                                            </p>

                                            {/* Attachments */}
                                            {assignment.attachments.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-[12px] font-medium text-gray-600 mb-2">Attachments:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {assignment.attachments.map((attachment, index) => (
                                                            <button
                                                                key={index}
                                                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[12px] text-gray-700 transition-colors"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                {attachment}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* File Restrictions */}
                                            {(assignment.allowedFileTypes || assignment.maxFileSize) && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-[12px] font-medium text-gray-700 mb-2">Submission Requirements:</p>
                                                    <div className="flex flex-wrap gap-4 text-[12px] text-gray-600">
                                                        {assignment.allowedFileTypes && (
                                                            <span>
                                                                <span className="font-medium">Allowed types:</span> {assignment.allowedFileTypes.join(', ')}
                                                            </span>
                                                        )}
                                                        {assignment.maxFileSize && (
                                                            <span>
                                                                <span className="font-medium">Max size:</span> {assignment.maxFileSize}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Deadline Status */}
                                            {assignment.submittedAt && (() => {
                                                const deadlineStatus = getDeadlineStatus(assignment);
                                                if (!deadlineStatus) return null;
                                                return (
                                                    <div className={`mt-3 p-3 rounded-lg border ${deadlineStatus.bgColor} ${deadlineStatus.borderColor}`}>
                                                        <p className={`text-[12px] font-medium ${deadlineStatus.color}`}>
                                                            {deadlineStatus.text}
                                                        </p>
                                                        <p className="text-[11px] text-gray-600 mt-1">
                                                            Submitted: {new Date(assignment.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            {/* Feedback */}
                                            {assignment.feedback && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-[12px] font-medium text-blue-800 mb-1">Instructor Feedback:</p>
                                                    <p className="text-[14px] text-blue-700">{assignment.feedback}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                            {assignment.status === 'pending' && (
                                                <button
                                                    onClick={() => openSubmitModal(assignment)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Submit Assignment
                                                </button>
                                            )}
                                            {assignment.status === 'submitted' && (
                                                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    View Submission
                                                </button>
                                            )}
                                            {assignment.status === 'graded' && (
                                                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    View Grade
                                                </button>
                                            )}
                                            {assignment.status === 'late' && (
                                                <button
                                                    onClick={() => openSubmitModal(assignment)}
                                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Submit Late
                                                </button>
                                            )}

                                            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredAssignments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No assignments found</h3>
                        <p className="text-gray-600">Try adjusting your filter criteria</p>
                    </div>
                )}
            </div>
            {/* Submit Modal Portal */}
            <SubmissionModal
                open={showSubmitModal}
                onClose={closeSubmitModal}
                assignment={currentAssignment}
                submitting={!!submittingId}
                progress={progress}
                error={submitError}
                onFileChange={onFileSelected}
                notes={submitNotes}
                setNotes={setSubmitNotes}
                onSubmit={submitAssignment}
            />
        </div>
    );
};

// Submission Modal
// We append the modal markup after the component for clarity.
export const SubmissionModal = ({
    open,
    onClose,
    assignment,
    submitting,
    progress,
    error,
    onFileChange,
    notes,
    setNotes,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    assignment: Assignment | null;
    submitting: boolean;
    progress: number;
    error: string;
    onFileChange: (file: File | null) => void;
    notes: string;
    setNotes: (v: string) => void;
    onSubmit: () => void;
}) => {
    if (!open || !assignment) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full max-w-xl rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-[18px] font-bold text-gray-900">Submit Assignment</h3>
                    <p className="text-[14px] text-gray-600 mt-1">{assignment.title}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[14px] font-medium text-gray-900">File</label>
                        <input
                            type="file"
                            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                            className="w-full"
                            accept={assignment.allowedFileTypes?.map((t) => `.${t.toLowerCase()}`).join(',')}
                        />
                        <p className="text-[12px] text-gray-600">
                            Allowed: {assignment.allowedFileTypes?.join(', ') || 'Any'} • Max size: {assignment.maxFileSize || '—'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[14px] font-medium text-gray-900">Notes (optional)</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add any notes for your instructor"
                        />
                    </div>
                    {error && (
                        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-[14px] text-red-700">{error}</div>
                    )}
                    {submitting && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[12px] text-gray-600">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};
