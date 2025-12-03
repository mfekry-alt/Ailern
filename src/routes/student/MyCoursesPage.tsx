import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import dropIcon from '../../../material/drop.svg';

export const MyCoursesPage = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('All');
    const [sortOption, setSortOption] = useState('none');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

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

    const courses = [
        {
            id: 1,
            title: 'Introduction to Computer Science',
            instructor: 'Dr. Alan Turing',
            progress: 75,
            status: 'In Progress',
            statusColor: 'text-gray-600',
            progressColor: 'bg-blue-600',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            id: 2,
            title: 'Calculus I',
            instructor: 'Dr. Isaac Newton',
            progress: 100,
            status: '100% Complete',
            statusColor: 'text-green-600',
            progressColor: 'bg-teal-500',
            backgroundImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        {
            id: 3,
            title: 'Linear Algebra',
            instructor: 'Dr. Olga Taussky-Todd',
            progress: 45,
            status: 'In Progress',
            statusColor: 'text-gray-600',
            progressColor: 'bg-blue-600',
            backgroundImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            id: 4,
            title: 'Probability and Statistics',
            instructor: 'Dr. C. R. Rao',
            progress: 100,
            status: '100% Complete',
            statusColor: 'text-green-600',
            progressColor: 'bg-teal-500',
            backgroundImage: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        },
        {
            id: 5,
            title: 'Discrete Mathematics',
            instructor: 'Dr. László Lovász',
            progress: 20,
            status: 'In Progress',
            statusColor: 'text-gray-600',
            progressColor: 'bg-blue-600',
            backgroundImage: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        },
        {
            id: 6,
            title: 'Data Structures and Algorithms',
            instructor: 'Dr. Donald Knuth',
            progress: 90,
            status: 'In Progress',
            statusColor: 'text-gray-600',
            progressColor: 'bg-blue-600',
            backgroundImage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        }
    ];

    // Filter courses
    const filteredCourses = courses.filter(course => {
        // Apply search filter
        const matchesSearch = searchQuery === '' ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

        // Apply status filter
        let matchesFilter = true;
        if (filterOption === 'All') matchesFilter = true;
        else if (filterOption === 'In Progress') matchesFilter = course.status === 'In Progress';
        else if (filterOption === 'Completed') matchesFilter = course.status === '100% Complete';
        else if (filterOption === 'Not Started') matchesFilter = course.progress === 0;

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

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1 animate-fade-in">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                        Hi, {user?.firstName || 'Student'}!
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600">
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
                                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{
                                        width: '256px',
                                        padding: '11px 17px 11px 41px',
                                        borderRadius: '6px',
                                        border: '1px solid #D1D5DB',
                                        background: '#FFF'
                                    }}
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
                                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium text-[14px] transition-colors"
                                        style={{
                                            width: '137px',
                                            height: '42px',
                                            padding: '9px 17px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexShrink: 0,
                                            borderRadius: '6px',
                                            border: '1px solid var(--grey-46, #6b7280)'
                                        }}
                                    >
                                        <span>{filterOption}</span>
                                        <img src={dropIcon} alt="dropdown" className="w-5 h-5" />
                                    </button>
                                    {showFilterDropdown && (
                                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                            <button
                                                onClick={() => {
                                                    setFilterOption('All');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterOption === 'All' ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('In Progress');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterOption === 'In Progress' ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                In Progress
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('Completed');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterOption === 'Completed' ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                Completed
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFilterOption('Not Started');
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterOption === 'Not Started' ? 'bg-blue-50' : ''
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
                                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium text-[14px] transition-colors"
                                        style={{
                                            width: '137px',
                                            height: '42px',
                                            padding: '9px 17px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexShrink: 0,
                                            borderRadius: '6px',
                                            border: '1px solid var(--grey-46, #6b7280)'
                                        }}
                                    >
                                        <span>Sort by</span>
                                        <img src={dropIcon} alt="dropdown" className="w-5 h-5" />
                                    </button>
                                    {showSortDropdown && (
                                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                            <button
                                                onClick={() => {
                                                    setSortOption('title-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                            >
                                                Title (A-Z)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('title-desc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                            >
                                                Title (Z-A)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('progress-desc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                            >
                                                Progress (High to Low)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('progress-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                            >
                                                Progress (Low to High)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortOption('instructor-asc');
                                                    setShowSortDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                            >
                                                Instructor (A-Z)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* View Toggle */}
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                            ? 'bg-white shadow-sm text-blue-600'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                            ? 'bg-white shadow-sm text-blue-600'
                                            : 'text-gray-600 hover:text-gray-800'
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
                        <Link
                            key={course.id}
                            to={`/courses/${course.id}`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all card-hover animate-scale-up"
                            style={{ animationDelay: `${(index % 3) * 0.1}s` }}
                        >
                            <div className="relative">
                                <div
                                    className="aspect-video rounded-t-lg relative"
                                    style={{ background: course.backgroundImage }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-[18px] font-bold text-gray-900 mb-1 leading-[28px]">
                                    {course.title}
                                </h3>
                                <p className="text-[14px] leading-[20px] text-gray-600 mb-3">
                                    {course.instructor}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="bg-gray-200 h-1.5 rounded-full overflow-hidden">
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
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {sortedCourses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600">
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
                            className={`p-2 rounded-md transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
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
                                            : 'text-gray-600 hover:bg-gray-100'
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
                                    <span key={page} className="px-4 py-2 text-gray-600">
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
