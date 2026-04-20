import { useMemo, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useCourseOverview } from '../api';
import {
    ChevronLeft,
    ChevronRight,
    Layers,
    FileText,
    HelpCircle,
    ListChecks,
    LayoutDashboard,
    Menu,
    X,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: 'overview', label: 'Overview', icon: LayoutDashboard },
    { to: 'sections', label: 'Sections', icon: Layers },
    { to: 'assignments', label: 'Assignments', icon: ListChecks },
    { to: 'quizzes', label: 'Quizzes', icon: HelpCircle },
] as const;

export const CourseDetailsLayout = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const numericId = useMemo(() => {
        const n = Number(courseId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [courseId]);

    const { data: course, isLoading } = useCourseOverview(numericId ?? 0);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const linkBase = `/courses/${courseId}`;

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
                    bg-white dark:bg-slate-800/60 backdrop-blur-md
                    border-r border-gray-200 dark:border-slate-700/50
                    flex flex-col transition-all duration-300 ease-out shrink-0
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-[72px]' : 'w-64'}
                `}
            >
                <div
                    className={`p-4 border-b border-gray-100 dark:border-slate-700/50 flex items-center ${
                        collapsed ? 'justify-center' : 'justify-between'
                    } gap-2`}
                >
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                                {isLoading ? 'Loading...' : (course as any)?.name || 'Course'}
                            </h2>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                {(course as any)?.code || `#${courseId}`}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setCollapsed(!collapsed);
                            setMobileOpen(false);
                        }}
                        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={`${linkBase}/${to}`}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group
                                ${collapsed ? 'justify-center' : ''}
                                ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="truncate">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-100 dark:border-slate-700/50">
                    <button
                        onClick={() => navigate('/courses')}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white transition-all ${
                            collapsed ? 'justify-center' : ''
                        }`}
                    >
                        <ChevronLeft className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>All Courses</span>}
                    </button>
                </div>
            </aside>

            <div
                className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
                    collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
                }`}
            >
                <div className="lg:hidden flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700/50 sticky top-0 z-20">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                            {isLoading ? 'Loading...' : (course as any)?.name || 'Course'}
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
