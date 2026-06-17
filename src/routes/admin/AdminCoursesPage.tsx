import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, QUERY_KEYS } from '@/lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllCourses } from '@/api/services/course.service';
import type { GetAllCoursesDto, GetAllCoursesDtoPaginationResult } from '@/types/api.types';
import { handleApiError } from '@/api/client';
import {
    Search, Trash2, Download,
    BookOpen, CheckCircle2, AlertTriangle, Video,
    Users, ChevronLeft, ChevronRight, Eye, X, ChevronDown, ArrowUpDown
} from 'lucide-react';
import { CourseDetailsModal } from '@/components/ui/CourseDetailsModal';
import { deleteCourse as deleteCourseApi } from '@/api/services/course.service';

// Skeleton row component for loading state
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="py-4 px-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700" />
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        </td>
        <td className="py-4 px-6"><div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded" /></td>
        <td className="py-4 px-6"><div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded" /></td>
        <td className="py-4 px-6"><div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" /></td>
        <td className="py-4 px-6"><div className="flex justify-center gap-2"><div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-xl" /></div></td>
    </tr>
);

// Format date to readable string
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// --- Page Size Selector Component ---
interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    disabled?: boolean;
}

const PageSizeSelector = ({ pageSize, onPageSizeChange, disabled }: PageSizeSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const options = [5, 10, 25, 50];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-[10px] font-black text-gray-700 dark:text-slate-200 hover:border-[#21A9FF]/50 transition-all shadow-sm group disabled:opacity-50"
            >
                {pageSize} / page
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onPageSizeChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-black transition-all ${pageSize === option
                                    ? 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {option} / page
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Sort Selector Component ---
interface SortOption {
    label: string;
    sortBy: string;
    order: 'asc' | 'desc';
    icon: any;
}

const SORT_OPTIONS: SortOption[] = [
    { label: 'A-Z', sortBy: 'Name', order: 'asc', icon: BookOpen },
    { label: 'Most Enrollments', sortBy: 'EnrolledStudents', order: 'desc', icon: Users },
    { label: 'Recently Created', sortBy: 'CreatedAt', order: 'desc', icon: Video },
];

interface SortSelectorProps {
    sortBy: string;
    order: 'asc' | 'desc';
    onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
    disabled?: boolean;
}

const SortSelector = ({ sortBy, order, onSortChange, disabled }: SortSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeOption = SORT_OPTIONS.find(opt => opt.sortBy === sortBy && opt.order === order) || SORT_OPTIONS[2];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:border-[#21A9FF]/50 transition-all shadow-sm group disabled:opacity-50 h-[50px] min-w-[220px] justify-between"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-[#21A9FF] transition-colors">
                        <ArrowUpDown className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Sort By</span>
                        <span>{activeOption.label}</span>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-full min-w-[240px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {SORT_OPTIONS.map((option) => {
                            const isActive = sortBy === option.sortBy && order === option.order;
                            return (
                                <button
                                    key={`${option.sortBy}-${option.order}`}
                                    onClick={() => {
                                        onSortChange(option.sortBy, option.order);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all mb-1 last:mb-0 ${isActive
                                        ? 'bg-[#21A9FF]/10 text-[#21A9FF]'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <option.icon className={`w-4 h-4 ${isActive ? 'text-[#21A9FF]' : 'text-gray-400'}`} />
                                        <span>{option.label}</span>
                                    </div>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#21A9FF] shadow-[0_0_8px_rgba(33,169,255,0.5)]" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export const AdminCoursesPage = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const [pageNo, setPageNo] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState('CreatedAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    // Toast notification state
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

    // Delete confirmation state
    const [deletingCourse, setDeletingCourse] = useState<GetAllCoursesDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    // Fetch courses query
    const {
        data: coursesData,
        isLoading,
        error: coursesError,
        refetch: refetchCourses,
    } = useQuery({
        queryKey: QUERY_KEYS.ADMIN_COURSES({ pageNo, pageSize }),
        queryFn: () => getAllCourses({
            PageNumber: pageNo,
            PageSize: pageSize,
        }),
    });

    const error = coursesError ? handleApiError(coursesError).message : null;

    // Derived states
    const courses = coursesData?.items ?? [];
    const pagination = coursesData ?? null;

    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPageNo(1);
    }, []);

    const confirmDeleteCourse = async () => {
        if (!deletingCourse) return;
        setIsDeleting(true);
        try {
            await deleteCourseApi(deletingCourse.id);
            showToast('Course deleted successfully.', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
        } catch (err) {
            const apiError = handleApiError(err);
            showToast(apiError.message, 'error');
        } finally {
            setIsDeleting(false);
            setDeletingCourse(null);
        }
    };

    // Client-side search filter with startsWith logic (name, code, instructorName only)
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        // 1. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter((course) => {
                const name = course.name?.toLowerCase() ?? '';
                const code = course.code?.toLowerCase() ?? '';
                const instructorName = course.instructorName?.toLowerCase() ?? '';

                return (
                    name.startsWith(query) ||
                    code.startsWith(query) ||
                    instructorName.startsWith(query)
                );
            });
        }

        // 2. Client-side Sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'Name') {
                comparison = (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'EnrolledStudents') {
                comparison = (a.enrolledStudents || 0) - (b.enrolledStudents || 0);
            } else if (sortBy === 'CreatedAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }

            return order === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [courses, searchQuery, sortBy, order]);


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] p-4 sm:p-8 lg:p-10 transition-colors duration-300 font-sans pb-20 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Toast Notification - Moved to root to escape stacking context */}
            {statusMessage && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-8 duration-500">
                    <div className={`px-8 py-4 rounded-[3rem] border shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[320px] justify-center ${statusMessage.type === 'success'
                        ? 'bg-[#E0E7FF]/90 border-[#C7D2FE] text-slate-900'
                        : 'bg-red-50/90 border-red-200 text-red-900'
                        }`}>
                        {statusMessage.type === 'success' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
                                <AlertTriangle className="w-4 h-4 stroke-[3]" />
                            </div>
                        )}
                        <span className="font-black text-base tracking-tight">{statusMessage.text}</span>
                    </div>
                </div>
            )}

            <div className="max-w-[1920px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">

                {/* --- Header --- */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Video className="w-8 h-8 text-[#21A9FF]" /> Course Management
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
                            Oversee platform content and track course metrics.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => {
                                const rows = [
                                    ['id', 'code', 'name', 'instructorName', 'enrolledStudents', 'createdAt'],
                                    ...filteredCourses.map((c) => [
                                        String(c.id),
                                        c.code,
                                        `"${c.name}"`,
                                        `"${c.instructorName}"`,
                                        String(c.enrolledStudents || 0),
                                        formatDate(c.createdAt),
                                    ]),
                                ];
                                const csv = rows.map((r) => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.setAttribute('href', url);
                                link.setAttribute('download', 'ailern_courses_export.csv');
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                showToast('Export downloaded successfully.');
                            }}
                            disabled={isLoading || filteredCourses.length === 0}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-2xl font-bold transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* --- Search & Filter --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm flex flex-col lg:flex-row gap-4 items-center relative z-20">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#21A9FF] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, code, or instructor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 outline-none text-gray-900 dark:text-white transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed h-[50px]"
                        />
                    </div>
                    
                    <SortSelector 
                        sortBy={sortBy}
                        order={order}
                        onSortChange={(s, o) => {
                            setSortBy(s);
                            setOrder(o);
                        }}
                        disabled={isLoading}
                    />
                </div>

                {/* --- Courses Table --- */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700/50">
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Course Code</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Course Name</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Enrolled Students</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Created Date</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {isLoading ? (
                                    <>
                                        {Array.from({ length: 5 }).map((_, idx) => (
                                            <SkeletonRow key={idx} />
                                        ))}
                                    </>
                                ) : (
                                    filteredCourses.map((course) => (
                                        <tr key={course.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                                    {course.code}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
                                                        {course.imageUrl ? (
                                                            <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src="/course-default.png" alt="Default Course" className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                        {course.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        {(course.instructorName || 'I')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{course.instructorName || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300 text-sm font-bold">
                                                    <Users className="w-4 h-4 text-blue-500" /> {course.enrolledStudents || 0}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                                    {formatDate(course.createdAt)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCourseId(course.id);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                        className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 rounded-xl transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingCourse(course)}
                                                        className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 text-gray-500 rounded-xl transition-colors"
                                                        title="Delete Course"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Empty State --- */}
                    {!isLoading && filteredCourses.length === 0 && (
                        <div className="text-center py-20 bg-gray-50/30 dark:bg-slate-900/30">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {searchQuery.trim() ? 'No matching courses' : 'No courses found'}
                            </h3>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                {searchQuery.trim()
                                    ? `No courses start with "${searchQuery.trim()}". Try a different search.`
                                    : 'Try adjusting your search or refresh the page.'}
                            </p>
                        </div>
                    )}

                    {/* --- Pagination --- */}
                    {!isLoading && pagination && filteredCourses.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-slate-700/50 gap-4 bg-gray-50/30 dark:bg-slate-900/5">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Results</p>
                                    <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                                        Showing <span className="text-[#21A9FF]">{filteredCourses.length}</span> of <span className="text-gray-900 dark:text-white font-black">{pagination.totalResults}</span> courses
                                    </p>
                                </div>
                                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
                                <PageSizeSelector
                                    pageSize={pageSize}
                                    onPageSizeChange={handlePageSizeChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                <button
                                    onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                                    disabled={pageNo === 1 || isLoading}
                                    className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-blue-600 hover:bg-blue-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                <div className="px-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Page</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{pageNo}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">of</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{pagination.pagesCount}</span>
                                </div>

                                <button
                                    onClick={() => setPageNo((p) => Math.min(pagination.pagesCount, p + 1))}
                                    disabled={pageNo === pagination.pagesCount || isLoading}
                                    className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-500 hover:text-blue-600 hover:bg-blue-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- Error State --- */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[2rem] p-6 text-center m-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                            <button
                                onClick={() => refetchCourses()}
                                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Details Modal */}
            <CourseDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                courseId={selectedCourseId}
            />

            {/* Delete Confirmation Modal */}
            {deletingCourse !== null && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                                        Delete Course
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setDeletingCourse(null)}
                                disabled={isDeleting}
                                className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
                                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{deletingCourse.name}</span>? This action cannot be undone.
                            </p>
                        </div>

                        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setDeletingCourse(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteCourse}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Confirm Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};