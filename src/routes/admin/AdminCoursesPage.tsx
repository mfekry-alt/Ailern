import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Search, Eye, CheckCircle, XCircle, Filter, Download, BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

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
    modules: number;
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
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [reviewerNotes, setReviewerNotes] = useState<string>('');

    const [courses, setCourses] = useState<CourseRow[]>([
        {
            id: 1,
            title: 'Introduction to Computer Science',
            courseId: 'CS101',
            instructor: 'Dr. Emily Carter',
            students: 45,
            status: 'Published',
            createdDate: 'Jan 15, 2024',
            lastUpdated: 'Mar 10, 2024',
            rating: 4.8,
            modules: 12,
            category: 'Computer Science',
            description: 'Foundational course covering programming basics, problem solving, and computing concepts.',
            prerequisites: ['None'],
            whatYouWillLearn: ['Programming fundamentals', 'Problem-solving patterns', 'Basic algorithms'],
            materialsCount: 16,
            lecturesPreview: ['Intro to Computing', 'Variables & Types', 'Control Flow'],
            assignmentsCount: 4,
            quizzesCount: 2
        },
        {
            id: 2,
            title: 'Data Structures and Algorithms',
            courseId: 'CS202',
            instructor: 'Prof. Michael Brown',
            students: 38,
            status: 'Draft',
            createdDate: 'Jan 20, 2024',
            lastUpdated: 'Mar 5, 2024',
            rating: 4.6,
            modules: 15,
            category: 'Computer Science',
            description: 'Covers arrays, linked lists, stacks, queues, trees, graphs, and algorithm analysis.',
            prerequisites: ['CS101'],
            whatYouWillLearn: ['Time/space complexity', 'Common data structures', 'Sorting and searching'],
            materialsCount: 22,
            lecturesPreview: ['Complexity Analysis', 'Arrays vs Linked Lists', 'Tree Traversals'],
            assignmentsCount: 5,
            quizzesCount: 3
        },
        {
            id: 3,
            title: 'Linear Algebra',
            courseId: 'MA203',
            instructor: 'Dr. Sarah Johnson',
            students: 52,
            status: 'Published',
            createdDate: 'Jan 25, 2024',
            lastUpdated: 'Mar 8, 2024',
            rating: 4.7,
            modules: 10,
            category: 'Mathematics',
            description: 'Vectors, matrices, eigenvalues, and linear transformations for applied math and ML.',
            prerequisites: ['Calculus I'],
            whatYouWillLearn: ['Matrix algebra', 'Vector spaces', 'Eigen decomposition'],
            materialsCount: 14,
            lecturesPreview: ['Vectors & Spaces', 'Matrix Operations', 'Eigenvalues'],
            assignmentsCount: 3,
            quizzesCount: 2
        },
        {
            id: 4,
            title: 'Classical Mechanics',
            courseId: 'PHY105',
            instructor: 'Prof. David Wilson',
            students: 28,
            status: 'Pending Review',
            createdDate: 'Feb 1, 2024',
            lastUpdated: 'Mar 12, 2024',
            rating: 4.5,
            modules: 8,
            category: 'Physics',
            description: 'Motion, forces, energy, and momentum with problem-solving sessions.',
            prerequisites: ['Physics basics', 'Calculus I'],
            whatYouWillLearn: ['Kinematics', 'Newtonian mechanics', 'Work & energy'],
            materialsCount: 12,
            lecturesPreview: ['Kinematics', 'Dynamics', 'Energy Conservation'],
            assignmentsCount: 4,
            quizzesCount: 2
        },
        {
            id: 5,
            title: 'Introduction to Psychology',
            courseId: 'PSY101',
            instructor: 'Dr. Lisa Chen',
            students: 67,
            status: 'Published',
            createdDate: 'Feb 5, 2024',
            lastUpdated: 'Mar 15, 2024',
            rating: 4.9,
            modules: 14,
            category: 'Psychology',
            description: 'Survey of major psychology topics including cognition, development, and behavior.',
            prerequisites: ['None'],
            whatYouWillLearn: ['Research methods', 'Cognitive processes', 'Behavioral theories'],
            materialsCount: 18,
            lecturesPreview: ['Intro to Psych', 'Cognition', 'Development'],
            assignmentsCount: 4,
            quizzesCount: 3
        }
    ]);

    const filteredCourses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return courses.filter((c) => {
            const searchMatch =
                !q ||
                c.title.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q) ||
                c.courseId.toLowerCase().includes(q);
            const statusMatch = selectedStatus === 'all' || c.status === selectedStatus;
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

    const approveCourse = (id: number) => {
        setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Published' } : c)));
        setStatusMessage(`Course approved${reviewerNotes ? ` — Notes: ${reviewerNotes}` : '.'}`);
        setReviewerNotes('');
    };

    const rejectCourse = (id: number) => {
        setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Rejected' } : c)));
        setStatusMessage(`Course rejected${reviewerNotes ? ` — Notes: ${reviewerNotes}` : '.'}`);
        setReviewerNotes('');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Published':
                return 'bg-green-100 text-green-800';
            case 'Draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'Pending Review':
                return 'bg-blue-100 text-blue-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = [
        { label: 'Total Courses', value: '300', icon: BookOpen, color: 'text-blue-600' },
        { label: 'Published', value: '245', icon: CheckCircle, color: 'text-green-600' },
        { label: 'Pending Review', value: '15', icon: Calendar, color: 'text-yellow-600' },
        { label: 'Total Students', value: '5,250', icon: Users, color: 'text-purple-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900">Course Management</h1>
                        <p className="text-[18px] text-gray-600 mt-1">Review and manage all courses on the platform</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportCourses}
                            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors"
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

                {statusMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14px] text-green-800">
                        {statusMessage}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[20px] font-bold text-gray-900">{stat.value}</p>
                                            <p className="text-[14px] text-gray-600">{stat.label}</p>
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
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
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Course
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Instructor
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Students
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Rating
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Status
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Last Updated
                                        </th>
                                        <th className="text-left py-4 px-6 text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.map((course, index) => (
                                        <tr key={course.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === filteredCourses.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="text-[16px] font-medium text-gray-900">{course.title}</p>
                                                    <p className="text-[14px] text-gray-600">{course.courseId} • {course.modules} modules</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-[14px] text-gray-900">{course.instructor}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <span className="text-[14px] text-gray-600">{course.students}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[14px] font-medium text-gray-900">{course.rating}</span>
                                                    <span className="text-[12px] text-gray-500">★</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getStatusBadge(course.status)}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[14px] text-gray-600">{course.lastUpdated}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCourse(course);
                                                            setReviewerNotes('');
                                                            setStatusMessage('');
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    {course.status === 'Pending Review' && (
                                                        <>
                                                            <button
                                                                onClick={() => approveCourse(course.id)}
                                                                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                            >
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => rejectCourse(course.id)}
                                                                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                            >
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        </>
                                                    )}
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
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                            View All Courses
                        </button>
                    </div>
                )}
            </div>

            {selectedCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[18px] font-bold text-gray-900">Course Details</h2>
                                <p className="text-[14px] text-gray-600">{selectedCourse.courseId}</p>
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
                                <div className="text-[16px] font-bold text-gray-900">{selectedCourse.title}</div>
                                <div className="text-[14px] text-gray-600">Instructor: {selectedCourse.instructor}</div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="text-[12px] text-gray-600">Students</div>
                                    <div className="text-[16px] font-bold text-gray-900">{selectedCourse.students}</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="text-[12px] text-gray-600">Rating</div>
                                    <div className="text-[16px] font-bold text-gray-900">{selectedCourse.rating} ★</div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="text-[12px] text-gray-600 mb-2">Status</div>
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
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    Download
                                </button>
                                {selectedCourse.status === 'Pending Review' ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                approveCourse(selectedCourse.id);
                                                setSelectedCourse(null);
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                rejectCourse(selectedCourse.id);
                                                setSelectedCourse(null);
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setSelectedCourse(null)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

