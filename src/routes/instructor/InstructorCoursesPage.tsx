import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Edit2, Trash2, Plus, Users, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { ParallaxTiltCard } from '@/components/ui';
import { useInstructorCourses, useDeleteCourse } from '@/features/courses/api';
import { useAuthStore } from '@/features/auth/store';
import type { GetAllCoursesDto } from '@/types/api.types';

// --- Interfaces ---
interface Course {
    id: string;
    title: string;
    courseId: string;
    instructor: string;
    status: 'Draft' | 'Published';
    statusColor: string;
    statusBg: string;
    primaryAction?: string;
    secondaryAction?: string;
    students: number;
    startDate: string;
    modules: number;
}

// --- Helper: Map API status to UI status ---
const getStatusConfig = (apiStatus: string): Pick<Course, 'status' | 'statusColor' | 'statusBg' | 'primaryAction' | 'secondaryAction'> => {
    switch (apiStatus) {
        case 'Approved':
        case 'Pending':
            return {
                status: 'Published',
                statusColor: '#166534',
                statusBg: '#dcfce7',
                primaryAction: 'View Analytics',
                secondaryAction: 'Edit Content',
            };
        case 'Rejected':
            return {
                status: 'Draft',
                statusColor: '#854d0e',
                statusBg: '#fef9c3',
                primaryAction: 'Continue Editing',
            };
        default:
            return {
                status: 'Draft',
                statusColor: '#854d0e',
                statusBg: '#fef9c3',
                primaryAction: 'Go to Content',
            };
    }
};

// --- Helper: Map API DTO to UI Course ---
const mapCourseToUI = (dto: GetAllCoursesDto): Course => {
    const statusConfig = getStatusConfig(dto.courseStatus);
    return {
        id: dto.id.toString(),
        title: dto.name,
        courseId: dto.code,
        instructor: `Instructor #${dto.instructorId}`,
        students: 0,
        startDate: new Date(dto.createdAt).toLocaleDateString(),
        modules: 0,
        ...statusConfig,
    };
};

interface Course3DCardProps {
    course: Course;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSecondaryAction: (course: Course) => void;
}

const Course3DCard = ({ course, onEdit, onDelete, onSecondaryAction }: Course3DCardProps) => {
    return (
        <ParallaxTiltCard
            className="group bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer will-change-transform"
        >
            {/* Course Header */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 leading-tight flex-1">
                        {course.title}
                    </h3>
                    <div
                        className="px-3 py-1 rounded-full shrink-0 ml-2"
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
                    <p className="text-[14px] text-gray-600 dark:text-zinc-400">
                        <span className="font-medium text-gray-900 dark:text-zinc-200">Course ID:</span> {course.courseId}
                    </p>
                    <p className="text-[14px] text-gray-600 dark:text-zinc-400">
                        <span className="font-medium text-gray-900 dark:text-zinc-200">Instructor:</span> {course.instructor}
                    </p>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Users className="w-4 h-4 text-gray-500 dark:text-zinc-500 mr-1" />
                            <span className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{course.students}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-zinc-500">Students</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Calendar className="w-4 h-4 text-gray-500 dark:text-zinc-500 mr-1" />
                            <span className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{course.startDate.split(',')[0]}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-zinc-500">Start Date</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <BookOpen className="w-4 h-4 text-gray-500 dark:text-zinc-500 mr-1" />
                            <span className="text-[16px] font-bold text-gray-900 dark:text-zinc-100">{course.modules}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-zinc-500">Modules</p>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-gray-50 dark:bg-zinc-950 px-6 py-4 flex justify-between items-center border-t border-gray-100 dark:border-zinc-800">
                {/* Icon Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(course.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Edit Course"
                    >
                        <Edit2 className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                    </button>
                    <button
                        onClick={() => onDelete(course.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Delete Course"
                    >
                        <Trash2 className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                    </button>
                </div>

                {/* Button Actions */}
                <div className="flex gap-2">
                    {course.secondaryAction && (
                        <button
                            onClick={() => onSecondaryAction(course)}
                            className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[14px] px-4 py-2 rounded-md transition-colors"
                        >
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
        </ParallaxTiltCard>
    );
};

export const InstructorCoursesPage = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const instructorId = useMemo(() => {
        if (typeof user?.id === 'number') {
            return user.id;
        }

        const parsedId = Number(user?.id);
        return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
    }, [user?.id]);

    // Fetch instructor courses using numeric ID when available, otherwise fallback endpoint.
    const { data: coursesData, isLoading, error } = useInstructorCourses(instructorId);
    const deleteCourseMutation = useDeleteCourse();

    // Map API data to UI format
    const courses = useMemo(() => {
        if (!coursesData?.items) return [];
        return coursesData.items.map(mapCourseToUI);
    }, [coursesData]);

    const handleDeleteCourse = (id: string) => {
        if (globalThis.confirm('Are you sure you want to delete this course?')) {
            deleteCourseMutation.mutate(Number.parseInt(id));
        }
    };

    const runSecondaryAction = (course: Course) => {
        // Navigate to edit page for draft courses
        if (course.status === 'Draft') {
            navigate(ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id));
        }
    };

    return (
        // FIXED: Removed inline style, added min-h-screen and dark mode classes
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-gray-600 dark:text-zinc-400 text-[16px]">Loading courses...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">Failed to load courses. Please try again later.</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    {/* Added dark:text classes */}
                    <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100">My Courses</h1>
                    <p className="text-[18px] text-gray-600 dark:text-zinc-400 mt-1">Manage your courses and content</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors shadow-sm">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <Course3DCard
                        key={course.id}
                        course={course}
                        onEdit={(id) => navigate(ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', id))}
                        onDelete={handleDeleteCourse}
                        onSecondaryAction={runSecondaryAction}
                    />
                ))}
            </div>

            {/* Empty State */}
            {courses.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-[20px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">No courses yet</h3>
                    <p className="text-gray-600 dark:text-zinc-400 mb-6">Create your first course to get started</p>
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