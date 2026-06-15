import { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/api/services';
import { ROUTES } from '@/lib/constants';
import { Plus, FileText, Edit, Trash2, Loader2, Calendar, Eye, Filter, ChevronDown, Search, Download, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { GetAssignmentDto } from '@/types/api.types';
import { useDeleteAssignment, useCourseAssignments, useAssignment } from '@/features/assignments/api';

interface Ctx { courseId: string; numericCourseId: number | null }

const parseServerDate = (iso?: string): Date => {
    if (!iso) return new Date(0);
    const normalized = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
    return new Date(normalized);
};

const toLocal = (iso?: string) => {
    if (!iso) return '—';
    try {
        return parseServerDate(iso).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return iso; }
};

export const CourseAssignmentsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();
    const navigate = useNavigate();

    const { data: assignments = [], isLoading } = useCourseAssignments(numericCourseId || 0);
    const deleteAssignmentMutation = useDeleteAssignment();

    const [filterStatus, setFilterStatus] = useState<'all' | 'Published' | 'Draft' | 'Closed'>('all');
    const [search, setSearch] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [filesModal, setFilesModal] = useState<{ assignmentId: number, title: string } | null>(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState<{ id: number, title: string } | null>(null);

    const { data: assignmentDetail, isLoading: isLoadingFiles } = useAssignment(filesModal?.assignmentId || 0);
    const assignmentFiles = assignmentDetail?.submissionFiles || assignmentDetail?.files || [];

    const filteredAssignments = useMemo(() => {
        const arr = Array.isArray(assignments) ? assignments : [];
        const term = search.trim().toLowerCase();
        return arr
            .filter((a) => {
                const isPastDue = parseServerDate(a.dueDate) < new Date();
                const status = isPastDue && a.isPublished ? 'closed' : a.isPublished ? 'published' : 'draft';
                const statusOk = filterStatus === 'all' || status === filterStatus.toLowerCase();
                const searchOk = !term || String(a.title ?? '').toLowerCase().startsWith(term);
                return statusOk && searchOk;
            })
            .sort((a, b) => parseServerDate(b.createdAt).getTime() - parseServerDate(a.createdAt).getTime());
    }, [assignments, filterStatus, search]);

    const getStatusBadge = (published: boolean, dueDate?: string) => {
        const isPastDue = dueDate ? parseServerDate(dueDate) < new Date() : false;
        if (isPastDue && published) {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">Closed</span>;
        }
        if (published) {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Published</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">Draft</span>;
    };

    <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin mb-3" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">Loading assignments...</p>
    </div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-[#21A9FF]" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assignments</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredAssignments.length} Total</p>
                    </div>
                </div>
                <button onClick={() => navigate(`/instructor/courses/${numericCourseId}/assignments/create`)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <Plus className="w-4 h-4" /> Create Assignment
                </button>
            </div>

            {/* Filters */}
            <div className="relative z-10 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-3 sm:p-4 flex flex-col lg:flex-row gap-3 shadow-sm">
                {/* Search */}
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search assignments..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 placeholder:font-medium"
                    />
                </div>

                {/* Status Dropdown */}
                <div className="relative shrink-0 w-full lg:w-auto">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 shadow-sm hover:border-[#21A9FF] transition-all min-w-[180px]"
                    >
                        <span className="flex-1 text-slate-700 dark:text-slate-200">
                            {filterStatus === 'all' ? 'All Status' : filterStatus}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStatusDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                {[
                                    { value: 'all' as const, label: 'All Status' },
                                    { value: 'Draft' as const, label: 'Draft' },
                                    { value: 'Published' as const, label: 'Published' },
                                    { value: 'Closed' as const, label: 'Closed' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setFilterStatus(opt.value); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${filterStatus === opt.value
                                                ? 'bg-[#21A9FF]/5 text-[#21A9FF]'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                            }`}
                                    >
                                        {opt.label}
                                        {filterStatus === opt.value && <div className="w-1.5 h-1.5 bg-[#21A9FF] rounded-full shadow-[0_0_10px_#21A9FF]" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {filteredAssignments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No assignments found</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create an assignment or adjust your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAssignments.map((assignment) => {
                        return (                            <div key={assignment.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-[2rem] flex flex-col group hover:shadow-xl hover:shadow-blue-500/5 hover:border-[#21A9FF]/50 transition-all duration-500 overflow-hidden relative">
                                {/* Card header */}
                                <div className="p-6 pb-0 flex justify-between items-start">
                                    {getStatusBadge(assignment.isPublished, assignment.dueDate)}
                                </div>

                                {/* Card body */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-2 tracking-tight group-hover:text-[#21A9FF] transition-colors">{assignment.title}</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 line-clamp-2 leading-relaxed">{assignment.instructions || 'No special instructions provided.'}</p>

                                    {/* Meta info */}
                                    <div className="mt-auto">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                <Calendar className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">{toLocal(assignment.dueDate)}</p>
                                            </div>
                                            {parseServerDate(assignment.dueDate) < new Date() && (
                                                <span className="ml-auto text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-500/20">Overdue</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card footer / Actions */}
                                <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/40 grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-700/50 mt-auto">
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_EDIT.replace(':id', assignment.id.toString()))} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#21A9FF] hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Edit">
                                        <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Edit</span>
                                    </button>
                                    <button onClick={() => setFilesModal({ assignmentId: assignment.id, title: assignment.title })} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Files">
                                        <FileText className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Files</span>
                                    </button>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', assignment.id.toString()))} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Submissions">
                                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase truncate w-full text-center px-0.5">Submits</span>
                                    </button>
                                    <button onClick={() => setAssignmentToDelete({ id: assignment.id, title: assignment.title })} className="py-4 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn" title="Delete">
                                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[8px] sm:text-[9px] font-black leading-none tracking-widest uppercase">Del</span>
                                    </button>
                                </div>
                            </div>

                        );
                    })}
                </div>
            )}

            {/* ── Files Modal ── */}
            {filesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFilesModal(null)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assignment Files</h2>
                                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{filesModal.title}</p>
                            </div>
                            <button onClick={() => setFilesModal(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </header>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-slate-900/40">
                            {isLoadingFiles ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-[#21A9FF]/30 border-t-[#21A9FF] rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading files...</p>
                                </div>
                            ) : assignmentFiles.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200 dark:border-slate-700">
                                        <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">No files attached to this assignment.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1 ml-0.5">Manage Files</p>
                                    {assignmentFiles.map((file: any, idx: number) => {
                                        const fileUrl = file.fileUrl || file.url;
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all">
                                                <div className="flex items-center gap-4 flex-1 truncate pr-2">
                                                    <div className="w-11 h-11 bg-[#21A9FF] rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-[#21A9FF]/20">
                                                        <FileText className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="truncate pr-4">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{file.fileName || file.name || `File ${idx + 1}`}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {fileUrl && (
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 text-[#21A9FF] rounded-xl hover:bg-[#21A9FF]/10 transition-all shadow-sm border border-gray-100 dark:border-slate-700 hover:border-[#21A9FF]/20"
                                                            title="Preview"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <footer className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                            <button
                                onClick={() => setFilesModal(null)}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-bold text-sm rounded-xl transition-colors hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={assignmentToDelete !== null}
                title="Delete this assignment?"
                description={
                    <>
                        <span className="font-bold text-gray-900 dark:text-white">&ldquo;{assignmentToDelete?.title}&rdquo;</span>
                        {' '}will be permanently removed. This cannot be undone.
                    </>
                }
                confirmText="Delete Assignment"
                onClose={() => setAssignmentToDelete(null)}
                onConfirm={() => {
                    if (assignmentToDelete) {
                        deleteAssignmentMutation.mutate(assignmentToDelete.id, {
                            onSuccess: () => setAssignmentToDelete(null)
                        });
                    }
                }}
                isPending={deleteAssignmentMutation.isPending}
            />
        </div>
    );
};
