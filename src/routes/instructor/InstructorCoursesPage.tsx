import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Edit2, Trash2, Plus, Users, Calendar, BookOpen } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    courseId: string;
    instructor: string;
    status: 'Draft' | 'Approved' | 'Ready to Submit' | 'Pending Review';
    statusColor: string;
    statusBg: string;
    primaryAction?: string;
    secondaryAction?: string;
    students: number;
    startDate: string;
    modules: number;
}

const courses: Course[] = [
    {
        id: '1',
        title: 'CS101 - Introduction to Programming',
        courseId: 'CS101',
        instructor: 'Dr. Emily Carter',
        status: 'Draft',
        statusColor: '#854d0e',
        statusBg: '#fef9c3',
        secondaryAction: 'Mark as Ready',
        primaryAction: 'Open Course',
        students: 45,
        startDate: 'Jan 15, 2024',
        modules: 12
    },
    {
        id: '2',
        title: 'CS202 - Data Structures',
        courseId: 'CS202',
        instructor: 'Dr. Emily Carter',
        status: 'Approved',
        statusColor: '#166534',
        statusBg: '#dcfce7',
        primaryAction: 'Open Course',
        students: 38,
        startDate: 'Jan 20, 2024',
        modules: 15
    },
    {
        id: '3',
        title: 'MA203 - Linear Algebra',
        courseId: 'MA203',
        instructor: 'Dr. Emily Carter',
        status: 'Ready to Submit',
        statusColor: '#166534',
        statusBg: '#dcfce7',
        secondaryAction: 'Submit for Approval',
        primaryAction: 'Open Course',
        students: 52,
        startDate: 'Jan 25, 2024',
        modules: 10
    },
    {
        id: '4',
        title: 'PHY105 - Classical Mechanics',
        courseId: 'PHY105',
        instructor: 'Dr. Emily Carter',
        status: 'Pending Review',
        statusColor: '#6b21a8',
        statusBg: '#f0f1f4',
        primaryAction: 'Open Course',
        students: 28,
        startDate: 'Feb 1, 2024',
        modules: 8
    },
];

export const InstructorCoursesPage = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-[36px] font-bold text-gray-900">My Courses</h1>
                    <p className="text-[18px] text-gray-600 mt-1">Manage your courses and content</p>
                </div>
                <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors shadow-sm">
                        <Plus className="w-5 h-5" />
                        Create New Course
                    </button>
                </Link>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Course Header */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-[20px] font-bold text-gray-900 leading-tight flex-1">
                                    {course.title}
                                </h3>
                                <div
                                    className="px-3 py-1 rounded-full flex-shrink-0 ml-2"
                                    style={{ backgroundColor: course.statusBg }}
                                >
                                    <span
                                        className="font-medium text-[12px]"
                                        style={{ color: course.statusColor }}
                                    >
                                        {course.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <p className="text-[14px] text-gray-600">
                                    <span className="font-medium">Course ID:</span> {course.courseId}
                                </p>
                                <p className="text-[14px] text-gray-600">
                                    <span className="font-medium">Instructor:</span> {course.instructor}
                                </p>
                            </div>

                            {/* Course Stats */}
                            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Users className="w-4 h-4 text-gray-500 mr-1" />
                                        <span className="text-[16px] font-bold text-gray-900">{course.students}</span>
                                    </div>
                                    <p className="text-[12px] text-gray-600">Students</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                                        <span className="text-[16px] font-bold text-gray-900">{course.startDate.split(',')[0]}</span>
                                    </div>
                                    <p className="text-[12px] text-gray-600">Start Date</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <BookOpen className="w-4 h-4 text-gray-500 mr-1" />
                                        <span className="text-[16px] font-bold text-gray-900">{course.modules}</span>
                                    </div>
                                    <p className="text-[12px] text-gray-600">Modules</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                            {/* Icon Actions */}
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-200 rounded-md transition-colors">
                                    <Edit2 className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-200 rounded-md transition-colors">
                                    <Trash2 className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Button Actions */}
                            <div className="flex gap-2">
                                {course.secondaryAction && (
                                    <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-md transition-colors">
                                        {course.secondaryAction}
                                    </button>
                                )}
                                {course.primaryAction && (
                                    <Link to={`/instructor/courses/${course.id}/content`}>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-md transition-colors">
                                            {course.primaryAction}
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {courses.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-6">Create your first course to get started</p>
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                            Create Course
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
};

