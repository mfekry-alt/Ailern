import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, Save, Upload, X, FileText, Loader2,
    CalendarClock, ShieldCheck, CheckCircle2, AlertTriangle, Settings,
    Clock, Sparkles, Trash2
} from 'lucide-react';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useCreateAssignment } from '@/features/assignments/api';
import { useCourse } from '@/features/courses/api';
import { handleApiError } from '@/api/client';
import { uploadFileToPresignedUrlWithProgress } from '@/api/services/assignment.service';

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-semibold';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorAssignmentCreatePage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const courseIdNum = Number.parseInt(courseId || '0');
    
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFileSizeDropdownOpen, setIsFileSizeDropdownOpen] = useState(false);
    const [uploadStatuses, setUploadStatuses] = useState<Record<number, { progress: number; status: 'pending' | 'uploading' | 'success' | 'error' }>>({});

    const fileSizeOptions = [
        { label: 'No limit', value: '' },
        { label: '10 MB', value: '10' },
        { label: '50 MB', value: '50' },
        { label: '100 MB', value: '100' },
    ];

    // API hooks
    const createAssignmentMutation = useCreateAssignment();
    const { data: courseData } = useCourse(courseIdNum);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: null as Date | null,
        allowedFileTypes: [] as string[],
        maxFileSize: '',
        maxFileCount: '5',
        allowLateSubmission: false,
    });

    const fileTypeOptions = ['PDF', 'DOC', 'DOCX', 'ZIP', 'TXT', 'PPT', 'PPTX'];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
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
        if (!isDraft && !formData.dueDate) {
            setStatusMessage({ type: 'error', text: 'Due date is required for publishing.' });
            return;
        }

        setIsSubmitting(true);
        setStatusMessage(null);
        setUploadStatuses({});

        try {
            const command = {
                title: formData.title,
                instructions: formData.description,
                dueDate: formData.dueDate ? formData.dueDate.toISOString() : new Date().toISOString(),
                allowLateSubmission: formData.allowLateSubmission,
                isPublished: !isDraft,
                uploadedFileMetaData: attachments.map((file) => ({
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type || 'application/octet-stream',
                })),
            };

            const response = await createAssignmentMutation.mutateAsync({ courseId: courseIdNum, command });
            
            if (response.presingedFileUrls && attachments.length > 0) {
                if (response.presingedFileUrls.length !== attachments.length) {
                    throw new Error("Mismatch between uploaded files and secured storage paths.");
                }

                // Initialize statuses
                const initialStatuses: Record<number, any> = {};
                attachments.forEach((_,
i) => {
                    initialStatuses[i] = { progress: 0, status: 'pending' };
                });
                setUploadStatuses(initialStatuses);

                // Upload each file simultaneously
                const uploadPromises = attachments.map(async (file, index) => {
                    setUploadStatuses(prev => ({ ...prev, [index]: { progress: 0, status: 'uploading' } }));
                    try {
                        await uploadFileToPresignedUrlWithProgress(
                            response.presingedFileUrls![index],
                            file,
                            (progress) => {
                                setUploadStatuses(prev => ({ ...prev, [index]: { progress, status: 'uploading' } }));
                            }
                        );
                        setUploadStatuses(prev => ({ ...prev, [index]: { progress: 100, status: 'success' } }));
                    } catch (err) {
                        setUploadStatuses(prev => ({ ...prev, [index]: { progress: 0, status: 'error' } }));
                        throw err;
                    }
                });

                await Promise.all(uploadPromises);
            }

            setStatusMessage({ type: 'success', text: isDraft ? 'Draft saved and files uploaded!' : 'Assignment published and files successfully uploaded!' });
            const redirectPath = `/instructor/courses/${courseIdNum}/manage/assignments`;
            setTimeout(() => navigate(redirectPath), 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setStatusMessage({ type: 'error', text: apiError.message || 'Failed to complete assignment creation. Check file uploads.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPublishDisabled = !formData.title.trim() || !formData.dueDate || isSubmitting;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans pb-20">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
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
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shadow-sm">
                                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Basic Information</h3>
                            </div>

                            {/* Badge instead of select course */}
                            <div>
                                <label className={labelCls}>Course</label>
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 rounded-xl font-bold text-sm shadow-sm opacity-90 cursor-default">
                                    {courseData ? `${courseData.code} - ${courseData.name}` : `Course #${courseIdNum}`}
                                </div>
                            </div>

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
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shadow-sm">
                                    <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Submission Rules</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                <div className="flex flex-col h-full">
                                    <label className={labelCls}>Due Date &amp; Time <span className="text-red-500">*</span></label>
                                    <div className="flex-1 flex flex-col justify-start">
                                        <DateTimePicker
                                            value={formData.dueDate}
                                            onChange={(d) => setFormData({ ...formData, dueDate: d })}
                                            minDate={new Date()}
                                            placeholder="Select submission deadline"
                                            iconColor="text-amber-500"
                                        />
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-2 ml-1">The date after which submissions are marked late.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col h-full">
                                    <label className={labelCls}>Timing Preferences</label>
                                    <div className="flex-1 flex flex-col justify-start">
                                        <div 
                                            onClick={() => setFormData({ ...formData, allowLateSubmission: !formData.allowLateSubmission })}
                                            className={`${inputCls} cursor-pointer flex items-center justify-between hover:border-blue-300 dark:hover:border-slate-500 transition-colors w-full ${
                                                formData.allowLateSubmission ? 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <div className={`flex items-center justify-center transition-colors ${formData.allowLateSubmission ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                                                    <Clock className="w-[18px] h-[18px]" />
                                                </div>
                                                <span className={`font-semibold text-sm truncate ${formData.allowLateSubmission ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-slate-200'}`}>
                                                    Allow Late Submissions
                                                </span>
                                            </div>
                                            {/* Switch Toggle */}
                                            <div className={`w-10 h-5 shrink-0 rounded-full relative transition-colors duration-300 ml-4 ${
                                                formData.allowLateSubmission ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'
                                            }`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-spring ${
                                                    formData.allowLateSubmission ? 'left-[22px] scale-105' : 'left-0.5'
                                                }`} />
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-2 ml-1">
                                            {formData.allowLateSubmission 
                                                ? 'Late submissions will be accepted but marked as late.'
                                                : 'Submissions after deadline will be rejected.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Section 4: Attachments */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-sm">
                                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reference Materials</h3>
                            </div>

                            <label className="relative overflow-hidden flex flex-col items-center justify-center gap-4 px-6 py-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-[2rem] cursor-pointer hover:border-blue-500 group transition-all duration-500 bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/20 dark:to-slate-900/40 hover:shadow-lg hover:shadow-blue-500/5 outline-none">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95 transition-all duration-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700 relative z-10">
                                    <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500" />
                                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 relative z-10" />
                                </div>
                                <div className="text-center relative z-10">
                                    <span className="text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Click to upload reference files</span>
                                </div>
                                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                            </label>

                            {attachments.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    {attachments.map((file, index) => {
                                        const statusObj = uploadStatuses[index];
                                        const isUploading = statusObj?.status === 'uploading';
                                        const isSuccess = statusObj?.status === 'success';
                                        const isError = statusObj?.status === 'error';
                                        const progress = statusObj?.progress || 0;

                                        return (
                                        <div key={`new-${index}`} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden relative">
                                            <div className="flex items-center gap-4 flex-1 truncate pr-2 relative z-10">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                    {isSuccess ? (
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                                                    ) : isError ? (
                                                        <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
                                                    ) : (
                                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div className="truncate pr-2">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                    <div className="flex items-center gap-2 mt-1 truncate">
                                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 shrink-0">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg truncate ${isSuccess ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : isError ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10' : 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10'}`}>
                                                            {isUploading ? `Uploading ${progress}%` : isSuccess ? 'Success' : isError ? 'Failed' : 'New Attached'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 relative z-10 flex items-center">
                                                <button type="button" disabled={isSubmitting} onClick={() => removeAttachment(index)} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm" title="Remove File">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {isUploading && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-700 overflow-hidden">
                                                    <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        )})}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
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
                                disabled={isPublishDisabled}
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