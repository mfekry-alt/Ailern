import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Calendar, Clock, AlertCircle, ArrowLeft, 
    Filter, Search, CalendarDays, SortAsc, ArrowRight,
    ChevronDown, Check
} from 'lucide-react';
import { useUpcomingEvents, useInstructorMyCourses } from '@/features/instructor/api';
import { useInstructorAssignments } from '@/features/assignments/api';
import { ROUTES } from '@/lib/constants';
import type { UpcomingEventDto } from '@/types/api.types';

interface ExtendedEvent extends Omit<UpcomingEventDto, 'courseId' | 'id'> {
    id?: number | string;
    courseId?: number | string;
}

// ── Helpers ────────────────────────────────────────────────────────────

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
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
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

// ── Skeleton ───────────────────────────────────────────────────────────

const EventSkeleton = () => (
    <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between mb-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
        <div className="flex gap-4">
            <div className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────

export const InstructorUpcomingEventsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Assignment' | 'Quiz'>('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // ── Data fetching ──────────────────────────────────────────────────
    const { data: events, isLoading: eventsLoading, error: eventsError } = useUpcomingEvents();
    const { data: coursesData, isLoading: coursesLoading } = useInstructorMyCourses({ PageNumber: 1, PageSize: 50 });
    const { data: assignmentsData, isLoading: assignmentsLoading } = useInstructorAssignments({ PageNumber: 1, PageSize: 50 });

    // Merge logic
    const allEvents = useMemo(() => {
        const eventsList: ExtendedEvent[] = events ? [...events] : [];
        
        if (assignmentsData && coursesData?.items) {
            const now = new Date().getTime();
            const upcomingAssignments = assignmentsData
                .filter(a => new Date(a.dueDate).getTime() > now && a.isPublished !== false)
                .map(a => ({
                    id: a.id,
                    courseId: a.courseId,
                    courseName: coursesData.items.find(c => c.id === a.courseId)?.name || 'Course Assignment',
                    title: a.title,
                    availableUntil: a.dueDate,
                    eventType: 'Assignment' as const
                }));
            
            eventsList.push(...upcomingAssignments);
        }

        // Add courseId to quizzes if possible by matching course name
        if (coursesData?.items) {
            eventsList.forEach(ev => {
                if (ev.eventType === 'Quiz' && !ev.courseId) {
                    const course = coursesData.items.find(c => c.name === ev.courseName);
                    if (course) ev.courseId = course.id;
                }
            });
        }

        return eventsList.sort((a, b) => new Date(a.availableUntil).getTime() - new Date(b.availableUntil).getTime());
    }, [events, assignmentsData, coursesData]);

    // Filtering logic
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const matchesSearch = 
                event.title.toLowerCase().startsWith(searchQuery.toLowerCase());
            
            const matchesType = filterType === 'All' || event.eventType === filterType;
            
            return matchesSearch && matchesType;
        });
    }, [allEvents, searchQuery, filterType]);

    const isLoading = eventsLoading || (assignmentsLoading && assignmentsData === undefined) || coursesLoading;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8 text-[#21A9FF]" /> Upcoming Events
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
                                Comprehensive timeline of assessments and deadlines.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                         <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all w-full sm:w-64 shadow-sm"
                            />
                        </div>
                        
                        <div className="relative flex-1 sm:flex-none">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`w-full flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border ${filterType !== 'All' ? 'border-[#21A9FF] shadow-sm shadow-[#21A9FF]/10' : 'border-gray-200 dark:border-slate-700'} rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all`}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className={`w-4 h-4 ${filterType !== 'All' ? 'text-[#21A9FF]' : ''}`} />
                                    <span>{filterType === 'All' ? 'All Types' : filterType}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                        {(['All', 'Assignment', 'Quiz'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setFilterType(type);
                                                    setIsFilterOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                {type === 'All' ? 'All Types' : `${type}s`}
                                                {filterType === type && <Check className="w-4 h-4 text-[#21A9FF]" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)
                    ) : eventsError ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-red-200 dark:border-red-500/30">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load timeline</h2>
                            <p className="text-gray-500 dark:text-slate-400 mb-6">There was an error fetching your upcoming assessments.</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-[#21A9FF] text-white font-bold rounded-xl hover:bg-[#0094F2] transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700/50">
                            <Calendar className="w-16 h-16 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {searchQuery ? 'No matching events' : 'No upcoming events'}
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400">
                                {searchQuery ? `Try adjusting your search for "${searchQuery}"` : 'Your academic timeline is currently clear.'}
                            </p>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="mt-6 text-sm font-bold text-[#21A9FF] hover:underline"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.map((event, idx) => {
                                const c = eventColor(event.eventType);
                                
                                // Determine the details link navigation path
                                const getDetailsPath = () => {
                                    const type = event.eventType || (event as any).type;
                                    if (type === 'Assignment') {
                                        return event.id 
                                            ? ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', String(event.id))
                                            : ROUTES.INSTRUCTOR_ASSIGNMENTS;
                                    } else {
                                        // Quiz logic: link to course management
                                        return event.courseId 
                                            ? `${ROUTES.INSTRUCTOR_MANAGE_COURSE.replace(':id', String(event.courseId))}/quizzes`
                                            : ROUTES.INSTRUCTOR_COURSES;
                                    }
                                };
                                return (
                                    <div 
                                        key={idx}
                                        className={`group relative bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700/50 hover:shadow-xl hover:shadow-[#21A9FF]/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 overflow-hidden`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.dot}`} />
                                        
                                        <div className="flex-1 space-y-2 sm:space-y-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:py-1 rounded-lg ${c.badge}`}>
                                                    {event.eventType}
                                                </span>
                                                <span className="text-gray-300 dark:text-slate-700">|</span>
                                                <p className="text-xs sm:text-sm font-bold text-[#21A9FF] dark:text-[#21A9FF] truncate max-w-[150px] sm:max-w-none">
                                                    {event.courseName}
                                                </p>
                                            </div>

                                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-[#21A9FF] dark:group-hover:text-[#21A9FF] transition-colors leading-tight">
                                                {event.title}
                                            </h3>

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-gray-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                                    {formatDate(event.availableUntil)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                                    {new Date(event.availableUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800 min-w-[140px]">
                                            <div className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm border ${c.border} ${c.text} ${c.bg} shadow-sm`}>
                                                {daysUntil(event.availableUntil)}
                                            </div>
                                            <Link 
                                                to={getDetailsPath()}
                                                className="text-xs font-bold text-gray-400 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] flex items-center gap-1 transition-colors group/link"
                                            >
                                                Details <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Insight */}
                <div className="p-6 bg-[#21A9FF]/5 dark:bg-[#21A9FF]/5 rounded-3xl border border-[#21A9FF]/10 dark:border-[#21A9FF]/10 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#21A9FF] shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-[#21A9FF] dark:text-[#21A9FF]">Pro-Tip for Instructors</h4>
                        <p className="text-xs text-[#21A9FF]/70 dark:text-[#21A9FF]/60 mt-1 leading-relaxed">
                            Stay ahead of your grading cycle by monitoring this timeline daily. 
                            Events marked as <span className="font-bold">Overdue</span> require immediate attention or grading.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
