import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '@/api/services';
import { Users, Loader2, Search, ChevronLeft, ChevronRight, Eye, Trash2, UserMinus, Plus } from 'lucide-react';
import type { GetStudentsByCourseIdDto, PaginationResult } from '@/types/api.types';
import { StudentProfileModal } from '@/components/ui/StudentProfileModal';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddStudentModal } from '@/components/ui/AddStudentModal';

interface Ctx { courseId: string; numericCourseId: number | null }

const StudentStatsCells = ({ courseId, studentId }: { courseId: number | string, studentId: number }) => {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['student-profile-mini', courseId, studentId],
        queryFn: () => courseService.getStudentProfile(courseId, studentId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) return (
        <>
            <td className="px-8 py-5 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" /></td>
            <td className="px-8 py-5 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" /></td>
        </>
    );

    return (
        <>
            <td className="px-8 py-5 text-center">
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{profile?.progress || 0}%</span>
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[#21A9FF] transition-all duration-500" 
                            style={{ width: `${profile?.progress || 0}%` }} 
                        />
                    </div>
                </div>
            </td>
            <td className="px-8 py-5 text-center">
                <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-black border border-purple-100 dark:border-purple-500/20">
                    {profile?.averageQuizzesScore || 0}%
                </span>
            </td>
        </>
    );
};

export const CourseStudentsTab = () => {
    const { numericCourseId } = useOutletContext<Ctx>();
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<GetStudentsByCourseIdDto | null>(null);
    const [studentToRemove, setStudentToRemove] = useState<GetStudentsByCourseIdDto | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        setStudentToRemove(s);
    };

    const addMutation = useMutation({
        mutationFn: (email: string) => courseService.enrollStudentByEmail(numericCourseId!, email),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['course-students', numericCourseId] });
            toast.success('Student added successfully!');
            setIsAddModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to add student. Please check the email and try again.');
        }
    });

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
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#21A9FF]/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-[#21A9FF]" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Enrolled Students</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalResults} Total Enrollment</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 sm:p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#21A9FF] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search students by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-400 placeholder:font-medium shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2 px-5 py-3 bg-[#21A9FF]/5 dark:bg-[#21A9FF]/10 rounded-2xl border border-[#21A9FF]/10 w-full sm:w-auto justify-center">
                    <span className="text-[10px] font-black text-[#21A9FF] uppercase tracking-widest whitespace-nowrap">{totalResults} Enrolled Students</span>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-[#21A9FF]/20 active:scale-95 shrink-0"
                >
                    <UserMinus className="w-4 h-4 hidden" /> {/* For spacing maybe, or just use Plus */}
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Student</span>
                </button>
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
                    {/* Card-based layout for mobile, Table for desktop */}
                    <div className="lg:hidden space-y-3">
                        {students.map((s) => (
                            <div key={s.studentId} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm group hover:border-[#21A9FF]/30 transition-all">
                                <div className="flex items-center gap-5 mb-5">
                                    <div 
                                        className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-[#21A9FF]/20 shrink-0 border-4 border-white dark:border-slate-800 rotate-2 group-hover:rotate-6 transition-transform cursor-pointer"
                                        onClick={() => setSelectedStudent(s)}
                                    >
                                        {s.fullName?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 
                                            className="font-black text-slate-900 dark:text-white text-xl truncate mb-1 cursor-pointer hover:text-[#21A9FF] transition-colors"
                                            onClick={() => setSelectedStudent(s)}
                                        >
                                            {s.fullName}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrolled Student</span>
                                            <div className="w-1 h-1 bg-[#21A9FF] rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {s.email}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setSelectedStudent(s)}
                                            className="flex items-center justify-center gap-2 py-3.5 bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF] rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Progress</span>
                                        </button>
                                        <button 
                                            onClick={() => handleRemoveStudent(s)}
                                            className="flex items-center justify-center gap-2 py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden lg:block bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Contact Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Course Progress</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Quiz Performance</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {students.map((s) => (
                                        <tr key={s.studentId} className="group hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#21A9FF]/10 shrink-0 cursor-pointer group-hover:rotate-6 transition-transform duration-300"
                                                        onClick={() => setSelectedStudent(s)}
                                                    >
                                                        {s.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span 
                                                            className="font-black text-slate-900 dark:text-white cursor-pointer hover:text-[#21A9FF] transition-colors block text-base truncate tracking-tight"
                                                            onClick={() => setSelectedStudent(s)}
                                                        >
                                                            {s.fullName}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrolled</span>
                                                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                                            <span className="text-[9px] font-black text-[#21A9FF] uppercase tracking-widest">Student</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {s.email}
                                                </span>
                                            </td>
                                            
                                            <StudentStatsCells 
                                                courseId={numericCourseId || ''} 
                                                studentId={s.studentId} 
                                            />

                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => setSelectedStudent(s)}
                                                        className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF] rounded-2xl hover:bg-[#21A9FF] hover:text-white transition-all shadow-sm group/btn flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                                        title="View Profile & Progress"
                                                    >
                                                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                        <span>Progress</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveStudent(s)}
                                                        className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm group/btn"
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-4 sm:px-8 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 gap-4 shadow-sm">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900 dark:text-white">{(page - 1) * pageSize + 1}</span>–<span className="text-slate-900 dark:text-white">{Math.min(page * pageSize, totalResults)}</span> of <span className="text-slate-900 dark:text-white">{totalResults}</span>
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#21A9FF] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1 shadow-inner">
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
                                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                                    page === pageNum
                                                        ? 'bg-[#21A9FF] text-white shadow-lg shadow-blue-500/30'
                                                        : 'text-slate-400 hover:text-[#21A9FF] hover:bg-white dark:hover:bg-slate-800'
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
                                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#21A9FF] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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

            <ConfirmDialog
                open={studentToRemove !== null}
                title="Remove from Course?"
                description={
                    <>
                        Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-white">{studentToRemove?.fullName}</span> from this course?
                        <br />This will revoke their access to all course materials and assignments.
                    </>
                }
                confirmText="Remove Student"
                onClose={() => setStudentToRemove(null)}
                onConfirm={() => {
                    if (studentToRemove) {
                        removeMutation.mutate(studentToRemove.studentId, {
                            onSuccess: () => setStudentToRemove(null)
                        });
                    }
                }}
                isPending={removeMutation.isPending}
            />

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={async (email) => { 
                    try {
                        await addMutation.mutateAsync(email); 
                    } catch (error) {
                        // Error is already handled by useMutation's onError callback
                    }
                }}
                isPending={addMutation.isPending}
            />
        </div>
    );
};
