import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui';
import filterIcon from '../../../material/filter.svg';
import sortIcon from '../../../material/sort.svg';

export const CoursesPage = () => {
    const [filterByStatus, setFilterByStatus] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('none');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

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

    const allCourses = [
        {
            id: 1,
            title: 'Introduction to Artificial Intelligence',
            description: 'Explore the basics of AI, including problem-solving, knowledge representation, and machine learning.',
            instructor: 'Dr. Alan Turing',
            duration: '12 Weeks',
            status: 'available',
            gradient: 'from-teal-400 to-teal-600'
        },
        {
            id: 2,
            title: 'Advanced Data Science',
            description: 'Dive into advanced data analysis, statistical modeling, and big data processing techniques.',
            instructor: 'Dr. Ada Lovelace',
            duration: '10 Weeks',
            status: 'pending',
            gradient: 'from-green-400 to-green-600'
        },
        {
            id: 3,
            title: 'Machine Learning Fundamentals',
            description: 'Learn the core principles of machine learning, algorithms, and model evaluation.',
            instructor: 'Dr. Geoffrey Hinton',
            duration: '8 Weeks',
            status: 'enrolled',
            gradient: 'from-green-500 to-green-700'
        },
        {
            id: 4,
            title: 'Deep Learning Applications',
            description: 'Apply deep learning techniques to real-world problems, including neural networks and convolutional networks.',
            instructor: 'Dr. Yann LeCun',
            duration: '14 Weeks',
            status: 'available',
            gradient: 'from-blue-400 to-blue-600'
        },
        {
            id: 5,
            title: 'Natural Language Processing',
            description: 'Understand the fundamentals of NLP, text processing, and language modeling.',
            instructor: 'Dr. Yoshua Bengio',
            duration: '10 Weeks',
            status: 'available',
            gradient: 'from-orange-400 to-orange-600'
        },
        {
            id: 6,
            title: 'Computer Vision & Image Recognition',
            description: 'Discover computer vision techniques, image processing, and object recognition algorithms.',
            instructor: 'Dr. Fei-Fei Li',
            duration: '12 Weeks',
            status: 'rejected',
            gradient: 'from-green-600 to-green-800'
        }
    ];

    // Filter courses by status
    const filteredCourses = allCourses.filter(course => {
        if (filterByStatus === 'All') return true;
        return course.status === filterByStatus.toLowerCase();
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return { text: 'Pending Approval', className: 'bg-yellow-200 text-yellow-900' };
            case 'enrolled':
                return { text: 'Approved', className: 'bg-green-200 text-green-900' };
            case 'rejected':
                return { text: 'Rejected', className: 'bg-red-200 text-red-900' };
            default:
                return null;
        }
    };

    const getButtonText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Request Sent';
            case 'enrolled':
                return 'Go to Course';
            case 'rejected':
                return 'Re-apply';
            default:
                return 'Join Course';
        }
    };

    const getButtonStyle = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
            case 'enrolled':
                return 'bg-green-600 text-white hover:bg-green-700';
            case 'rejected':
                return 'bg-red-600 text-white hover:bg-red-700';
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

                {/* Sort and Filter Buttons */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex gap-4 animate-slide-in-left">
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
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'All' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            All Courses
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('available');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'available' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            Available
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('pending');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'pending' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            Pending
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('enrolled');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'enrolled' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            Enrolled
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterByStatus('rejected');
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm ${filterByStatus === 'rejected' ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            Rejected
                            </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Grid */}
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sortedCourses.map((course, index) => {
                        const statusBadge = getStatusBadge(course.status);
                            const delayClass = `animation-delay-[${(index % 4) * 0.1}s]`;
                        return (
                                <div
                                    key={course.id}
                                    className={`overflow-hidden hover:shadow-xl transition-all card-hover animate-scale-up ${delayClass}`}
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
                                    <div className="space-y-1 mb-4">
                                        <p className="text-[12px] text-gray-600">
                                            <span className="font-bold">Instructor:</span> {course.instructor}
                                        </p>
                                        <p className="text-[12px] text-gray-600">
                                            <span className="font-bold">Duration:</span> {course.duration}
                                        </p>
                                            </div>
                                    </div>
                                    <button
                                            className={`button-press w-full py-2 px-4 rounded-lg font-medium transition-colors ${getButtonStyle(course.status)} ${course.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={course.status === 'pending'}
                                    >
                                        {getButtonText(course.status)}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>

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

