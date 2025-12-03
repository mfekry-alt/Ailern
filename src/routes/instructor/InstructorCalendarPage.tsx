import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const InstructorCalendarPage = () => {
    const [currentMonth] = useState('October 2025');

    const events = [
        {
            id: 1,
            title: 'CS101 - Midterm Exam',
            course: 'CS101',
            date: 'Oct 25, 2025',
            time: '10:00 AM',
            type: 'exam',
        },
        {
            id: 2,
            title: 'CS202 - Assignment Due',
            course: 'CS202',
            date: 'Oct 22, 2025',
            time: '11:59 PM',
            type: 'assignment',
        },
        {
            id: 3,
            title: 'MA203 - Lecture',
            course: 'MA203',
            date: 'Oct 20, 2025',
            time: '2:00 PM',
            type: 'lecture',
        },
    ];

    return (
        <div className="px-48 py-8 max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-[30px] leading-[36px] text-azure-8 mb-2">Calendar</h1>
                <p className="text-[16px] text-azure-46">Manage your schedule and upcoming events</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="col-span-2 bg-white rounded-lg p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-[20px] text-azure-8">{currentMonth}</h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-md">
                                <ChevronLeft className="w-5 h-5 text-azure-46" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-md">
                                <ChevronRight className="w-5 h-5 text-azure-46" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid Placeholder */}
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Calendar view will be implemented here</p>
                            <p className="text-sm text-gray-400 mt-2">Full calendar integration coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-lg p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
                    <h3 className="font-bold text-[20px] text-azure-8 mb-4">Upcoming Events</h3>
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="p-4 rounded-lg border border-gray-200 hover:border-azure-50 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                        style={{
                                            backgroundColor:
                                                event.type === 'exam'
                                                    ? '#ef4444'
                                                    : event.type === 'assignment'
                                                        ? '#f59e0b'
                                                        : '#0d7ff2',
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-[14px] font-medium text-azure-8 mb-1">{event.title}</p>
                                        <p className="text-[12px] text-azure-46">{event.course}</p>
                                        <p className="text-[12px] text-azure-46 mt-1">
                                            {event.date} • {event.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-azure-50 text-white rounded-md text-[14px] font-medium hover:bg-azure-53 transition-colors">
                        Add Event
                    </button>
                </div>
            </div>
        </div>
    );
};

