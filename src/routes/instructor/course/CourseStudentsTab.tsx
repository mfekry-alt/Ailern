import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '@/api/services';
import { Users, Loader2, Search, ChevronLeft, ChevronRight, Eye, Trash2, UserMinus } from 'lucide-react';
import type { GetStudentsByCourseIdDto, PaginationResult } from '@/types/api.types';
import { StudentProfileModal } from '@/components/ui/StudentProfileModal';
import { toast } from 'sonner';

interface Ctx { courseId: string; numericCourseId: number | null }

export const CourseStudentsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<GetStudentsByCourseIdDto | null>(null);

    const queryKey = ['course-students', numericCourseId, page, debouncedSearch];

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery<PaginationResult<GetStudentsByCourseIdDto>>({
        queryKey,
        queryFn: () => courseService.getCourseStudents(numericCourseId!, {
            PageNumber: page,
            PageSize: pageSize,
            SearchString: debouncedSearch
        }),
        enabled: !!numericCourseId,
    });

    const removeMutation = useMutation({
        mutationFn: (studentId: number) => courseService.deleteEnrollment(numericCourseId!, studentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey });
            toast.success('Student removed from course');
        },
        onError: () => {
            toast.error('Failed to remove student');
        }
    });

    const handleRemoveStudent = (s: GetStudentsByCourseIdDto) => {
        if (window.confirm(`Are you sure you want to remove ${s.fullName} from this course?`)) {
            removeMutation.mutate(s.studentId);
        }
    };

    const students = data?.items || [];
    const totalResults = data?.totalResults || 0;
    const totalPages = data?.pagesCount || 1;

    if (isLoading && page === 1 && !debouncedSearch) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#21A9FF] animate-spin mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#21A9FF]" /> Enrolled Students
                </h2>
            </div>
            <div className="relative z-30 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white font-semibold transition-all"
                    />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#21A9FF]/10 rounded-xl border border-[#21A9FF]/20">
                    <span className="text-[10px] font-black text-[#21A9FF] uppercase tracking-widest">{totalResults} Enrolled</span>
                </div>
            </div>

            {/* Students List */}
            {students.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {debouncedSearch ? 'No matches found' : 'No students enrolled'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {debouncedSearch ? `Try adjusting your search for "${debouncedSearch}"` : 'Students will appear here once they join the course.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Student Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-center">Contact Details</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {students.map((s) => (
                                        <tr key={s.studentId} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#21A9FF]/20 shrink-0 cursor-pointer hover:rotate-6 transition-transform"
                                                        onClick={() => setSelectedStudent(s)}
                                                    >
                                                        {s.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span 
                                                            className="font-black text-gray-900 dark:text-white cursor-pointer hover:text-[#21A9FF] transition-colors block text-base truncate"
                                                            onClick={() => setSelectedStudent(s)}
                                                        >
                                                            {s.fullName}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enrolled</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className="text-[9px] font-black text-[#21A9FF] uppercase tracking-widest">Student</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex px-3 py-1.5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-300">
                                                    {s.email}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <button 
                                                        onClick={() => setSelectedStudent(s)}
                                                        className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF] rounded-xl hover:bg-[#21A9FF] hover:text-white transition-all shadow-sm group/btn flex items-center gap-2"
                                                        title="View Profile & Progress"
                                                    >
                                                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Progress</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveStudent(s)}
                                                        className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm group/btn"
                                                        title="Remove from Course"
                                                    >
                                                        <UserMinus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls - Premium Standardization */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800/40 p-3 px-6 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 gap-4 shadow-sm">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Showing <span className="text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span>- <span className="text-gray-900 dark:text-white">{Math.min(page * pageSize, totalResults)}</span> of <span className="text-gray-900 dark:text-white">{totalResults}</span>
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-[#21A9FF] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 gap-1 shadow-inner">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = page;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (page <= 3) pageNum = i + 1;
                                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = page - 2 + i;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                                    page === pageNum
                                                        ? 'bg-[#21A9FF] text-white shadow-lg shadow-[#21A9FF]/25'
                                                        : 'text-gray-400 hover:text-[#21A9FF] hover:bg-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-[#21A9FF] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Student Profile Modal */}
            <StudentProfileModal 
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                student={selectedStudent}
                courseId={numericCourseId || ''}
            />
        </div>
    );
};
