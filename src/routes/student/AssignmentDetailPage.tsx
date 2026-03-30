import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import {
    FileText, AlertCircle, ArrowLeft, Loader2,
    Calendar, User, Star, Clock, Download,
    CheckCircle, BookOpen, Paperclip, HardDrive
} from 'lucide-react';
import { getAssignment } from '@/api/services/assignment.service';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QUERY_KEYS } from '@/lib/constants';
import { handleApiError } from '@/api/client';

export const AssignmentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const assignmentId = id ? parseInt(id) : null;

    // Fetch assignment using React Query
    const {
        data: assignment,
        isLoading,
        error,
    } = useQuery({
        queryKey: QUERY_KEYS.ASSIGNMENT(assignmentId || 0),
        queryFn: () => getAssignment(assignmentId!),
        enabled: !!assignmentId,
    });

    // Map assignment to UI format
    const assignmentUI = useMemo(() => {
        if (!assignment) return null;

        const now = new Date();
        const due = new Date(assignment.dueDate);
        let status = 'pending';
        if (due < now) status = 'late';

        return {
            id: assignment.id.toString(),
            title: assignment.title,
            course: assignment.courseName ? assignment.courseName : `Course ${assignment.courseId}`,
            instructor: assignment.instructorName || 'Instructor',
            dueDate: assignment.dueDate,
            instructions: assignment.instructions || 'No detailed instructions provided.',
            files: assignment.files || [],
            status,
            points: 100, // Default points value
            allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'], // Default allowed types
            maxFileSize: '10 MB', // Default max size
        };
    }, [assignment]);

    // Calculate if assignment is due soon (within 48 hours)
    const isDueSoon = useMemo(() => {
        if (!assignmentUI) return false;
        const dueDate = new Date(assignmentUI.dueDate);
        const now = new Date();
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDue > 0 && hoursUntilDue <= 48;
    }, [assignmentUI]);

    // Loading state
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Error state
    if (error || !assignmentUI) {
        return (
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800/50 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{error ? handleApiError(error).message : 'Assignment not found'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isLate = assignmentUI.status === 'late';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans selection:bg-blue-500/30 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors w-fit group"
                >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Assignments
                </button>

                {/* Hero Header */}
                <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white mb-4 shadow-sm">
                                <BookOpen className="w-3.5 h-3.5" />
                                {assignmentUI.course}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                                {assignmentUI.title}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* Main Content (Left 2 columns) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Assignment Instructions */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 rounded-[2rem] shadow-sm overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instructions</h2>
                                </div>
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <p className="text-[15px] leading-relaxed text-gray-700 dark:text-slate-300 whitespace-pre-line">
                                        {assignmentUI.instructions}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attachments */}
                        {assignmentUI.files.length > 0 && (
                            <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 rounded-[2rem] shadow-sm overflow-hidden">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Paperclip className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reference Materials</h2>
                                        </div>
                                        <span className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
                                            {assignmentUI.files.length} Files
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {assignmentUI.files.map((attachment, index) => (
                                            <a
                                                key={index}
                                                href="#"
                                                download
                                                className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0 text-blue-500">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block truncate">
                                                            {attachment.fileName || `Attachment ${index + 1}`}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 uppercase">Document</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:shadow-sm transition-all shrink-0">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="space-y-6">

                        {/* Status & Deadline Card */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 rounded-[2rem] shadow-sm overflow-hidden">
                            <CardContent className="p-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Overview</h2>

                                <div className="space-y-5">
                                    {/* Due Date */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLate ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-gray-50 dark:bg-slate-800 text-blue-500'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Due Date</p>
                                            <p className={`text-sm font-semibold ${isDueSoon && !isLate ? 'text-orange-500' : isLate ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                {new Date(assignmentUI.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {isDueSoon && !isLate && <p className="text-[11px] font-bold text-orange-500 mt-1">Due soon!</p>}
                                            {isLate && <p className="text-[11px] font-bold text-red-500 mt-1">Overdue</p>}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLate ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                                            {isLate ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${isLate ? 'bg-red-50/50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' : 'bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                                                {assignmentUI.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center shrink-0 text-yellow-500">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Points</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{assignmentUI.points} Pts</p>
                                        </div>
                                    </div>

                                    {/* Instructor */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-500">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Instructor</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{assignmentUI.instructor}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submission Requirements Card */}
                        <Card className="bg-white dark:bg-slate-800/40 backdrop-blur-md border-gray-200 dark:border-slate-700/50 rounded-[2rem] shadow-sm overflow-hidden">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Requirements</h3>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-2">
                                            <FileText className="w-4 h-4" />
                                            <p className="text-[12px] font-bold uppercase tracking-wider">Allowed Files</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {assignmentUI.allowedFileTypes.map((type) => (
                                                <span key={type} className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-gray-200 dark:border-slate-700">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-1">
                                            <HardDrive className="w-4 h-4" />
                                            <p className="text-[12px] font-bold uppercase tracking-wider">Max File Size</p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{assignmentUI.maxFileSize}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};