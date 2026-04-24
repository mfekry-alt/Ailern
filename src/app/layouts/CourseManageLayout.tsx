import { useState, useMemo } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useCourse } from '@/features/courses/api';
import { ChevronLeft, ChevronRight, Layers, FileText, HelpCircle, Users, Menu, X, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
    { to: 'sections', label: 'Sections', icon: Layers },
    { to: 'assignments', label: 'Assignments', icon: FileText },
    { to: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { to: 'students', label: 'Students', icon: Users },
    { to: 'ai-assistant', label: 'Files', icon: Sparkles },
] as const;

export const CourseManageLayout = () => {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const numericId = useMemo(() => {
        const n = Number(courseId);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [courseId]);

    const { data: course, isLoading } = useCourse(numericId ?? 0);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const linkBase = `/instructor/courses/${courseId}/manage`;

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
                {/* Header */}
                <div className={`p-4 border-b border-gray-100 dark:border-slate-700/50 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                                {isLoading ? 'Loading...' : (course?.name || 'Course')}
                            </h2>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                {course?.code || `#${courseId}`}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
                        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-[#21A9FF] dark:hover:text-white hover:bg-[#21A9FF]/10 transition-colors shrink-0"
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

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
                        onClick={() => navigate('/instructor/courses')}
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
