import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, Save, Upload, X, FileText, Loader2 } from 'lucide-react';
import { useAssignment, useUpdateAssignment } from '@/features/assignments/api';
import { useInstructorCourses } from '@/features/courses/api';
import { handleApiError } from '@/api/client';

export const InstructorAssignmentEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const assignmentId = parseInt(id || '0');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // API hooks
    const { data: assignmentData, isLoading } = useAssignment(assignmentId);
    const updateAssignmentMutation = useUpdateAssignment();
    const { data: coursesData } = useInstructorCourses();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        dueDate: '',
        allowedFileTypes: [] as string[],
        maxFileSize: '',
        allowLateSubmission: false,
        status: 'draft' as 'draft' | 'published',
    });

    // Populate form with fetched assignment data
    useEffect(() => {
        if (assignmentData) {
            const dueDate = assignmentData.dueDate
                ? new Date(assignmentData.dueDate).toISOString().slice(0, 16)
                : '';
            setFormData({
                title: assignmentData.title || '',
                description: assignmentData.instructions || '',
                course: assignmentData.courseId?.toString() || '',
                dueDate,
                allowedFileTypes: [],
                maxFileSize: '',
                allowLateSubmission: assignmentData.allowLateSubmission || false,
                status: assignmentData.isPublished ? 'published' : 'draft',
            });
        }
    }, [assignmentData]);

    const fileTypeOptions = ['PDF', 'DOC', 'DOCX', 'ZIP', 'TXT', 'PPT', 'PPTX'];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const toggleFileType = (type: string) => {
        setFormData({
            ...formData,
            allowedFileTypes: formData.allowedFileTypes.includes(type)
                ? formData.allowedFileTypes.filter((t) => t !== type)
                : [...formData.allowedFileTypes, type],
        });
    };

    const handleSave = async (isDraft: boolean) => {
        if (!formData.title.trim()) {
            setStatusMessage('Assignment title is required.');
            return;
        }
        if (!isDraft && !formData.dueDate) {
            setStatusMessage('Due date is required for publishing.');
            return;
        }

        setIsSubmitting(true);
        setStatusMessage('');

        try {
            const command = {
                title: formData.title,
                instructions: formData.description,
                dueDate: formData.dueDate
                    ? new Date(formData.dueDate).toISOString()
                    : new Date().toISOString(),
                allowLateSubmission: formData.allowLateSubmission,
                isPublished: !isDraft,
                uploadedFileMetaData: attachments.map((file) => ({
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type || 'application/octet-stream',
                })),
            };

            await updateAssignmentMutation.mutateAsync({ id: assignmentId, command });

            setStatusMessage(isDraft ? 'Draft saved successfully!' : 'Assignment updated successfully!');
            setTimeout(() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS), 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setStatusMessage(apiError.message || 'Failed to update assignment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-gray-600 dark:text-zinc-400 text-[16px]">Loading assignment...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-[30px] font-bold text-gray-900 dark:text-zinc-100 mb-2">Edit Assignment</h1>
                                    <p className="text-[16px] text-gray-600 dark:text-zinc-400">Update assignment details</p>
                                </div>
                                <button
                                    onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            </div>

                            {statusMessage && (
                                <div className={`p-4 rounded-lg ${statusMessage.includes('success')
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                    }`}>
                                    <p className="text-sm">{statusMessage}</p>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                    Assignment Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Programming Assignment 1: Basic Algorithms"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                />
                            </div>

                            {/* Course */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                    Course <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 cursor-not-allowed"
                                >
                                    <option value="">Select a course</option>
                                    {coursesData?.items?.map((course ) => (
                                        <option key={course.id} value={course.id.toString()}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1">Course cannot be changed after creation</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    placeholder="Provide detailed instructions for the assignment..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] resize-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                />
                            </div>

                            {/* Allow Late Submission */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="allowLateSubmission"
                                    checked={formData.allowLateSubmission}
                                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-zinc-700 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="allowLateSubmission" className="text-[14px] font-medium text-gray-700 dark:text-zinc-300">
                                    Allow Late Submission
                                </label>
                            </div>

                            {/* Due Date and File Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>

                                {/* File Restrictions */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Allowed File Types
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {fileTypeOptions.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => toggleFileType(type)}
                                                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${formData.allowedFileTypes.includes(type)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                            Maximum File Size
                                        </label>
                                        <select
                                            value={formData.maxFileSize}
                                            onChange={(e) => setFormData({ ...formData, maxFileSize: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                        >
                                            <option value="">No limit</option>
                                            <option value="5">5 MB</option>
                                            <option value="10">10 MB</option>
                                            <option value="20">20 MB</option>
                                            <option value="50">50 MB</option>
                                            <option value="100">100 MB</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Attachments (Optional)
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors">
                                            <Upload className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                                            <span className="text-[14px] font-medium text-gray-700 dark:text-zinc-300">Upload Files</span>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {attachments.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                            <span className="text-[14px] text-gray-900 dark:text-zinc-100">{file.name}</span>
                                                            <span className="text-[12px] text-gray-500 dark:text-zinc-500">
                                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeAttachment(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Draft
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                                            className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-[14px] rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSave(false)}
                                            disabled={isSubmitting}
                                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Updating...' : 'Update Assignment'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};