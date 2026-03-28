import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { QUERY_KEYS } from '@/lib/constants';
import {
    FileText, Upload, Clock, CheckCircle, AlertCircle, Download,
    Calendar, User, Eye, X, Loader2, ListChecks, CheckSquare, Search
} from 'lucide-react';
import { getMyStudentCourses } from '@/api/services/student.service';
import { getCourseAssignmentsForStudent } from '@/api/services/assignment.service';
import type { GetAssignmentDto, GetCourseDto } from '@/types/api.types';

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
        description: dto.instructions || 'No detailed instructions provided.',
        attachments: dto.files?.map(f => f.fileName) || [],
        allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'],
        maxFileSize: '10 MB',
    };
};

export const AssignmentsPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Modals & Forms State
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [submitNotes, setSubmitNotes] = useState<string>('');
    const [submitError, setSubmitError] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

    // Fetch student's enrolled courses
    const { data: enrolledCoursesData } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => getMyStudentCourses(),
    });

    const enrolledCourses = useMemo(() => {
        if (Array.isArray(enrolledCoursesData)) return enrolledCoursesData;
        if ((enrolledCoursesData as any)?.data?.items && Array.isArray((enrolledCoursesData as any).data.items)) {
            return (enrolledCoursesData as any).data.items;
        }
        if ((enrolledCoursesData as any)?.items && Array.isArray((enrolledCoursesData as any).items)) {
            return (enrolledCoursesData as any).items;
        }
        if (enrolledCoursesData && typeof enrolledCoursesData === 'object') {
            for (const key of Object.keys(enrolledCoursesData)) {
                if (Array.isArray((enrolledCoursesData as any)[key])) {
                    return (enrolledCoursesData as any)[key];
                }
            }
        }
        return [];
    }, [enrolledCoursesData]);

    // Fetch assignments for all enrolled courses
    const { data: allAssignments = [], isLoading, error } = useQuery({
        queryKey: [QUERY_KEYS.ASSIGNMENTS, enrolledCourses.map((c: GetCourseDto) => c.id)],
        queryFn: async () => {
            if (enrolledCourses.length === 0) return [];
            const results = await Promise.allSettled(
                enrolledCourses.map((course: GetCourseDto) => getCourseAssignmentsForStudent(course.id))
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

    const initialAssignments = useMemo(() => allAssignments.map(mapApiToAssignment), [allAssignments]);
    const [localAssignments, setLocalAssignments] = useState<Assignment[]>([]);

    // Sync only once when data changes to prevent infinite loops
    useEffect(() => {
        setLocalAssignments(initialAssignments);
    }, [initialAssignments]);

    const courseOptions = useMemo(() => {
        const courses = new Set(localAssignments.map(a => a.course));
        return Array.from(courses);
    }, [localAssignments]);

    const allowedExtensions = useMemo(() => {
        const map: Record<string, string[]> = {
            PDF: ['pdf'], DOC: ['doc'], DOCX: ['docx'], ZIP: ['zip'],
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
        if (submittingId) return;
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
                errors.push(`${file.name}: Invalid type`);
                continue;
            }
            if (file.size > maxBytes) {
                errors.push(`${file.name}: Too large`);
                continue;
            }
            validFiles.push(file);
        }

        if (errors.length > 0) setSubmitError(errors.join(', '));
        if (validFiles.length > 0) setSelectedFiles([...selectedFiles, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setSubmitError('');
    };

    const submitAssignment = async () => {
        if (!currentAssignment) return;
        setSubmitError('');
        if (selectedFiles.length === 0) {
            setSubmitError('Please attach at least one file.');
            return;
        }
        setSubmittingId(currentAssignment.id);
        setProgress(0);

        // Simulate upload
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

        const submittedAt = new Date().toISOString();
        setLocalAssignments((prev) =>
            prev.map((a) => a.id === currentAssignment.id ? { ...a, status: 'submitted', submittedAt } : a)
        );
        setSubmittingId(null);
        setShowSubmitModal(false);
    };

    const filteredAssignments = localAssignments.filter(assignment => {
        const courseMatch = selectedCourse === 'all' || assignment.course.includes(selectedCourse);
        const statusMatch = selectedStatus === 'all' || assignment.status === selectedStatus;
        return courseMatch && statusMatch;
    });

    const stats = [
        { label: 'Total Tasks', value: localAssignments.length, icon: ListChecks, color: 'blue' },
        { label: 'Pending', value: localAssignments.filter(a => a.status === 'pending' || a.status === 'late').length, icon: Clock, color: 'amber' },
        { label: 'Submitted', value: localAssignments.filter(a => a.status === 'submitted').length, icon: Upload, color: 'indigo' },
        { label: 'Graded', value: localAssignments.filter(a => a.status === 'graded').length, icon: CheckCircle, color: 'emerald' }
    ];

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">We couldn't fetch your assignments. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-600/20 dark:border-indigo-500/30">
                            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assignments</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Manage your tasks and track deadlines.</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
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
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
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
                            <option value="all">All Enrolled Courses</option>
                            {courseOptions.map(course => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative group">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm font-medium cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                            <option value="late">Late / Overdue</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <CheckSquare className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No assignments found</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm">
                                You don't have any assignments matching these filters. You're all caught up!
                            </p>
                        </div>
                    ) : (
                        filteredAssignments.map((assignment) => {
                            const isLate = assignment.status === 'late';
                            const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';

                            let badgeStyle = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
                            let Icon = Clock;

                            if (isSubmitted) {
                                badgeStyle = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
                                Icon = assignment.status === 'graded' ? CheckCircle : Upload;
                            } else if (isLate) {
                                badgeStyle = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
                                Icon = AlertCircle;
                            }

                            return (
                                <div key={assignment.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 md:items-center">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{assignment.course}</span>
                                            <span className="text-gray-300 dark:text-slate-600">•</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {assignment.status}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {assignment.title}
                                        </h3>

                                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                                            {assignment.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800">
                                                <Calendar className={`w-4 h-4 ${isLate ? 'text-red-500' : 'text-blue-500'}`} />
                                                <span className={isLate ? 'text-red-600 dark:text-red-400' : ''}>
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800">
                                                <User className="w-4 h-4 text-purple-500" />
                                                <span>{assignment.instructor}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 w-full md:w-48 flex flex-col gap-2">
                                        {(!isSubmitted) && (
                                            <button
                                                onClick={() => openSubmitModal(assignment)}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Submit Work
                                            </button>
                                        )}

                                        {isSubmitted && (
                                            <button className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                View Submission
                                            </button>
                                        )}

                                        {assignment.attachments.length > 0 && (
                                            <button className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                                                <Download className="w-3.5 h-3.5" />
                                                Resources ({assignment.attachments.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
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

// ================= Submission Modal =================
const ChevronDown = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);

export const SubmissionModal = ({
    open, onClose, assignment, submitting, progress, error,
    onFilesChange, selectedFiles, onRemoveFile, notes, setNotes, onSubmit,
}: {
    open: boolean; onClose: () => void; assignment: Assignment | null;
    submitting: boolean; progress: number; error: string;
    onFilesChange: (files: FileList | null) => void; selectedFiles: File[];
    onRemoveFile: (index: number) => void; notes: string; setNotes: (v: string) => void;
    onSubmit: () => void;
}) => {
    if (!open || !assignment) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4">

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 shrink-0">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Submit Assignment</h3>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 line-clamp-1">{assignment.title}</p>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white">Upload Files</label>
                        <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group cursor-pointer text-center">
                            <input
                                type="file"
                                multiple
                                onChange={(e) => onFilesChange(e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept={assignment.allowedFileTypes?.map((t) => `.${t.toLowerCase()}`).join(',')}
                                disabled={submitting}
                            />
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Click or drag files here</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Max size: {assignment.maxFileSize || '10MB'} • Allowed: {assignment.allowedFileTypes?.join(', ') || 'Any'}
                            </p>
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-900 dark:text-white flex justify-between">
                                Attached Files <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{selectedFiles.length}</span>
                            </label>
                            <div className="space-y-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 text-blue-500">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveFile(index)}
                                            disabled={submitting}
                                            className="ml-3 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white">Submission Notes</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={submitting}
                            className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm resize-none custom-scrollbar"
                            placeholder="Add a message for your instructor..."
                        />
                    </div>

                    {submitting && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-sm font-bold text-blue-700 dark:text-blue-400">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-blue-200/50 dark:bg-blue-900/50 overflow-hidden">
                                <div className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-[2rem] flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting || selectedFiles.length === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:shadow-none text-sm flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {submitting ? 'Submitting' : 'Submit Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};