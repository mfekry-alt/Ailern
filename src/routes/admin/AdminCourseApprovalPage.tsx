import { useState } from 'react';
import { Card, CardContent, ParallaxTiltCard } from '@/components/ui';
import { CheckCircle, XCircle, Eye, Search, Calendar, User, BookOpen, FileText, HelpCircle } from 'lucide-react';

interface CourseForApproval {
    id: string;
    title: string;
    courseCode: string;
    category: string;
    description: string;
    prerequisites: string;
    whatYouWillLearn: string;
    materialsCount: number;
    lecturesCount: number;
    assignmentsCount: number;
    quizzesCount: number;
    instructorName: string;
    dateCreated: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export const AdminCourseApprovalPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [selectedCourse, setSelectedCourse] = useState<CourseForApproval | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');

    const [courses, setCourses] = useState<CourseForApproval[]>([]);

    const handleApprove = (id: string) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, status: 'Approved' } : c));
        setSelectedCourse(null);
        setReviewNotes('');
    };

    const handleReject = (id: string) => {
        if (!reviewNotes.trim()) {
            alert('Please provide reviewer notes for rejection');
            return;
        }
        setCourses(prev => prev.map(c => c.id === id ? { ...c, status: 'Rejected' } : c));
        setSelectedCourse(null);
        setReviewNotes('');
    };

    const filteredCourses = courses.filter(course => {
        const statusMatch = selectedStatus === 'All' || course.status === selectedStatus;
        const searchMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100">Course Approval</h1>
                    <p className="text-[18px] text-gray-600 dark:text-zinc-400 mt-1">Review and approve courses submitted by instructors</p>
                </div>

                {/* Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by title, code, or instructor"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                />
                            </div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Course List */}
                <div className="space-y-4">
                    {filteredCourses.map((course) => (
                        <ParallaxTiltCard key={course.id} className="rounded-xl hover:shadow-lg">
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex gap-6">
                                        {/* Course Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">{course.title}</h3>
                                                    <p className="text-[14px] text-gray-600 dark:text-zinc-400 mt-1">
                                                        {course.courseCode} • {course.category}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[13px] font-medium ${course.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    course.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {course.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    <User className="w-4 h-4" />
                                                    <span>Instructor: {course.instructorName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-zinc-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Submitted: {new Date(course.dateCreated).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                                    <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                                    <p className="text-[12px] text-blue-600">Lectures</p>
                                                    <p className="text-[18px] font-bold text-blue-900">{course.lecturesCount}</p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                                    <FileText className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                                    <p className="text-[12px] text-green-600">Materials</p>
                                                    <p className="text-[18px] font-bold text-green-900">{course.materialsCount}</p>
                                                </div>
                                                <div className="p-3 bg-purple-50 rounded-lg text-center">
                                                    <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                                    <p className="text-[12px] text-purple-600">Assignments</p>
                                                    <p className="text-[18px] font-bold text-purple-900">{course.assignmentsCount}</p>
                                                </div>
                                                <div className="p-3 bg-orange-50 rounded-lg text-center">
                                                    <HelpCircle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                                                    <p className="text-[12px] text-orange-600">Quizzes</p>
                                                    <p className="text-[18px] font-bold text-orange-900">{course.quizzesCount}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-[14px]"
                                            >
                                                <Eye className="w-4 h-4" />
                                                {selectedCourse?.id === course.id ? 'Hide Details' : 'View Full Details'}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        {course.status === 'Pending' && (
                                            <div className="flex flex-col gap-2 min-w-[150px]">
                                                <button
                                                    onClick={() => handleApprove(course.id)}
                                                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCourse(course)}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedCourse?.id === course.id && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 space-y-4">
                                            <div>
                                                <h4 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Description</h4>
                                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.description}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Prerequisites</h4>
                                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.prerequisites}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">What You Will Learn</h4>
                                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.whatYouWillLearn}</p>
                                            </div>

                                            {course.status === 'Pending' && (
                                                <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                                    <h4 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Reviewer Notes (Required for Rejection)</h4>
                                                    <textarea
                                                        value={reviewNotes}
                                                        onChange={(e) => setReviewNotes(e.target.value)}
                                                        placeholder="Provide feedback or reasons for rejection..."
                                                        rows={4}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                                                    />
                                                    <div className="flex gap-3 mt-3">
                                                        <button
                                                            onClick={() => handleApprove(course.id)}
                                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve Course
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(course.id)}
                                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject with Notes
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCourse(null);
                                                                setReviewNotes('');
                                                            }}
                                                            className="px-6 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-300 rounded-lg font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </ParallaxTiltCard>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <Card variant="elevated">
                        <CardContent className="p-12 text-center">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-[16px] text-gray-600 dark:text-zinc-400">No courses found</p>
                            <p className="text-[14px] text-gray-500 dark:text-zinc-500 mt-1">Try adjusting your filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
