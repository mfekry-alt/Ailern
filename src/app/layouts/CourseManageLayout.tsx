import { useState, useMemo } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCourse } from '@/features/courses/api';
import { QUERY_KEYS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Layers, FileText, HelpCircle, Users, Menu, X, Sparkles } from 'lucide-react';
import { CourseSidebarHeader } from '@/components/ui/CourseSidebarHeader';

const NAV_ITEMS = [
    { to: 'sections', label: 'Sections', icon: Layers },
    { to: 'assignments', label: 'Assignments', icon: FileText },
    { to: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { to: 'students', label: 'Students', icon: Users },
    { to: 'ai-assistant', label: 'Knowledge Base', icon: Sparkles },
] as const;

export const CourseManageLayout = () => {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const numericId = useMemo(() => {
        const n = Number(courseId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [courseId]);

    const { data: course, isLoading } = useCourse(numericId ?? 0);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const rawCourseImage = course?.imageUrl?.trim();
    const courseImageSrc = rawCourseImage || '/course-default.png';

    const linkBase = `/instructor/courses/${courseId}/manage`;

    const handleBackToInstructorCourses = () => {
        void queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.COURSES, 'instructor'] });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_MY_COURSES });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTOR_STATS });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UPCOMING_EVENTS });
        navigate('/instructor/courses');
    };

    return (
        <div className="flex bg-gray-50 dark:bg-slate-900" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 lg:top-[72px] left-0 z-40
                    h-screen lg:h-[calc(100vh-72px)]
                    bg-white dark:bg-slate-800/60 backdrop-blur-md
                    border-r border-gray-200 dark:border-slate-700/50
                    flex flex-col transition-all duration-300 ease-out shrink-0
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-[72px]' : 'w-64'}
                `}
            >
                <CourseSidebarHeader 
                    courseName={course?.name || 'Course'}
                    courseCode={course?.code || `#${courseId}`}
                    imageUrl={courseImageSrc}
                    isLoading={isLoading}
                    collapsed={collapsed}
                    onToggle={() => {
                        setCollapsed(!collapsed);
                        setMobileOpen(false);
                    }}
                    onMobileClose={() => setMobileOpen(false)}
                />

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={`${linkBase}/${to}`}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all group relative
                                ${collapsed ? 'justify-center' : ''}
                                ${isActive
                                    ? 'bg-[#21A9FF]/10 text-[#21A9FF] shadow-sm active'
                                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                                }`
                            }
                        >
                            {/* Active Indicator Bar */}
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#21A9FF] rounded-r-full transition-all duration-300 opacity-0 group-[.active]:opacity-100 ${collapsed ? '-left-1' : ''}`} />
                            
                            <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${collapsed ? '' : 'ml-1'}`} />
                            {!collapsed && <span className="truncate tracking-tight">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Back button */}
                <div className="p-3 border-t border-gray-100 dark:border-slate-700/50">
                    <button
                        onClick={handleBackToInstructorCourses}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
                    >
                        <ChevronLeft className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>All Courses</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700/50 sticky top-0 z-20">
                    <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                            {isLoading ? 'Loading...' : (course?.name || 'Course')}
                        </h2>
                    </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar">
                    <Outlet context={{ courseId, numericCourseId: numericId, course }} />
                </div>
            </div>
        </div>
    );
};
