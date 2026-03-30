import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { getSectionsByCourse } from '@/api/services/section.service';
import { getCourseQuizzes } from '@/api/services/quiz.service';
import type { SectionDto } from '@/api/services/section.service';
import type { GetQuizDto } from '@/types/api.types';
import {
    ArrowLeft, Lock, CheckCircle2, User, Layers, ClipboardList,
    ChevronDown, ChevronUp, HelpCircle, FileText, Target, CalendarClock,
    Inbox, CheckSquare, Calendar, ArrowRight, ListChecks
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Helper: Calculate days/hours until quiz is available or closes
const getTimeStatus = (availableFrom: string, availableUntil: string) => {
    const now = new Date();
    const from = new Date(availableFrom);
    const until = new Date(availableUntil);

    if (now < from) {
        const daysUntil = Math.ceil((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'upcoming', message: `Opens in ${daysUntil}d`, badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' };
    }

    if (now > until) {
        return { status: 'closed', message: 'Closed', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30' };
    }

    const daysLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60)) % 24;
    return {
        status: 'available',
        message: daysLeft > 0 ? `${daysLeft}d left` : `${hoursLeft}h left`,
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    };
};

export const CourseDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State Management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<GetQuizDto[]>([]);
    const [sections, setSections] = useState<SectionDto[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // --- API Integration ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch Course Data
                const courseRes = await api.get(`/Courses/${id}`);
                const courseData = courseRes.data?.data || courseRes.data;

                // 2. Check Enrollment & Fetch Assignments
                let assignmentsData: any[] = [];
                let isEnrolled = false;
                try {
                    const assignRes = await api.get(`/Courses/${id}/students/Assignments`);
                    const assignPayload = assignRes.data?.data || assignRes.data;
                    assignmentsData = Array.isArray(assignPayload) ? assignPayload : [];
                    isEnrolled = true;
                } catch (err: any) {
                    if (err.response?.status === 403) {
                        isEnrolled = false;
                    }
                }

                // 3. Fetch Sections (Modules) and Quizzes
                if (isEnrolled && courseData.id) {
                    const sectionsData = await getSectionsByCourse(courseData.id);
                    setSections(sectionsData);

                    try {
                        const quizzesData = await getCourseQuizzes(courseData.id.toString());
                        setQuizzes(quizzesData);
                    } catch (err) {
                        console.warn('Failed to fetch quizzes:', err);
                    }
                }

                // Set Course Data
                setCourse({
                    id: courseData.id,
                    name: courseData.name || 'Untitled Course',
                    code: courseData.code || 'N/A',
                    instructorName: courseData.instructorName || 'Instructor',
                    description: courseData.description || 'No description available for this course. Please contact the instructor for more details.',
                    courseStatus: courseData.courseStatus || 'Active',
                    isEnrolled,
                    progress: Math.floor(Math.random() * 60) + 10, // Mock progress for UI visual
                });

                setAssignments(assignmentsData);
            } catch (err: any) {
                console.error('Failed to fetch course:', err);
                setError(err.response?.data?.message || 'Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id]);

    // --- Render: Loading State ---
    if (loading) {
        return <LoadingSpinner />;
    }

    // --- Render: Error State ---
    if (error || !course) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-8 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-[2rem] max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">{error || 'Course not found'}</p>
                    <button
                        onClick={() => navigate('/my-courses')}
                        className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors w-full"
                    >
                        Back to My Courses
                    </button>
                </div>
            </div>
        );
    }

    // --- Render: Not Enrolled View ---
    if (!course.isEnrolled) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 pb-20">
                <div className="max-w-4xl mx-auto space-y-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-center py-20 px-6">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-blue-500" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{course.name}</h1>
                        <p className="text-lg text-gray-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                            You are not enrolled in this course yet. Enroll now to access modules, assignments, and quizzes.
                        </p>
                        <button
                            onClick={() => {/* TODO: Implement Enroll API Call */ }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-10 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            Enroll Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Render: Enrolled View (Main Layout) ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors w-fit group"
                >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Courses
                </button>

                {/* Hero Section */}
                <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/10">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>

                    <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white mb-6 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                {course.courseStatus}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
                                {course.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm sm:text-base font-medium">
                                <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">{course.code}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span>{course.instructorName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Card in Hero */}
                        <div className="w-full md:w-72 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-5 shrink-0 h-fit">
                            <div className="flex items-center justify-between mb-3 text-white">
                                <span className="text-sm font-semibold">Course Progress</span>
                                <span className="text-lg font-bold">{course.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full relative"
                                    style={{ width: `${course.progress}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                                </div>
                            </div>
                            <button className="w-full mt-5 py-2.5 bg-white text-blue-900 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2 group">
                                Continue Learning
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Assignments</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{assignments.length}</h3>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-purple-500"></div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Modules</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{sections.length}</h3>
                        </div>
                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[1.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{course.courseStatus}</h3>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Two-Column Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content (Left 2 columns) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Course Modules Section */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Modules</h2>
                            </div>

                            {sections.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800/20">
                                    <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                                    <p className="text-gray-500 dark:text-slate-400 font-medium">No modules available yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sections.map((section, idx) => {
                                        const isExpanded = expandedSections.has(section.id);
                                        return (
                                            <div key={section.id} className={`border rounded-2xl overflow-hidden transition-colors ${isExpanded ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-500/5' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-slate-600'}`}>
                                                <button
                                                    onClick={() => {
                                                        const newExpanded = new Set(expandedSections);
                                                        if (isExpanded) newExpanded.delete(section.id);
                                                        else newExpanded.add(section.id);
                                                        setExpandedSections(newExpanded);
                                                    }}
                                                    className="w-full flex items-center justify-between p-4 sm:p-5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                                            {section.sectionNumber}
                                                        </div>
                                                        <h3 className={`font-semibold text-left ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {section.title}
                                                        </h3>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </div>
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-5 py-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm flex items-center gap-2">
                                                            <FileText className="w-4 h-4" /> Section content and lessons will load here
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Assignments Section */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <ListChecks className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assignments</h2>
                                </div>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
                                    {assignments.length} Tasks
                                </span>
                            </div>

                            {assignments.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800/20">
                                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                                    <p className="text-gray-500 dark:text-slate-400 font-medium">No assignments available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {assignments.map((assignment) => (
                                        <div key={assignment.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-slate-500 transition-all hover:shadow-md group cursor-pointer">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{assignment.title}</h3>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-md shrink-0 ml-2">
                                                    {assignment.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-4 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800/50 w-fit">
                                                <Calendar className="w-4 h-4 text-orange-500" />
                                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <button className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-white text-sm font-semibold rounded-xl transition-all">
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quizzes Section */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Quizzes</h2>
                                </div>
                            </div>

                            {quizzes.filter((quiz) => {
                                const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                return timeStatus.status !== 'closed' && quiz.status === 'Published';
                            }).length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800/20">
                                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                                    <p className="text-gray-500 dark:text-slate-400 font-medium">No upcoming quizzes</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quizzes
                                        .filter((quiz) => {
                                            const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                            return timeStatus.status !== 'closed' && quiz.status === 'Published';
                                        })
                                        .slice(0, 3)
                                        .map((quiz) => {
                                            const status = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                            return (
                                                <div key={quiz.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition-all">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1.5 text-lg">{quiz.title}</h3>
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${status.badgeClass}`}>
                                                                {status.status === 'available' ? '🟢 Available' : '⏳ Upcoming'} - {status.message}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}
                                                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-purple-500/25 shrink-0"
                                                        >
                                                            Start Quiz
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-wider">Opens</p>
                                                            <p className="text-gray-900 dark:text-white text-sm font-semibold">{new Date(quiz.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-wider">Closes</p>
                                                            <p className="text-gray-900 dark:text-white text-sm font-semibold">{new Date(quiz.availableUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        <div className="hidden sm:flex bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl p-3 flex-col justify-center">
                                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-wider">Attempts</p>
                                                            <p className="text-gray-900 dark:text-white text-sm font-semibold">{quiz.maximumAttempts || 'Unlimited'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {quizzes.length > 3 && (
                                        <button
                                            onClick={() => navigate('/quizzes')}
                                            className="w-full py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-semibold rounded-xl transition-colors text-sm"
                                        >
                                            View All Quizzes
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Course Overview */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h2>
                            </div>
                            <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-sm">
                                {course.description}
                            </p>
                        </div>

                        {/* Learning Objectives */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                    <Target className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Objectives</h2>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    "Understand core concepts and principles",
                                    "Apply knowledge to practical scenarios",
                                    "Develop professional skills",
                                    "Collaborate effectively"
                                ].map((obj, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                        <span className="text-gray-600 dark:text-slate-400 text-sm leading-snug">{obj}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <CalendarClock className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Deadlines</h3>
                            </div>

                            <div className="space-y-3">
                                {assignments
                                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                    .slice(0, 5)
                                    .map((assignment) => {
                                        const dueDate = new Date(assignment.dueDate);
                                        const today = new Date();
                                        const isOverdue = dueDate < today;
                                        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 shadow-sm'}`}>
                                                    <span className="text-[10px] font-bold uppercase">{dueDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-lg font-black leading-none">{dueDate.getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-0.5">{assignment.title}</p>
                                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'}`}>
                                                        {isOverdue ? 'Overdue' : `${daysLeft} days left`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {assignments.length === 0 && (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700/50">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-80" />
                                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">All caught up!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};