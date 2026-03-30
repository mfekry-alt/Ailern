import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ROUTES, QUERY_KEYS } from '@/lib/constants';
import {
    Plus, Edit, Eye, Download, Upload, Clock, Users, FileText,
    CheckCircle, AlertCircle, Calendar, Loader2, Search, Trash2,
    ChevronDown, Filter, MoreVertical, CheckCircle2, LayoutGrid, X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    getInstructorAssignments,
    deleteAssignment,
    getAssignmentSubmissions,
    gradeSubmission,
    type GetAllAssignmentsDto,
    type GetAllAssignmentSubmissionsDto,
} from '@/api/services/assignment.service';
import { handleApiError } from '@/api/client';

// --- Types ---
type Assignment = {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    submissions: number;
    graded: number;
    status: 'draft' | 'published' | 'closed';
    description: string;
    attachments: string[];
    createdAt: string;
};

type Submission = {
    id: string;
    studentName: string;
    studentEmail: string;
    submittedAt: string;
    status: 'submitted' | 'graded' | 'late';
    grade?: number;
    feedback?: string;
    attachments: string[];
};

// --- Helpers ---
const mapAssignmentToUI = (assignment: GetAllAssignmentsDto): Assignment => ({
    id: assignment.id.toString(),
    title: assignment.title,
    course: assignment.courseName ? `${assignment.courseName}`.trim() : `Course ${assignment.courseId}`,
    dueDate: assignment.dueDate,
    submissions: 12, // Mock: Replace with real API data if available
    graded: 8,     // Mock: Replace with real API data if available
    status: assignment.isPublished ? 'published' : 'draft',
    description: assignment.instructions || '',
    attachments: [],
    createdAt: assignment.createdAt || new Date().toISOString(),
});

export const InstructorAssignmentsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

    // --- Queries ---
    const { data: assignmentsData, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS,
        queryFn: async () => {
            const response = await getInstructorAssignments();
            return Array.isArray(response) ? response : [];
        },
    });

    const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
        queryKey: QUERY_KEYS.ASSIGNMENT_SUBMISSIONS(selectedAssignmentId || 0),
        queryFn: () => getAssignmentSubmissions(selectedAssignmentId!),
        enabled: !!selectedAssignmentId,
    });

    const assignments = useMemo(() => assignmentsData?.map(mapAssignmentToUI) || [], [assignmentsData]);

    const submissions = useMemo(() => {
        if (!submissionsData || !Array.isArray(submissionsData)) return [];
        return submissionsData.map((sub: GetAllAssignmentSubmissionsDto): Submission => ({
            id: sub.id.toString(),
            studentName: sub.studentName || 'Student',
            studentEmail: 'student@ailern.com',
            submittedAt: sub.submittedAt,
            status: sub.grade !== null ? 'graded' : 'submitted',
            grade: sub.grade,
            feedback: sub.feedback || '',
            attachments: [],
        }));
    }, [submissionsData]);

    // --- Mutations ---
    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteAssignment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_ASSIGNMENTS }),
    });

    const gradeMutation = useMutation({
        mutationFn: ({ assignmentId, submissionId, grade, feedback }: any) =>
            gradeSubmission(assignmentId, submissionId, { score: grade, feedback }),
        onSuccess: () => selectedAssignmentId && queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSIGNMENT_SUBMISSIONS(selectedAssignmentId) }),
    });

    const handleGrade = (subId: string) => {
        const grade = prompt('Enter grade (0-100):');
        if (grade && !isNaN(parseFloat(grade))) {
            const feedback = prompt('Enter feedback (optional):') || undefined;
            gradeMutation.mutate({
                assignmentId: selectedAssignmentId,
                submissionId: parseInt(subId),
                grade: parseFloat(grade),
                feedback
            });
        }
    };

    const filteredAssignments = assignments.filter(a =>
        (selectedCourse === 'all' || a.course.includes(selectedCourse)) &&
        (selectedStatus === 'all' || a.status === selectedStatus)
    );

    const stats = [
        { label: 'Total Assignments', value: assignments.length, icon: FileText, color: 'blue' },
        { label: 'Published', value: assignments.filter(a => a.status === 'published').length, icon: CheckCircle2, color: 'emerald' },
        { label: 'Submissions', value: assignments.reduce((s, a) => s + a.submissions, 0), icon: Upload, color: 'indigo' },
        { label: 'To Grade', value: assignments.reduce((s, a) => s + (a.submissions - a.graded), 0), icon: Clock, color: 'orange' }
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50 shadow-sm shrink-0">
                            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assignment Lab</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Create, monitor, and grade student submissions.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Create Assignment
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute left-0 top-0 w-1 h-full bg-${stat.color}-500`}></div>
                            <div>
                                <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform shrink-0`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
                    <div className="flex-1 relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div className="flex-[2] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            placeholder="Filter by course name..."
                            value={selectedCourse === 'all' ? '' : selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value || 'all')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm font-bold"
                        />
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                            <FileText className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No assignments found</h3>
                            <p className="text-gray-500 dark:text-slate-400 mt-2">Try adjusting your filters or create a new assignment.</p>
                        </div>
                    ) : filteredAssignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex flex-col lg:flex-row gap-6 lg:items-center relative overflow-hidden">

                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${assignment.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                        }`}>
                                        {assignment.status}
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{assignment.course}</span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                                    {assignment.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-gray-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> {assignment.submissions} Students Submitted</div>
                                </div>

                                {/* Grading Progress */}
                                <div className="space-y-1.5 max-w-md">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        <span>Grading Progress</span>
                                        <span className="text-blue-600 dark:text-blue-400">{Math.round((assignment.graded / assignment.submissions) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(assignment.graded / assignment.submissions) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap lg:flex-col items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
                                <button
                                    onClick={() => { setSelectedAssignmentId(parseInt(assignment.id)); setViewingAssignment(assignment); }}
                                    className="flex-1 lg:w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    <Eye className="w-4 h-4" /> View Submissions
                                </button>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => navigate(`/instructor/assignments/${assignment.id}/edit`)}
                                        className="flex-1 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        <Edit className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => deleteMutation.mutate(parseInt(assignment.id))}
                                        className="flex-1 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submissions Modal */}
                {viewingAssignment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingAssignment(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">

                            <header className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Submissions</h2>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{viewingAssignment.title}</p>
                                </div>
                                <button onClick={() => setViewingAssignment(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </header>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {isLoadingSubmissions ? (
                                    <div className="py-20 flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading student work...</p>
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="py-20 text-center text-gray-500">No submissions yet for this assignment.</div>
                                ) : (
                                    <div className="grid gap-4">
                                        {submissions.map((sub) => (
                                            <div key={sub.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-300 dark:hover:border-slate-500 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-gray-700 dark:text-white font-black text-lg shadow-inner shrink-0">
                                                        {sub.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{sub.studentName}</h4>
                                                        <p className="text-xs font-medium text-gray-500 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" /> Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                                                    <div className="text-center shrink-0">
                                                        <p className={`text-xl font-black ${sub.grade ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                            {sub.grade !== undefined ? `${sub.grade}%` : '--'}
                                                        </p>
                                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-1">Grade</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shadow-sm" title="Download Submission">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleGrade(sub.id)}
                                                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                                                        >
                                                            {sub.grade !== undefined ? 'Edit Grade' : 'Grade Submission'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <footer className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
                                <button onClick={() => setViewingAssignment(null)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors">Close</button>
                            </footer>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};