import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { FileText, Play, HelpCircle, Download, BookOpen, FileVideo, File, Presentation, MessageSquare, BarChart3, CheckCircle2, Clock, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

type TabType = 'lectures' | 'materials' | 'assignments' | 'quizzes' | 'announcements' | 'grades';

const TEST_VIDEO_URL = 'https://drive.google.com/file/d/1T5Gz7wrSii11TkPxHjDBkfKh3ZYuzXpQ/view?usp=sharing';
const TEST_MATERIALS = {
    pdf: '/testpdf.pdf',
    slide: '/testslide.pptx',
    image: '/testimg.png',
    audio: '/testvideo.m4a',
};

// Mock course database
const coursesDatabase: { [key: string]: any } = {
    '1': {
        id: '1',
        title: 'Introduction to Computer Science',
        instructor: 'Dr. Alan Turing',
        description: 'This course provides a comprehensive introduction to the fundamental concepts and techniques of Computer Science. Students will explore programming fundamentals, algorithms, data structures, and software development principles.',
        isEnrolled: true,
        progress: 75,
    },
    '2': {
        id: '2',
        title: 'Calculus I',
        instructor: 'Dr. Isaac Newton',
        description: 'An introduction to differential and integral calculus with applications to science and engineering.',
        isEnrolled: true,
        progress: 100,
    },
    '3': {
        id: '3',
        title: 'Linear Algebra',
        instructor: 'Dr. Olga Taussky-Todd',
        description: 'Study of vector spaces, linear transformations, matrices, and systems of linear equations.',
        isEnrolled: true,
        progress: 45,
    },
    '4': {
        id: '4',
        title: 'Probability and Statistics',
        instructor: 'Dr. C. R. Rao',
        description: 'Introduction to probability theory, statistical inference, and data analysis techniques.',
        isEnrolled: true,
        progress: 100,
    },
    '5': {
        id: '5',
        title: 'Discrete Mathematics',
        instructor: 'Dr. László Lovász',
        description: 'Mathematical structures and techniques for discrete objects including logic, sets, functions, and graphs.',
        isEnrolled: true,
        progress: 20,
    },
};

export const CourseDetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
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

    // Get course data from location state or database
    const courseFromState = location.state?.course;
    const courseFromDatabase = coursesDatabase[id || '1'];

    const courseData = courseFromState || courseFromDatabase || {
        id: id || '1',
        title: 'Introduction to Artificial Intelligence',
        instructor: 'Dr. Alan Turing',
        description: 'This course provides a comprehensive introduction to the fundamental concepts and techniques of Artificial Intelligence.',
        isEnrolled: false,
        progress: 0,
    };

    const course = {
        ...courseData,
        id: courseData.id || id || '1',
        title: courseData.title || 'Introduction to Artificial Intelligence',
        instructor: courseData.instructor || 'Dr. Alan Turing',
        description: courseData.description || 'This course provides a comprehensive introduction to the fundamental concepts and techniques of Artificial Intelligence. Students will explore the history of AI, search algorithms, knowledge representation and reasoning, machine learning, natural language processing, computer vision, and the ethical implications of AI technologies.',
        learningObjectives: [
            'Understand the core concepts and history of Artificial Intelligence.',
            'Apply various search algorithms to solve complex problems.',
            'Learn the principles of knowledge representation and logical reasoning.',
            'Grasp the fundamentals of machine learning, including supervised and unsupervised learning.',
            'Develop an understanding of natural language processing and computer vision.',
            'Analyze the ethical and social impacts of AI.'
        ],
        isEnrolled: courseData.isEnrolled !== undefined ? courseData.isEnrolled : false,
        progress: courseData.progress || 0,
        lectureCount: 24,
        assignmentCount: 8,
        quizCount: 6,
        prerequisites: [
            'CS101 - Introduction to Programming',
            'MATH201 - Linear Algebra',
            'STAT101 - Introduction to Statistics'
        ],
        lectures: [
            {
                id: 1,
                title: 'Introduction to AI',
                duration: '45 min',
                completed: true,
                video: { url: TEST_VIDEO_URL, title: 'Lecture 1: Introduction to AI', duration: '45:30' },
                materials: [
                    { id: 1, title: 'Lecture 1 Slides', type: 'Slides', format: 'PPTX', size: '2.5 MB', icon: Presentation, url: TEST_MATERIALS.slide },
                    { id: 2, title: 'Reading Material - Chapter 1', type: 'PDF', format: 'PDF', size: '5 MB', icon: File, url: TEST_MATERIALS.pdf },
                ]
            },
            {
                id: 2,
                title: 'Search Algorithms',
                duration: '50 min',
                completed: true,
                video: { url: TEST_VIDEO_URL, title: 'Lecture 2: Search Algorithms', duration: '50:15' },
                materials: [
                    { id: 3, title: 'Lecture 2 Slides', type: 'Slides', format: 'PPTX', size: '3 MB', icon: Presentation, url: TEST_MATERIALS.slide },
                    { id: 4, title: 'Algorithm Diagrams', type: 'PDF', format: 'PDF', size: '1.2 MB', icon: File, url: TEST_MATERIALS.pdf },
                    { id: 5, title: 'Code Examples', type: 'DOCX', format: 'DOCX', size: '800 KB', icon: FileText, url: TEST_MATERIALS.pdf },
                ]
            },
            {
                id: 3,
                title: 'Knowledge Representation',
                duration: '40 min',
                completed: false,
                video: { url: TEST_VIDEO_URL, title: 'Lecture 3: Knowledge Representation', duration: '40:20' },
                materials: [
                    { id: 6, title: 'Lecture 3 Slides', type: 'Slides', format: 'PPTX', size: '2.8 MB', icon: Presentation, url: TEST_MATERIALS.slide },
                ]
            },
            {
                id: 4,
                title: 'Machine Learning Basics',
                duration: '55 min',
                completed: false,
                video: { url: TEST_VIDEO_URL, title: 'Lecture 4: Machine Learning Basics', duration: '55:10' },
                materials: [
                    { id: 7, title: 'Lecture 4 Slides', type: 'Slides', format: 'PPTX', size: '4 MB', icon: Presentation, url: TEST_MATERIALS.slide },
                    { id: 8, title: 'ML Concepts Diagram', type: 'Image', format: 'PNG', size: '2 MB', icon: ImageIcon, url: TEST_MATERIALS.image },
                    { id: 9, title: 'Practice Exercises', type: 'PDF', format: 'PDF', size: '1.5 MB', icon: File, url: TEST_MATERIALS.pdf },
                ]
            },
        ],
        materials: [
            { id: 101, title: 'Course Book (PDF)', type: 'Course Book', format: 'PDF', size: '5 MB', icon: FileText, url: TEST_MATERIALS.pdf },
            { id: 102, title: 'Course Syllabus', type: 'Syllabus', format: 'PDF', size: '2.5 MB', icon: File, url: TEST_MATERIALS.pdf },
            { id: 103, title: 'Reference Slides', type: 'Slides', format: 'PPTX', size: '15 MB', icon: Presentation, url: TEST_MATERIALS.slide },
            { id: 104, title: 'Brand Assets (Image)', type: 'Image', format: 'PNG', size: '2 MB', icon: ImageIcon, url: TEST_MATERIALS.image },
            { id: 105, title: 'Audio Guide', type: 'Audio', format: 'M4A', size: '3 MB', icon: File, url: TEST_MATERIALS.audio },
        ],
        assignments: [
            { id: 1, title: 'Assignment 1: Search Algorithms', dueDate: '2024-11-15', status: 'Submitted', grade: '95/100' },
            { id: 2, title: 'Assignment 2: Knowledge Representation', dueDate: '2024-11-22', status: 'In Progress', grade: null },
            { id: 3, title: 'Assignment 3: ML Project', dueDate: '2024-11-29', status: 'Not Started', grade: null },
        ],
        quizzes: [
            { id: 1, title: 'Quiz 1: AI Fundamentals', completed: true, score: '18/20' },
            { id: 2, title: 'Quiz 2: Search Algorithms', completed: false, score: null },
            { id: 3, title: 'Quiz 3: Machine Learning', completed: false, score: null },
        ],
        announcements: [
            { id: 1, title: 'Welcome to the Course', date: '2024-10-01', content: 'Welcome everyone! Please review the syllabus and course materials.' },
            { id: 2, title: 'Assignment 1 Deadline Extended', date: '2024-10-15', content: 'The deadline for Assignment 1 has been extended to November 15th.' },
            { id: 3, title: 'Office Hours Update', date: '2024-10-20', content: 'Office hours will be held every Tuesday and Thursday from 2-4 PM.' },
        ],
        grades: {
            assignments: 87,
            quizzes: 92,
            participation: 95,
            overall: 89
        }
    };

    const toPreviewUrl = (rawUrl?: string, format?: string) => {
        if (!rawUrl) return '';
        if (rawUrl.includes('drive.google.com/file/')) {
            const idMatch = rawUrl.match(/\/file\/d\/([^/]+)\//);
            const id = idMatch?.[1];
            return id ? `https://drive.google.com/file/d/${id}/preview` : rawUrl;
        }
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
        const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        // Properly encode each path segment to handle spaces
        const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const fullUrl = `${window.location.origin}${encodedPath}`;

        // For PDFs and Office files, use Google Docs Viewer to prevent auto-download
        const fmt = format?.toLowerCase();
        if (fmt === 'pdf' || fmt === 'pptx' || fmt === 'docx' || fmt === 'xlsx') {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
        }

        return fullUrl;
    };

    const toDownloadUrl = (rawUrl?: string) => {
        if (!rawUrl) return '';
        if (rawUrl.includes('drive.google.com/file/')) {
            const idMatch = rawUrl.match(/\/file\/d\/([^/]+)\//);
            const id = idMatch?.[1];
            return id ? `https://drive.google.com/uc?export=download&id=${id}` : rawUrl;
        }
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
        const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        // Properly encode each path segment to handle spaces
        const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
        return `${window.location.origin}${encodedPath}`;
    };

    const openVideo = (url?: string, title?: string, format?: string) => {
        const previewUrl = toPreviewUrl(url, format);
        const downloadUrl = toDownloadUrl(url);
        if (!previewUrl) return;
        setPreview({ title: title || 'Video', url: previewUrl, downloadUrl, kind: 'video', format });
    };

    const openMaterial = (material: any) => {
        const fallbackExt = material.format ? String(material.format).toLowerCase() : 'file';
        const rawUrl = material.url || `/materials/material-${material.id}.${fallbackExt}`;
        const previewUrl = toPreviewUrl(rawUrl, material.format);
        const downloadUrl = toDownloadUrl(rawUrl);
        if (!previewUrl) return;
        setPreview({ title: material.title, url: previewUrl, downloadUrl, kind: 'material', format: material.format, type: material.type });
    };

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'lectures', label: 'Lectures', icon: Play },
        { id: 'materials', label: 'General Materials', icon: FileText },
        { id: 'assignments', label: 'Assignments', icon: BookOpen },
        { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
        { id: 'announcements', label: 'Announcements', icon: MessageSquare },
        { id: 'grades', label: 'Grades/Progress', icon: BarChart3 },
    ];

    if (!course.isEnrolled) {
        // Not Enrolled View - Show prerequisites and counts
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Title and Instructor */}
                        <div>
                            <h1 className="text-[36px] font-bold leading-[40px] text-gray-900 mb-2">
                                {course.title}
                            </h1>
                            <p className="text-[18px] leading-[28px] text-gray-600">
                                Instructor: {course.instructor}
                            </p>
                        </div>

                        {/* Course Description */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[24px] font-bold text-gray-900 mb-4">Course Description</h2>
                                <p className="text-[16px] leading-[24px] text-gray-700">
                                    {course.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Learning Objectives */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[24px] font-bold text-gray-900 mb-4">Learning Objectives</h2>
                                <ul className="space-y-3">
                                    {course.learningObjectives.map((objective: string, index: number) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                            <span className="text-[16px] leading-[24px] text-gray-700">{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Prerequisites */}
                        {course.prerequisites.length > 0 && (
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <h2 className="text-[24px] font-bold text-gray-900 mb-4">Prerequisites</h2>
                                    <ul className="space-y-2">
                                        {course.prerequisites.map((prereq: string, index: number) => (
                                            <li key={index} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <span className="text-[16px] leading-[24px] text-gray-700">{prereq}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Enrollment Status */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[20px] font-bold text-gray-900 mb-4">Course Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-[14px] font-medium text-gray-700">Lectures</span>
                                        <span className="text-[16px] font-bold text-gray-900">{course.lectureCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-[14px] font-medium text-gray-700">Assignments</span>
                                        <span className="text-[16px] font-bold text-gray-900">{course.assignmentCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-[14px] font-medium text-gray-700">Quizzes</span>
                                        <span className="text-[16px] font-bold text-gray-900">{course.quizCount}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-[16px] text-gray-700 mb-4">You are not currently enrolled in this course.</p>
                                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        Request Enrollment
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Syllabus */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[20px] font-bold text-gray-900 mb-4">Course Syllabus</h3>
                                <p className="text-[16px] text-gray-700 mb-4">
                                    Download the complete course syllabus for detailed information on topics, schedule, and grading.
                                </p>
                                <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                    <Download className="w-5 h-5" />
                                    Download Syllabus (PDF)
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Enrolled View - Tabbed Interface
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-[36px] font-bold leading-[40px] text-gray-900 mb-2">
                            {course.title}
                        </h1>
                        <p className="text-[18px] leading-[28px] text-gray-600">
                            Instructor: {course.instructor}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[16px] font-medium text-gray-700">Course Progress</span>
                                <span className="text-[16px] font-bold text-green-600">{course.progress}% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-green-600 h-3 rounded-full transition-all"
                                    style={{ width: `${course.progress}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Card variant="elevated">
                        <CardContent className="p-0">
                            <div className="border-b border-gray-200">
                                <div className="flex overflow-x-auto">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-6 py-4 font-medium text-[14px] transition-colors border-b-2 ${activeTab === tab.id
                                                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-4">Lecture List</h2>
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
                                                <div
                                                    key={lecture.id}
                                                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                                >
                                                    {/* Lecture Header */}
                                                    <div
                                                        onClick={toggleExpand}
                                                        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            {lecture.completed ? (
                                                                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <Clock className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1">
                                                                <h3 className="text-[16px] font-semibold text-gray-900">{lecture.title}</h3>
                                                                <p className="text-[14px] text-gray-600">Duration: {lecture.duration}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={toggleExpand}
                                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                                                ) : (
                                                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openVideo(lecture.video?.url, lecture.video?.title, 'MP4');
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                                {lecture.completed ? 'Review' : 'Start'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content */}
                                                    {isExpanded && (
                                                        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                                            {/* Video */}
                                                            {lecture.video && (
                                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                                                <FileVideo className="w-5 h-5 text-red-600" />
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-[14px] font-semibold text-gray-900">{lecture.video.title}</h4>
                                                                                <p className="text-[12px] text-gray-600">MP4 • {lecture.video.duration}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => openVideo(lecture.video.url, lecture.video.title, 'MP4')}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[12px] font-medium"
                                                                        >
                                                                            <Play className="w-3 h-3" />
                                                                            Play Video
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Materials */}
                                                            {lecture.materials && lecture.materials.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-[14px] font-semibold text-gray-900 mb-3">Additional Materials</h4>
                                                                    <div className="space-y-2">
                                                                        {lecture.materials.map((material: any) => {
                                                                            const Icon = material.icon;
                                                                            return (
                                                                                <div
                                                                                    key={material.id}
                                                                                    onClick={() => openMaterial(material)}
                                                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                                            <Icon className="w-4 h-4 text-gray-600" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[14px] font-medium text-gray-900">{material.title}</p>
                                                                                            <p className="text-[12px] text-gray-600">
                                                                                                {material.format} • {material.size}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openMaterial(material);
                                                                                        }}
                                                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                                    >
                                                                                        <Download className="w-4 h-4 text-gray-600" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    </div>
                                )}

                                {/* General Materials Tab */}
                                {activeTab === 'materials' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-2">General Materials</h2>
                                        <p className="text-[14px] text-gray-600 mb-4">
                                            Course-wide resources that are not tied to any specific lecture (syllabus, templates, reference sheets).
                                        </p>

                                        {course.materials.length === 0 && (
                                            <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-gray-600 text-sm">
                                                No general materials available yet.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {course.materials.map((material: any) => {
                                                const Icon = material.icon;
                                                return (
                                                    <div
                                                        key={material.id}
                                                        onClick={() => openMaterial(material)}
                                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <Icon className="w-5 h-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[16px] font-semibold text-gray-900">{material.title}</h3>
                                                                <p className="text-[14px] text-gray-600">
                                                                    {material.format} • {material.size}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openMaterial(material);
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <Download className="w-5 h-5 text-gray-600" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}

                                {/* Assignments Tab */}
                                {activeTab === 'assignments' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-4">Assignment List</h2>
                                        {course.assignments.map((assignment: any) => (
                                            <div
                                                key={assignment.id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="text-[16px] font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                                                    <div className="flex items-center gap-4 text-[14px] text-gray-600">
                                                        <span>Due: {assignment.dueDate}</span>
                                                        {assignment.grade && <span className="font-semibold text-green-600">Grade: {assignment.grade}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-[12px] font-medium ${assignment.status === 'Submitted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : assignment.status === 'In Progress'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {assignment.status}
                                                    </span>
                                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                        {assignment.status === 'Submitted' ? 'View' : assignment.status === 'In Progress' ? 'Continue' : 'Start'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Quizzes Tab */}
                                {activeTab === 'quizzes' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-4">Quiz List</h2>
                                        {course.quizzes.map((quiz: any) => (
                                            <div
                                                key={quiz.id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {quiz.completed ? (
                                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                    ) : (
                                                        <HelpCircle className="w-6 h-6 text-gray-400" />
                                                    )}
                                                    <div>
                                                        <h3 className="text-[16px] font-semibold text-gray-900">{quiz.title}</h3>
                                                        {quiz.score && <p className="text-[14px] text-green-600 font-medium">Score: {quiz.score}</p>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    {quiz.completed ? 'Review' : 'Start Quiz'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Announcements Tab */}
                                {activeTab === 'announcements' && (
                                    <div className="space-y-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-4">Announcements</h2>
                                        {course.announcements.map((announcement: any) => (
                                            <div
                                                key={announcement.id}
                                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-[16px] font-semibold text-gray-900">{announcement.title}</h3>
                                                    <span className="text-[14px] text-gray-600">{announcement.date}</span>
                                                </div>
                                                <p className="text-[14px] text-gray-700">{announcement.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Grades/Progress Tab */}
                                {activeTab === 'grades' && (
                                    <div className="space-y-6">
                                        <h2 className="text-[24px] font-bold text-gray-900 mb-4">Grades & Progress</h2>

                                        {/* Progress Chart */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card variant="elevated">
                                                <CardContent className="p-6">
                                                    <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Overall Progress</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[14px] font-medium text-gray-700">Assignments</span>
                                                                <span className="text-[16px] font-bold text-gray-900">{course.grades.assignments}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${course.grades.assignments}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[14px] font-medium text-gray-700">Quizzes</span>
                                                                <span className="text-[16px] font-bold text-gray-900">{course.grades.quizzes}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-green-600 h-2 rounded-full"
                                                                    style={{ width: `${course.grades.quizzes}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[14px] font-medium text-gray-700">Participation</span>
                                                                <span className="text-[16px] font-bold text-gray-900">{course.grades.participation}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-purple-600 h-2 rounded-full"
                                                                    style={{ width: `${course.grades.participation}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card variant="elevated">
                                                <CardContent className="p-6">
                                                    <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Overall Grade</h3>
                                                    <div className="text-center">
                                                        <div className="text-[48px] font-bold text-blue-600 mb-2">{course.grades.overall}%</div>
                                                        <p className="text-[16px] text-gray-600">Current Grade</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {preview && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
                    onClick={() => setPreview(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden"
                        style={{ height: preview.kind === 'video' ? '85vh' : '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <p className="text-[12px] text-gray-500">{preview.kind === 'video' ? 'Video Preview' : 'Material Preview'}</p>
                                <h3 className="text-[18px] font-semibold text-gray-900">{preview.title}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={preview.downloadUrl || preview.url}
                                    download
                                    className="px-3 py-2 text-[13px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Download
                                </a>
                                <button
                                    onClick={() => setPreview(null)}
                                    className="px-3 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 relative overflow-hidden">
                            {preview.kind === 'video' ? (
                                <iframe
                                    title="video-preview"
                                    src={preview.url}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : preview.format?.toLowerCase() === 'png' || preview.format?.toLowerCase() === 'jpg' || preview.format?.toLowerCase() === 'jpeg' || preview.format?.toLowerCase() === 'gif' ? (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <img
                                        src={preview.downloadUrl}
                                        alt={preview.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <iframe
                                    title="material-preview"
                                    src={preview.url}
                                    className="w-full h-full border-0"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
