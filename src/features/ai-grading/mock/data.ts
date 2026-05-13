import type { AISubmissionResult, AIQuizGradingStats } from '../types';

export const MOCK_QUIZ_STATS: AIQuizGradingStats = {
    totalSubmissions: 42,
    averageScore: 74.5,
    averageConfidence: 81.2,
    lowConfidenceCount: 6,
    needsReviewCount: 8,
    completionPercentage: 100
};

export const MOCK_SUBMISSIONS: AISubmissionResult[] = [
    {
        id: 'sub-1',
        quizId: 'quiz-1',
        studentId: 'std-1',
        studentName: 'Ahmed Mohamed',
        studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
        submissionDate: '2024-05-08T14:30:00Z',
        timeTakenMinutes: 34,
        finalScore: 78,
        maxScore: 100,
        overallConfidence: 82,
        status: 'Auto Approved',
        overallFeedback: 'The student demonstrates a solid understanding of Core Programming concepts, particularly in OOP. However, there are noticeable gaps in advanced data structures and algorithm optimization.',
        recommendation: 'Focus on practicing Time Complexity analysis and implementing balanced trees.',
        weakTopics: [
            { id: '1', name: 'Time Complexity', severity: 'high' },
            { id: '2', name: 'Balanced Trees', severity: 'medium' }
        ],
        strengths: [
            { id: '3', name: 'OOP Principles' },
            { id: '4', name: 'Exception Handling' }
        ],
        questionEvaluations: [
            {
                questionNumber: 1,
                questionId: 'q-1',
                questionType: 'Written',
                questionText: 'Explain the concept of Polymorphism in Object-Oriented Programming and provide an example.',
                studentAnswer: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass. For example, if we have a Shape class and subclasses like Circle and Square, we can call a draw() method on any shape without knowing its specific type.',
                modelAnswer: 'Polymorphism is the ability of a message to be displayed in more than one form. In OOP, it is often achieved through inheritance and interface implementation. Examples include method overriding (runtime) and method overloading (compile-time).',
                awardedScore: 8,
                maxScore: 10,
                confidence: 88,
                feedback: 'Good explanation of basic concept. The student correctly identified inheritance-based polymorphism.',
                mistakes: [
                    'Did not explicitly mention the difference between static and dynamic polymorphism.'
                ],
                missingConcepts: [
                    'Method Overloading vs Overriding',
                    'Interface implementation'
                ],
                positiveObservations: [
                    'Correct use of Shape/Circle example',
                    'Clear definition of the core benefit'
                ],
                rubricScores: [
                    { criterionName: 'Core Definition', weight: 40, score: 35, feedback: 'Strong conceptual grasp.' },
                    { criterionName: 'Example Quality', weight: 30, score: 30, feedback: 'Excellent practical example.' },
                    { criterionName: 'Technical Depth', weight: 30, score: 13, feedback: 'Lacks mention of implementation details.' }
                ]
            }
        ]
    },
    {
        id: 'sub-2',
        quizId: 'quiz-1',
        studentId: 'std-2',
        studentName: 'Sarah Chen',
        studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        submissionDate: '2024-05-08T15:15:00Z',
        timeTakenMinutes: 28,
        finalScore: 45,
        maxScore: 100,
        overallConfidence: 42,
        status: 'Needs Manual Review',
        overallFeedback: 'Submission contains multiple ambiguous answers that the AI struggled to interpret accurately. Manual verification is highly recommended.',
        recommendation: 'Review student performance in supervised environment. The student seems to struggle with basic syntax.',
        weakTopics: [
            { id: '5', name: 'Syntax', severity: 'high' },
            { id: '6', name: 'Logic Flow', severity: 'high' }
        ],
        strengths: [],
        questionEvaluations: [
            {
                questionNumber: 1,
                questionId: 'q-1',
                questionType: 'Written',
                questionText: 'Explain the concept of Polymorphism in Object-Oriented Programming.',
                studentAnswer: 'It is when one thing can do many things. Like a person can be a teacher and a father.',
                modelAnswer: 'Polymorphism is the ability of a message to be displayed in more than one form...',
                awardedScore: 3,
                maxScore: 10,
                confidence: 35,
                feedback: 'The answer is too vague and lacks technical terminology. The analogy is conceptually correct but not academic.',
                mistakes: [
                    'Lack of technical context',
                    'No mention of classes or objects'
                ],
                missingConcepts: [
                    'Inheritance',
                    'Interfaces',
                    'Overriding'
                ],
                positiveObservations: [
                    'Understands the basic "many forms" concept'
                ]
            }
        ]
    },
    {
        id: 'sub-3',
        quizId: 'quiz-1',
        studentId: 'std-3',
        studentName: 'James Wilson',
        studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        submissionDate: '2024-05-08T16:00:00Z',
        timeTakenMinutes: 45,
        finalScore: 92,
        maxScore: 100,
        overallConfidence: 95,
        status: 'Auto Approved',
        overallFeedback: 'Outstanding performance. The student demonstrates mastery across all topics covered in this quiz.',
        recommendation: 'Encourage student to take the Advanced Algorithms elective.',
        weakTopics: [],
        strengths: [
            { id: '1', name: 'Time Complexity' },
            { id: '3', name: 'OOP Principles' },
            { id: '7', name: 'Design Patterns' }
        ],
        questionEvaluations: [
            {
                questionNumber: 1,
                questionId: 'q-1',
                questionType: 'Written',
                questionText: 'Explain the concept of Polymorphism in Object-Oriented Programming.',
                studentAnswer: 'Polymorphism refers to the ability of different classes to respond to the same message in unique ways. It includes static polymorphism (overloading) and dynamic polymorphism (overriding via virtual methods). This enables decoupling of code through interfaces.',
                modelAnswer: 'Polymorphism is the ability of a message to be displayed in more than one form...',
                awardedScore: 10,
                maxScore: 10,
                confidence: 98,
                feedback: 'Perfect score. Student covered both static and dynamic types and mentioned decoupling.',
                mistakes: [],
                missingConcepts: [],
                positiveObservations: [
                    'Excellent depth',
                    'Correct use of terminology',
                    'Mentioned decoupling'
                ]
            }
        ]
    }
];
