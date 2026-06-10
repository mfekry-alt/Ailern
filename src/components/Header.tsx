import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Bell, Search, BookOpen, Users, AlertTriangle, MessageSquare, Clock, CheckCircle, Menu, X, Sun, Moon, Camera, Image as ImageIcon, Trash2, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { api } from '@/api/client';
import { useTheme } from '@/hooks/useTheme';

interface NavLink {
    label: string;
    path: string;
}

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const isGuest = !user;
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; code: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'New assignment posted in Introduction to Psychology',
            time: '10:30 AM',
            isRead: false,
            icon: BookOpen,
            iconBg: 'bg-[#21A9FF]/10',
            iconColor: 'text-[#21A9FF]'
        },
        {
            id: 2,
            title: 'Student submitted assignment for History 101',
            time: 'Yesterday',
            isRead: true,
            icon: Users,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            id: 3,
            title: 'Grading deadline approaching for Calculus 202',
            time: '2 days ago',
            isRead: true,
            icon: AlertTriangle,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
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

    // 🌟 التعديل الأساسي هنا لحل مشكلة البحث و الـ 403
    const searchCourses = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        setIsSearching(true);
        setShowSearchResults(true);
        try {
            // استخدام الرابط الخاص بالطالب بناءً على ה JSON الخاص بك
            const res = await api.get('/Users/students/courses', {
                params: { search: query.trim() }
            });

            // قراءة الـ Items من الـ Response
            let coursesData: any[] = [];
            if (res.data?.data?.items && Array.isArray(res.data.data.items)) {
                coursesData = res.data.data.items;
            } else if (res.data?.items && Array.isArray(res.data.items)) {
                coursesData = res.data.items;
            } else if (Array.isArray(res.data?.data)) {
                coursesData = res.data.data;
            } else if (Array.isArray(res.data)) {
                coursesData = res.data;
            }

            // فلترة إضافية للبيانات في الـ Frontend للتأكد أن البحث يعمل حتى لو الـ API أرجع كل الكورسات
            const lowerQuery = query.toLowerCase();
            const filteredCourses = coursesData.filter(c =>
                (c.name || '').toLowerCase().includes(lowerQuery) ||
                (c.code || '').toLowerCase().includes(lowerQuery)
            );

            setSearchResults(
                filteredCourses.slice(0, 8).map((c: any) => ({
                    id: c.id,
                    name: c.name || c.title || c.courseName || 'Untitled Course',
                    code: c.code || c.courseCode || '',
                }))
            );
        } catch (error) {
            console.error("Search failed:", error);
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
        setIsProfileOpen(!isProfileOpen);
    };

    const handleFileChange = () => {
        // Removed photo logic
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
                { label: 'Content Reports', path: ROUTES.ADMIN_CONTENT_REPORTS },
                { label: 'Settings', path: ROUTES.ADMIN_SETTINGS },
            ];
        }
        if (user?.roles?.includes('Instructor')) {
            return [
                { label: 'Dashboard', path: ROUTES.INSTRUCTOR },
                { label: 'My Courses', path: ROUTES.INSTRUCTOR_COURSES },
                { label: 'Upcoming Events', path: ROUTES.INSTRUCTOR_UPCOMING_EVENTS },
            ];
        }
        if (user?.roles?.includes('Student')) {
            return [
                { label: 'Dashboard', path: ROUTES.DASHBOARD },
                { label: 'Courses', path: ROUTES.COURSES },
            ];
        }
        return [];
    };

    const navLinks = getNavLinks();

    const renderSearchResultsContent = () => {
        if (isSearching) {
            return <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400 animate-pulse">Searching...</div>;
        }
        if (searchResults.length === 0) {
            return <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">No courses found</div>;
        }
        return (
            <ul className="max-h-[320px] overflow-auto custom-scrollbar p-2">
                {searchResults.map((course) => (
                    <li key={course.id} className="mb-1 last:mb-0">
                        <button
                            type="button"
                            onClick={() => handleSearchResultClick(course.id)}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#21A9FF]/10 dark:hover:bg-slate-800 transition-colors group flex flex-col gap-1"
                        >
                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate group-hover:text-[#21A9FF] dark:group-hover:text-[#21A9FF] transition-colors">
                                {course.name}
                            </span>
                            {course.code && (
                                <span className="text-xs text-gray-500 dark:text-slate-400">{course.code}</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        // 1. ثبتنا ارتفاع الهيدر باستخدام h-[72px] وشلنا الـ py
        <header className="sticky top-0 z-[60] w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 py-9 px-8 h-[72px]">
            {/* 2. خلينا الـ div الداخلي يأخد h-full */}
            <div className="relative flex items-center justify-between w-full h-full max-w-[1920px] mx-auto">

                {/* Logo */}
                <Link
                    to={user ? getDashboardRoute() : ROUTES.HOME}
                    // 3. عطينا الـ Link عرض ثابت عشان يحجز مكان للوجو، وخليناه relative
                    className="relative flex items-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity w-[80px] sm:w-[110px] h-full"
                >
                    <img
                        src="/logo-removebg.png"
                        alt="Ailern"
                        className="left-3 absolute top-1/2 -translate-y-1/2 w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] object-contain drop-shadow-md"
                       
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    {!isGuest &&
                        navLinks.map((link) => {
                            const isActive = (location.pathname === link.path ||
                                (link.path !== getDashboardRoute() && location.pathname.startsWith(link.path))) &&
                                !location.pathname.includes('/profile');

                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${isActive
                                        ? 'bg-[#21A9FF]/10 text-[#21A9FF] shadow-sm'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                </nav>

                {/* Right Side Actions (Search, Notifications, Profile) */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">

                    {isGuest ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to={ROUTES.LOGIN}
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to={`${ROUTES.HOME}#contact`}
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#21A9FF] hover:bg-[#0094F2] hover:shadow-lg hover:shadow-[#21A9FF]/25 transition-all hover:-translate-y-0.5"
                            >
                                Contact Us
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Search */}
                            <div className="relative w-[260px] hidden md:block group" ref={searchRef}>
                                <form onSubmit={handleSearch}>
                                    <div className="flex items-center h-10 px-3 rounded-full relative bg-gray-100/80 dark:bg-slate-800/80 border border-transparent focus-within:border-[#21A9FF]/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-[#21A9FF]/10 transition-all duration-300">
                                        <Search className="absolute left-3 w-4 h-4 text-gray-400 group-focus-within:text-[#21A9FF] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search Courses..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
                                            className="bg-transparent border-none outline-none text-sm w-full pl-7 pr-2 text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                        />
                                    </div>
                                </form>

                                {/* Search Results Dropdown */}
                                {showSearchResults && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-full bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                                        {renderSearchResultsContent()}
                                    </div>
                                )}
                            </div>

                            {/* Theme Toggle Button */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="relative p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] transition-colors"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Notification Bell */}
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="relative p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-[#21A9FF] dark:hover:text-[#21A9FF] transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                                        {/* Header */}
                                        <div className="border-b border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h3>
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-xs font-semibold text-[#21A9FF] dark:text-[#21A9FF] hover:text-[#0094F2] transition-colors"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>

                                        {/* Notifications List */}
                                        <div className="max-h-[360px] overflow-auto custom-scrollbar">
                                            {notifications.map((notification) => {
                                                const IconComponent = notification.icon;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={notification.id}
                                                        onClick={() => markNotificationAsRead(notification.id)}
                                                        className={`w-full text-left border-b border-gray-50 dark:border-slate-800/50 last:border-0 p-4 transition-colors flex items-start gap-4 ${notification.isRead
                                                            ? 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                            : 'bg-blue-50/50 dark:bg-[#21A9FF]/10 hover:bg-blue-50 dark:hover:bg-[#21A9FF]/20'
                                                            }`}
                                                    >
                                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${notification.iconBg}`}>
                                                            <IconComponent className={`w-5 h-5 ${notification.iconColor}`} />
                                                        </div>

                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className={`text-sm leading-snug mb-1 ${notification.isRead ? 'text-gray-700 dark:text-slate-300' : 'text-gray-900 dark:text-white font-medium'}`}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-500">
                                                                {notification.time}
                                                            </p>
                                                        </div>

                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-[#21A9FF] rounded-full shrink-0 mt-2 shadow-sm shadow-[#21A9FF]/50"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t border-gray-100 dark:border-slate-800 p-3 flex items-center justify-center bg-gray-50/80 dark:bg-slate-900/80">
                                            <Link
                                                to={ROUTES.NOTIFICATIONS}
                                                className="text-sm font-semibold text-[#21A9FF] dark:text-[#21A9FF] hover:text-[#0094F2] transition-colors"
                                                onClick={() => setIsNotificationsOpen(false)}
                                            >
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Avatar */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={handleProfileClick}
                                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#21A9FF] to-[#0094F2] flex items-center justify-center text-white font-bold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all ring-2 ring-transparent hover:ring-[#21A9FF]/30 overflow-hidden"
                                >
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                                    )}
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#21A9FF]/10 flex items-center justify-center text-[#21A9FF] overflow-hidden">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => { navigate(ROUTES.PROFILE); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => { navigate(ROUTES.PROFILE); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                Settings
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Menu Button - Moved to end */}
                            {!isGuest && (
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen(prev => !prev)}
                                    className="lg:hidden p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {!isGuest && isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-4">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Menu</p>
                    </div>
                    <div className="flex flex-col py-2">
                        {navLinks.map((link) => {
                            const isActive = (location.pathname === link.path ||
                                (link.path !== getDashboardRoute() && location.pathname.startsWith(link.path))) &&
                                !location.pathname.includes('/profile');
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-6 py-3.5 text-sm font-semibold transition-colors flex items-center gap-3 ${isActive
                                        ? 'text-[#21A9FF] dark:text-[#21A9FF] bg-[#21A9FF]/10'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#21A9FF] dark:bg-[#21A9FF]" />}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
};