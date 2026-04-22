import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Edit2, Plus, Users, BookOpen, Clock,
    AlertCircle, CheckSquare, Calendar, Loader2, ArrowRight,
    LayoutGrid, ChevronLeft, ChevronRight, ClipboardList, FileText,
    ChevronDown, ChevronUp, Info, Activity
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { useInstructorStats, useUpcomingEvents, useInstructorMyCourses } from '@/features/instructor/api';
import { useInstructorAssignments } from '@/features/assignments/api';
import type { GetAllCoursesDto, UpcomingEventDto } from '@/types/api.types';

// ── Helpers ────────────────────────────────────────────────────────────

interface CourseUI {
    id: string;
    title: string;
    courseId: string;
    primaryAction?: string;
}

const mapCourseToUI = (dto: any): CourseUI => {
    return {
        id: dto.id.toString(),
        title: dto.courseName || dto.name,
        courseId: dto.courseCode || dto.code,
        primaryAction: 'Manage',
    };
};

/** Colour palette per event type */
const eventColor = (type: string) =>
    type === 'Assignment'
        ? {
            bg: 'bg-rose-50 dark:bg-rose-500/10',
            border: 'border-rose-200 dark:border-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            dot: 'bg-rose-500',
        }
        : {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
            dot: 'bg-emerald-500',
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
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#21A9FF]" /> Calendar
                </h2>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300 min-w-[110px] text-center">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 py-1">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const dayEvents = eventsByDay[day];
                    const hasAssignment = dayEvents?.some((e) => e.eventType === 'Assignment');
                    const hasQuiz = dayEvents?.some((e) => e.eventType === 'Quiz');

                    return (
                        <div
                            key={day}
                            className={`group/cal relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs font-semibold transition-all cursor-default
                                ${isToday(day) ? 'bg-[#21A9FF] text-white shadow-md shadow-[#21A9FF]/30' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'}
                            `}
                        >
                            {day}
                            {/* Event dots */}
                            {dayEvents && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {hasAssignment && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                                    {hasQuiz && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                                </div>
                            )}
                            {/* Hover card */}
                            {dayEvents && (
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-2.5 pointer-events-none opacity-0 group-hover/cal:opacity-100 transition-opacity duration-200">
                                    {dayEvents.map((ev, idx) => (
                                        <div key={idx} className="flex items-start gap-2 mb-1 last:mb-0">
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${ev.eventType === 'Assignment' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-tight">{ev.title}</p>
                                                <p className="text-[9px] text-gray-400 dark:text-slate-500">{ev.courseName}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white dark:bg-slate-800 border-b border-r border-gray-200 dark:border-slate-700 rotate-45 -mt-1" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Assignment</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Quiz</span></div>
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
    const { data: assignmentsData, isLoading: assignmentsLoading } = useInstructorAssignments({ PageNumber: 1, PageSize: 50 });

    // ── Derived state ──────────────────────────────────────────────────
    const courses = useMemo(() => coursesData?.items?.map(mapCourseToUI) ?? [], [coursesData]);

    // Merge backend UpcomingEvents (quizzes) with dynamically computed upcoming assignments
    const sortedEvents = useMemo(() => {
        const eventsList = events ? [...events] : [];
        
        // Find upcoming assignments not returned by the backend endpoint
        if (assignmentsData && coursesData?.items) {
            const now = new Date().getTime();
            
            const upcomingAssignments = assignmentsData.filter(a => {
                return new Date(a.dueDate).getTime() > now && a.isPublished !== false;
            }).map(a => ({
                courseName: coursesData.items.find(c => c.id === a.courseId)?.name || 'Course Assignment',
                title: a.title,
                availableUntil: a.dueDate,
                eventType: 'Assignment' as const
            }));
            
            eventsList.push(...upcomingAssignments);
        }

        return eventsList.sort((a, b) => new Date(a.availableUntil).getTime() - new Date(b.availableUntil).getTime());
    }, [events, assignmentsData, coursesData]);

    // ── Stats config ───────────────────────────────────────────────────
    const statCards = [
        { label: 'Total Courses', value: stats?.totalCourses ?? '—', icon: BookOpen, color: 'blue' },
        { label: 'Total Students', value: stats?.totalStudents ?? '—', icon: Users, color: 'emerald' },
        { label: 'Total Quizzes', value: stats?.totalQuizzes ?? '—', icon: ClipboardList, color: 'purple' },
        { label: 'Total Assignments', value: stats?.totalAssignments ?? '—', icon: FileText, color: 'amber' },
    ];

    // Greeting name
    const displayName = user?.firstName || user?.fullName || 'Instructor';

    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Greeting Hero ─────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                            <Activity className="w-3.1 h-3.1" /> Academic Management Console
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            Dashboard Overview, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#21A9FF] to-indigo-500">{displayName}</span>
                        </h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                            <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base font-medium">
                                Monitoring live curriculum engagement and academic performance metrics.
                            </p>
                            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-sm font-semibold">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                    
                    <Link to={ROUTES.INSTRUCTOR_COURSE_NEW}>
                        <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-[#21A9FF]/25 hover:-translate-y-0.5 active:scale-95">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </button>
                    </Link>
                </div>

                {/* ── Statistics Cards ──────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {statsLoading
                        ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                        : statCards.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className={`absolute left-0 top-0 w-1.5 h-full
                                        ${stat.color === 'blue' ? 'bg-[#21A9FF]' : ''}
                                        ${stat.color === 'emerald' ? 'bg-emerald-500' : ''}
                                        ${stat.color === 'purple' ? 'bg-purple-500' : ''}
                                        ${stat.color === 'amber' ? 'bg-amber-500' : ''}
                                    `} />
                                    <div>
                                        <p className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                                            {statsError ? <AlertCircle className="w-6 h-6 text-red-400 inline" /> : stat.value}
                                        </h3>
                                    </div>
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0
                                        ${stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-[#21A9FF] dark:text-[#21A9FF]' : ''}
                                        ${stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}
                                        ${stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : ''}
                                        ${stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : ''}
                                    `}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* ── Main Content Grid ─────────────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* ── Left Column (2 cols) ─────────────────────── */}
                    <div className="lg:col-span-2 space-y-8">

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
                                {!coursesLoading && !coursesError && courses.slice(0, 4).map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-slate-500 transition-all group"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-[#21A9FF] dark:group-hover:text-[#21A9FF] transition-colors mb-1.5">
                                                {course.title}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-gray-400 dark:text-slate-500">ID: {course.courseId}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-200 dark:border-slate-700 pt-4 sm:pt-0">
                                            <Link to={ROUTES.INSTRUCTOR_COURSE_EDIT.replace(':id', course.id)}>
                                                <button className="p-2 text-gray-500 hover:text-[#21A9FF] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors border border-gray-200 dark:border-slate-600 shadow-sm" title="Edit Settings">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            {course.primaryAction && (
                                                <Link to={`/instructor/courses/${course.id}/manage/sections`}>
                                                    <button className="bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[#21A9FF]/25 active:scale-95 flex items-center gap-1">
                                                        {course.primaryAction}
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}


                            </div>
                        </div>
                    </div>

                    {/* ── Right Column (1 col) ─────────────────────── */}
                    <div className="lg:col-span-1 space-y-8">
                    
                        {/* ── Calendar ─────────────────────────────── */}
                        <MiniCalendar events={sortedEvents} />

                        {/* ── Upcoming Events ──────────────────────── */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-rose-500" /> Upcoming Events
                                </h2>
                                <Link 
                                    to={ROUTES.INSTRUCTOR_UPCOMING_EVENTS}
                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors group"
                                >
                                    View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="space-y-3">
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
                                    return (
                                        <div
                                            key={idx}
                                            className={`group/tip relative rounded-xl p-4 border ${c.bg} ${c.border} transition-all hover:shadow-md`}
                                        >
                                            <EventTooltip event={event} />
                                            <div className="flex justify-between items-start mb-2">
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
                                                    {event.courseName}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.badge}`}>
                                                    {daysUntil(event.availableUntil)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{event.title}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDate(event.availableUntil)}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.badge}`}>
                                                    {event.eventType}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}


                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};