import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Trash2,
    Clock, 
    ArrowLeft, Save, GripVertical
} from 'lucide-react';

// ─── Interfaces ─────────────────────────────────────────────────────────

type TabType = 'Overview' | 'Curriculum' | 'Students' | 'Announcements';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'quiz' | 'document';
    duration?: string;
}

interface Section {
    id: string;
    title: string;
    lessons: Lesson[];
}

// ─── State Reducer Helpers (Extracted to solve S2004) ────────────────────

const mutateUpdateSection = (sections: Section[], sid: string, title: string) =>
    sections.map(s => (s.id === sid ? { ...s, title } : s));

const mutateUpdateLesson = (sections: Section[], sid: string, lid: string, title: string) =>
    sections.map(s => {
        if (s.id !== sid) return s;
        return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lid ? { ...l, title } : l))
        };
    });

const mutateRemoveLesson = (sections: Section[], sid: string, lid: string) =>
    sections.map(s => {
        if (s.id !== sid) return s;
        return { ...s, lessons: s.lessons.filter(l => l.id !== lid) };
    });

// ─── UI Styling Helpers (Extracted to solve S3358) ───────────────────────

const getTabClasses = (active: boolean) => {
    const base = "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer";
    const activeStyle = "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20";
    const inactiveStyle = "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800";
    return `${base} ${active ? activeStyle : inactiveStyle}`;
};

const getStatusStyle = (status: string) => {
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30';
    if (status === 'Approved') return 'bg-green-100 text-green-700 dark:bg-green-900/30';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
};

// ─── Main Component ─────────────────────────────────────────────────────

export const InstructorCourseEditContentPage = () => {
    const navigate = useNavigate();
    useParams<{ id: string; }>();
    const [activeTab, setActiveTab] = useState<TabType>('Curriculum');
    const [courseTitle, setCourseTitle] = useState('Introduction to Modern Web Development');

    const [sections, setSections] = useState<Section[]>([
        {
            id: 'sec-1',
            title: 'Introduction to Web Development',
            lessons: [
                { id: 'les-1', title: 'Course Overview', type: 'video', duration: '5:00' },
                { id: 'les-2', title: 'Environment Setup', type: 'video', duration: '12:00' },
            ]
        }
    ]);

    // Handlers using mutation helpers
    const handleUpdateSection = (sid: string, val: string) => setSections(prev => mutateUpdateSection(prev, sid, val));
    const handleUpdateLesson = (sid: string, lid: string, val: string) => setSections(prev => mutateUpdateLesson(prev, sid, lid, val));
    const handleRemoveLesson = (sid: string, lid: string) => setSections(prev => mutateRemoveLesson(prev, sid, lid));

    const addSection = () => {
        setSections([...sections, { id: `sec-${Date.now()}`, title: 'New Section', lessons: [] }]);
    };

    const addLesson = (sid: string) => {
        setSections(prev => prev.map(s => s.id === sid ? {
            ...s,
            lessons: [...s.lessons, { id: `les-${Date.now()}`, title: 'New Lesson', type: 'video' }]
        } : s));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Edit Course Content</h1>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold cursor-pointer">
                            <Save className="w-4 h-4 inline mr-2" /> Save
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <nav className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
                    {(['Overview', 'Curriculum', 'Students', 'Announcements'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            className={getTabClasses(activeTab === tab)}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                {activeTab === 'Curriculum' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Curriculum</h2>
                            <button type="button" onClick={addSection} className="text-blue-600 font-medium cursor-pointer">+ Add Section</button>
                        </div>

                        <div className="space-y-4">
                            {sections.map((section, sIdx) => (
                                <Card key={section.id} variant="elevated">
                                    <div className="p-4 border-b bg-gray-50/50 dark:bg-zinc-800/30 flex items-center gap-4">
                                        <label htmlFor={`sec-input-${section.id}`} className="text-sm font-bold text-gray-400 shrink-0">Section {sIdx + 1}</label>
                                        <input
                                            id={`sec-input-${section.id}`}
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-lg"
                                        />
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group">
                                                <GripVertical className="w-4 h-4 text-gray-300" />
                                                <label htmlFor={`les-input-${lesson.id}`} className="text-xs font-medium text-gray-400 w-6">{lIdx + 1}</label>
                                                <input
                                                    id={`les-input-${lesson.id}`}
                                                    type="text"
                                                    value={lesson.title}
                                                    onChange={(e) => handleUpdateLesson(section.id, lesson.id, e.target.value)}
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                                                />
                                                <button type="button" onClick={() => handleRemoveLesson(section.id, lesson.id)} className="text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addLesson(section.id)} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-blue-500 cursor-pointer">+ Add Lesson</button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Overview' && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">General Info</h3>
                                    <div>
                                        <label htmlFor="course-title-main" className="block text-sm font-medium mb-2">Course Title</label>
                                        <input
                                            id="course-title-main"
                                            type="text"
                                            value={courseTitle}
                                            onChange={(e) => setCourseTitle(e.target.value)}
                                            className="w-full p-2 border rounded-lg dark:bg-zinc-900"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">Status</h3>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 ${getStatusStyle('Pending')}`}>
                                        <Clock className="w-5 h-5" />
                                        <span className="font-medium text-sm">Pending Review</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};