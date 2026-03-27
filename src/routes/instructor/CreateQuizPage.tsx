import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useCreateQuiz } from '@/features/quizzes/api';
import type { CreateQuizCommand } from '@/types/api.types';

export const CreateQuizPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    // React Query mutation for creating quiz
    const createQuizMutation = useCreateQuiz();

    // Form state
    const [formData, setFormData] = useState<CreateQuizCommand>({
        title: '',
        description: '',
        courseId: courseId || '',
        maximumAttempts: 1,
        status: 'Draft',
        availableFrom: new Date().toISOString(),
        availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        publishedDate: undefined,
        showResultOnClose: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        questions: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!courseId) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Request</h1>
                    <p className="text-slate-400 mb-6">Course ID is missing.</p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    // Format datetime for input fields
    const formatDateTimeForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Parse datetime input to ISO string
    const parseDateTimeInput = (inputValue: string) => {
        return new Date(inputValue).toISOString();
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (formData.title.length > 255) {
            newErrors.title = 'Title must be 255 characters or less';
        }

        const availableFrom = new Date(formData.availableFrom);
        const availableUntil = new Date(formData.availableUntil);

        if (availableUntil <= availableFrom) {
            newErrors.availableUntil = 'Available until must be after available from';
        }

        if (formData.maximumAttempts < 1) {
            newErrors.maximumAttempts = 'Attempts allowed must be at least 1';
        }

        if (formData.status === 'Scheduled' && !formData.publishedDate) {
            newErrors.publishedDate = 'Published date is required when scheduling';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setError(null);

            // Create the quiz
            const result = await createQuizMutation.mutateAsync(formData);

            // Extract quiz ID from response
            const newQuizId = result?.id;

            // Navigate to quiz questions builder
            if (newQuizId) {
                navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, {
                    replace: true,
                    state: {
                        settings: formData,
                        quizId: newQuizId,
                        courseId: courseId,
                    },
                });
            }
        } catch (err: any) {
            console.error('Failed to create quiz:', err);
            setError(err.response?.data?.message || 'Failed to create quiz. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Create New Quiz</h1>
                        <p className="text-slate-400">Set up quiz details and rules</p>
                    </div>
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="text-slate-400 hover:text-white transition-colors text-2xl"
                    >
                        ←
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quiz Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Quiz Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, title: e.target.value }));
                                if (errors.title) setErrors((prev) => {
                                    const { title, ...rest } = prev;
                                    return rest;
                                });
                            }}
                            placeholder="Enter quiz title"
                            className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-slate-700'
                                }`}
                            maxLength={255}
                            disabled={createQuizMutation.isPending}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter quiz description (optional)"
                            rows={4}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            disabled={createQuizMutation.isPending}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Available From <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formatDateTimeForInput(formData.availableFrom)}
                                onChange={(e) => setFormData((prev) => ({ ...prev, availableFrom: parseDateTimeInput(e.target.value) }))}
                                className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 ${errors.availableFrom ? 'border-red-500' : 'border-slate-700'
                                    }`}
                                disabled={createQuizMutation.isPending}
                            />
                            <p className="text-slate-400 text-xs mt-1">When students can start the quiz</p>
                            {errors.availableFrom && <p className="text-red-500 text-sm mt-1">{errors.availableFrom}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Available Until <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formatDateTimeForInput(formData.availableUntil)}
                                onChange={(e) => setFormData((prev) => ({ ...prev, availableUntil: parseDateTimeInput(e.target.value) }))}
                                className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 ${errors.availableUntil ? 'border-red-500' : 'border-slate-700'
                                    }`}
                                disabled={createQuizMutation.isPending}
                            />
                            <p className="text-slate-400 text-xs mt-1">Last moment a student can enter the quiz</p>
                            {errors.availableUntil && <p className="text-red-500 text-sm mt-1">{errors.availableUntil}</p>}
                        </div>
                    </div>

                    {/* Attempts Allowed */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Attempts Allowed <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.maximumAttempts}
                            onChange={(e) => setFormData((prev) => ({ ...prev, maximumAttempts: parseInt(e.target.value) || 0 }))}
                            min="1"
                            max="100"
                            className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 ${errors.maximumAttempts ? 'border-red-500' : 'border-slate-700'
                                }`}
                            disabled={createQuizMutation.isPending}
                        />
                        <p className="text-slate-400 text-xs mt-1">1 - 5 attempts</p>
                        {errors.maximumAttempts && <p className="text-red-500 text-sm mt-1">{errors.maximumAttempts}</p>}
                    </div>

                    {/* Publish Status */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Publish Status</label>
                        <div className="space-y-3">
                            {/* Save as Draft */}
                            <label className={`flex items-start cursor-pointer hover:bg-slate-900/50 border rounded-lg p-4 transition-colors ${formData.status === 'Draft'
                                    ? 'border-blue-500 bg-blue-950/20'
                                    : 'border-slate-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Draft"
                                    checked={formData.status === 'Draft'}
                                    onChange={() => setFormData((prev) => ({ ...prev, status: 'Draft' }))}
                                    disabled={createQuizMutation.isPending}
                                    className="mt-1 w-4 h-4 cursor-pointer"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium">Save as Draft</p>
                                    <p className="text-slate-400 text-sm">Not visible to students yet</p>
                                </div>
                            </label>

                            {/* Publish Immediately */}
                            <label className={`flex items-start cursor-pointer hover:bg-slate-900/50 border rounded-lg p-4 transition-colors ${formData.status === 'Published'
                                    ? 'border-blue-500 bg-blue-950/20'
                                    : 'border-slate-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Published"
                                    checked={formData.status === 'Published'}
                                    onChange={() => setFormData((prev) => ({ ...prev, status: 'Published', publishedDate: new Date().toISOString() }))}
                                    disabled={createQuizMutation.isPending}
                                    className="mt-1 w-4 h-4 cursor-pointer"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium">Publish Immediately</p>
                                    <p className="text-slate-400 text-sm">Visible to students right away</p>
                                </div>
                            </label>

                            {/* Schedule */}
                            <div>
                                <label className={`flex items-start cursor-pointer hover:bg-slate-900/50 border rounded-lg p-4 transition-colors ${formData.status === 'Scheduled'
                                        ? 'border-blue-500 bg-blue-950/20'
                                        : 'border-slate-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Scheduled"
                                        checked={formData.status === 'Scheduled'}
                                        onChange={() => setFormData((prev) => ({ ...prev, status: 'Scheduled' }))}
                                        disabled={createQuizMutation.isPending}
                                        className="mt-1 w-4 h-4 cursor-pointer"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className="font-medium">Schedule</p>
                                        <p className="text-slate-400 text-sm">Set a future publish date</p>
                                    </div>
                                </label>

                                {formData.status === 'Scheduled' && (
                                    <div className="mt-3 ml-7 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                                        <label className="block text-sm font-medium mb-2">Publish Date</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.publishedDate ? formatDateTimeForInput(formData.publishedDate) : ''}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: parseDateTimeInput(e.target.value) }))}
                                            className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 ${errors.publishedDate ? 'border-red-500' : 'border-slate-700'
                                                }`}
                                            disabled={createQuizMutation.isPending}
                                        />
                                        {errors.publishedDate && <p className="text-red-500 text-sm mt-1">{errors.publishedDate}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quiz Behavior */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Quiz Behavior</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Show Results on Close */}
                            <label
                                className={`flex items-center cursor-pointer border rounded-lg p-4 transition-colors ${formData.showResultOnClose
                                    ? 'border-blue-500 bg-blue-950/20'
                                    : 'border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.showResultOnClose}
                                    onChange={() => setFormData((prev) => ({ ...prev, showResultOnClose: !prev.showResultOnClose }))}
                                    disabled={createQuizMutation.isPending}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium text-sm">Show results on close</p>
                                    <p className="text-slate-400 text-xs mt-1">Show correct answers to students after the quiz ends</p>
                                </div>
                            </label>

                            {/* Shuffle Questions */}
                            <label
                                className={`flex items-center cursor-pointer border rounded-lg p-4 transition-colors ${formData.shuffleQuestions
                                    ? 'border-blue-500 bg-blue-950/20'
                                    : 'border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.shuffleQuestions}
                                    onChange={() => setFormData((prev) => ({ ...prev, shuffleQuestions: !prev.shuffleQuestions }))}
                                    disabled={createQuizMutation.isPending}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium text-sm">Shuffle questions</p>
                                    <p className="text-slate-400 text-xs mt-1">Randomize the order of questions for each attempt</p>
                                </div>
                            </label>

                            {/* Shuffle Options */}
                            <label
                                className={`flex items-center cursor-pointer border rounded-lg p-4 transition-colors ${formData.shuffleOptions
                                    ? 'border-blue-500 bg-blue-950/20'
                                    : 'border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.shuffleOptions}
                                    onChange={() => setFormData((prev) => ({ ...prev, shuffleOptions: !prev.shuffleOptions }))}
                                    disabled={createQuizMutation.isPending}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium text-sm">Shuffle options</p>
                                    <p className="text-slate-400 text-xs mt-1">Randomize the order of answer choices</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate(`/courses/${courseId}`)}
                            disabled={createQuizMutation.isPending}
                            className="flex-1 px-6 py-2 border border-slate-600 text-white rounded-lg hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={createQuizMutation.isPending}
                            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {createQuizMutation.isPending ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Next: Edit Questions <span>→</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateQuizPage;