import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, Save, Upload, X, FileText, Loader2,
    BookOpen, CalendarClock, ShieldCheck, Plus, CheckCircle2, AlertTriangle, Settings
} from 'lucide-react';
import { useCreateAssignment } from '@/features/assignments/api';
import { useInstructorCourses } from '@/features/courses/api';
import { handleApiError } from '@/api/client';

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-semibold';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorAssignmentCreatePage = () => {
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // API hooks
    const createAssignmentMutation = useCreateAssignment();
    const { data: coursesData } = useInstructorCourses();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        dueDate: '',
        allowedFileTypes: [] as string[],
        maxFileSize: '',
        maxFileCount: '5',
        allowLateSubmission: false,
    });

    const fileTypeOptions = ['PDF', 'DOC', 'DOCX', 'ZIP', 'TXT', 'PPT', 'PPTX'];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const maxFiles = Number.parseInt(formData.maxFileCount) || 5;
        const totalFiles = attachments.length + files.length;

        if (totalFiles > maxFiles) {
            setStatusMessage({ type: 'error', text: `Maximum ${maxFiles} files allowed.` });
            return;
        }

        setAttachments([...attachments, ...files]);
        setStatusMessage(null);
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
            setStatusMessage({ type: 'error', text: 'Assignment title is required.' });
            return;
        }
        if (!formData.course) {
            setStatusMessage({ type: 'error', text: 'Please select a course.' });
            return;
        }
        if (!isDraft && !formData.dueDate) {
            setStatusMessage({ type: 'error', text: 'Due date is required for publishing.' });
            return;
        }

        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            const command = {
                title: formData.title,
                instructions: formData.description,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString(),
                courseId: Number.parseInt(formData.course),
                allowLateSubmission: formData.allowLateSubmission,
                isPublished: !isDraft,
                uploadedFileMetaData: attachments.map((file) => ({
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type || 'application/octet-stream',
                })),
            };

            await createAssignmentMutation.mutateAsync(command);
            setStatusMessage({ type: 'success', text: isDraft ? 'Draft saved!' : 'Assignment published!' });
            setTimeout(() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS), 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setStatusMessage({ type: 'error', text: apiError.message || 'Failed to create assignment.' });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                             Create New Assignment
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">Set up tasks, deadlines, and requirements for your students.</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-8">

                        {statusMessage && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 ${statusMessage.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                }`}>
                                {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                <p className="text-sm font-bold">{statusMessage.text}</p>
                            </div>
                        )}

                        {/* Section 1: Basic Information */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-blue-500" /> Basic Information
                            </h3>

                            <div>
                                <label className={labelCls}>Assignment Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Phase 1: Market Research Analysis"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Select Course <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="">Select a course...</option>
                                    {coursesData?.items?.map((course) => (
                                        <option key={course.id} value={course.id.toString()}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Instructions / Description</label>
                                <textarea
                                    rows={5}
                                    placeholder="Add detailed instructions for students..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>
                        </div>

                        {/* Section 2: Timing & Submission */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <CalendarClock className="w-5 h-5 text-amber-500" /> Submission Rules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Due Date & Time <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div className="flex flex-col justify-end pb-1">
                                    <label className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.allowLateSubmission ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-gray-200 dark:border-slate-700 hover:border-amber-300 bg-white dark:bg-slate-800'
                                        }`}>
                                        <div className="flex-1">
                                            <div className={`font-bold text-sm ${formData.allowLateSubmission ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-white'}`}>Allow Late Submission</div>
                                            <p className="text-[10px] text-gray-500">Students can submit after the deadline.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.allowLateSubmission}
                                            onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                                            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: File Requirements */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" /> File Restrictions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Max File Size</label>
                                    <select
                                        value={formData.maxFileSize}
                                        onChange={(e) => setFormData({ ...formData, maxFileSize: e.target.value })}
                                        className={inputCls}
                                    >
                                        <option value="">No limit</option>
                                        <option value="10">10 MB</option>
                                        <option value="50">50 MB</option>
                                        <option value="100">100 MB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Max File Count</label>
                                    <input
                                        type="number"
                                        min="1" max="10"
                                        value={formData.maxFileCount}
                                        onChange={(e) => setFormData({ ...formData, maxFileCount: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Allowed File Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {fileTypeOptions.map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleFileType(type)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${formData.allowedFileTypes.includes(type)
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-blue-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Attachments */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Upload className="w-5 h-5 text-indigo-500" /> Reference Materials
                            </h3>

                            <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Click to upload reference files</span>
                                    <p className="text-xs text-gray-500 mt-1">Maximum {formData.maxFileCount} files allowed</p>
                                </div>
                                <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={attachments.length >= Number(formData.maxFileCount)} />
                            </label>

                            {attachments.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl">
                                            <div className="flex items-center gap-3 truncate">
                                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{file.name}</span>
                                            </div>
                                            <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 active:scale-95 text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};