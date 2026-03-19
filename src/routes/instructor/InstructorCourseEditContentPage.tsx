import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Video, FileText, Plus, Trash2,
    Clock, 
    ArrowLeft, Save,
    GripVertical} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

// ─── Constants & Types ──────────────────────────────────────────────────

type TabType = 'Overview' | 'Curriculum' | 'Students' | 'Announcements';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'quiz' | 'document';
    duration?: string;
    isCompleted?: boolean;
}

interface Section {
    id: string;
    title: string;
    lessons: Lesson[];
}

const INITIAL_SECTIONS: Section[] = [
    {
        id: 'sec-1',
        title: 'Introduction to Web Development',
        lessons: [
            { id: 'les-1', title: 'Course Overview', type: 'video', duration: '5:00' },
            { id: 'les-2', title: 'Setting up your Environment', type: 'video', duration: '12:00' },
        ]
    },
    {
        id: 'sec-2',
        title: 'HTML Basics',
        lessons: [
            { id: 'les-3', title: 'HTML Document Structure', type: 'video', duration: '15:00' },
            { id: 'les-4', title: 'Common HTML Tags', type: 'video', duration: '20:00' },
            { id: 'les-5', title: 'HTML Forms', type: 'video', duration: '18:00' },
        ]
    }
];

// ─── State Reducer Helpers (Extracted to Fix S2004) ──────────────────────

const mutateUpdateSection = (sections: Section[], sectionId: string, title: string) =>
    sections.map(s => (s.id === sectionId ? { ...s, title } : s));

const mutateUpdateLesson = (sections: Section[], sectionId: string, lessonId: string, title: string) =>
    sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, title } : l))
        };
    });

const mutateRemoveLesson = (sections: Section[], sectionId: string, lessonId: string) =>
    sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
            ...s,
            lessons: s.lessons.filter(l => l.id !== lessonId)
        };
    });

// ─── UI Styling Helpers (Extracted to Fix S3358) ─────────────────────────

const getTabButtonClasses = (activeTab: TabType, currentTab: TabType) => {
    const base = "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors";
    const active = "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20";
    const inactive = "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800";
    return `${base} ${activeTab === currentTab ? active : inactive}`;
};

const getStatusBadgeClasses = (status: string) => {
    if (status === 'Approved') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
};

// ─── Main Component ─────────────────────────────────────────────────────

export const InstructorCourseEditContentPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
    const [courseTitle, setCourseTitle] = useState('Introduction to Modern Web Development');

    // ── Handlers ──
    const updateSectionTitle = (sid: string, val: string) => setSections(prev => mutateUpdateSection(prev, sid, val));
    const updateLessonTitle = (sid: string, lid: string, val: string) => setSections(prev => mutateUpdateLesson(prev, sid, lid, val));
    const removeLesson = (sid: string, lid: string) => setSections(prev => mutateRemoveLesson(prev, sid, lid));

    const addSection = () => {
        const newSec: Section = { id: `sec-${Date.now()}`, title: 'New Section', lessons: [] };
        setSections([...sections, newSec]);
    };

    const addLesson = (sectionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            const newLesson: Lesson = { id: `les-${Date.now()}`, title: 'New Lesson', type: 'video', duration: '0:00' };
            return { ...s, lessons: [...s.lessons, newLesson] };
        }));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-zinc-100">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-[24px] font-bold">Edit Course Content</h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">ID: {id}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button type="button" className="flex-1 md:flex-none px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            Preview
                        </button>
                        <button type="button" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
                    {(['Overview', 'Curriculum', 'Students', 'Announcements'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={getTabButtonClasses(activeTab, tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content: Curriculum */}
                {activeTab === 'Curriculum' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[20px] font-bold">Course Curriculum</h2>
                            <button
                                type="button"
                                onClick={addSection}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Add Section
                            </button>
                        </div>

                        <div className="space-y-4">
                            {sections.map((section, sIdx) => (
                                <Card key={section.id} variant="elevated" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-400">Section {sIdx + 1}</span>
                                            <input
                                                id={`section-input-${section.id}`}
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                                className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-lg p-0"
                                            />
                                            <button type="button" className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group">
                                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 cursor-grab" />
                                                <span className="text-xs font-medium text-gray-400 w-6">{lIdx + 1}</span>
                                                <div className="p-2 bg-white dark:bg-zinc-700 rounded-md shadow-sm">
                                                    {lesson.type === 'video' ? <Video className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
                                                </div>
                                                <input
                                                    id={`lesson-input-${lesson.id}`}
                                                    type="text"
                                                    value={lesson.title}
                                                    onChange={(e) => updateLessonTitle(section.id, lesson.id, e.target.value)}
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeLesson(section.id, lesson.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addLesson(section.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" /> Add Lesson
                                        </button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Content: Overview (Fixing S6853) */}
                {activeTab === 'Overview' && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">General Information</h3>
                                    <div>
                                        <label htmlFor="course-title-main" className={labelCls}>Course Title</label>
                                        <input
                                            id="course-title-main"
                                            type="text"
                                            value={courseTitle}
                                            onChange={(e) => setCourseTitle(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="course-desc-main" className={labelCls}>Description</label>
                                        <textarea
                                            id="course-desc-main"
                                            rows={4}
                                            className={inputCls}
                                            defaultValue="Enter course description here..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">Course Status</h3>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 ${getStatusBadgeClasses('Pending')}`}>
                                        <Clock className="w-5 h-5" />
                                        <span className="font-medium text-sm">Pending Review</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Your course is currently being reviewed by administrators.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const labelCls = "block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2";
const inputCls = "w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100";