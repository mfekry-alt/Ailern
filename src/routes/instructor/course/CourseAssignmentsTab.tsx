import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/api/services';
import { ROUTES } from '@/lib/constants';
import { Plus, FileText, Eye, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import type { GetAssignmentDto } from '@/types/api.types';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseAssignmentsTab = () => {
    const { courseId, numericCourseId } = useOutletContext<Ctx>();
    const navigate = useNavigate();

    const { data: assignments = [], isLoading } = useQuery<GetAssignmentDto[]>({
        queryKey: ['instructor-course-assignments', numericCourseId],
        queryFn: () => assignmentService.getCourseAssignmentsForInstructor(numericCourseId!),
        enabled: !!numericCourseId,
    });

    const getStatusBadge = (published: boolean) => {
        if (published) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Published</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">Draft</span>;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-500" /> Assignments
                </h2>
                <button onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-95">
                    <Plus className="w-4 h-4" /> New Assignment
                </button>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No assignments yet</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create your first assignment to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((a) => (
                        <div key={a.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-slate-500 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                    {getStatusBadge(a.isPublished)}
                                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">{a.title}</h4>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', String(a.id)))} className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="View Submissions">
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_EDIT.replace(':id', String(a.id)))} className="p-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
