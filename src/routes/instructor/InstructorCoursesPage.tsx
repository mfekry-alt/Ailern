import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Trash2, Plus, Users, Calendar, BookOpen,
    Loader2, BookMarked, ArrowRight, AlertCircle, LayoutGrid,
    Search, SlidersHorizontal, Sparkles, GraduationCap, ChevronDown,
    Layers, Clock, SortAsc, X
} from 'lucide-react';
import { ParallaxTiltCard } from '@/components/ui';
import { useInstructorCourses, useDeleteCourse } from '@/features/courses/api';
import { useAuthStore } from '@/features/auth/store';
import type { GetAllCoursesDto } from '@/types/api.types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/Input';

// --- Interfaces ---
interface Course {
    id: string;
    title: string;
    courseId: string;
    instructor: string;
    primaryAction?: string;
    secondaryAction?: string;
    students: number;
    startDate: string;
    sections: number;
    thumbnail: string;
    imageUrl?: string;
    description: string;
}

const THUMBNAILS = [
    '/course-default.png'
];

// --- Helper: Map API DTO to UI Course ---
const mapCourseToUI = (dto: GetAllCoursesDto): Course => {
    // Determine thumbnail based on ID for consistency
    const thumbIndex = dto.id % THUMBNAILS.length;
    
    return {
        id: dto.id.toString(),
        title: dto.name,
        courseId: dto.code,
        instructor: `Instructor #${dto.instructorId}`,
        students: dto.totalStudents,
        startDate: new Date(dto.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sections: dto.totalSections,
        primaryAction: 'Manage Content',
        thumbnail: dto.imageUrl || THUMBNAILS[thumbIndex],
        imageUrl: dto.imageUrl || undefined,
        description: dto.description || 'No description provided.',
    };
};

interface Course3DCardProps {
    course: Course;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSecondaryAction: (course: Course) => void;
}

const FALLBACK_IMAGE = "/course-default.png";

const Course3DCard = ({ course, onEdit, onDelete, onSecondaryAction }: Course3DCardProps) => {
    return (
        <ParallaxTiltCard
            className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-[#21A9FF]/10 transition-all duration-500 overflow-hidden h-full"
            intensity={6}
            scale={1.02}
        >
            {/* Image Section */}
            <div className="relative aspect-[16/7] overflow-hidden">
                <img 
                    src={course.imageUrl || course.thumbnail || FALLBACK_IMAGE} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Status Badge (Optional - can be customized per course status) */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white shadow-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#21A9FF]">
                        {course.courseId}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="h-10 mb-2">
                    <Link to={`/instructor/courses/${course.id}/manage/sections`} className="group/title" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover/title:text-[#21A9FF] transition-colors duration-300">
                            {course.title}
                        </h3>
                    </Link>
                </div>

                <div className="h-12 mb-2">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 opacity-80 italic">
                        {course.description}
                    </p>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20">
                            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {course.sections} Sections
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20">
                            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {course.students} Students
                        </span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2 text-slate-400">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(course.id); }}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-[#21A9FF]/10 hover:text-[#21A9FF] hover:border-[#21A9FF]/50 transition-all active:scale-95 group/edit"
                            title="Edit Course"
                        >
                            <Edit2 className="w-3.5 h-3.5 transition-transform group-hover/edit:rotate-12" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 group/trash"
                            title="Delete Course"
                        >
                            <Trash2 className="w-3.5 h-3.5 transition-transform group-hover/trash:scale-110" />
                        </button>
                    </div>

                    <Link to={`/instructor/courses/${course.id}/manage/sections`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <button className="w-full flex items-center justify-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black text-[10px] py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-[#21A9FF]/30 active:scale-95 group/btn">
                            Manage Content
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
            </div>
        </ParallaxTiltCard>
    );
};

export const InstructorCoursesPage = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'name' | 'students'>('name');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    const instructorId = useMemo(() => {
        if (typeof user?.id === 'number') return user.id;
        const parsedId = Number(user?.id);
        return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
    }, [user?.id]);

    // Fetch instructor courses
    const { data: coursesData, isLoading, error } = useInstructorCourses(instructorId);
    const deleteCourseMutation = useDeleteCourse();

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortOptions = [
        { value: 'latest', label: 'Latest First', icon: Clock },
        { value: 'name', label: 'Name (A-Z)', icon: SortAsc },
        { value: 'students', label: 'Most Students', icon: Users },
    ];

    const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

    // Map and Filter/Sort API data
    const courses = useMemo(() => {
        if (!coursesData?.items) return [];
        let mapped = coursesData.items.map(mapCourseToUI);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            mapped = mapped.filter(c =>
                c.title.toLowerCase().startsWith(query) ||
                c.courseId.toLowerCase().startsWith(query)
            );
        }

        return mapped.sort((a, b) => {
            if (sortBy === 'name') return a.title.localeCompare(b.title);
            if (sortBy === 'students') return b.students - a.students;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
    }, [coursesData, searchQuery, sortBy]);

    const handleDeleteCourse = (id: string) => {
        if (window.confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
            deleteCourseMutation.mutate(parseInt(id));
        }
    };

    const runSecondaryAction = (course: Course) => {
        navigate(ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id));
    };

    if (isLoading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-[2rem] max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load courses</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">We couldn't fetch your courses at this time. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 sm:p-8 lg:p-12 transition-colors duration-500 font-sans selection:bg-blue-500/30 pb-32">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-fade-in">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-[#21A9FF] rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-[#21A9FF]/20 shrink-0 transform -rotate-3">
                                <BookMarked className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#21A9FF] to-indigo-600">Courses</span>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium max-w-lg">
                                    Craft your curriculum and inspire your students with premium content and interactive sections.
                                </p>
                            </div>
                        </div>

                        <Link to={ROUTES.INSTRUCTOR_COURSE_NEW} className="shrink-0">
                            <button className="group relative flex items-center justify-center gap-3 bg-[#21A9FF] text-white font-black text-base px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 hover:-translate-y-1 active:scale-95 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#21A9FF] to-[#0094F2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="relative z-10">Create New Course</span>
                            </button>
                        </Link>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="mt-12 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex-1 w-full flex items-center gap-3 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus-within:border-[#21A9FF] dark:focus-within:border-[#21A9FF] transition-all duration-300">
                            <div className="pl-4 text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 py-2.5 font-semibold text-sm transition-all shadow-none"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="p-1.5 mr-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Custom Sort Dropdown */}
                        <div className="relative w-full md:w-auto" ref={sortRef}>
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center justify-between gap-4 min-w-[200px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-slate-400 group-hover:text-[#21A9FF] transition-colors" />
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{currentSort.label}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSortOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value as any);
                                                setIsSortOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                                                sortBy === option.value 
                                                ? 'bg-blue-50 dark:bg-[#21A9FF]/10 text-[#21A9FF]' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <option.icon className={`w-4 h-4 ${sortBy === option.value ? 'text-[#21A9FF]' : 'text-slate-400'}`} />
                                                <span className="text-sm font-bold">{option.label}</span>
                                            </div>
                                            {sortBy === option.value && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#21A9FF]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Courses Grid */}
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {courses.map((course, idx) => (
                            <div key={course.id} className="animate-in fade-in slide-in-from-bottom-4 flex" style={{ animationDelay: `${idx * 100}ms` }}>
                                <Course3DCard
                                    course={course}
                                    onEdit={(id) => navigate(ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', id))}
                                    onDelete={handleDeleteCourse}
                                    onSecondaryAction={runSecondaryAction}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-8">
                            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                <BookOpen className="w-14 h-14 text-slate-300 dark:text-slate-600" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                                <Sparkles className="w-6 h-6 text-[#21A9FF]" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 italic">No courses found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                            {searchQuery ? "We couldn't find any courses matching your search." : "Your curriculum is waiting to be built. Start by creating your first masterpiece."}
                        </p>
                        <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                            <button className="group flex items-center gap-3 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-black px-10 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-[#21A9FF]/25 hover:shadow-[#21A9FF]/40 hover:-translate-y-1 active:scale-95">
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Create New Course
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};