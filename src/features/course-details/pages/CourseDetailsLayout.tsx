import { useEffect, useMemo, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseOverview } from '../api';
import type { GetCourseDto } from '@/types/api.types';
import { useAuth } from '@/hooks/useAuth';
import { QUERY_KEYS } from '@/lib/constants';
import {
    ChevronLeft,
    ChevronRight,
    Layers,
    HelpCircle,
    ListChecks,
    LayoutDashboard,
    Menu,
    MessageSquareText,
} from 'lucide-react';
import { CourseSidebarHeader } from '@/components/ui/CourseSidebarHeader';

const NAV_ITEMS = [
    { to: 'sections', label: 'Sections', icon: Layers },
    { to: 'assignments', label: 'Assignments', icon: ListChecks },
    { to: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { to: 'qna', label: 'Q&A Board', icon: MessageSquareText },
] as const;

const FALLBACK_COURSE_IMAGE = '/course-default.png';

function UserAvatarBadge({
    size = 'md',
    title,
}: {
    size?: 'sm' | 'md';
    title?: string;
}) {
    const { user } = useAuth();
    const [avatarFailed, setAvatarFailed] = useState(false);

    useEffect(() => {
        setAvatarFailed(false);
    }, [user?.avatar]);

    const initials =
        `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.trim() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        '?';
    const showImg = Boolean(user?.avatar?.trim()) && !avatarFailed;
    const dims = size === 'sm' ? 'w-9 h-9 text-[10px]' : 'w-10 h-10 text-[11px]';

    return (
        <div
            className={`${dims} rounded-full overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-sm bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] flex items-center justify-center text-white font-black select-none`}
            title={title}
        >
            {showImg ? (
                <img
                    src={user!.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarFailed(true)}
                />
            ) : (
                initials
            )}
        </div>
    );
}


export const CourseDetailsLayout = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const numericId = useMemo(() => {
        const n = Number(courseId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [courseId]);

    const { data: course, isLoading } = useCourseOverview(numericId ?? 0);
    const sectionsLocked = false;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [courseThumbFailed, setCourseThumbFailed] = useState(false);

    const linkBase = `/courses/${courseId}`;

    const courseData = course as GetCourseDto | undefined;
    const rawCourseImage = courseData?.imageUrl?.trim();

    useEffect(() => {
        setCourseThumbFailed(false);
    }, [numericId, rawCourseImage]);

    const courseImageSrc =
        courseThumbFailed || !rawCourseImage ? FALLBACK_COURSE_IMAGE : rawCourseImage;
    const courseTitle = courseData?.name || 'Course';
    const courseCode = courseData?.code || `#${courseId}`;

    const handleBackToCourseCatalog = () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT_MY_COURSES });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT_DASHBOARD });
        navigate('/courses');
    };

    return (
        <div className="flex bg-gray-50 dark:bg-slate-900" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed top-0 lg:top-[72px] left-0 z-40
                    h-screen lg:h-[calc(100vh-72px)]
                    bg-white dark:bg-slate-900/80 backdrop-blur-xl
                    border-r border-gray-100 dark:border-slate-800/50
                    flex flex-col transition-all duration-500 ease-in-out shrink-0
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-[72px]' : 'w-64'}
                `}
            >
                <CourseSidebarHeader
                    courseName={courseTitle}
                    courseCode={courseCode}
                    imageUrl={courseImageSrc}
                    isLoading={isLoading}
                    collapsed={collapsed}
                    onToggle={() => {
                        setCollapsed(!collapsed);
                        setMobileOpen(false);
                    }}
                />

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar min-h-0">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                        const lockedTab = to === 'sections' && sectionsLocked;
                        return (
                            <NavLink
                                key={to}
                                to={`${linkBase}/${to}`}
                                onClick={() => setMobileOpen(false)}
                                title={
                                    lockedTab
                                        ? 'Course materials are limited while a quiz is in progress. Open Sections for details or resume the quiz from here.'
                                        : undefined
                                }
                                className={({ isActive }) => {
                                    const base = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all duration-300 group relative
                                        ${collapsed ? 'justify-center px-0' : ''}`;
                                    if (lockedTab) {
                                        return `${base} ${isActive
                                                ? 'bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-300/60 dark:border-amber-500/40'
                                                : 'text-amber-900/90 dark:text-amber-200/90 border border-transparent hover:bg-amber-500/10 dark:hover:bg-amber-500/10'
                                            }`;
                                    }
                                    return `${base} ${isActive
                                            ? 'bg-[#21A9FF]/10 text-[#21A9FF] active shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                        }`;
                                }}
                            >
                                {!lockedTab && (
                                    <div
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#21A9FF] rounded-r-full transition-all duration-500 opacity-0 group-[.active]:opacity-100 ${collapsed ? '-left-1' : ''}`}
                                    />
                                )}

                                <Icon
                                    className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${collapsed ? '' : 'ml-1'}`}
                                />
                                {!collapsed && (
                                    <span className="truncate tracking-tight">
                                        {lockedTab ? `${label} · locked` : label}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-slate-800/50">
                    <button
                        type="button"
                        onClick={handleBackToCourseCatalog}
                        className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all group ${collapsed ? 'justify-center px-0' : ''
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                        {!collapsed && <span>All Courses</span>}
                    </button>
                </div>
            </aside>

            <div
                className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
                    }`}
            >
                <div className="lg:hidden flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/50 fixed top-[72px] left-0 right-0 z-30 h-16">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 shrink-0"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                            {isLoading ? 'Loading...' : courseTitle}
                        </h2>
                    </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar lg:pt-8 pt-20">
                    <Outlet context={{ courseId, numericCourseId: numericId, course }} />
                </div>
            </div>
        </div>
    );
};
