import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { api } from '@/api/client';
import { getSectionsByCourse } from '@/api/services/section.service';
import { getCourseQuizzes } from '@/api/services/quiz.service';
import type { SectionDto } from '@/api/services/section.service';
import type { GetQuizDto } from '@/types/api.types';
import { QuizCard } from '@/components/QuizCard';
// Material Symbols Icon Wrapper Component
const MaterialIcon = ({ name, className = '', size = '24' }: { name: string; className?: string; size?: string }) => (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>
        {name}
    </span>
);

// Helper: Generate random color and initials for instructor avatar
const getAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper: Format date range
const formatDateRange = (start: string, end?: string) => {
    const startDate = new Date(start);
    if (!end) return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// Helper: Format quiz availability with period
const formatQuizAvailability = (availableFrom: string, availableUntil: string) => {
    const from = new Date(availableFrom);
    const until = new Date(availableUntil);
    const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const toStr = until.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fromStr} - ${toStr}`;
};

// Helper: Calculate days/hours until quiz is available or closes
const getTimeStatus = (availableFrom: string, availableUntil: string) => {
    const now = new Date();
    const from = new Date(availableFrom);
    const until = new Date(availableUntil);

    if (now < from) {
        const daysUntil = Math.ceil((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'not-available', message: `Opens in ${daysUntil}d`, color: 'text-yellow-400' };
    }

    if (now > until) {
        return { status: 'closed', message: 'Closed', color: 'text-red-400' };
    }

    const daysLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60)) % 24;
    return {
        status: 'available',
        message: daysLeft > 0 ? `${daysLeft}d left` : `${hoursLeft}h left`,
        color: 'text-green-400'
    };
};

// Helper: Format publish date
const formatPublishDate = (publishedDate?: string) => {
    if (!publishedDate) return 'Not published';
    const date = new Date(publishedDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                    description: courseData.description || 'No description available',
                    courseStatus: courseData.courseStatus || 'Active',
                    isEnrolled,
                    progress: 0, // Backend will provide this
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
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading course details...</p>
                </div>
            </div>
        );
    }

    // --- Render: Error State ---
    if (error || !course) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-red-500 mb-4">Error</h2>
                    <p className="text-zinc-300 mb-6">{error || 'Course not found'}</p>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- Render: Not Enrolled View ---
    if (!course.isEnrolled) {
        return (
            <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <MaterialIcon name="arrow_back" />
                        Back
                    </button>

                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-[#1e3a8a] to-[#5b21b6] rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <div className="inline-block bg-blue-600/90 backdrop-blur-md text-xs font-bold uppercase px-4 py-2 rounded-full text-white mb-4">
                                {course.courseStatus}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">{course.name}</h1>
                            <p className="text-blue-100 text-lg mb-4">{course.code}</p>
                            <p className="text-blue-200 mb-6">{course.instructorName}</p>
                            <p className="text-blue-100 max-w-2xl">{course.description}</p>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-[#1e3a8a] border border-blue-500/20 rounded-[2rem] p-8">
                        <div className="text-center">
                            <MaterialIcon name="lock" className="text-4xl text-blue-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Not Enrolled</h2>
                            <p className="text-zinc-400 mb-6">Enroll in this course to access all content and materials.</p>
                            <button
                                onClick={() => {
                                    /* TODO: Implement Enroll API Call */
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                            >
                                Enroll Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Render: Enrolled View (Main Layout) ---
    return (
        <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <MaterialIcon name="arrow_back" />
                    Back
                </button>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-[#1e3a8a] to-[#5b21b6] rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden" style={{
                    boxShadow: '0 0 20px rgba(44, 47, 211, 0.15)'
                }}>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="inline-block bg-blue-600/90 backdrop-blur-md text-xs font-bold uppercase px-4 py-2 rounded-full text-white mb-4">
                            {course.courseStatus}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">{course.name}</h1>
                        <p className="text-blue-100 text-lg">{course.code}</p>
                        <div className="mt-6 flex items-center gap-2 text-blue-200">
                            <MaterialIcon name="person" />
                            <span>{course.instructorName}</span>
                        </div>

                        {/* Progress Bar */}
                        {course.progress > 0 && (
                            <div className="mt-6 max-w-md">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-blue-100">Course Progress</span>
                                    <span className="text-sm font-bold text-blue-100">{course.progress}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Assignments Card */}
                    <div className="bg-[#1e3a8a] border border-blue-500/20 rounded-[2rem] p-6 sm:p-8 flex items-center justify-between hover:border-blue-500/40 transition-colors"
                        style={{ borderLeft: '4px solid #3b82f6' }}>
                        <div className="space-y-1">
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Assignments</p>
                            <h3 className="text-4xl sm:text-5xl font-black text-white">{assignments.length}</h3>
                        </div>
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <MaterialIcon name="assignment" className="text-3xl text-blue-400" />
                        </div>
                    </div>

                    {/* Sections Card */}
                    <div className="bg-[#1e3a8a] border border-purple-500/20 rounded-[2rem] p-6 sm:p-8 flex items-center justify-between hover:border-purple-500/40 transition-colors"
                        style={{ borderLeft: '4px solid #5b21b6' }}>
                        <div className="space-y-1">
                            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Sections</p>
                            <h3 className="text-4xl sm:text-5xl font-black text-white">{sections.length}</h3>
                        </div>
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <MaterialIcon name="collections_bookmark" className="text-3xl text-purple-400" />
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-[#1e3a8a] border border-indigo-500/20 rounded-[2rem] p-6 sm:p-8 flex items-center justify-between hover:border-indigo-500/40 transition-colors"
                        style={{ borderLeft: '4px solid #6366f1' }}>
                        <div className="space-y-1">
                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Status</p>
                            <h3 className="text-2xl font-black text-white">{course.courseStatus}</h3>
                        </div>
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <MaterialIcon name="check_circle" className="text-3xl text-indigo-400" />
                        </div>
                    </div>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left 2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Sections/Modules Timeline */}
                        <div
                            className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-sm hover:border-blue-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <MaterialIcon name="layers" className="text-2xl text-blue-400" />
                                <h2 className="text-2xl font-bold text-white">Course Modules</h2>
                            </div>

                            {sections.length === 0 ? (
                                <div className="text-center py-8">
                                    <MaterialIcon name="inbox" className="text-4xl text-zinc-500 mx-auto mb-4" />
                                    <p className="text-zinc-400">No sections available yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sections.map((section, idx) => {
                                        const isExpanded = expandedSections.has(section.id);
                                        return (
                                            <div
                                                key={section.id}
                                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors"
                                            >
                                                <button
                                                    onClick={() => {
                                                        const newExpanded = new Set(expandedSections);
                                                        if (isExpanded) {
                                                            newExpanded.delete(section.id);
                                                        } else {
                                                            newExpanded.add(section.id);
                                                        }
                                                        setExpandedSections(newExpanded);
                                                    }}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                                                            {section.sectionNumber}
                                                        </div>
                                                        <h3 className="font-semibold text-white">{section.title}</h3>
                                                    </div>
                                                    <MaterialIcon
                                                        name={isExpanded ? 'expand_less' : 'expand_more'}
                                                        className="text-zinc-400"
                                                    />
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 py-4 border-t border-white/10 bg-black/20">
                                                        <p className="text-zinc-400 text-sm">Section content and lessons will load here</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Assignments Section */}
                        <div
                            className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-sm hover:border-blue-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <MaterialIcon name="checklist" className="text-2xl text-green-400" />
                                <h2 className="text-2xl font-bold text-white">Assignments</h2>
                                <span className="ml-auto text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-semibold">
                                    {assignments.length}
                                </span>
                            </div>

                            {assignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <MaterialIcon name="task_alt" className="text-4xl text-zinc-500 mx-auto mb-4" />
                                    <p className="text-zinc-400">No assignments available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="bg-[#1e3a8a] border border-blue-500/20 rounded-xl p-4 hover:border-blue-500/40 hover:bg-[#1e3a8a]/80 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-semibold text-white flex-1">{assignment.title}</h3>
                                                <span className="text-xs bg-blue-600/40 text-blue-200 px-2 py-1 rounded whitespace-nowrap ml-2">
                                                    {assignment.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                                                <MaterialIcon name="calendar_today" size="18" />
                                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <button className="w-full px-3 py-2 bg-blue-600/50 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quizzes Section */}
                        <div className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-sm hover:border-blue-500/20 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <MaterialIcon name="quiz" className="text-2xl text-purple-400" />
                                <h2 className="text-2xl font-bold text-white">Upcoming Quizzes</h2>
                                <span className="ml-auto text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-semibold">
                                    {quizzes.filter((quiz) => {
                                        const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                        return timeStatus.status !== 'closed' && quiz.status === 'Published';
                                    }).length}
                                </span>
                            </div>

                            {quizzes.filter((quiz) => {
                                const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                return timeStatus.status !== 'closed' && quiz.status === 'Published';
                            }).length === 0 ? (
                                <div className="text-center py-8">
                                    <MaterialIcon name="help_outline" className="text-4xl text-zinc-500 mx-auto mb-4" />
                                    <p className="text-zinc-400">No upcoming quizzes available</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-6">
                                        {quizzes
                                            .filter((quiz) => {
                                                const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                                return timeStatus.status !== 'closed' && quiz.status === 'Published';
                                            })
                                            .slice(0, 3)
                                            .map((quiz) => {
                                                const status = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                                return (
                                                    <div
                                                        key={quiz.id}
                                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 hover:bg-white/10 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-white mb-1">{quiz.title}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${status.status === 'available' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                                        {status.status === 'available' ? 'Available' : 'Upcoming'}
                                                                    </span>
                                                                    <span className={`text-xs font-semibold ${status.color}`}>{status.message}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                                                            <div className="bg-black/20 rounded-lg p-2">
                                                                <p className="text-zinc-400 mb-1">Available From</p>
                                                                <p className="text-white font-semibold">{new Date(quiz.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                            </div>
                                                            <div className="bg-black/20 rounded-lg p-2">
                                                                <p className="text-zinc-400 mb-1">Available Until</p>
                                                                <p className="text-white font-semibold">{new Date(quiz.availableUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                            </div>
                                                            <div className="bg-black/20 rounded-lg p-2">
                                                                <p className="text-zinc-400 mb-1">Attempts</p>
                                                                <p className="text-white font-semibold">{quiz.maximumAttempts || '-'}</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}
                                                            className="w-full px-3 py-2 bg-purple-600/50 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                                        >
                                                            Start Quiz
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {quizzes.filter((quiz) => {
                                        const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                        return timeStatus.status !== 'closed' && quiz.status === 'Published';
                                    }).length > 3 && (
                                            <button
                                                onClick={() => navigate('/quizzes')}
                                                className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded-lg transition-colors border border-purple-500/20"
                                            >
                                                Show All ({quizzes.filter((quiz) => {
                                                    const timeStatus = getTimeStatus(quiz.availableFrom, quiz.availableUntil);
                                                    return timeStatus.status !== 'closed' && quiz.status === 'Published';
                                                }).length})
                                            </button>
                                        )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Course Description */}
                        <div
                            className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm hover:border-blue-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <MaterialIcon name="description" className="text-2xl text-blue-400" />
                                <h2 className="text-2xl font-bold text-white">Course Overview</h2>
                            </div>
                            <p className="text-zinc-300 leading-relaxed text-sm">{course.description}</p>
                        </div>

                        {/* Learning Objectives */}
                        <div
                            className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm hover:border-blue-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <MaterialIcon name="star_rate" className="text-2xl text-yellow-400" />
                                <h2 className="text-2xl font-bold text-white">Learning Objectives</h2>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 font-bold mt-1 text-sm">•</span>
                                    <span className="text-zinc-300 text-sm">Understand core concepts and principles</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 font-bold mt-1 text-sm">•</span>
                                    <span className="text-zinc-300 text-sm">Apply knowledge to practical scenarios</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 font-bold mt-1 text-sm">•</span>
                                    <span className="text-zinc-300 text-sm">Develop professional skills and competencies</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400 font-bold mt-1 text-sm">•</span>
                                    <span className="text-zinc-300 text-sm">Collaborate and communicate effectively</span>
                                </li>
                            </ul>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div
                            className="bg-[#1e3a8a]/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <MaterialIcon name="calendar_month" className="text-xl text-orange-400" />
                                <h3 className="font-bold text-white">Upcoming Deadlines</h3>
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
                                            <div key={assignment.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                                                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 font-bold text-sm ${isOverdue ? 'bg-red-600/20 text-red-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                                    <span>{dueDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-lg">{dueDate.getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white text-sm truncate">{assignment.title}</p>
                                                    <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
                                                        {isOverdue ? 'Overdue' : `${daysLeft} days left`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {assignments.length === 0 && (
                                    <div className="text-center py-6">
                                        <MaterialIcon name="done_all" className="text-4xl text-green-500 mx-auto mb-2" />
                                        <p className="text-zinc-400 text-sm">No upcoming deadlines</p>
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