import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, BookOpen, ChevronDown, X } from 'lucide-react';
import { studentService } from '@/api/services';
import { handleApiError } from '@/api/client';
import { CourseCard } from '@/components/CourseCard';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

const sortOptions = [
    { value: 'none', label: 'Default' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'instructor-asc', label: 'Instructor (A-Z)' },
    { value: 'instructor-desc', label: 'Instructor (Z-A)' },
];

export const CoursesPage = () => {
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('All');
    const [sortBy, setSortBy] = useState('none');

    // Debounced search (300ms)
    const debouncedSearch = useDebounce(searchQuery, 300);

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
        const uniqueInstructors = Array.from(new Set(allCourses.map((c: any) => c.instructor))) as string[];
        return ['All', ...uniqueInstructors.sort()];
    }, [allCourses]);

    // Filter Courses (search + instructor)
    const filteredCourses = useMemo(() => {
        let courses = allCourses;

        // Apply instructor filter
        if (selectedInstructor !== 'All') {
            courses = courses.filter((course: any) => course.instructor === selectedInstructor);
        }

        // Apply search filter (startsWith only)
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

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">Loading your courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-lg">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-2xl">⚠</span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{handleApiError(error).message}</p>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Could not load your courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-8 bg-gray-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Continue your learning journey
                            </p>
                        </div>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                        {allCourses.length} Course{allCourses.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses by title or instructor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Instructor Filter Dropdown */}
                    <div className="relative min-w-[180px]">
                        <select
                            value={selectedInstructor}
                            onChange={(e) => setSelectedInstructor(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                            {instructors.map((instructor) => (
                                <option key={instructor} value={instructor}>
                                    {instructor === 'All' ? 'All Instructors' : instructor}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative min-w-[160px]">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Courses Grid */}
                {sortedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sortedCourses.map((course: any) => (
                            <CourseCard
                                key={course.id}
                                id={course.id}
                                title={course.title}
                                description={course.description}
                                instructor={course.instructor}
                                progress={course.progress}
                                courseCode={course.courseCode}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No courses found</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md">
                            We couldn't find any courses matching your filters. Try adjusting your search or instructor filter.
                        </p>
                        {(searchQuery || selectedInstructor !== 'All') && (
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedInstructor('All'); }}
                                className="mt-4 px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};