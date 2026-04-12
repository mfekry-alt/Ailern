import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTES } from '@/lib/constants';
import {
    ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle,
    Settings, BookOpen, AlignLeft
} from 'lucide-react';
import { useCreateCourse, useUpdateCourse, useCourse } from '@/features/courses/api';
import { handleApiError } from '@/api/client';

const inputCls =
    'w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white transition-all text-sm font-semibold';
const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1';

export const InstructorCourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id; // If there is no ID in the URL, we are on the Create page
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
        department: '',
        academicYear: '',
        category: '',
        thumbnail: null as File | null,
        prerequisites: '',
        learningObjectives: '',
        readyToSubmit: false,
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

    const handleSubmit = async (isDraft: boolean) => {
        setStatusMessage(null);
        if (!isDraft && !formData.title.trim()) {
            setStatusMessage({ type: 'error', text: 'Course title is required for submission.' });
            return;
        }

        const code = formData.courseId.trim() ? formData.courseId.trim() : generateCourseId(formData.title);
        setFormData((prev) => ({ ...prev, courseId: code }));
        setIsSubmitting(true);

        try {
            const command = {
                code,
                name: formData.title,
                description: formData.description,
                department: formData.department,
                academicYear: formData.academicYear,
                category: formData.category,
                prerequisites: formData.prerequisites,
                learningObjectives: formData.learningObjectives,
                isDraft: isDraft
            };

            if (isNew) {
                await createCourseMutation.mutateAsync(command);
                setStatusMessage({ type: 'success', text: isDraft ? 'Draft saved successfully.' : 'Course created successfully!' });
            } else {
                await updateCourseMutation.mutateAsync({ id: courseId, command });
                setStatusMessage({ type: 'success', text: isDraft ? 'Draft updated successfully.' : 'Course updated successfully!' });
            }

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
                            Set up the structure and foundational details of your course.
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

                        {/* Section 1: Basic Information */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <Settings className="w-5 h-5 text-blue-500" /> Basic Information
                            </h3>

                            <div>
                                <label className={labelCls}>Course Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Introduction to Artificial Intelligence"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={inputCls}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Course ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CS101 (Auto-generated if empty)"
                                        value={formData.courseId}
                                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                        disabled={!isNew}
                                        className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Category</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Programming, Design, AI"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Academic Details */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <BookOpen className="w-5 h-5 text-amber-500" /> Academic Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Department</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Computer Science"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Academic Year</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2024/2025"
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Course Content Details */}
                        <div className="space-y-5 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-3">
                                <AlignLeft className="w-5 h-5 text-emerald-500" /> Course Content Details
                            </h3>

                            <div>
                                <label className={labelCls}>Course Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Provide a detailed overview of the course content..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Prerequisites</label>
                                <textarea
                                    rows={2}
                                    placeholder="What should students know before taking this course?"
                                    value={formData.prerequisites}
                                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Learning Objectives</label>
                                <textarea
                                    rows={2}
                                    placeholder="What will students learn? (Separate with commas or bullets)"
                                    value={formData.learningObjectives}
                                    onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
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

                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl font-bold transition-all text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-blue-500/25 active:scale-95 text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {isNew ? 'Create Course' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};