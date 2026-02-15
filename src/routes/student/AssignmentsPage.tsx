import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { QUERY_KEYS } from '@/lib/constants';
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
    Eye,
    X,
    Loader2
} from 'lucide-react';
import { getMyStudentCourses } from '@/api/services/student.service';
import { getCourseAssignmentsForStudent } from '@/api/services/assignment.service';
import type { GetAssignmentDto } from '@/types/api.types';

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

const mapApiToAssignment = (dto: GetAssignmentDto): Assignment => {
    const now = new Date();
    const due = new Date(dto.dueDate);
    let status: Assignment['status'] = 'pending';
    if (due < now) status = 'late';

    return {
        id: dto.id.toString(),
        title: dto.title,
        course: dto.courseName ? `${dto.courseName}` : `Course ${dto.courseId}`,
        instructor: dto.instructorName || 'Instructor',
        dueDate: dto.dueDate,
        status,
        points: 0,
        description: dto.instructions || '',
        attachments: dto.files?.map(f => f.fileName) || [],
        allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'],
        maxFileSize: '10 MB',
    };
};

export const AssignmentsPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Fetch student's enrolled courses
    const { data: enrolledCourses = [] } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => getMyStudentCourses(),
    });

    // Fetch assignments for all enrolled courses
    const { data: allAssignments = [], isLoading, error } = useQuery({
        queryKey: [QUERY_KEYS.ASSIGNMENTS, enrolledCourses.map(c => c.id)],
        queryFn: async () => {
            if (enrolledCourses.length === 0) return [];
            const results = await Promise.allSettled(
                enrolledCourses.map(course => getCourseAssignmentsForStudent(course.id))
            );
            const combined: GetAssignmentDto[] = [];
            for (const result of results) {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    combined.push(...result.value);
                }
            }
            return combined;
        },
        enabled: enrolledCourses.length > 0,
    });

    const mappedAssignments = useMemo(() => allAssignments.map(mapApiToAssignment), [allAssignments]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // Sync API data into local state (for submit status updates)
    useEffect(() => {
        setAssignments(mappedAssignments);
    }, [mappedAssignments]);

    // Derive unique course names for filter dropdown
    const courseOptions = useMemo(() => {
        const courses = new Set(assignments.map(a => a.course));
        return Array.from(courses);
    }, [assignments]);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
        setSelectedFiles([]);
        setSubmitNotes('');
        setSubmitError('');
        setProgress(0);
        setShowSubmitModal(true);
    };

    const closeSubmitModal = () => {
        if (submittingId) return; // prevent closing during submit
        setShowSubmitModal(false);
        setCurrentAssignment(null);
        setSelectedFiles([]);
        setSubmitNotes('');
        setSubmitError('');
        setProgress(0);
    };

    const onFilesSelected = (newFiles: FileList | null) => {
        setSubmitError('');
        if (!newFiles || newFiles.length === 0 || !currentAssignment) return;

        const filesArray = Array.from(newFiles);
        const validFiles: File[] = [];
        const errors: string[] = [];

        for (const file of filesArray) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (allowedExtensions.length && (!ext || !allowedExtensions.includes(ext))) {
                errors.push(`${file.name}: Invalid file type`);
                continue;
            }
            if (file.size > maxBytes) {
                errors.push(`${file.name}: File too large (Max: ${currentAssignment.maxFileSize})`);
                continue;
            }
            validFiles.push(file);
        }

        if (errors.length > 0) {
            setSubmitError(errors.join(', '));
        }

        if (validFiles.length > 0) {
            setSelectedFiles([...selectedFiles, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setSubmitError('');
    };

    const submitAssignment = async () => {
        if (!currentAssignment) return;
        setSubmitError('');
        if (selectedFiles.length === 0) {
            setSubmitError('Please select at least one file to submit.');
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

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-zinc-400">Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-[20px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">Failed to load assignments</h3>
                    <p className="text-gray-600 dark:text-zinc-400">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                        Assignments
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400">
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
                                    {courseOptions.map(course => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
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
                                                <h3 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100 flex-1">
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
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    <User className="w-4 h-4" />
                                                    <span>{assignment.instructor}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>


                                                <p className="text-[14px] text-gray-700 dark:text-zinc-300 mb-3">
                                                    {assignment.description}
                                                </p>

                                                {/* Attachments */}
                                                {assignment.attachments.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[12px] font-medium text-gray-600 dark:text-zinc-400 mb-2">Attachments:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {assignment.attachments.map((attachment, index) => (
                                                                <button
                                                                    key={index}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-[12px] text-gray-700 dark:text-zinc-300 transition-colors"
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
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                                                        <p className="text-[12px] font-medium text-gray-700 dark:text-zinc-300 mb-2">Submission Requirements:</p>
                                                        <div className="flex flex-wrap gap-4 text-[12px] text-gray-600 dark:text-zinc-400">
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
                                                            <p className="text-[11px] text-gray-600 dark:text-zinc-400 mt-1">
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
                                                    <button className="w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
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

                                                <button className="w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            </div>
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
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">No assignments found</h3>
                        <p className="text-gray-600 dark:text-zinc-400">Try adjusting your filter criteria</p>
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
                onFilesChange={onFilesSelected}
                selectedFiles={selectedFiles}
                onRemoveFile={removeFile}
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
    onFilesChange,
    selectedFiles,
    onRemoveFile,
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
    onFilesChange: (files: FileList | null) => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    notes: string;
    setNotes: (v: string) => void;
    onSubmit: () => void;
}) => {
    if (!open || !assignment) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                    <h3 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100">Submit Assignment</h3>
                    <p className="text-[14px] text-gray-600 dark:text-zinc-400 mt-1">{assignment.title}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Upload Files</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={(e) => onFilesChange(e.target.files)}
                                className="w-full"
                                accept={assignment.allowedFileTypes?.map((t) => `.${t.toLowerCase()}`).join(',')}
                                disabled={submitting}
                            />
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-zinc-400">
                            Allowed: {assignment.allowedFileTypes?.join(', ') || 'Any'} • Max size per file: {assignment.maxFileSize || '—'}
                        </p>
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Selected Files ({selectedFiles.length})</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-gray-900 dark:text-zinc-100 truncate">{file.name}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-zinc-500">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveFile(index)}
                                            disabled={submitting}
                                            className="ml-2 p-1 hover:bg-red-100 rounded text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Remove file"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Notes (optional)</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                            placeholder="Add any notes for your instructor"
                        />
                    </div>
                    {error && (
                        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-[14px] text-red-700">{error}</div>
                    )}
                    {submitting && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[12px] text-gray-600 dark:text-zinc-400">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
