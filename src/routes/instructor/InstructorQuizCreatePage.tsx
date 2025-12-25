import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

export const InstructorQuizCreatePage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [statusMessage, setStatusMessage] = useState<string>('');

    const [quizSettings, setQuizSettings] = useState({
        title: '',
        description: '',
        duration: 30,
        attemptsAllowed: 1,
        publishOption: 'draft' as 'draft' | 'immediate' | 'scheduled',
        scheduledStart: '',
        scheduledEnd: '',
    });

    const handleNext = () => {
        if (!quizSettings.title.trim()) {
            setStatusMessage('Quiz title is required.');
            return;
        }
        setStatusMessage('');
        navigate(ROUTES.INSTRUCTOR_QUIZ_QUESTIONS, { state: { quizSettings } });
    };

    const handleSaveDraft = () => {
        setStatusMessage('Draft saved.');
        // API call would go here
        setTimeout(() => navigate(ROUTES.INSTRUCTOR_COURSES), 1000);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigate(ROUTES.INSTRUCTOR_COURSES);
        }
    };

    // Page 1: Settings
    if (step === 1) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="max-w-4xl mx-auto">
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-[30px] font-bold text-gray-900 mb-2">Create New Quiz</h1>
                                        <p className="text-[16px] text-gray-600">Step 1 of 2: Quiz Settings</p>
                                    </div>
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                </div>

                                {statusMessage && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">{statusMessage}</p>
                                    </div>
                                )}

                                {/* Quiz Title */}
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Quiz Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Midterm Exam - Chapter 1-5"
                                        value={quizSettings.title}
                                        onChange={(e) => setQuizSettings({ ...quizSettings, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Provide instructions and information about this quiz..."
                                        value={quizSettings.description}
                                        onChange={(e) => setQuizSettings({ ...quizSettings, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] resize-none"
                                    />
                                </div>

                                {/* Duration and Attempts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Duration (minutes) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quizSettings.duration}
                                            onChange={(e) => setQuizSettings({ ...quizSettings, duration: parseInt(e.target.value) || 30 })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                            Attempts Allowed <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quizSettings.attemptsAllowed}
                                            onChange={(e) => setQuizSettings({ ...quizSettings, attemptsAllowed: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                        />
                                    </div>
                                </div>

                                {/* Publish Options */}
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-3">
                                        Publish Options
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="publishOption"
                                                value="draft"
                                                checked={quizSettings.publishOption === 'draft'}
                                                onChange={() => setQuizSettings({ ...quizSettings, publishOption: 'draft' })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-[14px] text-gray-900">Save as Draft</div>
                                                <div className="text-[12px] text-gray-600">Quiz will not be visible to students</div>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="publishOption"
                                                value="immediate"
                                                checked={quizSettings.publishOption === 'immediate'}
                                                onChange={() => setQuizSettings({ ...quizSettings, publishOption: 'immediate' })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-[14px] text-gray-900">Publish Immediately</div>
                                                <div className="text-[12px] text-gray-600">Quiz will be available to students right away</div>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="publishOption"
                                                value="scheduled"
                                                checked={quizSettings.publishOption === 'scheduled'}
                                                onChange={() => setQuizSettings({ ...quizSettings, publishOption: 'scheduled' })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-[14px] text-gray-900">Schedule</div>
                                                <div className="text-[12px] text-gray-600">Set start and end dates for the quiz</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Schedule Dates */}
                                {quizSettings.publishOption === 'scheduled' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Start Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={quizSettings.scheduledStart}
                                                onChange={(e) => setQuizSettings({ ...quizSettings, scheduledStart: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                End Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={quizSettings.scheduledEnd}
                                                onChange={(e) => setQuizSettings({ ...quizSettings, scheduledEnd: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleSaveDraft}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        Next: Add Questions
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Page 2: Question Builder will be in a separate component
    // For now, redirect to a placeholder or show message
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-4xl mx-auto">
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <p className="text-center text-gray-600">Question Builder will be implemented next...</p>
                        <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                            Back to Settings
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

