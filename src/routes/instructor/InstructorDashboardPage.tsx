import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Plus, Users, BookOpen, Clock,
    AlertCircle, CheckSquare, Calendar, Loader2, ArrowRight,
    LayoutGrid, ChevronLeft, ChevronRight, ClipboardList, FileText,
    ChevronDown, ChevronUp, Info, Activity, TrendingUp, Target, Settings, Eye,
    Lightbulb
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { useInstructorStats, useUpcomingEvents, useInstructorMyCourses } from '@/features/instructor/api';
import type { GetAllCoursesDto, UpcomingEventDto } from '@/types/api.types';
import { CourseProgressOverview } from '@/components/CourseProgressOverview';

// ── Helpers ────────────────────────────────────────────────────────────

interface CourseUI {
    id: string;
    title: string;
    courseId: string;
    imageUrl?: string | null;
    primaryAction?: string;
}

const mapCourseToUI = (dto: any, index: number): CourseUI => {
    return {
        id: dto.id.toString(),
        title: dto.courseName || dto.name,
        courseId: dto.courseCode || dto.code,
        imageUrl: dto.imageUrl,
        primaryAction: 'Manage',
    };
};

/** Colour palette per event type */
const eventColor = (type: string) =>
    type === 'Assignment'
        ? {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-500',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
            dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
            line: 'bg-emerald-100 dark:bg-emerald-500/20',
        }
        : {
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-500',
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
            dot: 'bg-blue-500 shadow-[0_0_8px_rgba(33,169,255,0.4)]',
            line: 'bg-blue-100 dark:bg-blue-500/20',
        };

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    } catch { return iso; }
};

const daysUntil = (iso: string) => {
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days left`;
};

// ── Skeleton helpers ───────────────────────────────────────────────────

const StatSkeleton = () => (
    <div className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between animate-pulse">
        <div><div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-3" /><div className="h-8 w-14 bg-gray-200 dark:bg-slate-700 rounded" /></div>
        <div className="w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
    </div>
);

const CardSkeleton = () => (
    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 animate-pulse">
        <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
    </div>
);

const EventSkeleton = () => (
    <div className="rounded-xl p-4 border border-gray-200 dark:border-slate-700/50 animate-pulse">
        <div className="flex justify-between mb-2"><div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" /><div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded-md" /></div>
        <div className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
    </div>
);

// ── Tooltip ────────────────────────────────────────────────────────────

const EventTooltip = ({ event }: { event: UpcomingEventDto }) => (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-4 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">{event.eventType}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{event.title}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Course: {event.courseName}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Due {formatDate(event.availableUntil)}</p>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white dark:bg-slate-800 border-b border-r border-gray-200 dark:border-slate-700 rotate-45 -mt-1" />
    </div>
);

// ── Mini Calendar ──────────────────────────────────────────────────────

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MiniCalendar = ({ events }: { events: UpcomingEventDto[] }) => {
    const [viewDate, setViewDate] = useState(() => new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Build a map: dayNumber → events for that day
    const eventsByDay = useMemo(() => {
        const map: Record<number, UpcomingEventDto[]> = {};
        events.forEach((ev) => {
            const d = new Date(ev.availableUntil);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                (map[day] ??= []).push(ev);
            }
        });
        return map;
    }, [events, year, month]);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d: number) =>
        d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    return (
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    Calendar
                </h2>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-900/50 p-1 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all">
                        <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-300 min-w-[100px] text-center">
                        {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all">
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 py-1">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                    const dayEvents = eventsByDay[day];
                    const hasAssignment = dayEvents?.some((e) => e.eventType === 'Assignment');
                    const hasQuiz = dayEvents?.some((e) => e.eventType === 'Quiz');
                    const hasMixed = hasAssignment && hasQuiz;
                    const isSpecial = hasAssignment || hasQuiz;
                    const today = isToday(day);

                    return (
                        <div
                            key={day}
                            className={`
                                group/cal relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-black transition-all duration-300 cursor-default
                                ${isSpecial
                                    ? (hasMixed ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : hasQuiz ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20')
                                    : (today ? 'bg-white dark:bg-slate-800 text-[#812E96] shadow-md shadow-purple-500/10' : 'bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50')}
                                ${today ? 'border-[2.5px] border-[#812E96]' : ''}
                            `}
                        >
                            <span className={isSpecial ? 'mt-[-4px]' : ''}>{day}</span>
                            {isSpecial && (
                                <span className="text-[7px] font-black uppercase tracking-tighter opacity-80 mt-[-2px]">
                                    {hasMixed ? 'Mixed' : hasQuiz ? 'Quiz' : 'Assig'}
                                </span>
                            )}

                            {/* Hover Quick View Tooltip */}
                            {dayEvents && (
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 pointer-events-none opacity-0 group-hover/cal:opacity-100 transition-all duration-300 translate-y-2 group-hover/cal:translate-y-0">
                                    <div className="space-y-3">
                                        {dayEvents.map((ev, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 border-l-2 pl-3 border-gray-200 dark:border-slate-700 last:border-0 last:pl-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.eventType === 'Assignment' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                    <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight">{ev.title}</p>
                                                </div>
                                                <div className="pl-3.5 space-y-0.5">
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                                                        <BookOpen className="w-2.5 h-2.5" /> {ev.courseName}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                                                        <Clock className="w-2.5 h-2.5" /> Due {formatDate(ev.availableUntil)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2.5 h-2.5 bg-white dark:bg-slate-900 border-b border-r border-gray-200 dark:border-slate-700 rotate-45 -mt-1.5" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-[4px] bg-blue-500 shadow-sm" /><span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Quizzes</span></div>
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-[4px] bg-emerald-500 shadow-sm" /><span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Assignments</span></div>
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-[4px] bg-amber-500 shadow-sm" /><span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mixed</span></div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const InstructorDashboardPage = () => {
    const user = useAuthStore((s) => s.user);

    // ── Data fetching ──────────────────────────────────────────────────
    const { data: stats, isLoading: statsLoading, error: statsError } = useInstructorStats();
    const { data: events, isLoading: eventsLoading, error: eventsError } = useUpcomingEvents();
    const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useInstructorMyCourses({ PageNumber: 1, PageSize: 50 });

    // ── Derived state ──────────────────────────────────────────────────
    const courses = useMemo(() => coursesData?.items?.map((dto, idx) => mapCourseToUI(dto, idx)) ?? [], [coursesData]);

    // Sort upcoming events returned from the backend (both quizzes and assignments) by date
    const sortedEvents = useMemo(() => {
        if (!events) return [];
        return [...events].sort((a, b) => new Date(a.availableUntil).getTime() - new Date(b.availableUntil).getTime());
    }, [events]);

    // ── Stats config ───────────────────────────────────────────────────
    const statCards = [
        { label: 'Total Courses', value: stats?.totalCourses ?? '16', icon: BookOpen, color: 'blue', subLabel: 'Active semester' },
        { label: 'Total Students', value: stats?.totalStudents ?? '5', icon: Users, color: 'emerald', subLabel: 'Unique enrollments' },
        { label: 'Avg. Performance', value: '84%', icon: Target, color: 'purple', subLabel: 'Across all quizzes' },
        { label: 'Submissions', value: stats?.totalAssignments ?? '5', icon: FileText, color: 'amber', subLabel: 'Pending review' },
    ];

    // Greeting name
    const displayName = user?.firstName || user?.fullName || 'Instructor';

    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                {/* ── Greeting Hero ─────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
                    <div className="space-y-2 sm:space-y-3 text-center lg:text-left items-center lg:items-start flex flex-col">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                            <Activity className="w-3.5 h-3.5" /> Academic Management Console
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            Dashboard Overview, <br className="sm:hidden" /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#21A9FF] to-indigo-500">{displayName}</span>
                        </h1>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 pt-1">
                            <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm md:text-base font-medium">
                                Monitoring live curriculum engagement and academic performance metrics.
                            </p>
                            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs sm:text-sm font-semibold">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-sm px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-[#21A9FF]/25 hover:-translate-y-0.5 active:scale-95">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>

                {/* ── Statistics Cards ──────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {statsLoading
                        ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                        : statCards.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 flex flex-col gap-6 shadow-sm group hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    {/* Top Row: Icon and Label */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                            ${stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : ''}
                                            ${stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : ''}
                                            ${stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' : ''}
                                            ${stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : ''}
                                        `}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">{stat.label}</p>
                                    </div>

                                    {/* Content Area */}
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {stat.value}
                                            </h3>
                                        </div>
                                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">{stat.subLabel}</p>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* ── Main Content Grid ─────────────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* ── Left Column (2 cols) ─────────────────────── */}
                    <div className="lg:col-span-2 flex flex-col gap-8">

                        {/* ── My Courses ───────────────────────────── */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-[#21A9FF]" /> My Courses
                                </h2>
                                <Link to={ROUTES.INSTRUCTOR_COURSES}>
                                    <button className="text-sm font-bold text-[#21A9FF] dark:text-[#21A9FF] hover:text-[#0094F2] dark:hover:text-[#0094F2] flex items-center gap-1 group">
                                        View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>

                            <div className="grid gap-4">
                                {coursesLoading && Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}

                                {!coursesLoading && coursesError && (
                                    <div className="text-center py-10 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-dashed border-red-200 dark:border-red-500/30">
                                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Failed to load courses</p>
                                    </div>
                                )}

                                {!coursesLoading && !coursesError && courses.length === 0 && (
                                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                        <BookOpen className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                                        <p className="text-base font-bold text-gray-900 dark:text-white mb-1">No courses yet</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Create your first course to start teaching.</p>
                                    </div>
                                )}

                                {/* Change slice from 5 to 4 */}
                                {!coursesLoading && !coursesError && courses.slice(0, 4).map((course, idx) => {
                                    return (
                                        <div
                                            key={course.id}
                                            className="relative rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 group overflow-hidden bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-slate-600"
                                        >
                                            {/* Course Icon and Info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                                    {course.imageUrl ? (
                                                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700/50">
                                                            <BookOpen className="w-6 h-6 text-gray-300 dark:text-slate-500" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-0.5 tracking-tight">ID: {course.courseId}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800 pt-3 sm:pt-0">
                                                <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id)}>
                                                    <button className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl transition-all border border-gray-200 dark:border-slate-700 shadow-sm hover:text-blue-500" title="Course Settings">
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                </Link>

                                                {course.primaryAction && (
                                                    <Link to={`/instructor/courses/${course.id}/manage/sections`}>
                                                        <button className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 shadow-sm bg-[#21A9FF] hover:bg-[#0094F2] text-white hover:shadow-[#21A9FF]/25">
                                                            Manage
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>

                        {/* ── Course Progress Overview ────────────────── */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <CourseProgressOverview hasCourses={courses.length > 0} />
                        </div>
                    </div>

                    {/* ── Right Column (1 col) ─────────────────────── */}
                    <div className="lg:col-span-1 flex flex-col gap-8">

                        {/* ── Calendar ─────────────────────────────── */}
                        <MiniCalendar events={sortedEvents} />

                        {/* ── Timeline ──────────────────────── */}
                        <div className="flex-1 bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Upcoming Events</h2>
                                </div>
                                <Link
                                    to={ROUTES.INSTRUCTOR_UPCOMING_EVENTS}
                                    className="text-[10px] font-black text-gray-400 hover:text-blue-500 transition-colors tracking-widest uppercase"
                                >
                                    VIEW FULL
                                </Link>
                            </div>

                            <div className="relative space-y-0 pl-1">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100 dark:bg-slate-700/50" />

                                {eventsLoading && Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)}

                                {!eventsLoading && eventsError && (
                                    <div className="text-center py-6 bg-red-50 dark:bg-red-500/10 rounded-xl border border-dashed border-red-200 dark:border-red-500/30">
                                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400">Failed to load events</p>
                                    </div>
                                )}

                                {!eventsLoading && !eventsError && sortedEvents.length === 0 && (
                                    <div className="text-center py-6">
                                        <Calendar className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 dark:text-slate-400">No upcoming events</p>
                                    </div>
                                )}

                                {!eventsLoading && !eventsError && sortedEvents.slice(0, 3).map((event, idx) => {
                                    const c = eventColor(event.eventType);
                                    const Icon = event.eventType === 'Assignment' ? FileText : Lightbulb;
                                    return (
                                        <div key={idx} className="relative pl-12 pb-8 last:pb-2 group/item">
                                            {/* Timeline Icon */}
                                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-lg flex items-center justify-center z-10 transition-transform group-hover/item:scale-110 border ${c.bg} ${c.text} ${c.border}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-black tracking-widest uppercase ${c.text}`}>
                                                        {event.eventType}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {daysUntil(event.availableUntil)}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                                    {event.title}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-bold truncate max-w-[140px]">{event.courseName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-bold">{formatDate(event.availableUntil)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!eventsLoading && sortedEvents.length > 0 && (
                                    <div className="pt-2">
                                        <Link to={ROUTES.INSTRUCTOR_UPCOMING_EVENTS} className="block w-full">
                                            <button className="w-full py-4 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl text-[10px] font-black text-gray-500 tracking-widest uppercase transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                                                LOAD MORE HISTORY
                                            </button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};