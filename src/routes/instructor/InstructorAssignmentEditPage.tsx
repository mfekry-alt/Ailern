import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, Save, Upload, X, FileText, Loader2, Settings, CalendarClock, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAssignment, useUpdateAssignment } from '@/features/assignments/api';
import { useInstructorCourses } from '@/features/courses/api';
import { handleApiError } from '@/api/client';

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorAssignmentEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const assignmentId = parseInt(id || '0');

    const [errorMsg, setErrorMsg] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
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
                allowedFileTypes: [], // Update if API returns this
                maxFileSize: '', // Update if API returns this
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
        setErrorMsg('');
        setSuccessMsg('');

        if (!formData.title.trim()) {
            setErrorMsg('Assignment title is required.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!isDraft && !formData.dueDate) {
            setErrorMsg('Due date is required for publishing.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);

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

            setSuccessMsg(isDraft ? 'Draft saved successfully!' : 'Assignment updated successfully!');
            setTimeout(() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS), 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setErrorMsg(apiError.message || 'Failed to update assignment. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Loading assignment details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                        className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-8 h-8 text-indigo-500" /> Edit Assignment
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                            Update assignment details, attachments, and submission rules.
                        </p>
                    </div>
                </div>

                {/* Main Form Container */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Notifications */}
                        {errorMsg && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm font-bold shadow-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0" /> {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
                                <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg} Redirecting...
                            </div>
                        )}

                        {/* Basic Information Section */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-blue-500" /> Basic Information
                            </h3>

                            <div>
                                <label className={labelCls}>Assignment Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g., Programming Assignment 1: Basic Algorithms"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Associated Course</label>
                                <select
                                    value={formData.course}
                                    disabled
                                    className={`${inputCls} bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400`}
                                >
                                    <option value={formData.course}>
                                        {coursesData?.items?.find(c => c.id.toString() === formData.course)?.name || `Course ID: ${formData.course}`}
                                    </option>
                                </select>
                                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-500 mt-1.5 ml-1">The course cannot be changed after creation.</p>
                            </div>

                            <div>
                                <label className={labelCls}>Description / Instructions</label>
                                <textarea
                                    rows={5}
                                    placeholder="Provide detailed instructions for the assignment..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>
                        </div>

                        {/* Timing & Submission Rules */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <CalendarClock className="w-5 h-5 text-amber-500" /> Timing & Rules
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Due Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>

                                <div className="flex flex-col justify-end">
                                    <label
                                        className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.allowLateSubmission
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className={`font-bold text-sm mb-0.5 ${formData.allowLateSubmission ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-white'}`}>
                                                Allow Late Submission
                                            </div>
                                            <div className={`text-[11px] font-medium ${formData.allowLateSubmission ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-slate-400'}`}>
                                                Students can submit after the due date.
                                            </div>
                                        </div>
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowLateSubmission}
                                                onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* File Restrictions */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" /> File Restrictions
                            </h3>

                            <div>
                                <label className={labelCls}>Allowed File Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {fileTypeOptions.map((type) => {
                                        const isSelected = formData.allowedFileTypes.includes(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleFileType(type)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${isSelected
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-500 mt-2 ml-1">Leave empty to allow all file types.</p>
                            </div>

                            <div>
                                <label className={labelCls}>Maximum File Size</label>
                                <select
                                    value={formData.maxFileSize}
                                    onChange={(e) => setFormData({ ...formData, maxFileSize: e.target.value })}
                                    className={`${inputCls} sm:max-w-xs`}
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

                        {/* Visibility Status */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-purple-500" /> Visibility Status
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.status === 'draft' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold text-sm ${formData.status === 'draft' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>Save as Draft</span>
                                        <input type="radio" name="status" value="draft" checked={formData.status === 'draft'} onChange={() => setFormData({ ...formData, status: 'draft' })} className="w-4 h-4 text-purple-600 accent-purple-600 cursor-pointer" />
                                    </div>
                                    <span className={`text-[11px] font-medium ${formData.status === 'draft' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-slate-400'}`}>Not visible to students yet.</span>
                                </label>

                                <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.status === 'published' ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold text-sm ${formData.status === 'published' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>Publish Immediately</span>
                                        <input type="radio" name="status" value="published" checked={formData.status === 'published'} onChange={() => setFormData({ ...formData, status: 'published' })} className="w-4 h-4 text-purple-600 accent-purple-600 cursor-pointer" />
                                    </div>
                                    <span className={`text-[11px] font-medium ${formData.status === 'published' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-slate-400'}`}>Visible to students right away.</span>
                                </label>
                            </div>
                        </div>

                        {/* Attachments Upload */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Upload className="w-5 h-5 text-rose-500" /> Reference Materials (Optional)
                            </h3>

                            <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all bg-gray-50/50 dark:bg-slate-900/30 group">
                                <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Click to browse or drag files here</span>
                                    <p className="text-xs text-gray-500 mt-1">Support for PDF, DOCX, ZIP</p>
                                </div>
                                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                            </label>

                            {attachments.length > 0 && (
                                <div className="space-y-2 mt-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Attached Files</p>
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg shrink-0">
                                                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700/50 flex flex-col-reverse sm:flex-row gap-4 justify-between items-center shrink-0">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm"
                        >
                            Cancel
                        </button>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 text-sm disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Update Assignment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
