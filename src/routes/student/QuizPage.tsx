import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, HelpCircle, FileText, Play } from 'lucide-react';

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

interface Quiz {
    id: string;
    name: string;
    instructions: string;
    duration: number; // in minutes
    attemptsAllowed: number;
    attemptsUsed: number;
    questions: Question[];
}

export const QuizPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [quiz] = useState<Quiz>({
        id: id || '1',
        name: 'Quiz 1: AI Fundamentals',
        instructions: `This quiz covers the fundamental concepts of Artificial Intelligence. 

Important Instructions:
• You have ${30} minutes to complete this quiz
• Read each question carefully before answering
• You cannot go back once you submit an answer
• All questions must be answered before submission
• Written questions will be manually reviewed by the instructor

Good luck!`,
        duration: 30,
        attemptsAllowed: 3,
        attemptsUsed: 0,
        questions: [
            {
                id: 1,
                type: 'MCQ',
                text: 'What is the primary goal of Artificial Intelligence?',
                points: 5,
                options: [
                    'To replace human intelligence',
                    'To create machines that can perform tasks requiring human intelligence',
                    'To automate all jobs',
                    'To build robots'
                ],
                correctAnswer: 'To create machines that can perform tasks requiring human intelligence',
                explanation: 'AI aims to create systems that can perform tasks that typically require human intelligence.'
            },
            {
                id: 2,
                type: 'MCQ',
                text: 'Which of the following is NOT a type of machine learning?',
                points: 5,
                options: [
                    'Supervised Learning',
                    'Unsupervised Learning',
                    'Reinforcement Learning',
                    'Quantum Learning'
                ],
                correctAnswer: 'Quantum Learning',
                explanation: 'Quantum Learning is not a standard type of machine learning.'
            },
            {
                id: 3,
                type: 'TF',
                text: 'Machine Learning is a subset of Artificial Intelligence.',
                points: 3,
                correctAnswer: true,
                explanation: 'Machine Learning is indeed a subset of AI that focuses on algorithms that can learn from data.'
            },
            {
                id: 4,
                type: 'TF',
                text: 'Deep Learning requires less data than traditional machine learning.',
                points: 3,
                correctAnswer: false,
                explanation: 'Deep Learning typically requires more data than traditional machine learning to train effectively.'
            },
            {
                id: 5,
                type: 'Written',
                text: 'Explain the difference between supervised and unsupervised learning. Provide at least one example of each.',
                points: 10,
            },
            {
                id: 6,
                type: 'Written',
                text: 'What are the ethical concerns surrounding AI development? Discuss at least two major issues.',
                points: 10,
            },
        ],
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [autoGradedScore, setAutoGradedScore] = useState(0);
    const [totalAutoGradablePoints, setTotalAutoGradablePoints] = useState(0);

    // Timer effect
    useEffect(() => {
        if (quizStarted && !quizSubmitted && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quizStarted, quizSubmitted, timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartQuiz = () => {
        setQuizStarted(true);
        setTimeRemaining(quiz.duration * 60);
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const handleSubmitQuiz = () => {
        // Calculate auto-graded score
        let score = 0;
        let totalAutoPoints = 0;

        quiz.questions.forEach((question) => {
            if (question.type !== 'Written') {
                totalAutoPoints += question.points;
                const userAnswer = answers[question.id];
                if (userAnswer === question.correctAnswer) {
                    score += question.points;
                }
            }
        });

        setAutoGradedScore(score);
        setTotalAutoGradablePoints(totalAutoPoints);
        setQuizSubmitted(true);
    };

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const hasWrittenQuestions = quiz.questions.some(q => q.type === 'Written');
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    // Pre-start view
    if (!quizStarted && !quizSubmitted) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Course
                    </button>

                    <Card variant="elevated">
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                        <FileText className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h1 className="text-[32px] font-bold text-gray-900 mb-2">{quiz.name}</h1>
                                </div>

                                {/* Quiz Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-gray-600" />
                                            <span className="text-[14px] text-gray-600">Duration</span>
                                        </div>
                                        <p className="text-[18px] font-bold text-gray-900">{quiz.duration} minutes</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <HelpCircle className="w-4 h-4 text-gray-600" />
                                            <span className="text-[14px] text-gray-600">Questions</span>
                                        </div>
                                        <p className="text-[18px] font-bold text-gray-900">{totalQuestions}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <HelpCircle className="w-4 h-4 text-gray-600" />
                                            <span className="text-[14px] text-gray-600">Attempts Left</span>
                                        </div>
                                        <p className="text-[18px] font-bold text-gray-900">
                                            {quiz.attemptsAllowed - quiz.attemptsUsed} / {quiz.attemptsAllowed}
                                        </p>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                    <h3 className="text-[18px] font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Instructions
                                    </h3>
                                    <p className="text-[14px] text-blue-800 whitespace-pre-line leading-relaxed">
                                        {quiz.instructions}
                                    </p>
                                </div>

                                {/* Question breakdown */}
                                <div className="p-5 bg-gray-50 rounded-lg">
                                    <h3 className="text-[16px] font-semibold text-gray-900 mb-3">Question Breakdown:</h3>
                                    <div className="space-y-2 text-[14px] text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Total Points:</span>
                                            <span className="font-semibold">{totalPoints}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Multiple Choice Questions:</span>
                                            <span className="font-semibold">{quiz.questions.filter(q => q.type === 'MCQ').length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>True/False Questions:</span>
                                            <span className="font-semibold">{quiz.questions.filter(q => q.type === 'TF').length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Written Questions:</span>
                                            <span className="font-semibold">{quiz.questions.filter(q => q.type === 'Written').length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Start button */}
                                {quiz.attemptsUsed >= quiz.attemptsAllowed ? (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-[14px] text-red-800 font-medium text-center">
                                            You have used all available attempts for this quiz.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartQuiz}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[18px] px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-5 h-5" />
                                        Start Quiz
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Quiz in progress
    if (quizStarted && !quizSubmitted) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
                <div className="max-w-5xl mx-auto">
                    {/* Timer and Progress Header */}
                    <Card variant="elevated" className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[20px] font-bold text-gray-900">{quiz.name}</h2>
                                    <p className="text-[14px] text-gray-600">
                                        Question {currentQuestionIndex + 1} of {totalQuestions}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[28px] font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                    <p className="text-[13px] text-gray-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Time Remaining
                                    </p>
                                </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-[13px] text-gray-600 mb-2">
                                    <span>Progress: {answeredCount} / {totalQuestions} answered</span>
                                    <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Question Navigation */}
                    <Card variant="elevated" className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {quiz.questions.map((q, index) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(index)}
                                        className={`flex-shrink-0 w-10 h-10 rounded-lg font-semibold text-[14px] transition-all ${
                                            index === currentQuestionIndex
                                                ? 'bg-blue-600 text-white'
                                                : answers[q.id] !== undefined
                                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Question */}
                    <Card variant="elevated" className="mb-6">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[12px] font-semibold">
                                                    {currentQuestion.type === 'MCQ' ? 'Multiple Choice' :
                                                     currentQuestion.type === 'TF' ? 'True/False' : 'Written Answer'}
                                                </span>
                                                <span className="text-[14px] text-gray-600">
                                                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                                                </span>
                                            </div>
                                            <h3 className="text-[18px] font-semibold text-gray-900 leading-relaxed">
                                                {currentQuestion.text}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* MCQ Options */}
                                    {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                                        <div className="space-y-3">
                                            {currentQuestion.options.map((option, index) => (
                                                <label
                                                    key={index}
                                                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                        answers[currentQuestion.id] === option
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion.id}`}
                                                        value={option}
                                                        checked={answers[currentQuestion.id] === option}
                                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                        className="mt-1 w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-[15px] text-gray-800 flex-1">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* True/False Options */}
                                    {currentQuestion.type === 'TF' && (
                                        <div className="space-y-3">
                                            {[true, false].map((value) => (
                                                <label
                                                    key={String(value)}
                                                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                        answers[currentQuestion.id] === value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion.id}`}
                                                        value={String(value)}
                                                        checked={answers[currentQuestion.id] === value}
                                                        onChange={() => handleAnswerChange(currentQuestion.id, value)}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-[16px] font-medium text-gray-800">
                                                        {value ? 'True' : 'False'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Written Answer */}
                                    {currentQuestion.type === 'Written' && (
                                        <textarea
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            placeholder="Type your answer here..."
                                            className="w-full min-h-[200px] p-4 border-2 border-gray-200 rounded-lg text-[15px] text-gray-800 focus:border-blue-500 focus:outline-none resize-y"
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-[14px] transition-colors ${
                                currentQuestionIndex === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-[14px] transition-colors"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitQuiz}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-[16px] transition-colors"
                            >
                                Submit Quiz
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Quiz completed - Results view
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-4xl mx-auto">
                <Card variant="elevated">
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {/* Success Header */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h1 className="text-[32px] font-bold text-gray-900 mb-2">Quiz Completed!</h1>
                                <p className="text-[16px] text-gray-600">Your quiz has been submitted successfully</p>
                            </div>

                            {/* Auto-graded Score */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                                <h2 className="text-[20px] font-bold text-gray-900 mb-4 text-center">
                                    Auto-Graded Score
                                </h2>
                                <div className="text-center mb-4">
                                    <div className="text-[48px] font-bold text-blue-600">
                                        {autoGradedScore} / {totalAutoGradablePoints}
                                    </div>
                                    <div className="text-[18px] text-gray-700 font-medium">
                                        {Math.round((autoGradedScore / totalAutoGradablePoints) * 100)}% on auto-graded questions
                                    </div>
                                </div>
                                <p className="text-[14px] text-gray-600 text-center">
                                    MCQ and True/False questions have been automatically graded
                                </p>
                            </div>

                            {/* Written Questions Pending */}
                            {hasWrittenQuestions && (
                                <div className="p-5 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-[16px] font-bold text-yellow-900 mb-2">
                                                Written Questions Pending Review
                                            </h3>
                                            <p className="text-[14px] text-yellow-800 leading-relaxed mb-2">
                                                Your written answers are currently being reviewed by the instructor. 
                                                Your final score will be updated once the manual grading is complete.
                                            </p>
                                            <div className="flex items-center gap-2 text-[13px] text-yellow-700">
                                                <FileText className="w-4 h-4" />
                                                <span className="font-semibold">
                                                    {quiz.questions.filter(q => q.type === 'Written').length} written question(s) 
                                                    worth {quiz.questions.filter(q => q.type === 'Written').reduce((sum, q) => sum + q.points, 0)} points
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Review Answers */}
                            <div className="space-y-4">
                                <h2 className="text-[22px] font-bold text-gray-900">Review Your Answers</h2>
                                
                                {quiz.questions.map((question, index) => {
                                    const userAnswer = answers[question.id];
                                    const isCorrect = question.type !== 'Written' && userAnswer === question.correctAnswer;
                                    const isAnswered = userAnswer !== undefined;

                                    return (
                                        <div key={question.id} className="p-5 border-2 border-gray-200 rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[14px] font-semibold text-gray-700">
                                                            Question {index + 1}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[12px] font-medium">
                                                            {question.type === 'MCQ' ? 'MCQ' : question.type === 'TF' ? 'T/F' : 'Written'}
                                                        </span>
                                                        <span className="text-[13px] text-gray-600">
                                                            {question.points} pts
                                                        </span>
                                                    </div>
                                                    <p className="text-[15px] text-gray-900 font-medium mb-3">
                                                        {question.text}
                                                    </p>
                                                </div>
                                                {question.type !== 'Written' && (
                                                    <div className="flex-shrink-0">
                                                        {isCorrect ? (
                                                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                <span className="text-[13px] font-semibold">Correct</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                                                <XCircle className="w-4 h-4" />
                                                                <span className="text-[13px] font-semibold">Incorrect</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* User's Answer */}
                                            <div className="mb-3">
                                                <p className="text-[13px] font-semibold text-gray-700 mb-1">Your Answer:</p>
                                                <div className={`p-3 rounded-lg ${
                                                    question.type === 'Written' 
                                                        ? 'bg-blue-50 border border-blue-200'
                                                        : isCorrect 
                                                        ? 'bg-green-50 border border-green-200' 
                                                        : 'bg-red-50 border border-red-200'
                                                }`}>
                                                    <p className="text-[14px] text-gray-800">
                                                        {isAnswered 
                                                            ? String(userAnswer)
                                                            : <span className="text-gray-500 italic">No answer provided</span>
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Correct Answer (for auto-gradable questions) */}
                                            {question.type !== 'Written' && (
                                                <div className="mb-3">
                                                    <p className="text-[13px] font-semibold text-gray-700 mb-1">Correct Answer:</p>
                                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <p className="text-[14px] text-green-900 font-medium">
                                                            {String(question.correctAnswer)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {question.explanation && question.type !== 'Written' && (
                                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-[13px] font-semibold text-blue-900 mb-1">Explanation:</p>
                                                    <p className="text-[14px] text-blue-800">{question.explanation}</p>
                                                </div>
                                            )}

                                            {/* Pending review for written */}
                                            {question.type === 'Written' && (
                                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-[13px] text-yellow-800 italic">
                                                        ⏳ This answer is pending instructor review
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] px-6 py-3 rounded-lg transition-colors"
                                >
                                    Back to Course
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


