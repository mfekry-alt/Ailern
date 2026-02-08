import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { courseService } from '@/api/services';
import { handleApiError } from '@/api/client';
const filterIcon = '/filter.svg';
const sortIcon = '/sort.svg';

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
    const [filterByStatus, setFilterByStatus] = useState<string>('All');
    const [filterByInstructor, setFilterByInstructor] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('none');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 8;
    const [courseStatuses, setCourseStatuses] = useState<{ [key: number]: string }>({});

    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const instructorRef = useRef<HTMLDivElement>(null);

    const { data: paginated, isLoading, error } = useQuery({
        queryKey: ['courses', 'available', { PageNumber: currentPage, PageSize: coursesPerPage }],
        queryFn: () =>
            courseService.getAvailableCourses({
                PageNumber: currentPage,
                PageSize: coursesPerPage,
            }),
    });

    const apiItems = paginated?.items ?? [];
    const allCourses = useMemo(
        () =>
            apiItems.map((c, i) => ({
                id: c.id,
                title: c.name || c.code,
                description: '',
                instructor: c.instructorName || 'Instructor',
                duration: '',
                status: 'open' as const,
                gradient: GRADIENTS[i % GRADIENTS.length],
                lectureCount: 0,
                assignmentCount: 0,
                quizCount: 0,
            })),
        [apiItems]
    );

    const instructors = useMemo(
        () => Array.from(new Set(allCourses.map((c) => c.instructor))),
        [allCourses]
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
            if (instructorRef.current && !instructorRef.current.contains(event.target as Node)) {
                setShowInstructorDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter courses by status, instructor, and search
    const filteredCourses = allCourses.filter(course => {
        const statusMatch = filterByStatus === 'All' || course.status === filterByStatus.toLowerCase();
        const instructorMatch = filterByInstructor === 'All' || course.instructor === filterByInstructor;
        const searchMatch =
            searchQuery === '' ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && instructorMatch && searchMatch;
    });

    // Sort courses
    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'duration-asc':
                return parseInt(a.duration.replace(/\D/g, '')) - parseInt(b.duration.replace(/\D/g, ''));
            case 'duration-desc':
                return parseInt(b.duration.replace(/\D/g, '')) - parseInt(a.duration.replace(/\D/g, ''));
            case 'instructor-asc':
                return a.instructor.localeCompare(b.instructor);
            case 'instructor-desc':
                return b.instructor.localeCompare(a.instructor);
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterByStatus, filterByInstructor, searchQuery, sortBy]);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex items-center justify-center min-h-[50vh]" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading available courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{handleApiError(error).message}</p>
                    <p className="text-gray-600">Could not load courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        // Status badge only shows Open or Closed (spec 2.1)
        switch (status) {
            case 'open':
            case 'pending':
            case 'enrolled':
                return { text: 'Open', className: 'bg-green-100 text-green-800' };
            case 'closed':
                return { text: 'Closed', className: 'bg-gray-200 text-gray-800' };
            default:
                return { text: 'Open', className: 'bg-green-100 text-green-800' };
        }
    };

    const getButtonText = (status: string) => {
        switch (status) {
            case 'open':
                return 'Request Enrollment';
            case 'pending':
                return 'Request Sent';
            case 'enrolled':
                return 'Go to Course';
            case 'closed':
                return 'Closed';
            default:
                return 'Request Enrollment';
        }
    };

    const getButtonStyle = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-600 text-white hover:bg-blue-700';
            case 'pending':
                return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
            case 'enrolled':
                return 'bg-green-600 text-white hover:bg-green-700';
            case 'closed':
                return 'bg-gray-200 text-gray-600 cursor-not-allowed';
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-[36px] font-bold leading-[40px] text-gray-900">Available Courses</h1>
                    <p className="text-[18px] leading-[28px] text-gray-600 mt-1">Browse and join courses offered this term.</p>
                </div>

                {/* Search, Sort and Filter Buttons */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses by title, description, or instructor..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 animate-slide-in-left">
                            <div className="relative" ref={sortRef}>
                                <button
                                    onClick={() => {
                                        setShowSortDropdown(!showSortDropdown);
                                        setShowFilterDropdown(false);
                                    }}
                                    className="flex items-center bg-white hover:bg-gray-50 text-gray-700 font-medium text-[16px] transition-colors"
                                    style={{ padding: '9px 17px', borderRadius: '6px', border: '1px solid #D1D5DB', gap: '8px' }}
                                >
                                    <img src={sortIcon} alt="sort" className="w-5 h-5" />
                                    Sort
                                </button>
                                {showSortDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                        <button
                                            onClick={() => {
                                                setSortBy('title-asc');
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                        >
                                            Title (A-Z)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('title-desc');
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                        >
                                            Title (Z-A)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('duration-asc');
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                        >
                                            Duration (Low to High)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('duration-desc');
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                        >
                                            Duration (High to Low)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('instructor-asc');
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                                        >
                                            Instructor (A-Z)
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={filterRef}>
                                <button
                                    onClick={() => {
                                        setShowFilterDropdown(!showFilterDropdown);
                                        setShowSortDropdown(false);
                                    }}
                                    className="flex items-center bg-white hover:bg-gray-50 text-gray-700 font-medium text-[16px] transition-colors"
                                    style={{ padding: '9px 17px', borderRadius: '6px', border: '1px solid #D1D5DB', gap: '8px' }}
                                >
                                    <img src={filterIcon} alt="filter" className="w-5 h-5" />
                                    Filter
                                </button>
                                {showFilterDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown">
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('All');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'All' ? 'bg-blue-50' : ''}`}
                                        >
                                            All Courses
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('open');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'open' ? 'bg-blue-50' : ''}`}
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('closed');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'closed' ? 'bg-blue-50' : ''}`}
                                        >
                                            Closed
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('enrolled');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'enrolled' ? 'bg-blue-50' : ''}`}
                                        >
                                            Enrolled
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('pending');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'pending' ? 'bg-blue-50' : ''}`}
                                        >
                                            Pending Request
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Filter by Instructor */}
                            <div className="relative" ref={instructorRef}>
                                <button
                                    onClick={() => {
                                        setShowInstructorDropdown(!showInstructorDropdown);
                                        setShowFilterDropdown(false);
                                        setShowSortDropdown(false);
                                    }}
                                    className="flex items-center bg-white hover:bg-gray-50 text-gray-700 font-medium text-[16px] transition-colors"
                                    style={{ padding: '9px 17px', borderRadius: '6px', border: '1px solid #D1D5DB', gap: '8px' }}
                                >
                                    <img src={filterIcon} alt="filter" className="w-5 h-5" />
                                    Instructor
                                </button>
                                {showInstructorDropdown && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] animate-dropdown max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                setFilterByInstructor('All');
                                                setShowInstructorDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByInstructor === 'All' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            All Instructors
                                        </button>
                                        {instructors.map((instructor) => (
                                            <button
                                                key={instructor}
                                                onClick={() => {
                                                    setFilterByInstructor(instructor);
                                                    setShowInstructorDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByInstructor === instructor ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                {instructor}
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
                            const currentStatus = courseStatuses[course.id] || course.status;
                            const statusBadge = getStatusBadge(currentStatus);
                            const delayClass = `animation-delay-[${(index % 4) * 0.1}s]`;
                            return (
                                <div
                                    key={course.id}
                                    onClick={() => navigate(`${ROUTES.COURSES}/${course.id}`, {
                                        state: {
                                            course: {
                                                id: course.id,
                                                title: course.title,
                                                instructor: course.instructor,
                                                description: course.description,
                                                isEnrolled: currentStatus === 'enrolled',
                                                progress: currentStatus === 'enrolled' ? 0 : 0,
                                                lectureCount: course.lectureCount,
                                                assignmentCount: course.assignmentCount,
                                                quizCount: course.quizCount,
                                            }
                                        }
                                    })}
                                    className={`overflow-hidden hover:shadow-xl transition-all card-hover animate-scale-up cursor-pointer ${delayClass}`}
                                    style={{
                                        borderRadius: '8px',
                                        background: '#FFF',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        animationDelay: `${(index % 4) * 0.1}s`
                                    }}
                                >
                                    <div className="relative w-full">
                                        <div
                                            className={`aspect-video bg-gradient-to-br ${course.gradient}`}
                                            style={{
                                                borderTopLeftRadius: '8px',
                                                borderTopRightRadius: '8px'
                                            }}
                                        ></div>
                                        {statusBadge && (
                                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[12px] font-semibold ${statusBadge.className}`}>
                                                {statusBadge.text}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex-grow">
                                            <h3 className="text-[18px] font-semibold text-gray-900 mb-2 leading-[28px]">
                                                {course.title}
                                            </h3>
                                            <p className="text-[14px] leading-[20px] text-gray-600 mb-4">
                                                {course.description}
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                <p className="text-[14px] text-gray-700">
                                                    <span className="font-semibold">Instructor:</span> {course.instructor}
                                                </p>
                                                <div className="flex items-center gap-4 text-[13px] text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">{course.lectureCount}</span>
                                                        <span>Lectures</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">{course.assignmentCount}</span>
                                                        <span>Assignments</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">{course.quizCount}</span>
                                                        <span>Quizzes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (currentStatus === 'closed' || currentStatus === 'pending') return;
                                                if (currentStatus === 'open') {
                                                    setCourseStatuses(prev => ({ ...prev, [course.id]: 'pending' }));
                                                    return;
                                                }
                                                navigate(`${ROUTES.COURSES}/${course.id}`, {
                                                    state: {
                                                        course: {
                                                            id: course.id,
                                                            title: course.title,
                                                            instructor: course.instructor,
                                                            description: course.description,
                                                            isEnrolled: true,
                                                            progress: 0,
                                                            lectureCount: course.lectureCount,
                                                            assignmentCount: course.assignmentCount,
                                                            quizCount: course.quizCount,
                                                        }
                                                    }
                                                });
                                            }}
                                            className={`button-press w-full py-2 px-4 rounded-lg font-medium transition-colors ${getButtonStyle(currentStatus)} ${currentStatus === 'pending' || currentStatus === 'closed' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            disabled={currentStatus === 'pending' || currentStatus === 'closed'}
                                        >
                                            {getButtonText(currentStatus)}
                                        </button>
                                    </div>
                                </div>
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
                            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {sortedCourses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600">
                            No courses found matching your filter criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

