import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, Save, Upload, X, FileText, Loader2,
    CalendarClock, ShieldCheck, CheckCircle2, AlertTriangle, Settings,
    Clock, Sparkles, Trash2, AlertCircle
} from 'lucide-react';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useCreateAssignment } from '@/features/assignments/api';
import { useCourse } from '@/features/courses/api';
import { handleApiError } from '@/api/client';
import { uploadFileToPresignedUrlWithProgress } from '@/api/services/assignment.service';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { mapServerErrors } from '@/utils/mapServerErrors';
import { scrollToFirstError } from '@/utils/form-utils';

const ALLOWED_CONTENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'application/zip',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

const assignmentSchema = yup.object().shape({
    title: yup.string()
        .required('Title is required.')
        .max(200, 'Title is required and must be 200 characters or less.'),
    instructions: yup.string().optional(),
    dueDate: yup.date()
        .typeError('Due date must be a valid date.')
        .required('Due date is required.')
        .min(new Date(), 'DueDate must be in the future.'),
    allowLateSubmission: yup.boolean().default(false),
    files: yup.array().of(
        yup.mixed<File>().test('fileValidation', 'Invalid file', (file) => {
            if (!file) return true;
            
            // Extension check
            if (!file.name.includes('.')) return false;
            
            // Content Type check
            if (!ALLOWED_CONTENT_TYPES.includes(file.type)) return false;
            
            // Size check
            const isVideo = file.type.startsWith('video/');
            const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
            if (file.size > maxSize) return false;
            
            return true;
        })
    ).max(10, 'You can upload a maximum of 10 files.').optional().default([])
});

type AssignmentFormData = yup.InferType<typeof assignmentSchema>;

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#21A9FF]/50 text-gray-900 dark:text-white transition-all text-sm font-semibold';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorAssignmentCreatePage = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const courseIdNum = Number.parseInt(courseId || '0');
    
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [uploadStatuses, setUploadStatuses] = useState<Record<number, { progress: number; status: 'pending' | 'uploading' | 'success' | 'error' }>>({});

    const createAssignmentMutation = useCreateAssignment();
    const { data: courseData } = useCourse(courseIdNum);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<AssignmentFormData>({
        resolver: yupResolver(assignmentSchema) as any,
        defaultValues: {
            title: '',
            instructions: '',
            allowLateSubmission: false,
            files: [],
        }
    });

    const attachments = (watch('files') || []).filter((f): f is File => !!f);

    const handleSave = async (isDraft: boolean) => {
        // Trigger validation manually to handle the draft/publish logic if needed
        // but since both use the same schema, we can just use handleSubmit
    };

    const onSubmit = async (data: AssignmentFormData, isDraft: boolean) => {
        setStatusMessage(null);
        setUploadStatuses({});

        try {
            const command = {
                title: data.title,
                instructions: data.instructions || '',
                dueDate: data.dueDate.toISOString(),
                allowLateSubmission: data.allowLateSubmission,
                isPublished: !isDraft,
                courseId: courseIdNum,
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

                const initialStatuses: Record<number, any> = {};
                attachments.forEach((_, i) => {
                    initialStatuses[i] = { progress: 0, status: 'pending' };
                });
                setUploadStatuses(initialStatuses);

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
            setTimeout(() => navigate(`/instructor/courses/${courseIdNum}/manage/assignments`), 1500);
        } catch (error: any) {
            if (error?.response?.data?.errors) {
                mapServerErrors(error.response.data.errors, setError);
                setTimeout(() => scrollToFirstError(error.response.data.errors), 100);
            }
            const apiError = handleApiError(error);
            setStatusMessage({ type: 'error', text: apiError.message || 'Failed to complete assignment creation.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        const currentFiles = watch('files') || [];
        setValue('files', [...currentFiles, ...newFiles], { shouldValidate: true });
        setStatusMessage(null);
    };

    const removeAttachment = (index: number) => {
        const currentFiles = watch('files') || [];
        setValue('files', currentFiles.filter((_, i) => i !== index), { shouldValidate: true });
    };

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
                                <div className="w-10 h-10 rounded-xl bg-[#21A9FF]/10 border border-[#21A9FF]/20 flex items-center justify-center shadow-sm">
                                    <Settings className="w-5 h-5 text-[#21A9FF]" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Basic Information</h3>
                            </div>

                            {/* Badge instead of select course */}
                            <div>
                                <label className={labelCls}>Course</label>
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#21A9FF]/10 border border-[#21A9FF]/20 text-[#21A9FF] rounded-xl font-bold text-sm shadow-sm opacity-90 cursor-default">
                                    {courseData ? `${courseData.code} - ${courseData.name}` : `Course #${courseIdNum}`}
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Assignment Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Phase 1: Market Research Analysis"
                                    {...register('title')}
                                    className={`${inputCls} ${errors.title ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                                />
                                {errors.title && (
                                    <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5 ml-1 animate-in slide-in-from-left-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> {errors.title.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelCls}>Instructions / Description</label>
                                <textarea
                                    rows={5}
                                    placeholder="Add detailed instructions for students..."
                                    {...register('instructions')}
                                    className={`${inputCls} resize-none ${errors.instructions ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                                />
                                {errors.instructions && (
                                    <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5 ml-1 animate-in slide-in-from-left-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> {errors.instructions.message}
                                    </p>
                                )}
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
                                            value={watch('dueDate')}
                                            onChange={(d) => setValue('dueDate', d || new Date(), { shouldValidate: true })}
                                            minDate={new Date()}
                                            placeholder="Select submission deadline"
                                            iconColor={errors.dueDate ? "text-red-500" : "text-amber-500"}
                                            hasError={!!errors.dueDate}
                                        />
                                        {errors.dueDate ? (
                                            <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5 ml-1 animate-in slide-in-from-left-2">
                                                <AlertCircle className="w-3.5 h-3.5" /> {errors.dueDate.message}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-2 ml-1">The date after which submissions are marked late.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col h-full">
                                    <label className={labelCls}>Timing Preferences</label>
                                    <div className="flex-1 flex flex-col justify-start">
                                        <div 
                                            onClick={() => setValue('allowLateSubmission', !watch('allowLateSubmission'))}
                                            className={`${inputCls} cursor-pointer flex items-center justify-between hover:border-[#21A9FF]/50 transition-colors w-full ${
                                                watch('allowLateSubmission') ? 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <div className={`flex items-center justify-center transition-colors ${watch('allowLateSubmission') ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                                                    <Clock className="w-[18px] h-[18px]" />
                                                </div>
                                                <span className={`font-semibold text-sm truncate ${watch('allowLateSubmission') ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-slate-200'}`}>
                                                    Allow Late Submissions
                                                </span>
                                            </div>
                                            <div className={`w-10 h-5 shrink-0 rounded-full relative transition-colors duration-300 ml-4 ${
                                                watch('allowLateSubmission') ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'
                                            }`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-spring ${
                                                    watch('allowLateSubmission') ? 'left-[22px] scale-105' : 'left-0.5'
                                                }`} />
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-2 ml-1">
                                            {watch('allowLateSubmission') 
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
                                <div className="w-10 h-10 rounded-xl bg-[#21A9FF]/10 border border-[#21A9FF]/20 flex items-center justify-center shadow-sm">
                                    <Upload className="w-5 h-5 text-[#21A9FF]" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reference Materials</h3>
                            </div>

                            <label className={`relative overflow-hidden flex flex-col items-center justify-center gap-4 px-6 py-12 border-2 border-dashed rounded-[2rem] cursor-pointer group transition-all duration-500 bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/20 dark:to-slate-900/40 hover:shadow-lg hover:shadow-[#21A9FF]/5 outline-none ${errors.files ? 'border-red-400 bg-red-50/30 dark:bg-red-500/5' : 'border-gray-300 dark:border-slate-600 hover:border-[#21A9FF]'}`}>
                                <div className="absolute inset-0 bg-[#21A9FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95 transition-all duration-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700 relative z-10">
                                    <div className="absolute inset-0 bg-[#21A9FF] opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500" />
                                    <Upload className={`w-8 h-8 relative z-10 ${errors.files ? 'text-red-500' : 'text-[#21A9FF]'}`} />
                                </div>
                                <div className="text-center relative z-10">
                                    <span className={`text-lg font-extrabold transition-colors ${errors.files ? 'text-red-600' : 'text-gray-900 dark:text-white group-hover:text-[#21A9FF]'}`}>Click to upload reference files</span>
                                    {errors.files && <p className="mt-2 text-sm font-bold text-red-500">{errors.files.message}</p>}
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
                                                        <FileText className="w-6 h-6 text-[#21A9FF]" />
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
                                                    <div className="bg-[#21A9FF] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
                                onClick={handleSubmit((data) => onSubmit(data, true))}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all text-sm disabled:opacity-50 active:scale-95 shadow-sm"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit((data) => onSubmit(data, false))}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-[#21A9FF] hover:bg-[#0094F2] text-white rounded-xl font-bold transition-all shadow-md shadow-[#21A9FF]/20 hover:shadow-[#21A9FF]/40 active:scale-95 text-sm disabled:opacity-50"
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