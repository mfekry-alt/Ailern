import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import { Bell, BookOpen, Users, AlertTriangle, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export const NotificationsPage = () => {
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

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                        Notifications
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600">
                        Stay updated with your course activities.
                    </p>
                </div>

                {/* Notifications Card */}
                <Card variant="elevated" className="overflow-hidden">
                    <CardContent className="p-0">
                        {/* Header */}
                        <div className="border-b border-gray-200 h-[57px] flex items-center justify-between px-4">
                            <h3 className="text-[18px] font-medium text-gray-900">
                                Notifications
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
                            {notifications.map((notification) => {
                                const IconComponent = notification.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`border-b border-gray-200 last:border-b-0 ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                                            }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex gap-4 items-start">
                                                {/* Icon */}
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${notification.iconBg} flex-shrink-0`}>
                                                    <IconComponent className={`w-6 h-6 ${notification.iconColor}`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-medium text-gray-900 leading-[20px] mb-1">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[14px] text-gray-600 leading-[20px]">
                                                        {notification.time}
                                                    </p>
                                                </div>

                                                {/* Unread Indicator */}
                                                {!notification.isRead && (
                                                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 h-[45px] flex items-center justify-center">
                            <button className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                See All Notifications
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                                <Bell className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900">{unreadCount}</h3>
                            <p className="text-[14px] text-gray-600">Unread</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                                <BookOpen className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900">{notifications.filter(n => n.title.includes('assignment')).length}</h3>
                            <p className="text-[14px] text-gray-600">Assignments</p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900">{notifications.filter(n => n.title.includes('deadline')).length}</h3>
                            <p className="text-[14px] text-gray-600">Deadlines</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Empty State */}
                {notifications.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[18px] font-medium text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-600">
                            You're all caught up! Check back later for new updates.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
