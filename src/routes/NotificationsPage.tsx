import { useState, useMemo } from 'react';
import {
    Bell, BookOpen, Award, UserCheck,
    X, CheckCircle2, Megaphone, Clock, Search, SearchX,
    Activity, Info, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';

type NotificationType = 'all' | 'enrollment' | 'announcement' | 'assignment_grade' | 'quiz_grade' | 'course_update';

interface Notification {
    id: number;
    title: string;
    description: string;
    time: string;
    isRead: boolean;
    type: NotificationType;
    role: 'instructor' | 'student' | 'all';
}

const initialNotifications: Notification[] = [
    { id: 1, title: 'New Student Enrolled', description: 'Sami Ahmad has enrolled in "Advanced React Mastery".', time: '2 mins ago', isRead: false, type: 'enrollment', role: 'instructor' },
    { id: 2, title: 'New Course Announcement', description: 'The final project requirements have been updated for all students.', time: '1 hour ago', isRead: false, type: 'announcement', role: 'all' },
    { id: 3, title: 'Assignment Graded', description: 'Your "Database Design" assignment has been reviewed by the instructor.', time: '3 hours ago', isRead: true, type: 'assignment_grade', role: 'student' },
    { id: 4, title: 'Quiz Score Available', description: 'You scored 95% in the "Logic Gates" quiz. Great job!', time: 'Yesterday', isRead: true, type: 'quiz_grade', role: 'student' },
    { id: 5, title: 'Course Content Updated', description: '3 new lectures added to "Machine Learning 101" module.', time: '2 days ago', isRead: true, type: 'course_update', role: 'all' },
    { id: 6, title: 'Enrollment Request', description: 'Sara Ali is requesting to join your private session.', time: '3 days ago', isRead: true, type: 'enrollment', role: 'instructor' },
];

export const NotificationsPage = () => {
    const user = useAuthStore((state) => state.user);
    const userRole = user?.roles?.[0]?.toLowerCase() || 'instructor';

    const [selectedType, setSelectedType] = useState<NotificationType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const finalFilteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const roleMatch = n.role === 'all' || n.role === userRole;
            const typeMatch = selectedType === 'all' || n.type === selectedType;
            const searchMatch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.description.toLowerCase().includes(searchQuery.toLowerCase());
            return roleMatch && typeMatch && searchMatch;
        });
    }, [notifications, selectedType, searchQuery, userRole]);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'enrollment': return { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
            case 'announcement': return { icon: Megaphone, color: 'text-amber-500', bg: 'bg-amber-500/10' };
            case 'assignment_grade': case 'quiz_grade': return { icon: Award, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
            case 'course_update': return { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            default: return { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-500/10' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-8 lg:p-12 transition-colors duration-300 font-sans relative overflow-hidden">

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                            <Bell className="w-10 h-10 text-blue-600" /> Notifications
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 font-semibold text-lg mt-1">
                            Stay updated with your latest course activities.
                        </p>
                    </div>
                    <button
                        onClick={markAllAsRead}
                        className="w-full md:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                    >
                        <CheckCircle2 className="w-5 h-5" /> Mark all as read
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10 items-start">

                    {/* LEFT COLUMN: Large Notifications List */}
                    <div className="space-y-8">
                        {/* Filter Pills - Larger */}
                        <div className="flex overflow-x-auto custom-scrollbar gap-3 p-2 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-inner">
                            {['all', 'enrollment', 'announcement', 'assignment_grade', 'course_update'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setSelectedType(f as any)}
                                    className={`px-6 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${selectedType === f
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 animate-in fade-in slide-in-from-left-6 duration-700">
                            {finalFilteredNotifications.length > 0 ? (
                                finalFilteredNotifications.map((notif) => {
                                    const config = getIcon(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`group relative bg-white dark:bg-slate-800/40 backdrop-blur-md border rounded-[2rem] p-6 sm:p-8 transition-all hover:shadow-xl hover:border-blue-400/50 dark:hover:border-slate-500 flex items-start gap-6 overflow-hidden ${!notif.isRead ? 'border-blue-200 dark:border-blue-900/40 ring-1 ring-blue-500/10' : 'border-gray-200 dark:border-slate-700/50 opacity-90'
                                                }`}
                                        >
                                            {/* الخط الأزرق الداخلي */}
                                            {!notif.isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-blue-600 shadow-[4px_0_15px_rgba(37,99,235,0.4)] z-20"></div>
                                            )}

                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${config.bg} ${config.color}`}>
                                                <config.icon className="w-8 h-8" />
                                            </div>

                                            <div className="flex-1 min-w-0 py-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className={`text-lg sm:text-xl font-extrabold truncate ${notif.isRead ? 'text-gray-700 dark:text-slate-200' : 'text-gray-900 dark:text-white'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-1 shrink-0 bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded-md">{notif.time}</span>
                                                </div>
                                                <p className="text-base sm:text-lg text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                                    {notif.description}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => deleteNotification(notif.id)}
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
                                    <p className="text-gray-500 text-lg mt-2">No notifications found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Search + Vertical Stats) */}
                    <aside className="space-y-8 lg:sticky lg:top-12 animate-in fade-in slide-in-from-right-6 duration-700">

                        {/* Enlarged Search Box */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block ml-1">Search activity</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Summary Stats (Vertical & Large) */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
                                <Activity className="w-4 h-4 text-blue-500" /> Dashboard Summary
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Unread Tasks', val: notifications.filter(n => !n.isRead).length, color: 'blue' },
                                    { label: 'Enrollments', val: notifications.filter(n => n.type === 'enrollment').length, color: 'emerald' },
                                    { label: 'News Alerts', val: notifications.filter(n => n.type === 'announcement').length, color: 'amber' },
                                    { label: 'Grade Updates', val: notifications.filter(n => n.type.includes('grade')).length, color: 'indigo' },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/30 group hover:border-blue-400 transition-colors">
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