import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Upload,
    FileText,
    Video,
    Presentation,
    HelpCircle,
    Users,
    Calendar,
    BookOpen,
    CheckCircle,
    AlertCircle,
    Mail,
    Download,
    UserCheck,
    XCircle
} from 'lucide-react';

const initialLectures = [
    {
        id: 'lec-1',
        title: 'Lecture 1: Introduction to Psychology',
        week: 'Week 1',
        length: '45:30',
        video: 'Introduction-psychology.mp4',
        resources: [
            { id: 'res-1', name: 'Lecture slides', type: 'PPT', size: '1.8 MB' },
            { id: 'res-2', name: 'Reading: Chapter 1', type: 'PDF', size: '2.3 MB' }
        ]
    },
    {
        id: 'lec-2',
        title: 'Lecture 2: Research Methods',
        week: 'Week 2',
        length: '38:10',
        video: 'Research-methods.mp4',
        resources: [
            { id: 'res-3', name: 'Worksheet', type: 'PDF', size: '856 KB' }
        ]
    }
];

const initialGeneralMaterials = [
    { id: 'mat-1', name: 'Syllabus', type: 'PDF', size: '512 KB', status: 'Published' },
    { id: 'mat-2', name: 'Course Outline', type: 'PDF', size: '420 KB', status: 'Published' },
    { id: 'mat-3', name: 'Lesson template', type: 'PPT', size: '1.1 MB', status: 'Draft' }
];

const initialAssignments = [
    {
        id: 'assgn-1',
        title: 'Assignment 1: Research Paper Outline',
        due: '2024-02-20',
        status: 'Published',
        submissions: 38,
        attempts: 2,
        weight: '15%'
    },
    {
        id: 'assgn-2',
        title: 'Assignment 2: Cognitive Bias Reflection',
        due: '2024-03-05',
        status: 'Draft',
        submissions: 0,
        attempts: 1,
        weight: '20%'
    }
];

const initialQuizzes = [
    { id: 'quiz-1', title: 'Quiz 1: Foundations', status: 'Published', attempts: 2, timeLimit: '30 min', release: '2024-02-15', submissions: 34 },
    { id: 'quiz-2', title: 'Quiz 2: Research Methods', status: 'Scheduled', attempts: 3, timeLimit: '25 min', release: '2024-02-28', submissions: 0 },
    { id: 'quiz-3', title: 'Final Quiz', status: 'Draft', attempts: 1, timeLimit: '45 min', release: 'TBD', submissions: 0 }
];

const initialStudents = [
    { id: 'stu-1', name: 'Alex Kim', progress: '82%', assignments: 'B+', quizzes: 'A-', lastActive: 'Today' },
    { id: 'stu-2', name: 'Jordan Miles', progress: '91%', assignments: 'A', quizzes: 'A', lastActive: 'Yesterday' },
    { id: 'stu-3', name: 'Taylor Smith', progress: '67%', assignments: 'C+', quizzes: 'B', lastActive: '3d ago' },
];

const initialEnrollmentRequests = [
    { id: 'req-1', name: 'Priya Patel', email: 'priya.patel@example.com', status: 'Pending', requestedAt: '2024-02-18' },
    { id: 'req-2', name: 'Samuel Green', email: 'sam.green@example.com', status: 'Approved', requestedAt: '2024-02-16' },
    { id: 'req-3', name: 'Lena Rossi', email: 'lena.rossi@example.com', status: 'Rejected', requestedAt: '2024-02-10' },
];

export const InstructorCourseEditContentPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementBody, setAnnouncementBody] = useState('');
    const [announcementPinned, setAnnouncementPinned] = useState(false);
    const [announcements, setAnnouncements] = useState<Array<{
        id: string;
        title: string;
        date: string;
        pinned: boolean;
        attachmentName?: string;
    }>>([
        { id: '1', title: 'Welcome to the Course', date: '2024-02-01', pinned: true },
        { id: '2', title: 'Assignment 1 posted', date: '2024-02-05', pinned: false },
    ]);

    // Content state
    const [lectures, setLectures] = useState(initialLectures);
    const [generalMaterials, setGeneralMaterials] = useState(initialGeneralMaterials);
    const [courseAssignments] = useState(initialAssignments);
    const [courseQuizzes] = useState(initialQuizzes);
    const [students] = useState(initialStudents);
    const [enrollmentRequests, setEnrollmentRequests] = useState(initialEnrollmentRequests);

    // Inline add forms state
    const [newLecture, setNewLecture] = useState({ title: '', week: '', length: '', video: '' });
    const [addMaterialForLectureId, setAddMaterialForLectureId] = useState<string | null>(null);
    const [newLectureMaterial, setNewLectureMaterial] = useState({ name: '', type: 'PDF', size: '' });
    const [newGeneralMaterial, setNewGeneralMaterial] = useState({ name: '', type: 'PDF', size: '' });
    const [announcementAttachment, setAnnouncementAttachment] = useState<File | null>(null);

    // Enrollment filters
    const [enrollFilterStatus, setEnrollFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollPage, setEnrollPage] = useState(1);
    const enrollPageSize = 5;

    const tabs = ['Overview', 'Lectures & Materials', 'Assignments', 'Quizzes', 'Announcements', 'Students & Progress', 'Enrollments Requests'];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Video':
                return <Video className="w-4 h-4 text-red-500" />;
            case 'PDF':
                return <FileText className="w-4 h-4 text-red-600" />;
            case 'PPT':
                return <Presentation className="w-4 h-4 text-orange-500" />;
            case 'Quiz':
                return <HelpCircle className="w-4 h-4 text-blue-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'Published') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-green-100 text-green-800">
                    Published
                </span>
            );
        }

        if (status === 'Scheduled') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-blue-100 text-blue-800">
                    Scheduled
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-yellow-100 text-yellow-800">
                Draft
            </span>
        );
    };

    const courseStats = [
        { label: 'Total Students', value: '45', icon: Users, color: 'text-blue-600' },
        { label: 'Modules', value: '8', icon: BookOpen, color: 'text-green-600' },
        { label: 'Start Date', value: 'Jan 15', icon: Calendar, color: 'text-purple-600' },
        { label: 'Materials', value: '12', icon: FileText, color: 'text-orange-600' }
    ];

    const handleAddAnnouncement = () => {
        if (!announcementTitle.trim() || !announcementBody.trim()) {
            return;
        }

        const newAnnouncement = {
            id: Date.now().toString(),
            title: announcementTitle,
            date: 'Today',
            pinned: announcementPinned,
            attachmentName: announcementAttachment ? announcementAttachment.name : undefined,
        };

        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setAnnouncementTitle('');
        setAnnouncementBody('');
        setAnnouncementPinned(false);
        setAnnouncementAttachment(null);
    };

    const togglePinAnnouncement = (id: string) => {
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));
    };

    // Lectures & Materials CRUD
    const addLecture = () => {
        if (!newLecture.title.trim() || !newLecture.week.trim() || !newLecture.length.trim()) return;
        if (newLecture.video && !newLecture.video.toLowerCase().endsWith('.mp4')) return;
        const id = `lec-${Date.now()}`;
        setLectures((prev) => [{ id, title: newLecture.title, week: newLecture.week, length: newLecture.length, video: newLecture.video, resources: [] }, ...prev]);
        setNewLecture({ title: '', week: '', length: '', video: '' });
    };

    const deleteLecture = (id: string) => {
        setLectures((prev) => prev.filter((l) => l.id !== id));
    };

    const addMaterialToLecture = (lectureId: string) => {
        if (!newLectureMaterial.name.trim() || !newLectureMaterial.size.trim()) return;
        setLectures((prev) =>
            prev.map((l) => (l.id === lectureId ? { ...l, resources: [{ id: `res-${Date.now()}`, name: newLectureMaterial.name, type: newLectureMaterial.type, size: newLectureMaterial.size }, ...l.resources] } : l))
        );
        setAddMaterialForLectureId(null);
        setNewLectureMaterial({ name: '', type: 'PDF', size: '' });
    };

    const deleteLectureMaterial = (lectureId: string, resId: string) => {
        setLectures((prev) => prev.map((l) => (l.id === lectureId ? { ...l, resources: l.resources.filter((r) => r.id !== resId) } : l)));
    };

    const addGeneralMaterial = () => {
        if (!newGeneralMaterial.name.trim() || !newGeneralMaterial.size.trim()) return;
        setGeneralMaterials((prev) => [{ id: `mat-${Date.now()}`, name: newGeneralMaterial.name, type: newGeneralMaterial.type, size: newGeneralMaterial.size, status: 'Draft' }, ...prev]);
        setNewGeneralMaterial({ name: '', type: 'PDF', size: '' });
    };

    const deleteGeneralMaterial = (id: string) => {
        setGeneralMaterials((prev) => prev.filter((m) => m.id !== id));
    };

    // Students & Progress CSV
    const downloadStudentCSV = () => {
        const headers = ['Name', 'Progress', 'Assignments', 'Quizzes', 'Last Active'];
        const rows = students.map((s) => [s.name, s.progress, s.assignments, s.quizzes, s.lastActive].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_progress.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Enrollment filtering and pagination
    const filteredEnrollments = useMemo(() => {
        return enrollmentRequests.filter((r) => {
            const statusOk = enrollFilterStatus === 'all' || r.status === enrollFilterStatus;
            const nameOk = !enrollSearch || r.name.toLowerCase().includes(enrollSearch.toLowerCase());
            return statusOk && nameOk;
        });
    }, [enrollmentRequests, enrollFilterStatus, enrollSearch]);

    const totalEnrollPages = Math.ceil(filteredEnrollments.length / enrollPageSize) || 1;
    const enrollStart = (enrollPage - 1) * enrollPageSize;
    const pagedEnrollments = filteredEnrollments.slice(enrollStart, enrollStart + enrollPageSize);

    const setEnrollmentStatus = (id: string, status: 'Approved' | 'Rejected') => {
        setEnrollmentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    };

    const renderContent = () => {
        if (activeTab === 'Overview') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Course overview</h3>
                            <p className="text-gray-700 leading-relaxed">
                                Students explore foundational psychological theories, research methods, and cognitive processes. The course combines short lectures with practice activities and weekly reflections to reinforce learning.
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Weekly lectures with downloadable slides and readings</li>
                                <li>Two major assignments and three graded quizzes</li>
                                <li>Built-in announcements and enrollment approvals</li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Completion rate</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">76%</p>
                                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Up 4% this week
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Average grade</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">B+</p>
                                <p className="text-sm text-gray-600 mt-1">Based on 3 graded items</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Active students</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">38</p>
                                <p className="text-sm text-blue-600 mt-1">7 pending enrollments</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Upcoming due dates</p>
                                <p className="text-lg font-semibold text-gray-900 mt-1">Quiz 2 • Feb 28</p>
                                <p className="text-sm text-gray-600">Assignment 2 • Mar 05</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Lectures & Materials') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Lectures</h3>
                            {/* Add lecture form */}
                            <div className="grid sm:grid-cols-4 gap-3 items-end">
                                <input value={newLecture.title} onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })} placeholder="Title" className="border border-gray-300 rounded-lg px-3 py-2" />
                                <input value={newLecture.week} onChange={(e) => setNewLecture({ ...newLecture, week: e.target.value })} placeholder="Week" className="border border-gray-300 rounded-lg px-3 py-2" />
                                <input value={newLecture.length} onChange={(e) => setNewLecture({ ...newLecture, length: e.target.value })} placeholder="Length (mm:ss)" className="border border-gray-300 rounded-lg px-3 py-2" />
                                <div className="flex gap-2">
                                    <input value={newLecture.video} onChange={(e) => setNewLecture({ ...newLecture, video: e.target.value })} placeholder="Video filename.mp4" className="flex-1 border border-gray-300 rounded-lg px-3 py-2" />
                                    <button onClick={addLecture} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Add Lecture</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {lectures.map((lecture) => (
                                    <div key={lecture.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-gray-600">{lecture.week}</p>
                                                <h4 className="text-lg font-semibold text-gray-900">{lecture.title}</h4>
                                                <p className="text-sm text-gray-600">Video • {lecture.length}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
                                                    <Eye className="w-4 h-4" /> Preview
                                                </button>
                                                <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
                                                    <Edit className="w-4 h-4" /> Edit
                                                </button>
                                                <button onClick={() => deleteLecture(lecture.id)} className="text-red-600 text-sm font-medium flex items-center gap-1">
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                                            <Video className="w-4 h-4 text-red-500" /> {lecture.video}
                                        </div>
                                        <div className="mt-4 grid sm:grid-cols-2 gap-2">
                                            {lecture.resources.map((res) => (
                                                <div key={res.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                                    {getTypeIcon(res.type)}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{res.name}</p>
                                                        <p className="text-gray-600">{res.type} • {res.size}</p>
                                                    </div>
                                                    <button onClick={() => deleteLectureMaterial(lecture.id, res.id)} className="ml-auto text-red-600 text-xs">Delete</button>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Add material to lecture */}
                                        {addMaterialForLectureId === lecture.id ? (
                                            <div className="mt-3 grid sm:grid-cols-4 gap-2 items-end">
                                                <input value={newLectureMaterial.name} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, name: e.target.value })} placeholder="Material name" className="border border-gray-300 rounded-lg px-3 py-2" />
                                                <select value={newLectureMaterial.type} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, type: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2">
                                                    <option>PDF</option>
                                                    <option>PPT</option>
                                                    <option>DOC</option>
                                                </select>
                                                <input value={newLectureMaterial.size} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, size: e.target.value })} placeholder="Size (e.g., 1.2 MB)" className="border border-gray-300 rounded-lg px-3 py-2" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => addMaterialToLecture(lecture.id)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Add</button>
                                                    <button onClick={() => { setAddMaterialForLectureId(null); setNewLectureMaterial({ name: '', type: 'PDF', size: '' }); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setAddMaterialForLectureId(lecture.id)} className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Add material to lecture
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">General materials</h3>
                                <button onClick={addGeneralMaterial} className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                    <Plus className="w-4 h-4" /> Add material
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                <input value={newGeneralMaterial.name} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, name: e.target.value })} placeholder="Material name" className="border border-gray-300 rounded-lg px-3 py-2" />
                                <select value={newGeneralMaterial.type} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, type: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2">
                                    <option>PDF</option>
                                    <option>PPT</option>
                                    <option>DOC</option>
                                </select>
                                <input value={newGeneralMaterial.size} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, size: e.target.value })} placeholder="Size (e.g., 1.0 MB)" className="border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div className="grid md:grid-cols-3 gap-3">
                                {generalMaterials.map((mat) => (
                                    <div key={mat.id} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                                        {getTypeIcon(mat.type)}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{mat.name}</p>
                                            <p className="text-sm text-gray-600">{mat.type} • {mat.size}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                {getStatusBadge(mat.status)}
                                                <button className="text-sm text-blue-600 flex items-center gap-1">
                                                    <Edit className="w-4 h-4" /> Edit
                                                </button>
                                                <button onClick={() => deleteGeneralMaterial(mat.id)} className="text-sm text-red-600 flex items-center gap-1">
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Assignments') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        {courseAssignments.map((assignment) => (
                            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Due {assignment.due}</p>
                                        <h4 className="text-lg font-semibold text-gray-900">{assignment.title}</h4>
                                        <p className="text-sm text-gray-600">Weight {assignment.weight} • Attempts {assignment.attempts}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(assignment.status)}
                                        <span className="text-sm text-gray-600">{assignment.submissions} submissions</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className="text-sm font-medium text-blue-600 flex items-center gap-1">
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', assignment.id))}
                                        className="text-sm font-medium text-blue-600 flex items-center gap-1"
                                    >
                                        <Eye className="w-4 h-4" /> View submissions
                                    </button>
                                    <button className="text-sm font-medium text-red-600 flex items-center gap-1">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE)} className="w-full border border-dashed border-gray-300 text-blue-600 font-medium py-3 rounded-lg flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> New assignment
                        </button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Quizzes') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        {courseQuizzes.map((quiz) => (
                            <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">{quiz.title}</h4>
                                        <p className="text-sm text-gray-600">Attempts {quiz.attempts} • Time limit {quiz.timeLimit}</p>
                                        <p className="text-sm text-gray-600">Release: {quiz.release}</p>
                                        <p className="text-sm text-gray-600">Submissions: {quiz.submissions}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(quiz.status)}
                                        <button className="text-sm text-blue-600 flex items-center gap-1">
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                        <button className="text-sm text-red-600 flex items-center gap-1">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_CREATE)} className="w-full border border-dashed border-gray-300 text-blue-600 font-medium py-3 rounded-lg flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Create quiz
                        </button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Announcements') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Post an announcement</h3>
                            <input
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                placeholder="Title"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                value={announcementBody}
                                onChange={(e) => setAnnouncementBody(e.target.value)}
                                placeholder="Write your announcement..."
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={announcementPinned}
                                    onChange={(e) => setAnnouncementPinned(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                />
                                Pin announcement
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Attachment (optional)</label>
                                <input type="file" onChange={(e) => setAnnouncementAttachment(e.target.files?.[0] || null)} className="text-sm" />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAddAnnouncement}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg"
                                >
                                    Post announcement
                                </button>
                                <button className="text-gray-700 font-medium">Cancel</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">Recent announcements</h3>
                            {announcements.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                                    {item.pinned ? (
                                        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                                    ) : (
                                        <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900">{item.title}</p>
                                            {item.pinned && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Pinned</span>}
                                        </div>
                                        <p className="text-sm text-gray-600">{item.date} {item.attachmentName && `• Attachment: ${item.attachmentName}`}</p>
                                    </div>
                                    <button onClick={() => togglePinAnnouncement(item.id)} className="text-sm text-blue-600 flex items-center gap-1 mr-2">
                                        <Edit className="w-4 h-4" /> {item.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button className="text-sm text-red-600 flex items-center gap-1">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Students & Progress') {
            return (
                <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-900">Progress overview</h3>
                            <button onClick={downloadStudentCSV} className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Assignments</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quizzes</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Last active</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id} className="border-b border-gray-200">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{student.progress}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{student.assignments}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{student.quizzes}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{student.lastActive}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <button className="text-blue-600 font-medium flex items-center gap-1">
                                                    <Eye className="w-4 h-4" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                <div className="p-6 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Status</label>
                            <select value={enrollFilterStatus} onChange={(e) => { setEnrollFilterStatus(e.target.value as any); setEnrollPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                <option value="all">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <input value={enrollSearch} onChange={(e) => { setEnrollSearch(e.target.value); setEnrollPage(1); }} placeholder="Search student name..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                    </div>
                    {pagedEnrollments.map((req) => (
                        <div key={req.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">
                                    {req.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{req.name}</p>
                                    <p className="text-sm text-gray-600">{req.email}</p>
                                    <p className="text-sm text-gray-600">Requested {req.requestedAt}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {req.status === 'Approved' && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Approved</span>}
                                {req.status === 'Rejected' && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Rejected</span>}
                                {req.status === 'Pending' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>}
                                <button onClick={() => setEnrollmentStatus(req.id, 'Approved')} className="text-sm text-green-700 border border-green-200 rounded-md px-3 py-1 flex items-center gap-1">
                                    <UserCheck className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={() => setEnrollmentStatus(req.id, 'Rejected')} className="text-sm text-red-700 border border-red-200 rounded-md px-3 py-1 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-gray-600">Page {enrollPage} of {totalEnrollPages}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setEnrollPage(Math.max(1, enrollPage - 1))} disabled={enrollPage === 1} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
                            {Array.from({ length: totalEnrollPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setEnrollPage(p)} className={`px-3 py-1 rounded-lg text-sm ${p === enrollPage ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}>{p}</button>
                            ))}
                            <button onClick={() => setEnrollPage(Math.min(totalEnrollPages, enrollPage + 1))} disabled={enrollPage === totalEnrollPages} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-[36px] font-bold text-gray-900">Introduction to Psychology</h1>
                    <p className="text-[18px] text-gray-600 mt-1">PSYCH 101 - Spring 2024</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
                        <Upload className="w-5 h-5" />
                        Upload Content
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
                        <Plus className="w-5 h-5" />
                        Add Content
                    </button>
                </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {courseStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-[20px] font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-[14px] text-gray-600">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-t-lg border border-gray-200">
                <div className="flex px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-[16px] font-medium transition-colors border-b-2 ${activeTab === tab
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {renderContent()}
        </div>
    );
};
