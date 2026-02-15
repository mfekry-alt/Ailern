import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import {
    FileText,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    Star,
    Clock
} from 'lucide-react';
import { getAssignment } from '@/api/services/assignment.service';
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

        return {
            id: assignment.id.toString(),
            title: assignment.title,
            course: assignment.courseName ? assignment.courseName : `Course ${assignment.courseId}`,
            instructor: assignment.instructorName || 'Instructor',
            dueDate: assignment.dueDate,
            instructions: assignment.instructions,
            files: assignment.files || [],
            status: 'pending', // Default status
            points: 100, // Default points
            allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'], // Default allowed types
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
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-zinc-400">Loading assignment...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !assignmentUI) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-[20px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">Failed to load assignment</h3>
                    <p className="text-gray-600 dark:text-zinc-400 mb-4">{error ? handleApiError(error).message : 'Assignment not found'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Assignments
                    </button>
                    <h1 className="text-[32px] font-bold text-gray-900 dark:text-zinc-100 mb-2">{assignmentUI.title}</h1>
                    <p className="text-[16px] text-gray-600 dark:text-zinc-400">{assignmentUI.course}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Assignment Details */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Assignment Details</h2>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Description</h3>
                                        <p className="text-[14px] text-gray-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                                            {assignmentUI.instructions}
                                        </p>
                                    </div>

                                    {assignmentUI.files.length > 0 && (
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300 mb-2">Attachments</h3>
                                            <div className="space-y-2">
                                                {assignmentUI.files.map((attachment, index) => (
                                                    <a
                                                        key={index}
                                                        href="#"
                                                        download
                                                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                        <span className="text-[14px] text-gray-700 dark:text-zinc-300 flex-1">
                                                            {attachment.fileName}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Assignment Info */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[18px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-zinc-500 mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Due Date</span>
                                        </div>
                                        <p className={`text-[14px] font-semibold ${isDueSoon && assignmentUI.status === 'pending' ? 'text-red-600' : 'text-gray-900 dark:text-zinc-100'}`}>
                                            {new Date(assignmentUI.dueDate).toLocaleString()}
                                        </p>
                                        {isDueSoon && assignmentUI.status === 'pending' && (
                                            <p className="text-[12px] text-red-600 mt-1">Due soon!</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-zinc-500 mb-1">
                                            <User className="w-4 h-4" />
                                            <span>Instructor</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">{assignmentUI.instructor}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-zinc-500 mb-1">
                                            <Star className="w-4 h-4" />
                                            <span>Points</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">{assignmentUI.points} points</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-zinc-500 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span>Status</span>
                                        </div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[13px] font-medium ${assignmentUI.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            assignmentUI.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {assignmentUI.status === 'pending' ? 'Pending' :
                                                assignmentUI.status === 'submitted' ? 'Submitted' :
                                                    'Graded'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submission Requirements */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-zinc-100 mb-4">Submission Requirements</h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[13px] text-gray-500 dark:text-zinc-500 mb-1">Allowed File Types</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignmentUI.allowedFileTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[12px] font-medium"
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[13px] text-gray-500 dark:text-zinc-500 mb-1">Maximum File Size</p>
                                        <p className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">{assignmentUI.maxFileSize}</p>
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
