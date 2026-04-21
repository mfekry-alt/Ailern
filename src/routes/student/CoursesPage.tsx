import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, ParallaxTiltCard } from '@/components/ui';
import { ChevronLeft, ChevronRight, Search, Loader2, BookOpen, User, ArrowRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { studentService } from '@/api/services';
import { handleApiError } from '@/api/client';

const filterIcon = '/filter.svg';
const sortIcon = '/sort.svg';

const GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-violet-500 to-purple-700',
    'from-orange-400 to-rose-500',
    'from-cyan-400 to-blue-600',
    'from-fuchsia-500 to-pink-600',
];

export const CoursesPage = () => {
    const navigate = useNavigate();

    // UI State
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('none');
    const [filterByInstructor, setFilterByInstructor] = useState<string>('All');

    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 8;

    const sortRef = useRef<HTMLDivElement>(null);
    const instructorRef = useRef<HTMLDivElement>(null);

    // Fetch student's enrolled courses
    const { data: enrolledCoursesData, isLoading, error } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => studentService.getMyStudentCourses(),
    });

    // Safely extract courses
    const enrolledCourses = (() => {
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
    })();

    // Map API data
    const allCourses = useMemo(() => {
        return enrolledCourses.map((c: any, i: number) => ({
            id: c.id,
            title: c.name || c.code || 'Untitled Course',
            description: c.description || 'No description available for this course.',
            instructor: c.instructorName || 'Unknown Instructor',
            gradient: GRADIENTS[i % GRADIENTS.length],
            progress: Math.floor(Math.random() * 60) + 10, // Mock progress for UI visual enhancement
        }));
    }, [enrolledCourses]);

    const instructors = useMemo(
        () => Array.from(new Set(allCourses.map((c: any) => c.instructor))),
        [allCourses]
    );

    // Close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
            if (instructorRef.current && !instructorRef.current.contains(event.target as Node)) {
                setShowInstructorDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Courses
    const filteredCourses = allCourses.filter((course: any) => {
        const instructorMatch = filterByInstructor === 'All' || course.instructor === filterByInstructor;
        const searchMatch =
            searchQuery === '' ||
            course.title.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().startsWith(searchQuery.toLowerCase());
        return instructorMatch && searchMatch;
    });

    // Sort Courses
    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case 'title-asc': return a.title.localeCompare(b.title);
            case 'title-desc': return b.title.localeCompare(a.title);
            case 'instructor-asc': return a.instructor.localeCompare(b.instructor);
            case 'instructor-desc': return b.instructor.localeCompare(a.instructor);
            default: return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterByInstructor, searchQuery, sortBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading your learning space...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{handleApiError(error).message}</p>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Could not load your courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-blue-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-600/20 dark:border-blue-500/30">
                            <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Courses</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Pick up right where you left off.</p>
                        </div>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800/50 w-fit">
                        {allCourses.length} Enrolled Courses
                    </div>
                </div>

                {/* Search and Filters Control Panel */}
                <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 shadow-sm rounded-[1.5rem] overflow-visible">
                    <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses by title, description, or instructor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-[15px] bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative w-full sm:w-auto" ref={sortRef}>
                                <button
                                    onClick={() => {
                                        setShowSortDropdown(!showSortDropdown);
                                        setShowInstructorDropdown(false);
                                    }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium text-[15px] transition-colors px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700/50"
                                >
                                    <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    Sort By
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-20 min-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="p-1">
                                            {[
                                                { id: 'title-asc', label: 'Title (A-Z)' },
                                                { id: 'title-desc', label: 'Title (Z-A)' },
                                                { id: 'instructor-asc', label: 'Instructor (A-Z)' },
                                                { id: 'instructor-desc', label: 'Instructor (Z-A)' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => { setSortBy(option.id); setShowSortDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${sortBy === option.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Instructor Filter Dropdown */}
                            <div className="relative w-full sm:w-auto" ref={instructorRef}>
                                <button
                                    onClick={() => {
                                        setShowInstructorDropdown(!showInstructorDropdown);
                                        setShowSortDropdown(false);
                                    }}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 transition-colors px-5 py-3.5 rounded-xl border font-medium text-[15px] ${filterByInstructor !== 'All'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400'
                                        : 'bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700/50'}`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {filterByInstructor === 'All' ? 'Instructors' : filterByInstructor}
                                </button>
                                {showInstructorDropdown && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-20 min-w-[220px] max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                        <div className="p-1">
                                            <button
                                                onClick={() => { setFilterByInstructor('All'); setShowInstructorDropdown(false); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${filterByInstructor === 'All' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'}`}
                                            >
                                                All Instructors
                                            </button>
                                            <div className="h-px bg-gray-100 dark:bg-slate-700/50 my-1 mx-2"></div>
                                            {instructors.map((instructor: any) => (
                                                <button
                                                    key={instructor as string}
                                                    onClick={() => { setFilterByInstructor(instructor as string); setShowInstructorDropdown(false); }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${filterByInstructor === instructor ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'}`}
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="truncate">{instructor as string}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Grid */}
                {sortedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedCourses.map((course, index) => (
                            <ParallaxTiltCard
                                key={course.id}
                                onClick={() => navigate(`${ROUTES.COURSES}/${course.id}`)}
                                className={`group overflow-hidden rounded-[1.5rem] bg-white dark:bg-slate-800/40 backdrop-blur-sm shadow-md hover:shadow-xl dark:shadow-none border border-gray-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 cursor-pointer flex flex-col items-start`}
                                style={{ animationDelay: `${(index % 4) * 0.1}s` }}
                            >
                                {/* Thumbnail/Gradient Top */}
                                <div className="relative w-full aspect-[16/9] overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient} opacity-90 group-hover:scale-105 transition-transform duration-700`} />
                                    {/* Glass Pattern Overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]" />

                                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/30 text-white backdrop-blur-md border border-white/20">
                                        In Progress
                                    </div>
                                </div>

                                {/* Content Bottom */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col w-full z-10 bg-white dark:bg-transparent">
                                    <div className="grow space-y-3">
                                        <h3 className="text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {course.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="truncate">{course.instructor}</span>
                                        </div>

                                        <p className="text-[14px] leading-relaxed text-gray-500 dark:text-slate-400 line-clamp-2 pt-2">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="mt-6 space-y-2">
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                                            <span>Progress</span>
                                            <span className="text-blue-600 dark:text-blue-400">{course.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                        <div className="flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                            Continue Learning
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </ParallaxTiltCard>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No courses found</h3>
                        <p className="text-gray-500 dark:text-slate-400 max-w-md">
                            We couldn't find any courses matching your current filters. Try adjusting your search or clearing the instructor filter.
                        </p>
                        {(searchQuery || filterByInstructor !== 'All') && (
                            <button
                                onClick={() => { setSearchQuery(''); setFilterByInstructor('All'); }}
                                className="mt-6 px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-slate-300 hover:shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === page
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-slate-300'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-slate-300 hover:shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};