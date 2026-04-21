import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ROUTES, QUERY_KEYS } from '@/lib/constants';
import {
    Plus, Edit, Eye, Upload, Clock, Users, FileText,
    Calendar, Loader2, Search, Trash2,
    Filter, CheckCircle2, X, AlertTriangle
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useInstructorMyCourses } from '@/features/instructor/api';
import { useInstructorAssignments, useDeleteAssignment } from '@/features/assignments/api';
import { handleApiError } from '@/api/client';

// --- Types ---
type Assignment = {
    id: string;
    title: string;
    course: string;
    courseId: number;
    dueDate: string;
    status: 'draft' | 'published' | 'closed';
    description: string;
    createdAt: string;
};

// --- Helpers ---
const mapAssignmentToUI = (assignment: GetAllAssignmentsDto): Assignment => ({
    id: assignment.id.toString(),
    title: assignment.title,
    course: assignment.courseName ? `${assignment.courseName}`.trim() : `Course ${assignment.courseId}`,
    courseId: assignment.courseId,
    dueDate: assignment.dueDate,
    status: assignment.isPublished ? 'published' : 'draft',
    description: assignment.instructions || '',
    createdAt: assignment.createdAt || new Date().toISOString(),
});

export const InstructorAssignmentsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isCourseSelectOpen, setIsCourseSelectOpen] = useState(false);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    // --- Queries ---
    const { data: assignmentsData, isLoading, error } = useInstructorAssignments();
    const { data: coursesData } = useInstructorMyCourses({ PageNumber: 1, PageSize: 100 });

    const assignments = useMemo(() => assignmentsData?.map(mapAssignmentToUI) || [], [assignmentsData]);

    // --- Mutations ---
    const deleteMutation = useDeleteAssignment();

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            setDeleteConfirm(null);
            showToast('success', 'Assignment deleted successfully.');
        } catch (err) {
            const apiError = handleApiError(err);
            setDeleteConfirm(null);
            showToast('error', apiError.message || 'Failed to delete assignment.');
        }
    };

    const filteredAssignments = assignments.filter(a =>
        (selectedCourse === 'all' || a.course.includes(selectedCourse)) &&
        (selectedStatus === 'all' || a.status === selectedStatus)
    );

    const stats = [
        { label: 'Total Assignments', value: assignments.length, icon: FileText, color: 'blue' },
        { label: 'Published', value: assignments.filter(a => a.status === 'published').length, icon: CheckCircle2, color: 'emerald' },
        { label: 'Drafts', value: assignments.filter(a => a.status === 'draft').length, icon: Edit, color: 'indigo' },
        { label: 'Past Due', value: assignments.filter(a => new Date(a.dueDate) < new Date()).length, icon: Clock, color: 'orange' }
    ];


    if (isLoading) return <LoadingSpinner />;

    if (error) {
        const apiError = handleApiError(error);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-red-200 dark:border-red-500/20 p-12 text-center shadow-sm">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load assignments</h3>
                        <p className="text-gray-500 dark:text-slate-400">{apiError.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg animate-in slide-in-from-top-2 ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <p className="text-sm font-bold">{toast.text}</p>
                        <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-black/10 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

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
                        onClick={() => setIsCourseSelectOpen(true)}
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                            {filteredAssignments.map((assignment) => (
                                <div key={assignment.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl flex flex-col group hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-500 transition-all overflow-hidden text-left">
                                    {/* Card header */}
                                    <div className="p-5 pb-0 flex justify-between items-start">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                                            assignment.status === 'published' 
                                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
                                                : 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                        }`}>
                                            {assignment.status}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={() => navigate(`/instructor/assignments/${assignment.id}/edit`)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit Assignment">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', assignment.id.toString()))} className="p-1.5 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors" title="View Submissions">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ id: parseInt(assignment.id), title: assignment.title })} disabled={deleteMutation.isPending} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Assignment">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 truncate">{assignment.course}</div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{assignment.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-4 line-clamp-2">{assignment.description || 'No description'}</p>

                                        {/* Meta info */}
                                        <div className="mt-auto space-y-2.5">
                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                <span className="font-semibold">Due:</span>
                                                <span className="truncate">{new Date(assignment.dueDate).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                {new Date(assignment.dueDate) < new Date() && (
                                                    <span className="ml-1 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">Past Due</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 p-8 animate-in zoom-in-95">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Assignment?</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                    Are you sure you want to delete <strong className="text-gray-900 dark:text-white">"{deleteConfirm.title}"</strong>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm.id)}
                                        disabled={deleteMutation.isPending}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Course Selection Modal */}
                {isCourseSelectOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCourseSelectOpen(false)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 p-8 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Course</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Choose a course to create an assignment in.</p>
                                </div>
                                <button onClick={() => setIsCourseSelectOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {!coursesData || coursesData.items.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 dark:text-slate-400 font-medium">You don't have any courses yet.</p>
                                    </div>
                                ) : (
                                    coursesData.items.map(course => (
                                        <button
                                            key={course.id}
                                            onClick={() => navigate(`/instructor/courses/${course.id}/assignments/create`)}
                                            className="w-full text-left p-4 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 rounded-xl transition-all group"
                                        >
                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{course.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{course.code || 'No code'}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};