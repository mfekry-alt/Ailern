import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Search, Loader2, BookOpen, ChevronDown, X, 
    BookMarked, Sparkles, SortAsc, Clock, Users,
    ArrowRight, User, LayoutGrid, Filter, Calendar
} from 'lucide-react';
import { studentService } from '@/api/services';
import { handleApiError } from '@/api/client';
import { ParallaxTiltCard } from '@/components/ui';
import { StudentCourseCard } from '@/components/StudentCourseCard';



// --- Custom hook for debouncing ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export const CoursesPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('All');
    const [sortBy, setSortBy] = useState('none');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isInstructorOpen, setIsInstructorOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    const instructorRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Fetch student's enrolled courses
    const { data: enrolledCoursesData, isLoading, error } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => studentService.getMyStudentCourses(),
    });

    // Safely extract courses
    const enrolledCourses = useMemo(() => {
        if (!enrolledCoursesData) return [];
        if (Array.isArray(enrolledCoursesData)) return enrolledCoursesData;
        
        // Deep extraction for various API shapes
        const data = (enrolledCoursesData as any);
        if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;
        if (data?.items && Array.isArray(data.items)) return data.items;
        
        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) return data[key];
        }
        return [];
    }, [enrolledCoursesData]);

    // Map API data
    const allCourses = useMemo(() => {
        return enrolledCourses.map((c: any) => ({
            id: c.id,
            title: c.name || c.code || 'Untitled Course',
            description: c.description || 'No description available for this course.',
            instructor: c.instructorName || 'Unknown Instructor',
            courseCode: c.code || '',
            progress: Math.floor(Math.random() * 60) + 10, // Mock progress for UI visual enhancement
        }));
    }, [enrolledCourses]);

    // Get unique instructors for filter dropdown
    const instructors = useMemo(() => {
        const unique = Array.from(new Set(allCourses.map((c: any) => c.instructor))) as string[];
        return ['All', ...unique.sort()];
    }, [allCourses]);

    // Filter Courses
    const filteredCourses = useMemo(() => {
        let courses = allCourses;
        if (selectedInstructor !== 'All') {
            courses = courses.filter((course: any) => course.instructor === selectedInstructor);
        }
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            courses = courses.filter((course: any) =>
                course.title.toLowerCase().startsWith(query) ||
                course.instructor.toLowerCase().startsWith(query)
            );
        }
        return courses;
    }, [allCourses, debouncedSearch, selectedInstructor]);

    // Sort Courses
    const sortedCourses = useMemo(() => {
        const courses = [...filteredCourses];
        switch (sortBy) {
            case 'title-asc': return courses.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc': return courses.sort((a, b) => b.title.localeCompare(a.title));
            case 'instructor-asc': return courses.sort((a, b) => a.instructor.localeCompare(b.instructor));
            case 'instructor-desc': return courses.sort((a, b) => b.instructor.localeCompare(a.instructor));
            default: return courses;
        }
    }, [filteredCourses, sortBy]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
            if (instructorRef.current && !instructorRef.current.contains(event.target as Node)) setIsInstructorOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortOptions = [
        { value: 'none', label: 'Default Order', icon: LayoutGrid },
        { value: 'title-asc', label: 'Title (A-Z)', icon: SortAsc },
        { value: 'title-desc', label: 'Title (Z-A)', icon: SortAsc },
        { value: 'instructor-asc', label: 'Instructor (A-Z)', icon: User },
    ];

    const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#020617] transition-colors duration-500">
                <Loader2 className="w-12 h-12 text-[#21A9FF] animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Loading your curriculum...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50 dark:bg-[#020617]">
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 p-10 rounded-[3rem] max-w-md text-center shadow-2xl backdrop-blur-md">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sync Interrupted</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{handleApiError(error).message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg"
                    >
                        Try Again
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
                                    Continue your learning journey with premium content and personalized tracks.
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Enrollment Badge */}
                        <div className="shrink-0 group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#21A9FF] to-indigo-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none animate-in fade-in zoom-in duration-700">
                                <div className="p-3.5 bg-gradient-to-br from-[#21A9FF] to-indigo-600 rounded-2xl shadow-lg shadow-[#21A9FF]/30">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Enrollment</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{allCourses.length}</span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Course{allCourses.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="mt-12 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex-1 w-full flex items-center gap-3 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus-within:border-[#21A9FF] dark:focus-within:border-[#21A9FF] transition-all duration-300">
                            <div className="pl-4 text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search your courses..."
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

                        {/* Instructor Filter */}
                        <div className="relative w-full md:w-auto" ref={instructorRef}>
                            <button
                                onClick={() => setIsInstructorOpen(!isInstructorOpen)}
                                className="flex items-center justify-between gap-4 min-w-[200px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Filter className="w-4 h-4 text-slate-400 group-hover:text-[#21A9FF] transition-colors" />
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                                        {selectedInstructor === 'All' ? 'All Instructors' : selectedInstructor}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isInstructorOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isInstructorOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto">
                                    {instructors.map((instructor) => (
                                        <button
                                            key={instructor}
                                            onClick={() => {
                                                setSelectedInstructor(instructor);
                                                setIsInstructorOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                                                selectedInstructor === instructor 
                                                ? 'bg-blue-50 dark:bg-[#21A9FF]/10 text-[#21A9FF]' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="text-sm font-bold truncate">{instructor === 'All' ? 'All Instructors' : instructor}</span>
                                            {selectedInstructor === instructor && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#21A9FF]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown */}
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
                                                setSortBy(option.value);
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
                {sortedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {sortedCourses.map((course, idx) => (
                            <div key={course.id} className="animate-in fade-in slide-in-from-bottom-4 flex" style={{ animationDelay: `${idx * 100}ms` }}>
                                <StudentCourseCard course={course} />
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
                            {searchQuery || selectedInstructor !== 'All' 
                                ? "We couldn't find any courses matching your filters. Try adjusting your search." 
                                : "You haven't enrolled in any courses yet. Start your journey by browsing available courses."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};