import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Bell, Search, BookOpen, Users, AlertTriangle, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/api/client';

interface NavLink {
    label: string;
    path: string;
}

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isGuest = !user;
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; code: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'New assignment posted in Introduction to Psychology',
            time: '10:30 AM',
            isRead: false,
            icon: BookOpen,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            id: 2,
            title: 'Student submitted assignment for History 101',
            time: 'Yesterday',
            isRead: true,
            icon: Users,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            id: 3,
            title: 'Grading deadline approaching for Calculus 202',
            time: '2 days ago',
            isRead: true,
            icon: AlertTriangle,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        {
            id: 4,
            title: 'New discussion post in Literature 303',
            time: '3 days ago',
            isRead: true,
            icon: MessageSquare,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            id: 5,
            title: 'Student requested extension for Physics 404',
            time: '4 days ago',
            isRead: true,
            icon: Clock,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600'
        },
        {
            id: 6,
            title: 'System maintenance scheduled for next week',
            time: '5 days ago',
            isRead: true,
            icon: CheckCircle,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    const markNotificationAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id ? { ...notification, isRead: true } : notification
            )
        );
    };

    const searchCourses = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        setIsSearching(true);
        setShowSearchResults(true);
        try {
            const res = await api.get('/Courses', { params: { search: query.trim() } });
            const courses = res.data?.data || res.data || [];
            setSearchResults(
                courses.slice(0, 8).map((c: any) => ({
                    id: c.id,
                    name: c.name || c.title || 'Untitled',
                    code: c.code || '',
                }))
            );
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => searchCourses(value), 300);
    };

    const handleSearch = (e: React.SyntheticEvent) => {
        e.preventDefault();
        searchCourses(searchQuery);
    };

    const handleSearchResultClick = (courseId: string) => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        navigate(`${ROUTES.COURSES}/${courseId}`);
    };

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutsideSearch = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideSearch);
        return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
    }, []);

    const handleProfileClick = () => {
        navigate(ROUTES.PROFILE);
    };

    const getDashboardRoute = () => {
        if (user?.roles?.includes('Admin')) return ROUTES.ADMIN;
        if (user?.roles?.includes('Instructor')) return ROUTES.INSTRUCTOR;
        return ROUTES.DASHBOARD;
    };

    const getNavLinks = (): NavLink[] => {
        if (user?.roles?.includes('Admin')) {
            return [
                { label: 'Dashboard', path: ROUTES.ADMIN },
                { label: 'Users', path: ROUTES.ADMIN_USERS },
                { label: 'Courses', path: ROUTES.ADMIN_COURSES },
                { label: 'Reports', path: ROUTES.ADMIN_REPORTS },
                { label: 'Settings', path: ROUTES.ADMIN_SETTINGS },
            ];
        }
        if (user?.roles?.includes('Instructor')) {
            return [
                { label: 'Dashboard', path: ROUTES.INSTRUCTOR },
                { label: 'Courses', path: ROUTES.INSTRUCTOR_COURSES },
                { label: 'Assignments', path: ROUTES.INSTRUCTOR_ASSIGNMENTS },
                { label: 'Calender', path: '/instructor/calendar' },
                { label: 'Messages', path: '/instructor/messages' },
            ];
        }
        if (user?.roles?.includes('Student')) {
            return [
                { label: 'Dashboard', path: ROUTES.DASHBOARD },
                { label: 'My Courses', path: ROUTES.MY_COURSES },
                { label: 'Available Courses', path: ROUTES.COURSES },
                { label: 'Assignments', path: ROUTES.ASSIGNMENTS },
                { label: 'Quizzes', path: ROUTES.QUIZZES },
                { label: 'Grades', path: ROUTES.GRADES },
                { label: 'Messages', path: ROUTES.MESSAGES },
            ];
        }
        return [];
    };

    const navLinks = getNavLinks();

    // Helper function to render search results without nested ternary
    const renderSearchResultsContent = () => {
        if (isSearching) {
            return <div className="px-4 py-3 text-center text-[14px] text-gray-500 dark:text-zinc-400">Searching...</div>;
        }
        if (searchResults.length === 0) {
            return <div className="px-4 py-3 text-center text-[14px] text-gray-500 dark:text-zinc-400">No courses found</div>;
        }
        return (
            <ul className="max-h-[280px] overflow-auto">
                {searchResults.map((course) => (
                    <li
                        key={course.id}
                        className="border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
                    >
                        <button
                            type="button"
                            onClick={() => handleSearchResultClick(course.id)}
                            className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                            <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100 truncate">{course.name}</p>
                            {course.code && (
                                <p className="text-[12px] text-gray-500 dark:text-zinc-400">{course.code}</p>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <header
            className="bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50 transition-colors"
            style={{
                paddingTop: '12px',
                paddingBottom: '13px',
                paddingLeft: '24px',
                paddingRight: '24px'
            }}
        >
            <div className="flex items-center justify-between w-full">
                {/* Logo */}
                <Link
                    to={user ? getDashboardRoute() : ROUTES.HOME}
                    className="flex items-center gap-2.5 h-[48px] w-[148px] cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <img src="/logo-removebg.svg" alt="Ailern" className="w-[44px] h-[44px] object-contain" />
                    <div className="font-bold text-[20px] leading-[28px] text-gray-900 dark:text-zinc-100">
                        {APP_NAME}
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-6 flex-1 justify-center">
                    {!isGuest &&
                        navLinks.map((link) => {
                            const isActive = location.pathname === link.path ||
                                (link.path !== getDashboardRoute() && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="relative font-medium text-[14px] leading-[20px] py-1"
                                    style={{
                                        color: isActive ? '#0d7ff2' : '#868e96',
                                        fontWeight: isActive ? 700 : 500,
                                        borderBottom: isActive ? '2px solid #0d7ff2' : 'none',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                </nav>

                {/* Search and User */}
                <div className="flex items-center gap-4">
                    {isGuest ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to={ROUTES.LOGIN}
                                className="px-4 py-2 rounded-lg font-medium text-[14px] text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to={`${ROUTES.HOME}#contact`}
                                className="px-4 py-2 rounded-lg font-medium text-[14px] text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Contact Us
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Search */}
                            <div className="relative w-[256px]" ref={searchRef}>
                                <form onSubmit={handleSearch}>
                                    <div
                                        className="flex items-center h-[40px] px-3 rounded-full relative bg-gray-100 dark:bg-zinc-800"
                                    >
                                        <div className="absolute left-[12px] top-[10px] w-[20px] h-[20px]">
                                            <Search className="w-[20px] h-[20px] text-gray-500 dark:text-zinc-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search Courses..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
                                            className="bg-transparent border-none outline-none text-[16px] w-full pl-[40px] pr-[31px] text-gray-500 dark:text-zinc-400 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                        />
                                    </div>
                                </form>

                                {/* Search Results Dropdown */}
                                {showSearchResults && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50 overflow-hidden">
                                        {renderSearchResultsContent()}
                                    </div>
                                )}
                            </div>

                            {/* Notification Bell */}
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    <Bell className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
                                    {unreadCount > 0 && (
                                        <span
                                            className="absolute top-[4px] right-[4px] w-[10px] h-[10px] rounded-full border-2 border-white"
                                            style={{ backgroundColor: '#ef4444' }}
                                        />
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50">
                                        {/* Header */}
                                        <div className="border-b border-gray-200 dark:border-zinc-700 h-[57px] flex items-center justify-between px-4">
                                            <h3 className="text-[18px] font-medium text-gray-900 dark:text-zinc-100">
                                                Notifications
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>

                                        {/* Notifications List */}
                                        <div className="max-h-[384px] overflow-auto">
                                            {notifications.map((notification) => {
                                                const IconComponent = notification.icon;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={notification.id}
                                                        onClick={() => markNotificationAsRead(notification.id)}
                                                        className={`block w-full text-left border-b border-gray-200 dark:border-zinc-700 last:border-b-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${notification.isRead ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-blue-50 dark:bg-blue-900/20'
                                                            }`}
                                                    >
                                                        <div className="p-4">
                                                            <div className="flex gap-4 items-start">
                                                                {/* Icon */}
                                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${notification.iconBg} shrink-0`}>
                                                                    <IconComponent className={`w-6 h-6 ${notification.iconColor}`} />
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100 leading-[20px] mb-1">
                                                                        {notification.title}
                                                                    </p>
                                                                    <p className="text-[14px] text-gray-600 dark:text-zinc-400 leading-[20px]">
                                                                        {notification.time}
                                                                    </p>
                                                                </div>

                                                                {/* Unread Indicator */}
                                                                {!notification.isRead && (
                                                                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-2"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 h-[45px] flex items-center justify-center">
                                            <Link
                                                to={ROUTES.NOTIFICATIONS}
                                                className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                onClick={() => setIsNotificationsOpen(false)}
                                            >
                                                See All Notifications
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Avatar */}
                            <button
                                type="button"
                                onClick={handleProfileClick}
                                className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors cursor-pointer"
                            >
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};