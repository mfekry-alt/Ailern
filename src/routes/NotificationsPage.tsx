import { useState, useMemo } from 'react';
import {
    Bell, X, CheckCircle2, Clock, Search, SearchX,
    Activity, FolderOpen, FileQuestion, ClipboardList, Sparkles, Trash2,
} from 'lucide-react';
import { useNotificationStore, NotificationType, type AppNotification } from '@/features/notifications';

// ─── Per-type visual config (mirrors NotificationToast) ──────────────────────

interface TypeConfig {
    Icon: React.ElementType;
    bg: string;
    color: string;
    label: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
    [NotificationType.NewAssignmentAdded]: {
        Icon: ClipboardList, bg: 'bg-indigo-500/10', color: 'text-indigo-500 dark:text-indigo-400',
        label: 'Assignment',
    },
    [NotificationType.CourseMaterialsUpdated]: {
        Icon: FolderOpen, bg: 'bg-blue-500/10', color: 'text-blue-500 dark:text-blue-400',
        label: 'Materials',
    },
    [NotificationType.NewQuizAdded]: {
        Icon: FileQuestion, bg: 'bg-orange-500/10', color: 'text-orange-500 dark:text-orange-400',
        label: 'Quiz',
    },
    [NotificationType.AttemptReviewed]: {
        Icon: CheckCircle2, bg: 'bg-emerald-500/10', color: 'text-emerald-500 dark:text-emerald-400',
        label: 'Reviewed',
    },
    [NotificationType.DeadlineReached]: {
        Icon: Clock, bg: 'bg-red-500/10', color: 'text-red-500 dark:text-red-400',
        label: 'Deadline',
    },
    [NotificationType.AiQuestionGenerationFinished]: {
        Icon: Sparkles, bg: 'bg-cyan-500/10', color: 'text-cyan-500 dark:text-cyan-400',
        label: 'AI',
    },
    [NotificationType.CourseRemovedByAdmin]: {
        Icon: Trash2, bg: 'bg-red-900/20', color: 'text-red-500 dark:text-red-400',
        label: 'Removed',
    },
};

function getConfig(type?: NotificationType): TypeConfig {
    if (!type || !TYPE_CONFIG[type]) {
        return { Icon: Bell, bg: 'bg-slate-500/10', color: 'text-slate-500', label: 'Other' };
    }
    return TYPE_CONFIG[type];
}

/** Converts an ISO-8601 timestamp to a human-readable relative string. */
function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60_000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | NotificationType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',                                              label: 'All' },
    { key: NotificationType.NewAssignmentAdded,                label: 'Assignments' },
    { key: NotificationType.CourseMaterialsUpdated,            label: 'Materials' },
    { key: NotificationType.NewQuizAdded,                      label: 'Quizzes' },
    { key: NotificationType.AttemptReviewed,                   label: 'Reviewed' },
    { key: NotificationType.DeadlineReached,                   label: 'Deadlines' },
    { key: NotificationType.AiQuestionGenerationFinished,      label: 'AI' },
    { key: NotificationType.CourseRemovedByAdmin,              label: 'Removed' },
];

// ─── Page component ───────────────────────────────────────────────────────────

export const NotificationsPage = () => {
    const { notifications, hasUnread, markAllRead, markRead, clearAll } = useNotificationStore();

    const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery]  = useState('');

    const filtered = useMemo<AppNotification[]>(() => {
        const q = searchQuery.toLowerCase();
        return notifications.filter(n => {
            const typeMatch = selectedTab === 'all' || n.type === selectedTab;
            const searchMatch =
                !q ||
                n.title.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q);
            return typeMatch && searchMatch;
        });
    }, [notifications, selectedTab, searchQuery]);

    // ── Stats for sidebar ────────────────────────────────────────────────────
    const stats = useMemo(() => [
        { label: 'Unread',      val: notifications.filter(n => !n.isRead).length,                                      color: 'blue' },
        { label: 'Assignments', val: notifications.filter(n => n.type === NotificationType.NewAssignmentAdded).length,  color: 'indigo' },
        { label: 'Quizzes',     val: notifications.filter(n => n.type === NotificationType.NewQuizAdded).length,        color: 'orange' },
        { label: 'Deadlines',   val: notifications.filter(n => n.type === NotificationType.DeadlineReached).length,     color: 'red' },
    ], [notifications]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-8 lg:p-12 transition-colors duration-300 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                            <Bell className="w-10 h-10 text-blue-600" /> Notifications
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 font-semibold text-lg mt-1">
                            Stay updated with your latest course activities.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {hasUnread && (
                            <button
                                onClick={markAllRead}
                                className="px-5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="px-5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" /> Clear all
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

                    {/* LEFT: List */}
                    <div className="space-y-6">

                        {/* Filter pills */}
                        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-2 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-inner">
                            {FILTER_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSelectedTab(tab.key)}
                                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-wider ${
                                        selectedTab === tab.key
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Notification cards */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-6 duration-700">
                            {filtered.length > 0 ? (
                                filtered.map(notif => {
                                    const cfg = getConfig(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`group relative bg-white dark:bg-slate-800/40 backdrop-blur-md border rounded-[2rem] p-6 sm:p-8 transition-all hover:shadow-xl hover:border-blue-400/50 dark:hover:border-slate-500 flex items-start gap-6 overflow-hidden ${
                                                !notif.isRead
                                                    ? 'border-blue-200 dark:border-blue-900/40 ring-1 ring-blue-500/10'
                                                    : 'border-gray-200 dark:border-slate-700/50 opacity-90'
                                            }`}
                                        >
                                            {/* Unread accent bar */}
                                            {!notif.isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-blue-600 shadow-[4px_0_15px_rgba(37,99,235,0.4)] z-20 rounded-l-[2rem]" />
                                            )}

                                            {/* Icon */}
                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${cfg.bg}`}>
                                                <cfg.Icon className={`w-8 h-8 ${cfg.color}`} />
                                            </div>

                                            {/* Text */}
                                            <div
                                                className="flex-1 min-w-0 py-1 cursor-pointer"
                                                onClick={() => markRead(notif.id)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className={`text-lg sm:text-xl font-extrabold truncate ${notif.isRead ? 'text-gray-700 dark:text-slate-200' : 'text-gray-900 dark:text-white'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-1 shrink-0 bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded-md ml-3">
                                                        {formatTime(notif.receivedAt)}
                                                    </span>
                                                </div>
                                                {notif.message && (
                                                    <p className="text-base text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                )}
                                                <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => markRead(notif.id)}
                                                title="Dismiss"
                                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-32 bg-white/20 dark:bg-slate-800/10 rounded-[3rem] border border-dashed border-gray-200 dark:border-slate-700">
                                    <SearchX className="w-20 h-20 text-gray-300 mx-auto mb-6 opacity-50" />
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">All caught up!</h3>
                                    <p className="text-gray-500 text-lg mt-2">No notifications found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Sidebar */}
                    <aside className="space-y-8 lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-6 duration-700">

                        {/* Search */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block ml-1">
                                Search activity
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Keywords..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
                                <Activity className="w-4 h-4 text-blue-500" /> Summary
                            </h3>
                            <div className="space-y-4">
                                {stats.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/30 hover:border-blue-400 transition-colors"
                                    >
                                        <span className="text-sm font-bold text-gray-600 dark:text-slate-400">{s.label}</span>
                                        <span className={`text-xl font-black text-${s.color}-600 dark:text-${s.color}-400 bg-${s.color}-500/10 px-3 py-1 rounded-xl`}>
                                            {s.val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};