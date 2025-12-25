import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Clock, CheckCircle2, XCircle, AlertCircle, Play, FileText, HelpCircle } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    course: string;
    instructor: string;
    duration: number; // in minutes
    totalQuestions: number;
    totalPoints: number;
    attemptsAllowed: number;
    attemptsUsed: number;
    dueDate: string;
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
    lastAttempt?: string;
}

export const QuizzesPage = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [quizzes] = useState<Quiz[]>([
        {
            id: '1',
            title: 'Quiz 1: AI Fundamentals',
            course: 'CS101 - Introduction to Programming',
            instructor: 'Dr. Emily Carter',
            duration: 30,
            totalQuestions: 6,
            totalPoints: 36,
            attemptsAllowed: 3,
            attemptsUsed: 0,
            dueDate: '2024-12-30T23:59:59',
            status: 'not_started'
        },
        {
            id: '2',
            title: 'Quiz 2: Data Structures Basics',
            course: 'CS202 - Data Structures',
            instructor: 'Prof. Michael Brown',
            duration: 45,
            totalQuestions: 10,
            totalPoints: 50,
            attemptsAllowed: 2,
            attemptsUsed: 1,
            dueDate: '2024-12-28T23:59:59',
            status: 'completed',
            score: 42,
            lastAttempt: '2024-12-25T14:30:00'
        },
        {
            id: '3',
            title: 'Mid-Term Quiz: Linear Algebra',
            course: 'MA203 - Linear Algebra',
            instructor: 'Dr. Sarah Wilson',
            duration: 60,
            totalQuestions: 15,
            totalPoints: 75,
            attemptsAllowed: 1,
            attemptsUsed: 0,
            dueDate: '2025-01-05T23:59:59',
            status: 'not_started'
        },
        {
            id: '4',
            title: 'Quiz 3: Mechanics Principles',
            course: 'PHY105 - Classical Mechanics',
            instructor: 'Dr. James Lee',
            duration: 40,
            totalQuestions: 8,
            totalPoints: 40,
            attemptsAllowed: 3,
            attemptsUsed: 2,
            dueDate: '2024-12-27T23:59:59',
            status: 'completed',
            score: 35,
            lastAttempt: '2024-12-26T10:15:00'
        }
    ]);

    const getStatusBadge = (quiz: Quiz) => {
        if (quiz.status === 'completed') {
            return {
                text: 'Completed',
                className: 'bg-green-100 text-green-800',
                icon: CheckCircle2
            };
        }
        if (quiz.attemptsUsed >= quiz.attemptsAllowed) {
            return {
                text: 'No Attempts Left',
                className: 'bg-red-100 text-red-800',
                icon: XCircle
            };
        }
        if (new Date(quiz.dueDate) < new Date()) {
            return {
                text: 'Overdue',
                className: 'bg-red-100 text-red-800',
                icon: AlertCircle
            };
        }
        return {
            text: 'Available',
            className: 'bg-blue-100 text-blue-800',
            icon: Play
        };
    };

    const handleStartQuiz = (quizId: string) => {
        navigate(`/quiz/${quizId}`);
    };

    const filteredQuizzes = quizzes.filter(quiz => {
        const courseMatch = selectedCourse === 'all' || quiz.course.includes(selectedCourse);
        const statusMatch = selectedStatus === 'all' || quiz.status === selectedStatus;
        return courseMatch && statusMatch;
    });

    const stats = [
        { label: 'Total Quizzes', value: quizzes.length, color: 'text-blue-600' },
        { label: 'Completed', value: quizzes.filter(q => q.status === 'completed').length, color: 'text-green-600' },
        { label: 'Pending', value: quizzes.filter(q => q.status === 'not_started').length, color: 'text-yellow-600' },
        { label: 'Average Score', value: `${Math.round(quizzes.filter(q => q.score).reduce((acc, q) => acc + (q.score! / q.totalPoints * 100), 0) / quizzes.filter(q => q.score).length) || 0}%`, color: 'text-purple-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-[36px] font-bold text-gray-900">Quizzes</h1>
                    <p className="text-[18px] text-gray-600 mt-1">View and take your course quizzes</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <Card key={index} variant="elevated">
                            <CardContent className="p-5">
                                <p className="text-[14px] text-gray-600 mb-1">{stat.label}</p>
                                <p className={`text-[28px] font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Course</label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Courses</option>
                                    <option value="CS101">CS101 - Introduction to Programming</option>
                                    <option value="CS202">CS202 - Data Structures</option>
                                    <option value="MA203">MA203 - Linear Algebra</option>
                                    <option value="PHY105">PHY105 - Classical Mechanics</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="not_started">Not Started</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quizzes List */}
                <div className="space-y-4">
                    {filteredQuizzes.map((quiz) => {
                        const statusBadge = getStatusBadge(quiz);
                        const StatusIcon = statusBadge.icon;
                        const canTakeQuiz = quiz.attemptsUsed < quiz.attemptsAllowed && new Date(quiz.dueDate) > new Date();

                        return (
                            <Card key={quiz.id} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-[20px] font-bold text-gray-900 mb-1">
                                                        {quiz.title}
                                                    </h3>
                                                    <p className="text-[14px] text-gray-600">{quiz.course}</p>
                                                    <p className="text-[13px] text-gray-500">Instructor: {quiz.instructor}</p>
                                                </div>
                                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[13px] font-medium ${statusBadge.className}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusBadge.text}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{quiz.duration} min</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <HelpCircle className="w-4 h-4" />
                                                    <span>{quiz.totalQuestions} questions</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <FileText className="w-4 h-4" />
                                                    <span>{quiz.totalPoints} points</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Play className="w-4 h-4" />
                                                    <span>{quiz.attemptsUsed} / {quiz.attemptsAllowed} attempts</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-[13px]">
                                                <div>
                                                    <span className="text-gray-600">Due: </span>
                                                    <span className="font-medium text-gray-900">
                                                        {new Date(quiz.dueDate).toLocaleString()}
                                                    </span>
                                                </div>
                                                {quiz.score !== undefined && (
                                                    <div>
                                                        <span className="text-gray-600">Last Score: </span>
                                                        <span className="font-semibold text-blue-600">
                                                            {quiz.score} / {quiz.totalPoints} ({Math.round((quiz.score / quiz.totalPoints) * 100)}%)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {quiz.lastAttempt && (
                                                <div className="mt-2 text-[12px] text-gray-500">
                                                    Last attempt: {new Date(quiz.lastAttempt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                            {canTakeQuiz ? (
                                                <>
                                                    <button
                                                        onClick={() => handleStartQuiz(quiz.id)}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        {quiz.status === 'completed' ? 'Retake Quiz' : 'Start Quiz'}
                                                    </button>
                                                    {quiz.status === 'completed' && (
                                                        <button
                                                            onClick={() => handleStartQuiz(quiz.id)}
                                                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                                                        >
                                                            View Results
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                                    <p className="text-[13px] text-gray-600">
                                                        {quiz.attemptsUsed >= quiz.attemptsAllowed
                                                            ? 'No attempts remaining'
                                                            : 'Quiz closed'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredQuizzes.length === 0 && (
                    <Card variant="elevated">
                        <CardContent className="p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-[16px] text-gray-600">No quizzes found</p>
                            <p className="text-[14px] text-gray-500 mt-1">Try adjusting your filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
