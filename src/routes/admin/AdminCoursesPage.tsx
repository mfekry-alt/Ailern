import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { Search, Eye, CheckCircle, Filter, Download, BookOpen, Users, TrendingUp, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { courseService } from '@/api/services';
import { handleApiError } from '@/api/client';

type CourseRow = {
    id: number;
    title: string;
    courseId: string;
    instructor: string;
    students: number;
    status: string;
    createdDate: string;
    lastUpdated: string;
    rating: number;
    sections: number;
    category: string;
    description: string;
    prerequisites: string[];
    whatYouWillLearn: string[];
    materialsCount: number;
    lecturesPreview: string[];
    assignmentsCount: number;
    quizzesCount: number;
};

export const AdminCoursesPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);

    const { data: paginated, isLoading, error } = useQuery({
        queryKey: ['admin', 'courses'],
        queryFn: () => courseService.getAllCourses({ PageNumber: 1, PageSize: 100 }),
    });

    const courses = useMemo<CourseRow[]>(() => {
        const items = paginated?.items ?? [];
        return items.map((c) => ({
            id: c.id,
            title: c.name,
            courseId: c.code,
            instructor: '—',
            students: 0,
            status: 'Published',
            createdDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
            lastUpdated: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
            rating: 0,
            sections: 0,
            category: '—',
            description: '',
            prerequisites: [],
            whatYouWillLearn: [],
            materialsCount: 0,
            lecturesPreview: [],
            assignmentsCount: 0,
            quizzesCount: 0,
        }));
    }, [paginated?.items]);

    const filteredCourses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return courses.filter((c) => {
            const searchMatch =
                !q ||
                c.title.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q) ||
                c.courseId.toLowerCase().includes(q);
            const statusMatch =
                selectedStatus === 'all' ||
                c.status.toLowerCase() === selectedStatus.toLowerCase();
            return searchMatch && statusMatch;
        });
    }, [courses, searchQuery, selectedStatus]);

    const downloadText = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const exportCourses = () => {
        const headers = ['Title', 'Course ID', 'Instructor', 'Students', 'Status', 'Last Updated'];
        const rows = filteredCourses.map((c) => [c.title, c.courseId, c.instructor, c.students, c.status, c.lastUpdated]);
        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        downloadText('courses-export.csv', csv);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Published':
                return 'bg-green-100 text-green-800';
            case 'Draft':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const totalCourses = courses.length;

    const stats = [
        { label: 'Total Courses', value: String(totalCourses), icon: BookOpen, color: 'text-blue-600' },
        { label: 'Published', value: String(totalCourses), icon: CheckCircle, color: 'text-green-600' },
        { label: 'Visible Courses', value: String(filteredCourses.length), icon: TrendingUp, color: 'text-orange-600' },
        { label: 'Total Students', value: '0', icon: Users, color: 'text-purple-600' }
    ];

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex items-center justify-center min-h-[50vh] bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-zinc-400">Loading courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{handleApiError(error).message}</p>
                    <p className="text-gray-600 dark:text-zinc-400">Could not load courses. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100">Course Management</h1>
                        <p className="text-[18px] text-gray-600 dark:text-zinc-400 mt-1">Review and manage all courses on the platform</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportCourses}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Analytics
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">{stat.value}</p>
                                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Search and Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses by title or instructor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                </select>
                                <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                    <Filter className="w-4 h-4" />
                                    More Filters
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Table */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Course
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Instructor
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Students
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Rating
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Status
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Last Updated
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 dark:text-zinc-300 uppercase tracking-wide">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.map((course, index) => (
                                        <tr key={course.id} className={`border-b border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${index === filteredCourses.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="text-[16px] font-medium text-gray-900 dark:text-zinc-100">{course.title}</p>
                                                    <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.courseId} • {course.sections} sections</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-[14px] text-gray-900 dark:text-zinc-100">{course.instructor}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <span className="text-[14px] text-gray-600 dark:text-zinc-400">{course.students}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">{course.rating}</span>
                                                    <span className="text-[12px] text-gray-500">★</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getStatusBadge(course.status)}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[14px] text-gray-600 dark:text-zinc-400">{course.lastUpdated}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCourse(course);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Empty State */}
                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">No courses found</h3>
                        <p className="text-gray-600 dark:text-zinc-400 mb-6">Try adjusting your search criteria</p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                            View All Courses
                        </button>
                    </div>
                )}
            </div>

            {selectedCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100">Course Details</h2>
                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">{selectedCourse.courseId}</p>
                            </div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{selectedCourse.title}</div>
                                <div className="text-[14px] text-gray-600 dark:text-zinc-400">Instructor: {selectedCourse.instructor}</div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                    <div className="text-[12px] text-gray-600 dark:text-zinc-400">Students</div>
                                    <div className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{selectedCourse.students}</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                    <div className="text-[12px] text-gray-600 dark:text-zinc-400">Rating</div>
                                    <div className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{selectedCourse.rating} ★</div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                                <div className="text-[12px] text-gray-600 dark:text-zinc-400 mb-2">Status</div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getStatusBadge(selectedCourse.status)}`}>
                                    {selectedCourse.status}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const summary = [
                                            `Title: ${selectedCourse.title}`,
                                            `CourseId: ${selectedCourse.courseId}`,
                                            `Instructor: ${selectedCourse.instructor}`,
                                            `Students: ${selectedCourse.students}`,
                                            `Status: ${selectedCourse.status}`,
                                            `Last Updated: ${selectedCourse.lastUpdated}`,
                                        ].join('\n');
                                        downloadText(`course-${selectedCourse.courseId}.txt`, summary);
                                    }}
                                    className="flex-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};