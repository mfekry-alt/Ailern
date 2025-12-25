import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const InstructorCalendarPage = () => {
    const months = useMemo(() => ['October 2025', 'November 2025', 'December 2025', 'January 2026'], []);
    const [monthIndex, setMonthIndex] = useState(0);
    const currentMonth = months[monthIndex] || months[0];

    const monthDate = useMemo(() => new Date(`${currentMonth} 1`), [currentMonth]);
    const monthNumber = monthDate.getMonth();
    const yearNumber = monthDate.getFullYear();
    const daysInMonth = new Date(yearNumber, monthNumber + 1, 0).getDate();
    const startDayOfWeek = new Date(yearNumber, monthNumber, 1).getDay();

    const [events, setEvents] = useState([
        {
            id: 1,
            title: 'CS101 - Midterm Exam',
            course: 'CS101',
            date: 'Oct 25, 2025',
            time: '10:00 AM',
            type: 'exam' as const,
        },
        {
            id: 2,
            title: 'CS202 - Assignment Due',
            course: 'CS202',
            date: 'Oct 22, 2025',
            time: '11:59 PM',
            type: 'assignment' as const,
        },
        {
            id: 3,
            title: 'MA203 - Lecture',
            course: 'MA203',
            date: 'Oct 20, 2025',
            time: '2:00 PM',
            type: 'lecture' as const,
        },
    ]);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventForm, setEventForm] = useState({
        title: '',
        course: 'CS101',
        date: 'Oct 26, 2025',
        time: '10:00 AM',
        type: 'lecture' as 'exam' | 'assignment' | 'lecture',
    });

    const openCreateEvent = (date?: string) => {
        setEditingEventId(null);
        setEventForm({
            title: '',
            course: 'CS101',
            date:
                date ||
                new Date(yearNumber, monthNumber, 1).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            time: '10:00 AM',
            type: 'lecture',
        });
        setIsEventModalOpen(true);
    };

    const openEditEvent = (eventId: number) => {
        const existing = events.find((e) => e.id === eventId);
        if (!existing) return;
        setEditingEventId(eventId);
        setEventForm({
            title: existing.title,
            course: existing.course,
            date: existing.date,
            time: existing.time,
            type: existing.type,
        });
        setIsEventModalOpen(true);
    };

    const saveEvent = () => {
        if (!eventForm.title.trim()) return;

        if (editingEventId) {
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === editingEventId
                        ? {
                            ...e,
                            title: eventForm.title.trim(),
                            course: eventForm.course,
                            date: eventForm.date,
                            time: eventForm.time,
                            type: eventForm.type,
                        }
                        : e
                )
            );
        } else {
            const nextId = Math.max(0, ...events.map((e) => e.id)) + 1;
            setEvents((prev) => [
                {
                    id: nextId,
                    title: eventForm.title.trim(),
                    course: eventForm.course,
                    date: eventForm.date,
                    time: eventForm.time,
                    type: eventForm.type,
                },
                ...prev,
            ]);
        }

        setIsEventModalOpen(false);
        setEditingEventId(null);
    };

    const goPrevMonth = () => {
        setMonthIndex((i) => (i - 1 + months.length) % months.length);
    };

    const goNextMonth = () => {
        setMonthIndex((i) => (i + 1) % months.length);
    };

    const monthEvents = useMemo(() => {
        return events
            .filter((e) => {
                const d = new Date(e.date);
                return d.getFullYear() === yearNumber && d.getMonth() === monthNumber;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events, monthNumber, yearNumber]);

    const eventsByDay = useMemo(() => {
        const map = new Map<number, typeof events>();
        monthEvents.forEach((e) => {
            const day = new Date(e.date).getDate();
            const existing = map.get(day) || [];
            map.set(day, [...existing, e]);
        });
        return map;
    }, [monthEvents]);

    const monthCells = useMemo(() => {
        const cells: Array<number | null> = [];
        for (let i = 0; i < startDayOfWeek; i += 1) cells.push(null);
        for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [daysInMonth, startDayOfWeek]);

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
                            <button onClick={goPrevMonth} className="p-2 hover:bg-gray-100 rounded-md">
                                <ChevronLeft className="w-5 h-5 text-azure-46" />
                            </button>
                            <button onClick={goNextMonth} className="p-2 hover:bg-gray-100 rounded-md">
                                <ChevronRight className="w-5 h-5 text-azure-46" />
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-7 gap-2 text-[12px] font-medium text-azure-46 mb-3">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} className="text-center">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {monthCells.map((day, idx) => {
                                const dayEvents = day ? eventsByDay.get(day) || [] : [];
                                const isClickable = day != null;
                                return (
                                    <button
                                        key={`${idx}-${day ?? 'x'}`}
                                        disabled={!isClickable}
                                        onClick={() => {
                                            if (!day) return;
                                            const dateStr = new Date(yearNumber, monthNumber, day).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            });
                                            openCreateEvent(dateStr);
                                        }}
                                        className={`h-20 rounded-md border text-left p-2 transition-colors ${isClickable
                                            ? 'bg-white border-gray-200 hover:bg-blue-50'
                                            : 'bg-transparent border-transparent'
                                            }`}
                                    >
                                        {day != null && (
                                            <div className="h-full flex flex-col">
                                                <div className="text-[12px] font-semibold text-azure-8">{day}</div>
                                                <div className="mt-1 space-y-1 overflow-hidden">
                                                    {dayEvents.slice(0, 2).map((e) => (
                                                        <div key={e.id} className="text-[10px] text-azure-46 truncate">
                                                            {e.course} • {e.type}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <div className="text-[10px] text-azure-46">+{dayEvents.length - 2} more</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 text-[12px] text-azure-46 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Click a date to add an event.
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-lg p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
                    <h3 className="font-bold text-[20px] text-azure-8 mb-4">Upcoming Events</h3>
                    <div className="space-y-4">
                        {monthEvents.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => openEditEvent(event.id)}
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

                    <button
                        onClick={() => openCreateEvent()}
                        className="w-full mt-4 px-4 py-2 bg-azure-50 text-white rounded-md text-[14px] font-medium hover:bg-azure-53 transition-colors"
                    >
                        Add Event
                    </button>
                </div>
            </div>

            {isEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-[18px] text-azure-8">
                                    {editingEventId ? 'Edit Event' : 'Add Event'}
                                </h2>
                                <p className="text-[14px] text-azure-46">Create an event for your course schedule.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsEventModalOpen(false);
                                    setEditingEventId(null);
                                }}
                                className="text-azure-46 hover:text-azure-8"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[14px] font-medium text-azure-8 mb-2">Title</label>
                                <input
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Course</label>
                                    <select
                                        value={eventForm.course}
                                        onChange={(e) => setEventForm((p) => ({ ...p, course: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                    >
                                        <option value="CS101">CS101</option>
                                        <option value="CS202">CS202</option>
                                        <option value="MA203">MA203</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Type</label>
                                    <select
                                        value={eventForm.type}
                                        onChange={(e) => setEventForm((p) => ({ ...p, type: e.target.value as any }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                    >
                                        <option value="lecture">Lecture</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="exam">Exam</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Date</label>
                                    <input
                                        value={eventForm.date}
                                        onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-azure-8 mb-2">Time</label>
                                    <input
                                        value={eventForm.time}
                                        onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsEventModalOpen(false);
                                        setEditingEventId(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-azure-8 rounded-md text-[14px] font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEvent}
                                    disabled={!eventForm.title.trim()}
                                    className="flex-1 px-4 py-2 bg-azure-50 text-white rounded-md text-[14px] font-medium hover:bg-azure-53 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

