import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import {
    FileText, Play, HelpCircle, Download, BookOpen,
    FileVideo, Presentation, MessageSquare, BarChart3,
    CheckCircle2, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '@/api/client';

type TabType = 'lectures' | 'materials' | 'assignments' | 'quizzes' | 'announcements' | 'grades';

export const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State for Data and UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<TabType>('lectures');
    const [expandedLectures, setExpandedLectures] = useState<Set<number>>(new Set());
    const [preview, setPreview] = useState<{
        title: string;
        url: string;
        downloadUrl: string;
        kind: 'video' | 'material';
        format?: string;
        type?: string;
    } | null>(null);

    // --- API Integration ---
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch Basic Course Info
                const courseRes = await api.get(`/Courses/${id}`);
                const courseData = courseRes.data.data; // Unwrap API response

                // 2. Fetch Assignments (Student View)
                // We wrap this in a try/catch specifically because if the user 
                // isn't enrolled, this endpoint might return 403 Forbidden.
                let assignmentsData = [];
                let isEnrolled = false;
                try {
                    const assignRes = await api.get(`/Courses/${id}/students/Assignments`);
                    assignmentsData = assignRes.data.data || [];
                    isEnrolled = true; // If we can fetch assignments, we are likely enrolled
                } catch (err) {
                    console.warn("Could not fetch assignments, likely not enrolled.");
                    isEnrolled = false;
                }

                // 3. Construct the Course Object
                // Note: The API currently lacks endpoints for Lectures, Materials, and Quizzes.
                // We initialize them as empty arrays [] for now.
                setCourse({
                    id: courseData.id,
                    title: courseData.name || 'Untitled Course',
                    code: courseData.code,
                    instructor: 'Instructor', // Backend needs to provide this field
                    description: courseData.description,
                    isEnrolled: isEnrolled,
                    progress: 0, // Backend needs to provide progress

                    // Arrays populated from API
                    assignments: assignmentsData,

                    // Placeholders until Backend adds these endpoints:
                    lectures: [],
                    materials: [],
                    quizzes: [],
                    announcements: [],
                    learningObjectives: [], // Backend needs to provide this
                    prerequisites: [],      // Backend needs to provide this

                    // Calculated counts
                    lectureCount: 0,
                    assignmentCount: assignmentsData.length,
                    quizCount: 0,

                    grades: { assignments: 0, quizzes: 0, participation: 0, overall: 0 }
                });

            } catch (err: any) {
                console.error("Failed to fetch course:", err);
                setError(err.response?.data?.message || 'Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [id]);

    // --- Helper Functions (Cleaned of Google Drive Logic) ---

    const toPreviewUrl = (rawUrl?: string) => {
        if (!rawUrl) return '';
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;

        // Handle local/relative paths
        const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        const fullUrl = `${window.location.origin}${path}`;
        return fullUrl;
    };

    const openVideo = (url?: string, title?: string, format?: string) => {
        const previewUrl = toPreviewUrl(url);
        if (!previewUrl) return;
        setPreview({ title: title || 'Video', url: previewUrl, downloadUrl: previewUrl, kind: 'video', format });
    };

    const openMaterial = (material: any) => {
        const rawUrl = material.url;
        const previewUrl = toPreviewUrl(rawUrl);
        if (!previewUrl) return;
        setPreview({
            title: material.title,
            url: previewUrl,
            downloadUrl: previewUrl,
            kind: 'material',
            format: material.format,
            type: material.type
        });
    };

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'lectures', label: 'Lectures', icon: Play },
        { id: 'materials', label: 'General Materials', icon: FileText },
        { id: 'assignments', label: 'Assignments', icon: BookOpen },
        { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
        { id: 'announcements', label: 'Announcements', icon: MessageSquare },
        { id: 'grades', label: 'Grades/Progress', icon: BarChart3 },
    ];

    // --- Loading & Error States ---

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-zinc-400">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="p-8 text-center bg-gray-50 dark:bg-zinc-950">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                <p className="text-gray-700 dark:text-zinc-300">{error || "Course not found"}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // --- Not Enrolled View ---
    if (!course.isEnrolled) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-slate-50 dark:bg-zinc-950 min-h-screen">
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100 mb-2">{course.title}</h1>
                            <p className="text-[18px] text-gray-600 dark:text-zinc-400">Code: {course.code}</p>
                            <p className="text-[18px] text-gray-600 dark:text-zinc-400">Instructor: {course.instructor}</p>
                        </div>
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Course Description</h2>
                                <p className="text-[16px] text-gray-700 dark:text-zinc-300">{course.description}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Actions</h3>
                                <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                                    <p className="text-[16px] text-gray-700 dark:text-zinc-300 mb-4">You are not currently enrolled.</p>
                                    <button
                                        onClick={() => {/* TODO: Implement Enroll API Call */ }}
                                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Request Enrollment
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // --- Enrolled View (Tabs) ---
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-slate-50 dark:bg-zinc-950 min-h-screen">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100 mb-2">{course.title}</h1>
                        <p className="text-[18px] text-gray-600 dark:text-zinc-400">Instructor: {course.instructor}</p>
                    </div>

                    {/* Tabs Header */}
                    <Card variant="elevated">
                        <CardContent className="p-0">
                            <div className="border-b border-gray-200 dark:border-zinc-700 overflow-x-auto">
                                <div className="flex">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-6 py-4 font-medium text-[14px] transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                                    ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Lectures Tab */}
                                {activeTab === 'lectures' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Lecture List</h2>
                                        {course.lectures.length === 0 && <p className="text-gray-500 dark:text-zinc-500 italic">No lectures available yet.</p>}
                                        {course.lectures.map((lecture: any) => {
                                            const isExpanded = expandedLectures.has(lecture.id);
                                            const toggleExpand = () => {
                                                const newExpanded = new Set(expandedLectures);
                                                if (isExpanded) {
                                                    newExpanded.delete(lecture.id);
                                                } else {
                                                    newExpanded.add(lecture.id);
                                                }
                                                setExpandedLectures(newExpanded);
                                            };

                                            return (
                                                <div key={lecture.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                                    <div onClick={toggleExpand} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            {lecture.completed ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Clock className="w-6 h-6 text-gray-400" />}
                                                            <div>
                                                                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">{lecture.title}</h3>
                                                                <p className="text-[14px] text-gray-600 dark:text-zinc-400">{lecture.duration}</p>
                                                            </div>
                                                        </div>
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Assignments Tab */}
                                {activeTab === 'assignments' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Assignment List</h2>
                                        {course.assignments.length === 0 && <p className="text-gray-500 dark:text-zinc-500 italic">No assignments available.</p>}
                                        {course.assignments.map((assignment: any) => (
                                            <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800">
                                                <div>
                                                    <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100 mb-1">{assignment.title}</h3>
                                                    <div className="text-[14px] text-gray-600 dark:text-zinc-400">
                                                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                    View Details
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Placeholder for other tabs (Materials, Quizzes, etc.) */}
                                {['materials', 'quizzes', 'announcements', 'grades'].includes(activeTab) && (
                                    <div className="p-8 text-center text-gray-500 dark:text-zinc-500 border border-dashed dark:border-zinc-700 rounded-lg">
                                        Content coming soon from backend.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Media Preview Modal */}
            {preview && (
                <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 px-4" onClick={() => setPreview(null)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden h-[85vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700">
                            <h3 className="text-[18px] font-semibold dark:text-zinc-100">{preview.title}</h3>
                            <button onClick={() => setPreview(null)} className="text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100">Close</button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            {/* Simple generic preview */}
                            <iframe title="preview" src={preview.url} className="w-full h-full" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};