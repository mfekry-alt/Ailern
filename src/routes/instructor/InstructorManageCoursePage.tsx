import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Play,
    FileText,
    BookOpen,
    HelpCircle,
    MessageSquare,
    Users,
    UserCheck,
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    Download,
    Upload,
    Pin,
    PinOff,
    CheckCircle,
    XCircle,
    Search,
    Eye
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

type TabType = 'overview' | 'lectures' | 'assignments' | 'quizzes' | 'announcements' | 'students' | 'enrollments';

interface Lecture {
    id: number;
    title: string;
    videoUrl?: string;
    materials: { id: number; title: string; type: string; url: string }[];
    expanded?: boolean;
}

interface Assignment {
    id: number;
    title: string;
    dueDate: string;
    attempts: number;
    submissions: number;
    status: 'Draft' | 'Published';
}

interface Quiz {
    id: number;
    name: string;
    duration: number;
    attemptsAllowed: number;
    status: 'Draft' | 'Scheduled' | 'Published';
    submissions: number;
}

interface Announcement {
    id: number;
    title: string;
    date: string;
    content: string;
    isPinned: boolean;
    hasAttachment?: boolean;
}

interface Student {
    id: number;
    name: string;
    progress: number;
    assignmentGrade: number;
    quizGrade: number;
    overallGrade: number;
}

interface EnrollmentRequest {
    id: number;
    studentName: string;
    email: string;
    requestDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export const InstructorManageCoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [course] = useState({
        id: id || '',
        title: '',
        code: '',
        status: '',
        enrollmentCount: 0,
        description: '',
        category: ''
    });

    const [lectures, setLectures] = useState<Lecture[]>([]);

    const [generalMaterials] = useState<{ id: number; title: string; type: string; url: string }[]>([]);

    const [assignments] = useState<Assignment[]>([]);

    const [quizzes] = useState<Quiz[]>([]);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const [students] = useState<Student[]>([]);

    const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);

    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', isPinned: false });

    const toggleLecture = (id: number) => {
        setLectures(prev => prev.map(l => l.id === id ? { ...l, expanded: !l.expanded } : l));
    };

    const togglePin = (id: number) => {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    };

    const handleEnrollmentAction = (id: number, action: 'Approved' | 'Rejected') => {
        setEnrollmentRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    };

    const addAnnouncement = () => {
        if (newAnnouncement.title && newAnnouncement.content) {
            setAnnouncements(prev => [{
                id: Date.now(),
                title: newAnnouncement.title,
                date: new Date().toISOString().split('T')[0],
                content: newAnnouncement.content,
                isPinned: newAnnouncement.isPinned
            }, ...prev]);
            setNewAnnouncement({ title: '', content: '', isPinned: false });
        }
    };

    const exportStudentData = () => {
        const csv = [
            ['Name', 'Progress', 'Assignment Grade', 'Quiz Grade', 'Overall Grade'],
            ...students.map(s => [s.name, `${s.progress}%`, `${s.assignmentGrade}%`, `${s.quizGrade}%`, `${s.overallGrade}%`])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${course.code}_students.csv`;
        a.click();
    };

    const filteredRequests = enrollmentRequests.filter(request => {
        const statusMatch = selectedStatus === 'all' || request.status === selectedStatus;
        const searchMatch = request.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.email.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'lectures', label: 'Lectures & Materials', icon: Play },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
        { id: 'announcements', label: 'Announcements', icon: MessageSquare },
        { id: 'students', label: 'Students & Progress', icon: Users },
        { id: 'enrollments', label: 'Enrollment Requests', icon: UserCheck },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <button
                        onClick={() => navigate('/instructor/courses')}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Courses
                    </button>
                    <h1 className="text-[36px] font-bold text-gray-900 dark:text-zinc-100">{course.title}</h1>
                    <p className="text-[18px] text-gray-600 dark:text-zinc-400 mt-1">
                        {course.code} • {course.status} • {course.enrollmentCount} students enrolled
                    </p>
                </div>

                {/* Tabs */}
                <Card variant="elevated">
                    <CardContent className="p-0">
                        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-zinc-700">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium text-[14px] border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600 dark:bg-blue-900/10'
                                            : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Content */}
                <div>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Course Overview</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-1">Description</p>
                                        <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-1">Category</p>
                                        <p className="text-[14px] text-gray-600 dark:text-zinc-400">{course.category}</p>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-6">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-[14px] text-blue-600 mb-1">Lectures</p>
                                            <p className="text-[24px] font-bold text-blue-900 dark:text-blue-300">{lectures.length}</p>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-[14px] text-green-600 mb-1">Assignments</p>
                                            <p className="text-[24px] font-bold text-green-900 dark:text-green-300">{assignments.length}</p>
                                        </div>
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <p className="text-[14px] text-purple-600 mb-1">Quizzes</p>
                                            <p className="text-[24px] font-bold text-purple-900 dark:text-purple-300">{quizzes.length}</p>
                                        </div>
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <p className="text-[14px] text-orange-600 mb-1">Students</p>
                                            <p className="text-[24px] font-bold text-orange-900 dark:text-orange-300">{course.enrollmentCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lectures & Materials Tab */}
                    {activeTab === 'lectures' && (
                        <div className="space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">Lectures</h2>
                                        <button
                                            onClick={() => navigate(`/instructor/courses/${course.id}/content/edit`)}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Lecture
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {lectures.map((lecture) => (
                                            <div key={lecture.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg">
                                                <div
                                                    onClick={() => toggleLecture(lecture.id)}
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Play className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">{lecture.title}</h3>
                                                            <p className="text-[13px] text-gray-600 dark:text-zinc-400">
                                                                {lecture.materials.length} material(s)
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                            <Edit2 className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {lecture.expanded && (
                                                    <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                                                        <p className="text-[13px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Materials:</p>
                                                        <div className="space-y-2">
                                                            {lecture.materials.map((material) => (
                                                                <div
                                                                    key={material.id}
                                                                    className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                                        <span className="text-[14px] text-gray-700 dark:text-zinc-300">{material.title}</span>
                                                                        <span className="text-[12px] text-gray-500 dark:text-zinc-500">({material.type})</span>
                                                                    </div>
                                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                                        <Trash2 className="w-3 h-3 text-red-600" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button className="flex items-center gap-2 text-[13px] text-blue-600 hover:text-blue-700 font-medium">
                                                                <Plus className="w-3 h-3" />
                                                                Add Material
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">General Materials</h2>
                                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                                            <Plus className="w-4 h-4" />
                                            Add Material
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {generalMaterials.map((material) => (
                                            <div
                                                key={material.id}
                                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-gray-500 dark:text-zinc-500" />
                                                    <div>
                                                        <p className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">{material.title}</p>
                                                        <p className="text-[12px] text-gray-500 dark:text-zinc-500">{material.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                        <Download className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">Assignments</h2>
                                    <button
                                        onClick={() => navigate('/instructor/assignments/create')}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Assignment
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">{assignment.title}</h3>
                                                    <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${assignment.status === 'Published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {assignment.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-zinc-400">
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                    <span>Attempts: {assignment.attempts}</span>
                                                    <span>Submissions: {assignment.submissions}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/instructor/assignments/${assignment.id}/submissions`)}
                                                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Submissions
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quizzes Tab */}
                    {activeTab === 'quizzes' && (
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">Quizzes</h2>
                                    <button
                                        onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_CREATE, { state: { courseId: id } })}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Quiz
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {quizzes.map((quiz) => (
                                        <div
                                            key={quiz.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">{quiz.name}</h3>
                                                    <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${quiz.status === 'Published' ? 'bg-green-100 text-green-800' :
                                                        quiz.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {quiz.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-zinc-400">
                                                    <span>Duration: {quiz.duration} min</span>
                                                    <span>Attempts: {quiz.attemptsAllowed}</span>
                                                    <span>Submissions: {quiz.submissions}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Announcements Tab */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-6">
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Create Announcement</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">Title</label>
                                            <input
                                                type="text"
                                                value={newAnnouncement.title}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                                placeholder="Announcement title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">Content</label>
                                            <textarea
                                                value={newAnnouncement.content}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                                placeholder="Announcement content"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newAnnouncement.isPinned}
                                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-[14px] text-gray-700 dark:text-zinc-300">Pin this announcement</span>
                                            </label>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg">
                                                <Upload className="w-4 h-4" />
                                                Add Attachment (optional)
                                            </button>
                                        </div>
                                        <button
                                            onClick={addAnnouncement}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                                        >
                                            Post Announcement
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Announcements</h2>
                                    <div className="space-y-3">
                                        {announcements.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((announcement) => (
                                            <div
                                                key={announcement.id}
                                                className={`p-4 border rounded-lg ${announcement.isPinned ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {announcement.isPinned && (
                                                                <Pin className="w-4 h-4 text-blue-600" />
                                                            )}
                                                            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">
                                                                {announcement.title}
                                                            </h3>
                                                        </div>
                                                        <p className="text-[13px] text-gray-600 dark:text-zinc-400 mb-2">{announcement.date}</p>
                                                        <p className="text-[14px] text-gray-700 dark:text-zinc-300">{announcement.content}</p>
                                                        {announcement.hasAttachment && (
                                                            <div className="flex items-center gap-2 mt-2 text-[13px] text-blue-600">
                                                                <FileText className="w-3 h-3" />
                                                                <span>Attachment available</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => togglePin(announcement.id)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                                    >
                                                        {announcement.isPinned ? (
                                                            <PinOff className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        ) : (
                                                            <Pin className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Students & Progress Tab */}
                    {activeTab === 'students' && (
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">Students & Progress</h2>
                                    <button
                                        onClick={exportStudentData}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-zinc-700">
                                                <th className="text-left py-3 px-4 text-[14px] font-semibold text-gray-700 dark:text-zinc-300">Student Name</th>
                                                <th className="text-left py-3 px-4 text-[14px] font-semibold text-gray-700 dark:text-zinc-300">Progress</th>
                                                <th className="text-left py-3 px-4 text-[14px] font-semibold text-gray-700 dark:text-zinc-300">Assignment Grade</th>
                                                <th className="text-left py-3 px-4 text-[14px] font-semibold text-gray-700 dark:text-zinc-300">Quiz Grade</th>
                                                <th className="text-left py-3 px-4 text-[14px] font-semibold text-gray-700 dark:text-zinc-300">Overall Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800">
                                                    <td className="py-3 px-4 text-[14px] text-gray-900 dark:text-zinc-100">{student.name}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-2 max-w-[100px]">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${student.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[13px] text-gray-600 dark:text-zinc-400">{student.progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-[14px] text-gray-900 dark:text-zinc-100">{student.assignmentGrade}%</td>
                                                    <td className="py-3 px-4 text-[14px] text-gray-900 dark:text-zinc-100">{student.quizGrade}%</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`font-semibold ${student.overallGrade >= 90 ? 'text-green-600' :
                                                            student.overallGrade >= 80 ? 'text-blue-600' :
                                                                student.overallGrade >= 70 ? 'text-yellow-600' :
                                                                    'text-red-600'
                                                            }`}>
                                                            {student.overallGrade}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Enrollment Requests Tab */}
                    {activeTab === 'enrollments' && (
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[24px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Enrollment Requests</h2>

                                {/* Filters */}
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by name or email"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    {filteredRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex-1">
                                                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">{request.studentName}</h3>
                                                <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-zinc-400 mt-1">
                                                    <span>{request.email}</span>
                                                    <span>Requested: {new Date(request.requestDate).toLocaleDateString()}</span>
                                                    <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {request.status === 'Pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEnrollmentAction(request.id, 'Approved')}
                                                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleEnrollmentAction(request.id, 'Rejected')}
                                                        className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
