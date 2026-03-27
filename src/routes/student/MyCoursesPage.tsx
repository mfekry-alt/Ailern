import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
const dropIcon = '/drop.svg';
import { ROUTES } from '@/lib/constants';
import { userService } from '@/api/services';
import { handleApiError } from '@/api/client';
import type { GetCourseDto } from '@/types/api.types';

const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

export const MyCoursesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('All');
    const [sortOption, setSortOption] = useState('none');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    const { data: apiCoursesData, isLoading, error } = useQuery({
        queryKey: ['student', 'my-courses'],
        queryFn: () => userService.getStudentCourses(),
    });

    // Safely extract courses from various possible API response structures
    const apiCourses = (() => {
        // Direct array
        if (Array.isArray(apiCoursesData)) return apiCoursesData;

        // Wrapped in data.items
        if ((apiCoursesData as any)?.data?.items && Array.isArray((apiCoursesData as any).data.items)) {
            return (apiCoursesData as any).data.items;
        }

        // Wrapped in items
        if ((apiCoursesData as any)?.items && Array.isArray((apiCoursesData as any).items)) {
            return (apiCoursesData as any).items;
        }

        // Search for first array property
        if (apiCoursesData && typeof apiCoursesData === 'object') {
            for (const key of Object.keys(apiCoursesData)) {
                if (Array.isArray((apiCoursesData as any)[key])) {
                    return (apiCoursesData as any)[key];
                }
            }
        }

        return [];
    })();

    const courses = useMemo(() => {
        return apiCourses.map((c: GetCourseDto, i: number) => ({
            id: c.id,
            title: c.name || c.code,
            instructor: c.instructorName || 'Instructor',
            progress: 0,
            status: 'In Progress',
            statusColor: 'text-gray-600',
            progressColor: 'bg-blue-600',
            backgroundImage: GRADIENTS[i % GRADIENTS.length],
        }));
    }, [apiCourses]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        setSearchQuery(q);
    }, [location.search]);

    // Filter courses
    const filteredCourses = courses.filter((course: any) => {
        // Apply search filter
        const matchesSearch = searchQuery === '' ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

        // Apply status filter
        let matchesFilter = true;
        if (filterOption === 'All') matchesFilter = true;
        else if (filterOption === 'In Progress') matchesFilter = course.status === 'In Progress';
        else if (filterOption === 'Completed') matchesFilter = course.status === 'Completed';
        else if (filterOption === 'Not Started') matchesFilter = course.status === 'Not Started';

        return matchesSearch && matchesFilter;
    });

    // Sort courses
    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortOption) {
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'progress-asc':
                return a.progress - b.progress;
            case 'progress-desc':
                return b.progress - a.progress;
            case 'instructor-asc':
                return a.instructor.localeCompare(b.instructor);
            case 'instructor-desc':
                return b.instructor.localeCompare(a.instructor);
            default:
                return 0;
        }
    });

    // Pagination logic
    const pageSize = viewMode === 'grid' ? 9 : 12; // 9 for grid (3x3), 12 for list
    const totalPages = Math.ceil(sortedCourses.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

    // Reset to page 1 when filters/sort/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterOption, sortOption, viewMode]);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex items-center justify-center min-h-[50vh] bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-zinc-400">Loading your courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
                <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400 mb-4">{handleApiError(error).message}</p>
                    <p className="text-gray-600 dark:text-zinc-400">Could not load your courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1 animate-fade-in">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                        Hi, {user?.firstName || 'Student'}!
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400">
                        Course overview.
                    </p>
                </div>

                {/* Search, Sort, Filter and View Toggle */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex gap-4 items-center animate-slide-in-left">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-[256px] py-[11px] px-[17px] pl-[41px] rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                />
                            </div>

                            {/* Buttons Group on the Right */}
                            <div className="flex gap-4 items-center ml-auto">
                                <div className="relative" ref={filterRef}>
                                    <button
                                        onClick={() => {
                                            setShowFilterDropdown(!showFilterDropdown);
                                            setShowSortDropdown(false);
                                        }}
                                        className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[14px] transition-colors w-[137px] h-[42px] px-[17px] py-[9px] flex items-center justify-between shrink-0 rounded-md border border-gray-500 dark:border-zinc-600"
                                    >
                                        <span>{filterOption}</span>
                                        <img src={dropIcon} alt="dropdown" className="w-5 h-5" />
                                    </button>
                                    {showFilterDropdown && (
                                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                            <button
                                                onClick={() => {
                                                    setFilterOption('All');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterOption === 'All' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('In Progress');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterOption === 'In Progress' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                            >
                                                In Progress
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('Completed');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterOption === 'Completed' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                            >
                                                Completed
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('Not Started');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm ${filterOption === 'Not Started' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                            >
                                                Not Started
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative" ref={sortRef}>
                                    <button
                                        onClick={() => {
                                            setShowSortDropdown(!showSortDropdown);
                                            setShowFilterDropdown(false);
                                        }}
                                        className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[14px] transition-colors w-[137px] h-[42px] px-[17px] py-[9px] flex items-center justify-between shrink-0 rounded-md border border-gray-500 dark:border-zinc-600"
                                    >
                                        <span>Sort by</span>
                                        <img src={dropIcon} alt="dropdown" className="w-5 h-5" />
                                    </button>
                                    {showSortDropdown && (
                                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                            <button
                                                onClick={() => {
                                                    setSortOption('title-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm"
                                            >
                                                Title (A-Z)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('title-desc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm"
                                            >
                                                Title (Z-A)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('progress-desc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm"
                                            >
                                                Progress (High to Low)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('progress-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm"
                                            >
                                                Progress (Low to High)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('instructor-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm"
                                            >
                                                Instructor (A-Z)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* View Toggle */}
                                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600'
                                            : 'text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600'
                                            : 'text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Grid */}
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {paginatedCourses.map((course, index) => (
                        <div
                            key={course.id}
                            onClick={() => navigate(`${ROUTES.COURSES}/${course.id}`, {
                                state: {
                                    course: {
                                        id: course.id,
                                        title: course.title,
                                        instructor: course.instructor,
                                        isEnrolled: true,
                                        progress: course.progress,
                                    }
                                }
                            })}
                            className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all card-hover animate-scale-up cursor-pointer"
                            style={{ animationDelay: `${(index % 3) * 0.1}s` }}
                        >
                            <div className="relative">
                                <div
                                    className="aspect-video rounded-t-lg relative"
                                    style={{ background: course.backgroundImage }}
                                >
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100 mb-1 leading-[28px]">
                                    {course.title}
                                </h3>
                                <p className="text-[14px] leading-[20px] text-gray-600 dark:text-zinc-400 mb-3">
                                    {course.instructor}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${course.progressColor}`}
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <p className={`text-[12px] leading-[16px] ${course.statusColor}`}>
                                    {course.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {sortedCourses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-zinc-400">
                            No courses found matching your search criteria.
                        </p>
                    </div>
                )}

                {/* Pagination - Only show if there are more courses than page size */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                        </button>

                        {/* Show page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-md font-medium transition-colors ${currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return (
                                    <span key={page} className="px-4 py-2 text-gray-600 dark:text-zinc-400">
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
