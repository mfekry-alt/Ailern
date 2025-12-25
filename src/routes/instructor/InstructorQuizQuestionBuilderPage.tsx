import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

type QuestionType = 'MCQ' | 'TF' | 'Written';

interface Question {
    id: number;
    type: QuestionType;
    text: string;
    points: number;
    options?: string[];
    correctAnswer?: string | boolean;
    explanation?: string;
}

export const InstructorQuizQuestionBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [statusMessage, setStatusMessage] = useState<string>('');
    
    // Get quiz settings from previous step (in real app, this would come from state/API)
    const quizSettings = location.state?.quizSettings || {
        title: 'New Quiz',
        duration: 30,
        attemptsAllowed: 1,
    };

    // Redirect if no settings provided
    useEffect(() => {
        if (!location.state?.quizSettings) {
            navigate(ROUTES.INSTRUCTOR_QUIZ_CREATE);
        }
    }, [location.state, navigate]);

    const [questions, setQuestions] = useState<Question[]>([
        {
            id: 1,
            type: 'MCQ',
            text: '',
            points: 5,
            options: ['', '', '', ''],
            correctAnswer: '',
        },
    ]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: questions.length + 1,
            type: 'MCQ',
            text: '',
            points: 5,
            options: ['', '', '', ''],
            correctAnswer: '',
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: number) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const updateQuestion = (id: number, updates: Partial<Question>) => {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
        );
    };

    const addOption = (questionId: number) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId && q.options) {
                    return { ...q, options: [...q.options, ''] };
                }
                return q;
            })
        );
    };

    const removeOption = (questionId: number, optionIndex: number) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId && q.options) {
                    const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const updateOption = (questionId: number, optionIndex: number, value: string) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId && q.options) {
                    const newOptions = [...q.options];
                    newOptions[optionIndex] = value;
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const handleSaveQuiz = (publish: boolean) => {
        // Validate questions
        for (const question of questions) {
            if (!question.text.trim()) {
                setStatusMessage('All questions must have text.');
                return;
            }
            if (question.type === 'MCQ') {
                if (!question.options || question.options.length < 2) {
                    setStatusMessage('MCQ questions must have at least 2 options.');
                    return;
                }
                if (!question.correctAnswer) {
                    setStatusMessage('MCQ questions must have a correct answer selected.');
                    return;
                }
            }
            if (question.type === 'TF' && question.correctAnswer === undefined) {
                setStatusMessage('True/False questions must have a correct answer.');
                return;
            }
        }

        setStatusMessage(publish ? 'Quiz published successfully!' : 'Quiz saved as draft.');
        // API call would go here
        setTimeout(() => navigate(ROUTES.INSTRUCTOR_COURSES), 1500);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-5xl mx-auto">
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-[30px] font-bold text-gray-900 mb-2">Question Builder</h1>
                                    <p className="text-[16px] text-gray-600">
                                        Step 2 of 2: Add questions to "{quizSettings.title}"
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            </div>

                            {statusMessage && (
                                <div className={`p-4 rounded-lg ${
                                    statusMessage.includes('success') || statusMessage.includes('saved')
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                }`}>
                                    <p className="text-sm">{statusMessage}</p>
                                </div>
                            )}

                            {/* Questions List */}
                            <div className="space-y-6">
                                {questions.map((question, index) => (
                                    <div key={question.id} className="p-6 border border-gray-200 rounded-lg bg-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-[18px] font-semibold text-gray-900">
                                                Question {index + 1}
                                            </h3>
                                            {questions.length > 1 && (
                                                <button
                                                    onClick={() => removeQuestion(question.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Question Type */}
                                        <div className="mb-4">
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Question Type
                                            </label>
                                            <select
                                                value={question.type}
                                                onChange={(e) =>
                                                    updateQuestion(question.id, {
                                                        type: e.target.value as QuestionType,
                                                        options: e.target.value === 'MCQ' ? ['', '', '', ''] : undefined,
                                                        correctAnswer: e.target.value === 'TF' ? true : undefined,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                            >
                                                <option value="MCQ">Multiple Choice (MCQ)</option>
                                                <option value="TF">True/False</option>
                                                <option value="Written">Written Answer</option>
                                            </select>
                                        </div>

                                        {/* Question Text */}
                                        <div className="mb-4">
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Question Text <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Enter your question here..."
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] resize-none"
                                            />
                                        </div>

                                        {/* Points */}
                                        <div className="mb-4">
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Points <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={question.points}
                                                onChange={(e) =>
                                                    updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                            />
                                        </div>

                                        {/* MCQ Options */}
                                        {question.type === 'MCQ' && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-[14px] font-medium text-gray-700">
                                                        Options <span className="text-red-500">*</span>
                                                    </label>
                                                    <button
                                                        onClick={() => addOption(question.id)}
                                                        className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        + Add Option
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {question.options?.map((option, optIndex) => (
                                                        <div key={optIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${question.id}`}
                                                                checked={question.correctAnswer === option}
                                                                onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder={`Option ${optIndex + 1}`}
                                                                value={option}
                                                                onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                                            />
                                                            {question.options && question.options.length > 2 && (
                                                                <button
                                                                    onClick={() => removeOption(question.id, optIndex)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* True/False Options */}
                                        {question.type === 'TF' && (
                                            <div className="mb-4">
                                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                    Correct Answer <span className="text-red-500">*</span>
                                                </label>
                                                <div className="space-y-2">
                                                    {[true, false].map((value) => (
                                                        <label
                                                            key={String(value)}
                                                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                                                question.correctAnswer === value
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`tf-${question.id}`}
                                                                checked={question.correctAnswer === value}
                                                                onChange={() => updateQuestion(question.id, { correctAnswer: value })}
                                                                className="w-4 h-4 text-blue-600"
                                                            />
                                                            <span className="text-[14px] text-gray-900">{value ? 'True' : 'False'}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Written Answer Note */}
                                        {question.type === 'Written' && (
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-[13px] text-blue-800">
                                                    Written questions will be manually graded by the instructor after submission.
                                                </p>
                                            </div>
                                        )}

                                        {/* Explanation (Optional) */}
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Explanation (Optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Provide an explanation for the correct answer..."
                                                value={question.explanation || ''}
                                                onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] resize-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Question Button */}
                            <button
                                onClick={addQuestion}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-[14px] font-medium text-gray-700"
                            >
                                <Plus className="w-5 h-5" />
                                Add More Questions
                            </button>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleSaveQuiz(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => handleSaveQuiz(true)}
                                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Publish Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

