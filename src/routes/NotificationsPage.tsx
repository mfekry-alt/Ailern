import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui';
import { Bell, BookOpen, MessageSquare, Award, UserCheck, XCircle } from 'lucide-react';

type NotificationType = 'all' | 'enrollment' | 'announcement' | 'assignment_grade' | 'quiz_grade' | 'course_update';

interface Notification {
    id: number;
    title: string;
    time: string;
    isRead: boolean;
    icon: any;
    iconBg: string;
    iconColor: string;
    type: NotificationType;
}

export const NotificationsPage = () => {
    const [selectedType, setSelectedType] = useState<NotificationType>('all');

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    const filteredNotifications = useMemo(() => {
        if (selectedType === 'all') return notifications;
        return notifications.filter(n => n.type === selectedType);
    }, [notifications, selectedType]);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const enrollmentCount = notifications.filter(n => n.type === 'enrollment').length;
    const announcementCount = notifications.filter(n => n.type === 'announcement').length;
    const assignmentGradeCount = notifications.filter(n => n.type === 'assignment_grade').length;
    const quizGradeCount = notifications.filter(n => n.type === 'quiz_grade').length;
    const courseUpdateCount = notifications.filter(n => n.type === 'course_update').length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                        Notifications
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400">
                        Stay updated with your course activities.
                    </p>
                </div>

                {/* Filter Tabs */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all' as NotificationType, label: 'All', count: notifications.length },
                                { id: 'enrollment' as NotificationType, label: 'Enrollment', count: enrollmentCount },
                                { id: 'announcement' as NotificationType, label: 'Announcements', count: announcementCount },
                                { id: 'assignment_grade' as NotificationType, label: 'Assignment Grades', count: assignmentGradeCount },
                                { id: 'quiz_grade' as NotificationType, label: 'Quiz Grades', count: quizGradeCount },
                                { id: 'course_update' as NotificationType, label: 'Course Updates', count: courseUpdateCount },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedType(filter.id)}
                                    className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${selectedType === filter.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {filter.label}
                                    {filter.count > 0 && (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[12px] ${selectedType === filter.id
                                            ? 'bg-blue-700 text-white'
                                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                                            }`}>
                                            {filter.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card variant="elevated" className="overflow-hidden">
                    <CardContent className="p-0">
                        {/* Header */}
                        <div className="border-b border-gray-200 dark:border-zinc-700 h-[57px] flex items-center justify-between px-4">
                            <h3 className="text-[18px] font-medium text-gray-900 dark:text-zinc-100">
                                {selectedType === 'all' ? 'All Notifications' : selectedType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <button
                                onClick={markAllAsRead}
                                className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Mark all as read
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[384px] overflow-auto">
                            {filteredNotifications.map((notification) => {
                                const IconComponent = notification.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`border-b border-gray-200 dark:border-zinc-700 last:border-b-0 ${notification.isRead ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-blue-50 dark:bg-zinc-800'
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
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 h-[45px] flex items-center justify-center">
                            <button className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                See All Notifications
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                                <Bell className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{unreadCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Unread</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{enrollmentCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Enrollment</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                                <MessageSquare className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{announcementCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Announcements</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                                <Award className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{assignmentGradeCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Assignment Grades</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                                <Award className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{quizGradeCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Quiz Grades</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-2">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100">{courseUpdateCount}</h3>
                            <p className="text-[14px] text-gray-600 dark:text-zinc-400">Course Updates</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Empty State */}
                {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[18px] font-medium text-gray-900 dark:text-zinc-100 mb-2">No notifications</h3>
                        <p className="text-gray-600 dark:text-zinc-400">
                            You're all caught up! Check back later for new updates.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
