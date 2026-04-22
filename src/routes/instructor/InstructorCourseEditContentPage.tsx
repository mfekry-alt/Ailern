import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useCourseQuizzes, useDeleteQuiz } from '@/features/quizzes/api';
import { useCourse } from '@/features/courses/api';
import { QUERY_KEYS } from '@/lib/constants';
import { quizService } from '@/api/services';
import { DeleteQuizDialog } from '@/components/ui/DeleteQuizDialog';
import { QuizStatusSelect } from '@/components/QuizStatusSelect';
import {
    Plus, Eye, Edit, Trash2, Upload, Filter, FileText, Video,
    Presentation, HelpCircle, Users, Calendar, BookOpen, CheckCircle,
    AlertCircle, Mail, Download, UserCheck, XCircle, Settings, ChevronRight, LayoutGrid, Loader2
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
    const { id: courseId } = useParams<{ id: string }>();
    const numericCourseId = useMemo(() => {
        const parsed = Number(courseId);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [courseId]);

    const quizzesCourseId = courseId ?? '';
    const { data: courseDetails, isLoading: courseLoading } = useCourse(numericCourseId ?? 0);
    const [activeTab, setActiveTab] = useState('Overview');

    // Announcements State
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
    const { data: courseQuizzes = [], isLoading: quizzesLoading } = useCourseQuizzes(quizzesCourseId);
    const deleteQuizMutation = useDeleteQuiz(quizzesCourseId);
    const [quizToDelete, setQuizToDelete] = useState<{ id: string; title: string } | null>(null);
    const [students] = useState(initialStudents);
    const [enrollmentRequests, setEnrollmentRequests] = useState(initialEnrollmentRequests);

    // Inline add forms state
    const [newLecture, setNewLecture] = useState({ title: '', week: '', length: '', video: '' });
    const [addMaterialForLectureId, setAddMaterialForLectureId] = useState<string | null>(null);
    const [newLectureMaterial, setNewLectureMaterial] = useState({ name: '', type: 'PDF', size: '' });
    const [newGeneralMaterial, setNewGeneralMaterial] = useState({ name: '', type: 'PDF', size: '' });
    const [announcementAttachment, setAnnouncementAttachment] = useState<File | null>(null);

    // Filters & Pagination
    const [enrollFilterStatus, setEnrollFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
    const [enrollSearch, setEnrollSearch] = useState('');
    const [quizFilterStatus, setQuizFilterStatus] = useState<'all' | 'Published' | 'Draft' | 'Scheduled'>('all');
    const [quizSortBy, setQuizSortBy] = useState<'title' | 'date' | 'submissions'>('date');
    const [quizSearch, setQuizSearch] = useState('');
    const [enrollPage, setEnrollPage] = useState(1);
    const enrollPageSize = 5;
    const quizDetailsQueries: any[] = [];

    const tabs = ['Overview', 'Lectures & Materials', 'Assignments', 'Quizzes', 'Announcements', 'Students & Progress', 'Enrollments Requests'];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Video': return <Video className="w-4 h-4 text-red-500" />;
            case 'PDF': return <FileText className="w-4 h-4 text-red-500" />;
            case 'PPT': return <Presentation className="w-4 h-4 text-orange-500" />;
            case 'Quiz': return <HelpCircle className="w-4 h-4 text-blue-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'Published') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Published</span>;
        }
        if (status === 'Scheduled') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#21A9FF]/10 border border-[#21A9FF]/20 text-[#21A9FF] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">Scheduled</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">Draft</span>;
    };

    const getEnrollStatusBadge = (status: string) => {
        if (status === 'Approved') return <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-md">Approved</span>;
        if (status === 'Rejected') return <span className="text-[11px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 px-2.5 py-1 rounded-md">Rejected</span>;
        return <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 px-2.5 py-1 rounded-md">Pending</span>;
    };

    const courseStats = useMemo(() => {
        const createdAt = courseDetails?.createdAt ? new Date(courseDetails.createdAt).toLocaleDateString() : '—';
        return [
            { label: 'Course ID', value: courseDetails?.id?.toString() ?? '—', icon: Users, color: 'text-[#21A9FF]', bg: 'bg-[#21A9FF]/10' },
            { label: 'Course Code', value: courseDetails?.code ?? '—', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Created At', value: createdAt, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
            { label: 'Status', value: courseDetails?.courseStatus ?? 'Draft', icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' }
        ];
    }, [courseDetails]);

    // Handlers
    const handleAddAnnouncement = () => {
        if (!announcementTitle.trim() || !announcementBody.trim()) return;
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

    const addLecture = () => {
        if (!newLecture.title.trim() || !newLecture.week.trim() || !newLecture.length.trim()) return;
        if (newLecture.video && !newLecture.video.toLowerCase().endsWith('.mp4')) return;
        const id = `lec-${Date.now()}`;
        setLectures((prev) => [{ id, title: newLecture.title, week: newLecture.week, length: newLecture.length, video: newLecture.video, resources: [] }, ...prev]);
        setNewLecture({ title: '', week: '', length: '', video: '' });
    };

    const deleteLecture = (id: string) => setLectures((prev) => prev.filter((l) => l.id !== id));

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

    const deleteGeneralMaterial = (id: string) => setGeneralMaterials((prev) => prev.filter((m) => m.id !== id));

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

    const filteredEnrollments = useMemo(() => {
        return enrollmentRequests.filter((r) => {
            const statusOk = enrollFilterStatus === 'all' || r.status === enrollFilterStatus;
            const nameOk = !enrollSearch || r.name.toLowerCase().startsWith(enrollSearch.toLowerCase());
            return statusOk && nameOk;
        });
    }, [enrollmentRequests, enrollFilterStatus, enrollSearch]);

    const totalEnrollPages = Math.ceil(filteredEnrollments.length / enrollPageSize) || 1;
    const enrollStart = (enrollPage - 1) * enrollPageSize;
    const pagedEnrollments = filteredEnrollments.slice(enrollStart, enrollStart + enrollPageSize);

    const filteredQuizzes = useMemo(() => {
        const normalizedSearch = quizSearch.trim().toLowerCase();
        const quizArray = Array.isArray(courseQuizzes) ? courseQuizzes : [];
        const filtered = quizArray.filter((q) => {
            const apiStatus = String((q as any).quizStatus ?? (q as any).status ?? '').toLowerCase();
            const selectedStatus = quizFilterStatus.toLowerCase();
            const statusOk = quizFilterStatus === 'all' || apiStatus === selectedStatus;
            const title = String(q.title ?? '').toLowerCase();
            const searchOk = !normalizedSearch || title.startsWith(normalizedSearch);
            return statusOk && searchOk;
        });

        return filtered.sort((a, b) => {
            if (quizSortBy === 'title') return String(a.title ?? '').localeCompare(String(b.title ?? ''));
            if (quizSortBy === 'submissions') return Number((b as any).submissionsCount ?? 0) - Number((a as any).submissionsCount ?? 0);
            return new Date((b as any).createdAt ?? 0).getTime() - new Date((a as any).createdAt ?? 0).getTime();
        });
    }, [courseQuizzes, quizFilterStatus, quizSortBy, quizSearch]);

    const quizStatsById = useMemo(() => {
        const stats = new Map<string, { questionsCount: number; totalPoints: number }>();
        const quizArray = Array.isArray(courseQuizzes) ? courseQuizzes : [];
        quizArray.forEach((quiz, index) => {
            const details = quizDetailsQueries[index]?.data as any;
            if (!details) return;
            const questions = Array.isArray(details.questions) ? details.questions : [];
            const questionsCount = questions.length > 0 ? questions.length : Number(details.questionsCount ?? 0);
            const totalPoints = questions.length > 0 ? questions.reduce((sum: number, q: any) => sum + Number(q?.mark ?? 0), 0) : Number(details.totalPoints ?? 0);
            stats.set(String(quiz.id), { questionsCount, totalPoints });
        });
        return stats;
    }, [courseQuizzes, quizDetailsQueries]);

    const setEnrollmentStatus = (id: string, status: 'Approved' | 'Rejected') => {
        setEnrollmentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    };

    const renderContent = () => {
        if (activeTab === 'Overview') {
            return (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-[#21A9FF]" /> Course Overview
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                                {courseDetails?.description || 'No description available. You can add a detailed description of your course content, objectives, and outcomes here.'}
                            </p>
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Quick Highlights</h4>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#21A9FF]"></div> Weekly lectures with downloadable slides and readings</li>
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Two major assignments and three graded quizzes</li>
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Built-in announcements and enrollment approvals</li>
                                </ul>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Completion Rate</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">76%</p>
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Up 4% this week
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Average Grade</p>
                                <p className="text-4xl font-black text-[#21A9FF] mb-2">B+</p>
                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Based on 3 graded items</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Active Students</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">38</p>
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">7 pending enrollments</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Next Deadline</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Quiz 2</p>
                                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Feb 28, 2024
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Lectures & Materials') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Add Lecture Card */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#21A9FF]" /> Add New Lecture
                        </h3>
                        <div className="grid sm:grid-cols-12 gap-4 items-end">
                            <div className="sm:col-span-3">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Title</label>
                                <input value={newLecture.title} onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })} placeholder="e.g. Intro to ML" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Week</label>
                                <input value={newLecture.week} onChange={(e) => setNewLecture({ ...newLecture, week: e.target.value })} placeholder="Week 1" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Duration</label>
                                <input value={newLecture.length} onChange={(e) => setNewLecture({ ...newLecture, length: e.target.value })} placeholder="45:00" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all" />
                            </div>
                            <div className="sm:col-span-3">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Video File</label>
                                <input value={newLecture.video} onChange={(e) => setNewLecture({ ...newLecture, video: e.target.value })} placeholder="video.mp4" className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all" />
                            </div>
                            <div className="sm:col-span-2">
                                <button onClick={addLecture} className="w-full bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 active:scale-95 text-sm">Add</button>
                            </div>
                        </div>
                    </div>

                    {/* Lectures List */}
                    <div className="space-y-4">
                        {lectures.map((lecture) => (
                            <div key={lecture.id} className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-600"></div>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 ml-2">
                                    <div>
                                        <span className="text-xs font-bold text-[#21A9FF] uppercase tracking-wider bg-[#21A9FF]/10 px-2.5 py-1 rounded-md border border-[#21A9FF]/20 mb-2 inline-block">
                                            {lecture.week}
                                        </span>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{lecture.title}</h4>
                                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-red-500" /> {lecture.video} • {lecture.length}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <button className="p-2 text-gray-600 dark:text-slate-300 hover:text-[#21A9FF] hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Preview"><Eye className="w-4 h-4" /></button>
                                        <button className="p-2 text-gray-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => deleteLecture(lecture.id)} className="p-2 text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <div className="ml-2 pl-4 border-l-2 border-gray-100 dark:border-slate-700/50 space-y-3 mt-6">
                                    {lecture.resources.map((res) => (
                                        <div key={res.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl p-3 hover:border-blue-200 dark:hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                                    {getTypeIcon(res.type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{res.name}</p>
                                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{res.type} • {res.size}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteLectureMaterial(lecture.id, res.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {addMaterialForLectureId === lecture.id ? (
                                        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 mt-4">
                                            <div className="grid sm:grid-cols-12 gap-3 items-end">
                                                <div className="sm:col-span-5">
                                                    <input value={newLectureMaterial.name} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, name: e.target.value })} placeholder="Material Name" className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white" />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <select value={newLectureMaterial.type} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, type: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white">
                                                        <option>PDF</option><option>PPT</option><option>DOC</option>
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <input value={newLectureMaterial.size} onChange={(e) => setNewLectureMaterial({ ...newLectureMaterial, size: e.target.value })} placeholder="Size" className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white" />
                                                </div>
                                                <div className="sm:col-span-2 flex gap-2">
                                                    <button onClick={() => addMaterialToLecture(lecture.id)} className="flex-1 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold py-2 rounded-lg transition-all text-sm shadow-sm">Save</button>
                                                    <button onClick={() => { setAddMaterialForLectureId(null); setNewLectureMaterial({ name: '', type: 'PDF', size: '' }); }} className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold py-2 rounded-lg transition-all text-sm">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setAddMaterialForLectureId(lecture.id)} className="flex items-center gap-2 text-sm font-bold text-[#21A9FF] hover:text-[#0094F2] mt-2 px-2 py-1 rounded-md hover:bg-[#21A9FF]/10 transition-colors w-fit">
                                            <Plus className="w-4 h-4" /> Add Material
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* General Materials Section */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" /> General Course Materials
                            </h3>
                        </div>

                        {/* Add General Material Form */}
                        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 mb-6">
                            <div className="grid sm:grid-cols-12 gap-3 items-end">
                                <div className="sm:col-span-5">
                                    <input value={newGeneralMaterial.name} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, name: e.target.value })} placeholder="Document Name" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white" />
                                </div>
                                <div className="sm:col-span-3">
                                    <select value={newGeneralMaterial.type} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, type: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white">
                                        <option>PDF</option><option>PPT</option><option>DOC</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <input value={newGeneralMaterial.size} onChange={(e) => setNewGeneralMaterial({ ...newGeneralMaterial, size: e.target.value })} placeholder="Size" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white" />
                                </div>
                                <div className="sm:col-span-2">
                                    <button onClick={addGeneralMaterial} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95 text-sm">Add File</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generalMaterials.map((mat) => (
                                <div key={mat.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col group hover:border-indigo-300 dark:hover:border-slate-500 transition-colors shadow-sm">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-800">
                                            {getTypeIcon(mat.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{mat.name}</p>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{mat.type} • {mat.size}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-3">
                                        {getStatusBadge(mat.status)}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => deleteGeneralMaterial(mat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Assignments') {
            return (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" /> Course Assignments
                        </h3>
                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE)} className="flex items-center gap-2 bg-[#21A9FF] hover:bg-[#0094F2] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 active:scale-95">
                            <Plus className="w-4 h-4" /> New Assignment
                        </button>
                    </div>

                    <div className="space-y-4">
                        {courseAssignments.map((assignment) => (
                            <div key={assignment.id} className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-slate-500 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        {getStatusBadge(assignment.status)}
                                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> Due {new Date(assignment.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{assignment.title}</h4>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                                        <span>Weight: {assignment.weight}</span>
                                        <span>•</span>
                                        <span>{assignment.attempts} Attempts Allowed</span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="text-center px-4 border-r border-gray-100 dark:border-slate-700 hidden sm:block">
                                        <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{assignment.submissions}</p>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">Submissions</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS.replace(':assignmentId', assignment.id))} className="p-2.5 bg-[#21A9FF]/10 text-[#21A9FF] hover:bg-[#21A9FF]/20 rounded-lg transition-colors" title="View Submissions">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="p-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'Quizzes') {
            return (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-purple-500" /> Course Quizzes
                        </h3>
                        <button onClick={() => navigate(`/courses/${quizzesCourseId}/quiz/create`)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-purple-500/25 active:scale-95">
                            <Plus className="w-4 h-4" /> Create Quiz
                        </button>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-3 mb-6">
                        <div className="flex-1 relative">
                            <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <select
                                value={quizFilterStatus}
                                onChange={(e) => setQuizFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                                <option value="Scheduled">Scheduled</option>
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <select
                                value={quizSortBy}
                                onChange={(e) => setQuizSortBy(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="title">Sort by Title</option>
                                <option value="submissions">Sort by Submissions</option>
                            </select>
                        </div>
                        <div className="flex-[2]">
                            <input
                                value={quizSearch}
                                onChange={(e) => setQuizSearch(e.target.value)}
                                placeholder="Search quizzes by title..."
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {quizzesLoading ? (
                        <div className="py-12 flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                            <p className="text-gray-500 dark:text-slate-400 font-medium">Loading quizzes...</p>
                        </div>
                    ) : filteredQuizzes.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No quizzes found</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Try adjusting your search or filter criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredQuizzes.map((quiz) => {
                                const stats = quizStatsById.get(String(quiz.id));
                                const questionsCount = Number(stats?.questionsCount ?? (quiz as any).questionsCount ?? 0);
                                const totalPoints = Number(stats?.totalPoints ?? (quiz as any).totalPoints ?? 0);

                                return (
                                    <div key={quiz.id} className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col group hover:shadow-md hover:border-purple-300 dark:hover:border-slate-500 transition-all">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="min-w-0 flex-1">
                                                {String((quiz as any).quizStatus ?? (quiz as any).status ?? '') === 'Scheduled' && (
                                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Scheduled</p>
                                                )}
                                                <QuizStatusSelect
                                                    quizId={quiz.id}
                                                    courseId={quizzesCourseId}
                                                    status={String((quiz as any).quizStatus ?? (quiz as any).status ?? 'Draft')}
                                                />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                                <button onClick={() => navigate(ROUTES.INSTRUCTOR_QUIZ_EDIT.replace(':id', quiz.id.toString()))} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuizToDelete({ id: quiz.id, title: quiz.title })}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-2">{quiz.title}</h4>
                                        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-200 dark:border-slate-700 pt-4">
                                            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2 border border-gray-100 dark:border-slate-700">
                                                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">Questions</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">{questionsCount}</p>
                                            </div>
                                            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2 border border-gray-100 dark:border-slate-700">
                                                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">Total Pts</p>
                                                <p className="text-lg font-black text-purple-600 dark:text-purple-400">{totalPoints}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === 'Announcements') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Create Announcement */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-amber-500" /> Broadcast Announcement
                        </h3>
                        <div className="space-y-4">
                            <input
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                placeholder="Subject / Title"
                                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-gray-900 dark:text-white transition-all"
                            />
                            <textarea
                                value={announcementBody}
                                onChange={(e) => setAnnouncementBody(e.target.value)}
                                placeholder="Write your message to students here..."
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-gray-900 dark:text-white transition-all resize-none"
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={announcementPinned}
                                            onChange={(e) => setAnnouncementPinned(e.target.checked)}
                                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                                        />
                                        Pin to top
                                    </label>
                                    <div className="h-6 w-px bg-gray-300 dark:bg-slate-600 hidden sm:block"></div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                        <Upload className="w-4 h-4" /> Attach File
                                        <input type="file" className="hidden" onChange={(e) => setAnnouncementAttachment(e.target.files?.[0] || null)} />
                                    </label>
                                    {announcementAttachment && <span className="text-xs text-gray-500 truncate max-w-[100px]">{announcementAttachment.name}</span>}
                                </div>
                                <button
                                    onClick={handleAddAnnouncement}
                                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-amber-500/25 active:scale-95 text-sm"
                                >
                                    Publish Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Announcements List */}
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Announcements</h3>
                        <div className="space-y-4">
                            {announcements.map((item) => (
                                <div key={item.id} className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row gap-4 ${item.pinned ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30' : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {item.pinned && <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pinned</span>}
                                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{item.date}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                        {item.attachmentName && <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2"><FileText className="w-3.5 h-3.5" /> Attached: {item.attachmentName}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => togglePinAnnouncement(item.id)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-amber-600 transition-colors">
                                            {item.pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Students & Progress') {
            return (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" /> Student Progress
                        </h3>
                        <button onClick={downloadStudentCSV} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all shadow-sm">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Student Name</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Completion</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Assignments</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Quizzes</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Last Active</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: student.progress }}></div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{student.progress}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-md bg-[#21A9FF]/10 text-[#21A9FF] font-bold text-xs border border-[#21A9FF]/20">{student.assignments}</span></td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold text-xs border border-purple-100 dark:border-purple-500/20">{student.quizzes}</span></td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-slate-400">{student.lastActive}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-[#21A9FF] hover:bg-[#21A9FF]/10 rounded-lg transition-colors" title="View Profile">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (activeTab === 'Enrollments Requests') {
            return (
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-gray-200 dark:border-slate-700 flex gap-2">
                            {['all', 'Pending', 'Approved', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setEnrollFilterStatus(status as any); setEnrollPage(1); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all capitalize ${enrollFilterStatus === status ? 'bg-white dark:bg-slate-800 text-[#21A9FF] shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1">
                            <input
                                value={enrollSearch}
                                onChange={(e) => { setEnrollSearch(e.target.value); setEnrollPage(1); }}
                                placeholder="Search by student name..."
                                className="w-full h-full px-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white text-sm font-semibold"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pagedEnrollments.map((req) => (
                            <div key={req.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-gray-700 dark:text-white font-black text-lg shadow-inner">
                                        {req.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{req.name}</h4>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">{req.email} • Requested {req.requestedAt}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getEnrollStatusBadge(req.status)}
                                    {req.status === 'Pending' && (
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
                                            <button onClick={() => setEnrollmentStatus(req.id, 'Approved')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button onClick={() => setEnrollmentStatus(req.id, 'Rejected')} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {pagedEnrollments.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-slate-400 font-medium">
                                No requests found.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalEnrollPages > 1 && (
                        <div className="flex items-center justify-between mt-8 border-t border-gray-100 dark:border-slate-800 pt-6">
                            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">Page {enrollPage} of {totalEnrollPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setEnrollPage(Math.max(1, enrollPage - 1))} disabled={enrollPage === 1} className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-white disabled:opacity-50 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700/80">Prev</button>
                                <button onClick={() => setEnrollPage(Math.min(totalEnrollPages, enrollPage + 1))} disabled={enrollPage === totalEnrollPages} className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-white disabled:opacity-50 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700/80">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Page Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {courseLoading ? 'Loading Course...' : (courseDetails?.name || 'Manage Course Content')}
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400 font-semibold mt-1">
                                {courseDetails?.code || (courseId ? `Course #${courseId}` : 'Mock Course')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-sm">
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-95">
                            <Upload className="w-4 h-4" /> Publish Content
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation (Pills Style) */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 p-2 bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-gray-200 dark:border-slate-700/50 shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                {renderContent()}

            </div>

            <DeleteQuizDialog
                open={quizToDelete !== null}
                quizTitle={quizToDelete?.title ?? ''}
                onClose={() => setQuizToDelete(null)}
                onConfirm={() => {
                    if (!quizToDelete) return;
                    deleteQuizMutation.mutate(quizToDelete.id, {
                        onSuccess: () => setQuizToDelete(null),
                    });
                }}
                isPending={deleteQuizMutation.isPending}
            />
        </div>
    );
};