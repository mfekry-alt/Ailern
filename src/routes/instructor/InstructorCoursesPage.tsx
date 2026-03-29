import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Trash2, Plus, Users, Calendar, BookOpen,
    Loader2, BookMarked, ArrowRight, AlertCircle, LayoutGrid
} from 'lucide-react';
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
    status: string;
    badgeBg: string;
    badgeText: string;
    primaryAction?: string;
    secondaryAction?: string;
    students: number;
    startDate: string;
    sections: number;
}

// --- Helper: Map API status to UI status ---
const getStatusConfig = (apiStatus: string): Pick<Course, 'status' | 'badgeBg' | 'badgeText' | 'primaryAction' | 'secondaryAction'> => {
    // You can expand this switch based on actual API statuses (e.g., 'Draft', 'Pending')
    const isPublished = apiStatus?.toLowerCase() === 'published' || true; // Defaulting to true for now based on original logic

    if (isPublished) {
        return {
            status: 'Published',
            badgeBg: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
            badgeText: 'text-emerald-700 dark:text-emerald-400',
            primaryAction: 'Manage Content',
            secondaryAction: 'Settings',
        };
    }

    return {
        status: apiStatus || 'Draft',
        badgeBg: 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
        badgeText: 'text-gray-700 dark:text-slate-300',
        primaryAction: 'Edit Content',
    };
};

// --- Helper: Map API DTO to UI Course ---
const mapCourseToUI = (dto: GetAllCoursesDto): Course => {
    const statusConfig = getStatusConfig(dto.courseStatus);
    return {
        id: dto.id.toString(),
        title: dto.name,
        courseId: dto.code,
        instructor: `Instructor #${dto.instructorId}`,
        students: 0, // Should come from API if available
        startDate: new Date(dto.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sections: 0, // Should come from API if available
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
            className="group relative flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden will-change-transform"
        >
            {/* Top Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>

            {/* Course Header */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${course.badgeBg} ${course.badgeText}`}>
                        {course.status}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                </h3>

                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-6">
                    Code: <span className="text-gray-900 dark:text-slate-200">{course.courseId}</span>
                </p>

                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-700/50 grid grid-cols-3 gap-2">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-2">
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{course.students}</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Students</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-2">
                            <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{course.sections}</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Sections</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-2">
                            <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1 mt-1 truncate w-full px-1">{course.startDate.split(',')[0]}</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Started</p>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 sm:p-5 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700/50 flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(course.id); }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                    title="Course Settings"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                    title="Delete Course"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                {course.primaryAction && (
                    <Link to={`/instructor/courses/${course.id}/content`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95">
                            {course.primaryAction}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                )}
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
        if (window.confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
            deleteCourseMutation.mutate(parseInt(id));
        }
    };

    const runSecondaryAction = (course: Course) => {
        navigate(ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id));
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading your courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-[2rem] max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load courses</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">We couldn't fetch your courses at this time. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50 shadow-sm shrink-0">
                            <BookMarked className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Courses</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1 text-lg">Manage your curriculum, students, and content.</p>
                        </div>
                    </div>
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>

                {/* Courses Grid */}
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
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
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
                            <BookOpen className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                            You haven't created any courses. Start building your curriculum by creating your first course.
                        </p>
                        <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95">
                                <Plus className="w-5 h-5" />
                                Create Your First Course
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};