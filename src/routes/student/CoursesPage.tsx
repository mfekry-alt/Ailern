import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, ParallaxTiltCard } from '@/components/ui';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { studentService } from '@/api/services';
import { handleApiError } from '@/api/client';
// You might need to import your API client directly if courseService doesn't have the enroll method yet

const filterIcon = '/filter.svg';
const sortIcon = '/sort.svg';

// We keep gradients as a nice UI fallback in case the backend doesn't provide thumbnails yet
const GRADIENTS = [
    'from-teal-400 to-teal-600',
    'from-green-400 to-green-600',
    'from-green-500 to-green-700',
    'from-blue-400 to-blue-600',
    'from-orange-400 to-orange-600',
    'from-green-600 to-green-800',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-cyan-400 to-cyan-600',
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

    // Safely extract courses from various possible API response structures
    const enrolledCourses = (() => {
        // Direct array
        if (Array.isArray(enrolledCoursesData)) return enrolledCoursesData;

        // Wrapped in data.items
        if ((enrolledCoursesData as any)?.data?.items && Array.isArray((enrolledCoursesData as any).data.items)) {
            return (enrolledCoursesData as any).data.items;
        }

        // Wrapped in items
        if ((enrolledCoursesData as any)?.items && Array.isArray((enrolledCoursesData as any).items)) {
            return (enrolledCoursesData as any).items;
        }

        // Search for first array property
        if (enrolledCoursesData && typeof enrolledCoursesData === 'object') {
            for (const key of Object.keys(enrolledCoursesData)) {
                if (Array.isArray((enrolledCoursesData as any)[key])) {
                    return (enrolledCoursesData as any)[key];
                }
            }
        }

        return [];
    })();

    // Map API data cleanly
    const allCourses = useMemo(() => {
        return enrolledCourses.map((c: any, i: number) => ({
            id: c.id,
            title: c.name || c.code || 'Untitled Course',
            description: c.description || 'No description available.',
            instructor: c.instructorName || 'Unknown Instructor',
            gradient: GRADIENTS[i % GRADIENTS.length],
        }));
    }, [enrolledCourses]);

    const instructors = useMemo(
        () => Array.from(new Set(allCourses.map((c: any) => c.instructor))),
        [allCourses]
    );

    // Close dropdowns on click outside
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
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        return instructorMatch && searchMatch;
    });

    // Sort Courses (Removed fake 'duration' sorting)
    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'instructor-asc':
                return a.instructor.localeCompare(b.instructor);
            case 'instructor-desc':
                return b.instructor.localeCompare(a.instructor);
            default:
                return 0;
        }
    });

    // Client-side pagination (if the backend returns all items, otherwise rely on the API pagination)
    const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterByInstructor, searchQuery, sortBy]);


    if (isLoading) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex items-center justify-center bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-zinc-400">Loading available courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400 mb-4">{handleApiError(error).message}</p>
                    <p className="text-gray-600 dark:text-zinc-400">Could not load courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="space-y-6">

                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-[36px] font-bold leading-[40px] text-gray-900 dark:text-zinc-100">My Courses</h1>
                    <p className="text-[18px] leading-[28px] text-gray-600 dark:text-zinc-400 mt-1">Your enrolled courses for this term.</p>
                </div>

                {/* Search and Filters */}
                <Card variant="elevated" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                    <CardContent className="p-4">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses by title, description, or instructor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 animate-slide-in-left">
                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortRef}>
                                <button
                                    onClick={() => {
                                        setShowSortDropdown(!showSortDropdown);
                                        setShowInstructorDropdown(false);
                                    }}
                                    className="flex items-center bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[16px] transition-colors px-[17px] py-[9px] rounded-md border border-gray-300 dark:border-zinc-700 gap-2"
                                >
                                    <img src={sortIcon} alt="sort" className="w-5 h-5 dark:invert" />
                                    Sort
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                        <button onClick={() => { setSortBy('title-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm">Title (A-Z)</button>
                                        <button onClick={() => { setSortBy('title-desc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm">Title (Z-A)</button>
                                        <button onClick={() => { setSortBy('instructor-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm">Instructor (A-Z)</button>
                                    </div>
                                )}
                            </div>

                            {/* Instructor Filter */}
                            <div className="relative" ref={instructorRef}>
                                <button
                                    onClick={() => {
                                        setShowInstructorDropdown(!showInstructorDropdown);
                                        setShowSortDropdown(false);
                                    }}
                                    className="flex items-center bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[16px] transition-colors px-[17px] py-[9px] rounded-md border border-gray-300 dark:border-zinc-700 gap-2"
                                >
                                    <img src={filterIcon} alt="filter" className="w-5 h-5 dark:invert" />
                                    Instructor
                                </button>
                                {showInstructorDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto animate-dropdown">
                                        <button
                                            onClick={() => { setFilterByInstructor('All'); setShowInstructorDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterByInstructor === 'All' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                                        >
                                            All Instructors
                                        </button>
                                        {instructors.map((instructor: any) => (
                                            <button
                                                key={instructor as string}
                                                onClick={() => { setFilterByInstructor(instructor as string); setShowInstructorDropdown(false); }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterByInstructor === instructor ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                                            >
                                                {instructor as string}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Grid */}
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {paginatedCourses.map((course, index) => {
                            return (
                                <ParallaxTiltCard
                                    key={course.id}
                                    onClick={() => navigate(`${ROUTES.COURSES}/${course.id}`)}
                                    className={`overflow-hidden hover:shadow-xl transition-shadow card-hover animate-scale-up cursor-pointer rounded-lg bg-white dark:bg-zinc-900 shadow-md dark:shadow-lg border border-transparent dark:border-zinc-800 flex flex-col items-start`}
                                    style={{ animationDelay: `${(index % 4) * 0.1}s` }}
                                >
                                    <div className="relative w-full">
                                        <div
                                            className={`aspect-video bg-linear-to-br ${course.gradient}`}
                                            style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                                        />
                                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[12px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                            Open
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col w-full">
                                        <div className="grow">
                                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100 mb-2 leading-[28px] line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400 mb-4 line-clamp-2">
                                                {course.description}
                                            </p>
                                            <p className="text-[14px] text-gray-700 dark:text-zinc-300 mb-4">
                                                <span className="font-semibold">Instructor:</span> {course.instructor}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`${ROUTES.COURSES}/${course.id}`);
                                            }}
                                            className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 mt-auto"
                                        >
                                            View Course
                                        </button>
                                    </div>
                                </ParallaxTiltCard>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-zinc-300"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 rounded-md border transition-colors ${currentPage === page
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-zinc-300"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {sortedCourses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-zinc-400">
                            No courses found matching your criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};