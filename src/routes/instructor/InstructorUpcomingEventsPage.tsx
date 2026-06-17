import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Calendar, Clock, AlertCircle, ArrowLeft, 
    Filter, Search, CalendarDays, SortAsc, ArrowRight,
    ChevronDown, Check, BookOpen, Lightbulb, Sparkles, SortDesc, AlertTriangle, HelpCircle
} from 'lucide-react';
import { useUpcomingEvents } from '@/features/instructor/api';
import { ROUTES } from '@/lib/constants';
import type { UpcomingEventDto } from '@/types/api.types';

interface ExtendedEvent extends Omit<UpcomingEventDto, 'courseId' | 'id'> {
    id?: number | string;
    courseId?: number | string;
};

// ── Helpers ────────────────────────────────────────────────────────────

const eventColor = (type: string) =>
    type === 'Assignment'
        ? {
            bg: 'bg-rose-50/50 dark:bg-rose-500/10',
            border: 'border-rose-100 dark:border-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
            iconBg: 'bg-rose-500',
            gradient: 'from-rose-500 to-pink-500',
            borderAccent: 'border-rose-200/60 dark:border-rose-500/20',
        }
        : {
            bg: 'bg-emerald-50/50 dark:bg-emerald-500/10',
            border: 'border-emerald-100 dark:border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
            dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
            iconBg: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-teal-500',
            borderAccent: 'border-emerald-200/60 dark:border-emerald-500/20',
        };

const getCourseAvatarColor = (courseName: string) => {
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 5;
    const gradients = [
        'from-blue-500 to-indigo-600 text-white shadow-blue-500/20',
        'from-purple-500 to-violet-600 text-white shadow-purple-500/20',
        'from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
        'from-rose-500 to-pink-600 text-white shadow-rose-500/20',
        'from-amber-500 to-orange-600 text-white shadow-amber-500/20'
    ];
    return gradients[index];
};

const getCourseInitials = (courseName: string) => {
    if (!courseName) return 'C';
    const parts = courseName.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return courseName.substring(0, 2).toUpperCase();
};

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });
    } catch { return iso; }
};

const getUrgencyInfo = (iso: string) => {
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
    if (diff < 0) {
        return {
            text: 'Overdue',
            color: 'rose',
            badgeClass: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 shadow-sm shadow-rose-500/5',
            pulse: true
        };
    }
    if (diff === 0) {
        return {
            text: 'Due Today',
            color: 'amber',
            badgeClass: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm shadow-amber-500/5',
            pulse: true
        };
    }
    if (diff === 1) {
        return {
            text: 'Due Tomorrow',
            color: 'amber',
            badgeClass: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm',
            pulse: false
        };
    }
    if (diff <= 3) {
        return {
            text: `${diff} days left`,
            color: 'blue',
            badgeClass: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shadow-sm',
            pulse: false
        };
    }
    return {
        text: `${diff} days left`,
        color: 'slate',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700 shadow-sm',
        pulse: false
    };
};

// ── Skeletons ───────────────────────────────────────────────────────────

const StatSkeleton = () => (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-5 sm:p-6 flex items-center justify-between animate-pulse">
        <div className="space-y-2">
            <div className="h-3.5 w-20 bg-gray-250 dark:bg-slate-700 rounded" />
            <div className="h-7 w-12 bg-gray-250 dark:bg-slate-700 rounded" />
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-250 dark:bg-slate-700 rounded-2xl" />
    </div>
);

const EventSkeleton = () => (
    <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 animate-pulse flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="flex gap-4 items-center w-full sm:flex-1">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-2 flex-1">
                <div className="h-3.5 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-3.5 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
        </div>
        <div className="h-8 w-24 bg-gray-200 dark:bg-slate-700 rounded-xl shrink-0 mt-3 sm:mt-0" />
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────

export const InstructorUpcomingEventsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Assignment' | 'Quiz'>('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'closest' | 'furthest'>('closest');

    // ── Data fetching ──────────────────────────────────────────────────
    const { data: events, isLoading: eventsLoading, error: eventsError } = useUpcomingEvents();

    const allEvents = useMemo(() => {
        if (!events) return [];
        return [...events];
    }, [events]);

    // Compute stats
    const stats = useMemo(() => {
        const total = allEvents.length;
        const quizzes = allEvents.filter(e => e.eventType === 'Quiz').length;
        const assignments = allEvents.filter(e => e.eventType === 'Assignment').length;
        const urgent = allEvents.filter(e => {
            const diff = Math.ceil((new Date(e.availableUntil).getTime() - Date.now()) / 86_400_000);
            return diff >= 0 && diff <= 3; // due in next 3 days
        }).length;

        return { total, quizzes, assignments, urgent };
    }, [allEvents]);

    // Filtering and sorting logic
    const filteredEvents = useMemo(() => {
        let list = allEvents.filter(event => {
            const matchesSearch = 
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.courseName.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = filterType === 'All' || event.eventType === filterType;
            
            return matchesSearch && matchesType;
        });

        list.sort((a, b) => {
            const timeA = new Date(a.availableUntil).getTime();
            const timeB = new Date(b.availableUntil).getTime();
            return sortBy === 'closest' ? timeA - timeB : timeB - timeA;
        });

        return list;
    }, [allEvents, searchQuery, filterType, sortBy]);

    const isLoading = eventsLoading;

    const statCards = [
        {
            label: 'Total Upcoming',
            value: stats.total,
            icon: CalendarDays,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            glowColor: 'bg-blue-500',
        },
        {
            label: 'Quizzes',
            value: stats.quizzes,
            icon: Sparkles,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
            glowColor: 'bg-violet-500',
        },
        {
            label: 'Assignments',
            value: stats.assignments,
            icon: BookOpen,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            glowColor: 'bg-emerald-500',
        },
        {
            label: 'Urgent Action',
            value: stats.urgent,
            icon: Clock,
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            glowColor: 'bg-rose-500',
            pulse: stats.urgent > 0,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-24">
            
            {/* Inline keyframes for premium animations */}
            <style>{`
                @keyframes shimmerLine {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes pulseGlow {
                    0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50%      { transform: scale(1.03); opacity: 1; box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.2); }
                }
                @keyframes slideUp {
                    0%   { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* ─── Hero Header Banner ─── */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 border border-gray-200/60 dark:border-slate-700/40 rounded-3xl p-5 sm:p-6 shadow-sm">
                    {/* Visual glowing blobs */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#21A9FF]/8 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-violet-400/6 to-transparent rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <button 
                                id="back-button"
                                onClick={() => navigate(-1)}
                                className="w-11 h-11 bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-gray-500 hover:text-[#21A9FF] hover:border-[#21A9FF]/30 dark:hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                                aria-label="Go Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                    <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8 text-[#21A9FF]" /> Upcoming Events
                                </h1>
                                <p className="text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
                                    Comprehensive timeline of course assessments and academic deadlines.
                                </p>
                            </div>
                        </div>

                        {/* Top total indicator count */}
                        {stats.total > 0 && (
                            <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#21A9FF]/10 text-[#21A9FF] border border-[#21A9FF]/15">
                                <Sparkles className="w-3.5 h-3.5" />
                                {stats.total} Upcoming Assessments
                            </span>
                        )}
                    </div>
                </div>

                {/* ─── Stats Row ─── */}
                <div 
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    style={{ animation: 'slideUp 0.5s ease-out' }}
                >
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                    ) : (
                        statCards.map((card, idx) => {
                            const Icon = card.icon;
                            const isUrgentFlash = card.pulse && card.value > 0;
                            return (
                                <div
                                    key={idx}
                                    className="relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 relative group overflow-hidden"
                                    style={isUrgentFlash ? { animation: 'pulseGlow 2.5s infinite ease-in-out' } : undefined}
                                >
                                    {/* Ambient glow circle */}
                                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[30px] opacity-10 group-hover:opacity-20 transition-opacity duration-300 -mr-8 -mt-8 ${card.glowColor}`} />
                                    
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                                {card.label}
                                            </p>
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{card.value}</h3>
                                        </div>
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${card.bgColor} flex items-center justify-center ${card.color} group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
                                            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ─── Glassmorphic Filter & Sort Bar ─── */}
                <div 
                    className="relative z-30 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/50 rounded-2xl sm:rounded-[1.75rem] p-3 sm:p-4 flex flex-col md:flex-row gap-3 shadow-sm"
                    style={{ animation: 'slideUp 0.6s ease-out' }}
                >
                    {/* Search */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#21A9FF] transition-colors" />
                        <input 
                            id="search-events"
                            type="text"
                            placeholder="Search by title or course name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#21A9FF]/20 focus:border-[#21A9FF] outline-none text-sm font-semibold transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Type Filter Dropdown */}
                        <div className="relative flex-1 md:flex-none md:min-w-[170px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <div 
                                id="filter-dropdown-toggle"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`pl-11 pr-4 py-3 bg-white dark:bg-slate-950/40 border ${filterType !== 'All' ? 'border-[#21A9FF] shadow-sm shadow-[#21A9FF]/5' : 'border-gray-200 dark:border-slate-700'} rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 hover:border-[#21A9FF] transition-all group`}
                            >
                                <span className="flex-1 text-gray-700 dark:text-slate-200 uppercase tracking-widest text-[10px] font-black">
                                    {filterType === 'All' ? 'All Types' : `${filterType}s`}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-full min-w-[170px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top">
                                        {(['All', 'Assignment', 'Quiz'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setFilterType(type);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
                                                    filterType === type 
                                                        ? 'bg-[#21A9FF]/5 text-[#21A9FF]' 
                                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {type === 'All' ? 'All Types' : `${type}s`}
                                                {filterType === type && <Check className="w-4 h-4 text-[#21A9FF]" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Due Date Sort Button */}
                        <button
                            id="sort-dropdown-toggle"
                            onClick={() => setSortBy(prev => prev === 'closest' ? 'furthest' : 'closest')}
                            className="px-4 py-3 bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-slate-700 hover:border-[#21A9FF] rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-[#21A9FF] flex items-center gap-2 transition-all shadow-sm shrink-0"
                            title={sortBy === 'closest' ? 'Sorting: Closest due date' : 'Sorting: Furthest due date'}
                        >
                            {sortBy === 'closest' ? (
                                <SortAsc className="w-4 h-4 text-[#21A9FF]" />
                            ) : (
                                <SortDesc className="w-4 h-4 text-[#21A9FF]" />
                            )}
                            <span className="uppercase tracking-widest text-[10px] font-black hidden sm:inline">
                                {sortBy === 'closest' ? 'Closest First' : 'Furthest First'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ─── Timeline Content Grid ─── */}
                <div className="relative">
                    {isLoading ? (
                        <div className="grid gap-4">
                            {Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)}
                        </div>
                    ) : eventsError ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-3xl border border-dashed border-red-200 dark:border-red-500/25">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Timeline Sync Failed</h2>
                            <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">We couldn't synchronize your upcoming course assessments.</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 bg-[#21A9FF] text-white font-bold rounded-xl hover:bg-[#0094F2] transition-colors shadow-md shadow-blue-500/10 active:scale-95"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white/40 dark:bg-slate-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700/50">
                            <Calendar className="w-14 h-14 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {searchQuery ? 'No matching assessments' : 'No upcoming events'}
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                                {searchQuery ? `We couldn't find items matching "${searchQuery}"` : 'Your academic planner is currently empty.'}
                            </p>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="mt-5 text-sm font-bold text-[#21A9FF] hover:underline"
                                >
                                    Clear Search Query
                                </button>
                            )}
                        </div>
                    ) : (
                        <div 
                            className="relative space-y-4 pl-0 sm:pl-8"
                            style={{ animation: 'slideUp 0.7s ease-out' }}
                        >
                            {/* Vertical Connected Track (timeline styling) */}
                            <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#21A9FF]/30 via-indigo-500/10 to-transparent border-dashed border-l border-gray-200 dark:border-slate-800 hidden sm:block" />
                            
                            {filteredEvents.map((event, idx) => {
                                const c = eventColor(event.eventType);
                                const urgency = getUrgencyInfo(event.availableUntil);
                                const avatarBg = getCourseAvatarColor(event.courseName);
                                const initials = getCourseInitials(event.courseName);
                                
                                // Determine the details link navigation path
                                const getDetailsPath = () => {
                                    const type = event.eventType || (event as any).type;
                                    if (type === 'Assignment') {
                                        return event.courseId 
                                            ? `${ROUTES.INSTRUCTOR_MANAGE_COURSE.replace(':id', String(event.courseId))}/assignments`
                                            : ROUTES.INSTRUCTOR_ASSIGNMENTS;
                                    } else {
                                        return event.courseId 
                                            ? `${ROUTES.INSTRUCTOR_MANAGE_COURSE.replace(':id', String(event.courseId))}/quizzes`
                                            : ROUTES.INSTRUCTOR_COURSES;
                                    }
                                };

                                return (
                                    <div 
                                        key={idx}
                                        className="relative group flex items-center"
                                        style={{ animation: `slideUp ${0.3 + idx * 0.05}s ease-out` }}
                                    >
                                        {/* Connected Timeline Dot */}
                                        <div className="absolute left-[-23px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-white dark:border-slate-900 bg-white dark:bg-slate-900 flex items-center justify-center hidden sm:flex z-10 transition-transform duration-300 group-hover:scale-125">
                                            <div className={`w-[4px] h-[4px] rounded-full ${c.dot}`} />
                                        </div>

                                        {/* Card Box */}
                                        <div className="w-full bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 border border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600/70 hover:shadow-xl hover:shadow-[#21A9FF]/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                                            {/* Accent color left bar */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-[5px] transition-opacity duration-300 opacity-60 group-hover:opacity-100 ${urgency.color === 'rose' ? 'bg-rose-500' : urgency.color === 'amber' ? 'bg-amber-500' : 'bg-[#21A9FF]'}`} />
                                            
                                            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 pl-1.5">
                                                {/* Styled Course Avatar Badge */}
                                                <Link 
                                                    id={`event-course-link-${idx}`}
                                                    to={getDetailsPath()}
                                                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarBg} flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105`}
                                                    title={`Go to ${event.courseName}`}
                                                >
                                                    {initials}
                                                </Link>

                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Type Badge */}
                                                        <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${c.badge}`}>
                                                            {event.eventType}
                                                        </span>
                                                        <span className="text-gray-300 dark:text-slate-700">|</span>
                                                        {/* Course Label */}
                                                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 truncate max-w-[200px]" title={event.courseName}>
                                                            {event.courseName}
                                                        </p>
                                                    </div>

                                                    <Link 
                                                        id={`event-details-link-${idx}`}
                                                        to={getDetailsPath()}
                                                    >
                                                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-[#21A9FF] transition-colors leading-snug hover:underline truncate">
                                                            {event.title}
                                                        </h3>
                                                    </Link>

                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 dark:text-slate-500">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-600" />
                                                            {formatDate(event.availableUntil)}
                                                        </div>
                                                        <div className="hidden sm:block w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full" />
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-600" />
                                                            {new Date(event.availableUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Due/Urgency status right panel */}
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800/80 min-w-[140px] pl-1.5 md:pl-0">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${urgency.badgeClass}`}>
                                                    {urgency.pulse && <span className={`w-2 h-2 rounded-full ${urgency.color === 'rose' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'} animate-ping`} />}
                                                    {urgency.text}
                                                </span>
                                                <Link 
                                                    to={getDetailsPath()}
                                                    className="text-xs font-bold text-gray-400 hover:text-[#21A9FF] flex items-center gap-1.5 transition-colors group/link select-none"
                                                >
                                                    Dashboard <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ─── Footer Insights Alert Box ─── */}
                <div 
                    className="p-5 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-white dark:from-slate-800/20 dark:via-slate-800/10 dark:to-transparent rounded-3xl border border-blue-100/60 dark:border-slate-800 flex items-start gap-4"
                    style={{ animation: 'slideUp 0.8s ease-out' }}
                >
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 text-blue-500">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Upcoming Events Analytics</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Assessments timeline compiles published items from your curriculum. Make sure to grade any <span className="text-rose-500 dark:text-rose-400 font-bold">Overdue</span> submissions to maintain course completion cycles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
