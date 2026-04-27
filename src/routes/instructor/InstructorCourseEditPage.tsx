import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle,
    Settings, AlignLeft, Camera, Image as ImageIcon, X, Trash2
} from 'lucide-react';
import { useCreateCourse, useUpdateCourse, useCourse } from '@/features/courses/api';
import { handleApiError } from '@/api/client';

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-semibold';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorCourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;
    const courseId = id ? parseInt(id) : 0;

    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // API hooks
    const createCourseMutation = useCreateCourse();
    const updateCourseMutation = useUpdateCourse();
    const { data: existingCourse, isLoading } = useCourse(courseId);

    const [formData, setFormData] = useState({
        title: '',
        courseId: '',
        description: '',
        thumbnail: null as File | null,
    });

    // Populate form when editing an existing course
    useEffect(() => {
        if (existingCourse && !isNew) {
            setFormData((prev) => ({
                ...prev,
                title: existingCourse.name || '',
                courseId: existingCourse.code || '',
                description: existingCourse.description || '',
            }));
        }
    }, [existingCourse, isNew]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, thumbnail: file }));
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, thumbnail: null }));
    };

    const generateCourseId = (title: string) => {
        const cleaned = title
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((w) => w.slice(0, 3))
            .join('');
        if (cleaned.length >= 4) return cleaned;
        const suffix = String(Date.now()).slice(-4);
        return `${cleaned || 'COURSE'}${suffix}`;
    };

    const handleSubmit = async () => {
        setStatusMessage(null);
        if (!formData.title.trim()) {
            setStatusMessage({ type: 'error', text: 'Course title is required.' });
            return;
        }

        if (!formData.courseId.trim()) {
            setStatusMessage({ type: 'error', text: 'Course code is required.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare image metadata if exists - Use PascalCase for backend compatibility
            const imageMetadata = formData.thumbnail ? {
                FileName: formData.thumbnail.name,
                FileSize: formData.thumbnail.size,
                ContentType: formData.thumbnail.type
            } : undefined;

            const command = {
                code: formData.courseId.trim(),
                name: formData.title.trim(),
                description: formData.description,
                Image: imageMetadata
            };

            console.log('📦 Sending Course Command:', JSON.stringify(command, null, 2));

            let response: any;
            if (isNew) {
                response = await createCourseMutation.mutateAsync(command);
            } else {
                response = await updateCourseMutation.mutateAsync({ id: courseId, command });
            }

            // Handle binary upload if uploadImageUrl returned
            // Create returns { data: { uploadImageUrl } }, Update returns { data: string }
            const uploadImageUrl = response?.data?.uploadImageUrl || (typeof response?.data === 'string' ? response.data : null);
            
            if (uploadImageUrl && formData.thumbnail) {
                console.log('🚀 Uploading course image to Wasabi...', uploadImageUrl);
                await axios.put(uploadImageUrl, formData.thumbnail, {
                    headers: { 'Content-Type': formData.thumbnail.type }
                });
                console.log('✅ Image upload complete!');
            }

            setStatusMessage({ 
                type: 'success', 
                text: isNew ? 'Course created successfully!' : 'Course updated successfully!' 
            });

            setTimeout(() => navigate(ROUTES.INSTRUCTOR_COURSES), 1500);
        } catch (error) {
            const apiError = handleApiError(error);
            setStatusMessage({ type: 'error', text: apiError.message || 'Failed to save course. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isNew && isLoading) {
        return (
            <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="text-gray-600 dark:text-slate-300 font-bold">Loading course...</span>
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
                        onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
                        className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            {isNew ? 'Create New Course' : 'Edit Course'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                            Set up the foundational details of your course.
                        </p>
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

                        {/* Basic Information Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-blue-500" /> Basic Information
                            </h3>

                            {/* Image Upload Section */}
                            <div className="flex flex-col sm:flex-row gap-6 items-start pb-4">
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center transition-all group-hover:border-blue-400">
                                        {formData.thumbnail ? (
                                            <img
                                                src={URL.createObjectURL(formData.thumbnail)}
                                                className="w-full h-full object-cover"
                                                alt="Course Preview"
                                            />
                                        ) : existingCourse?.imageUrl ? (
                                            <img
                                                src={existingCourse.imageUrl || undefined}
                                                className="w-full h-full object-cover opacity-60"
                                                alt="Current Thumbnail"
                                            />
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">No Image</p>
                                            </div>
                                        )}
                                    </div>
                                    {(formData.thumbnail || existingCourse?.imageUrl) && (
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Course Thumbnail</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                                        Upload a high-quality image to represent your course.
                                    </p>
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
                                            <Camera className="w-3.5 h-3.5" />
                                            {formData.thumbnail ? 'Change Image' : 'Select Image'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                        {formData.thumbnail && (
                                            <button
                                                onClick={removeImage}
                                                className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Course Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Introduction to Artificial Intelligence"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Course Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CS101"
                                        value={formData.courseId}
                                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                        disabled={!isNew}
                                        className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3 pt-4">
                                    <AlignLeft className="w-5 h-5 text-emerald-500" /> Description
                                </h3>
                                <div className="mt-4">
                                    <textarea
                                        rows={6}
                                        placeholder="Provide a detailed overview of the course content..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 active:scale-95 text-sm disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isNew ? 'Create Course' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};