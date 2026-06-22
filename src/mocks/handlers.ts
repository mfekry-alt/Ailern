import { http, passthrough } from 'msw';

// Temporary mock data for testing
const mockInstructorCourse = {
    id: 999,
    name: 'Temporary Test Course',
    code: 'TEMP-999',
    description: 'This is a temporary mock course for testing purposes',
    instructorId: 2,
    courseStatus: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const mockCourse = {
    id: 999,
    title: 'Temporary Test Course',
    description: 'This is a temporary mock course for testing purposes',
    instructorId: 2,
    instructorName: 'Test Instructor',
    status: 'Active',
    createdAt: new Date().toISOString(),
    enrollmentCount: 2,
};

const mockCourseDetails = {
    id: 999,
    name: 'Temporary Test Course',
    code: 'TEMP-999',
    description: 'This is a temporary mock course for testing purposes',
    instructorId: 2,
    instructorName: 'Test Instructor',
    courseStatus: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: [],
    assignments: [],
    enrollmentCount: 2,
};

// Mock assignment with all required properties from GetAssignmentDto
const mockAssignment = {
    id: 9999,
    title: 'Sample Assignment',
    instructions: 'This is a sample assignment for testing',
    courseId: 999,
    courseName: 'Temporary Test Course',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    instructorId: 2,
    instructorName: 'Test Instructor',
    allowLateSubmission: true,
    isPublished: false,
    createdAt: new Date().toISOString(),
    files: [],
};

// Mock quiz attempt result
const mockAttemptResult = {
    quizId: 'mock-quiz-id',
    achievedScore: 75,
    totalScore: 100,
    percentage: 75,
    status: 'Graded',
    submittedAt: new Date().toISOString(),
    attemptNumber: 1,
    studentId: 1,
    quizName: 'Test Quiz',
    attemptResult: [
        {
            questionId: 'q1',
            questionText: 'What is the capital of France?',
            studentAnswer: 'Paris',
            score: 10,
            maxScore: 10,
            options: [
                { isCorrect: true, optionText: 'Paris' },
                { isCorrect: false, optionText: 'Lyon' },
            ],
        },
        {
            questionId: 'q2',
            questionText: 'What is 2 + 2?',
            studentAnswer: '4',
            score: 10,
            maxScore: 10,
            options: [
                { isCorrect: true, optionText: '4' },
                { isCorrect: false, optionText: '5' },
            ],
        },
    ],
};

// Mock student answers for review
const mockStudentAnswers = [
    {
        questionId: 'q1',
        questionText: 'What is the capital of France?',
        studentAnswer: 'Paris',
        correctAnswer: 'Paris',
        isCorrect: true,
        points: 10,
        possiblePoints: 10,
    },
    {
        questionId: 'q2',
        questionText: 'What is 2 + 2?',
        studentAnswer: '4',
        correctAnswer: '4',
        isCorrect: true,
        points: 10,
        possiblePoints: 10,
    },
    {
        questionId: 'q3',
        questionText: 'What is the largest planet in our solar system?',
        studentAnswer: 'Jupiter',
        correctAnswer: 'Jupiter',
        isCorrect: true,
        points: 10,
        possiblePoints: 10,
    },
];

// We leave this array mostly empty so MSW lets requests pass through, but add mock course for testing
export const handlers = [
    // Mock handler for instructor's my courses
    http.get('*/api/Users/instructors/my-courses', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [mockInstructorCourse],
                    totalResults: 1,
                    pagesCount: 1,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting instructor's courses by ID
    http.get('*/api/Courses/instructors/:id', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [mockInstructorCourse],
                    totalResults: 1,
                    pagesCount: 1,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting available courses
    http.get('*/api/Courses/available-courses', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [mockCourse],
                    totalResults: 1,
                    pagesCount: 1,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting courses list
    http.get('*/api/Courses', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [mockInstructorCourse],
                    totalResults: 1,
                    pagesCount: 1,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting a specific course
    http.get('*/api/Courses/:id', ({ params }) => {
        if (params.id === '999') {
            return new Response(
                JSON.stringify({
                    data: mockCourseDetails,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }
        // Let other requests pass through
        return undefined;
    }),

    // Mock handler for updating course
    http.put('*/api/Courses/:id', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return new Response(
            JSON.stringify({
                data: { ...mockCourseDetails, ...body },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting course content
    http.get('*/api/Courses/:id/content', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [],
                    totalResults: 0,
                    pagesCount: 0,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting assignments for a course (instructor view)
    http.get('*/api/Courses/:id/instructors/Assignments', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [mockAssignment],
                    totalResults: 1,
                    pagesCount: 1,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting all instructor assignments
    http.get('*/api/Assignments', () => {
        return new Response(
            JSON.stringify({
                data: [mockAssignment],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for creating an assignment
    http.post('*/api/Assignments', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return new Response(
            JSON.stringify({
                data: {
                    ...mockAssignment,
                    ...body,
                    id: Math.floor(Math.random() * 100000),
                    createdAt: new Date().toISOString(),
                },
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting a specific assignment
    http.get('*/api/Assignments/:id', ({ params }) => {
        return new Response(
            JSON.stringify({
                data: mockAssignment,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for updating an assignment
    http.put('*/api/Assignments/:id', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return new Response(
            JSON.stringify({
                data: {
                    ...mockAssignment,
                    ...body,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for deleting an assignment
    http.delete('*/api/Assignments/:id', () => {
        return new Response(
            JSON.stringify({
                data: {},
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Mock handler for getting assignment submissions
    http.get('*/api/Assignments/:id/submissions', () => {
        return new Response(
            JSON.stringify({
                data: {
                    items: [],
                    totalResults: 0,
                    pagesCount: 0,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // ── Quiz mock handlers ─────────────────────────────────────────────────

    // GET /api/Quizzes?courseId=... -> get quizzes for a course
    http.get('*/api/Quizzes', ({ request }) => {
        const url = new URL(request.url);
        const courseId = url.searchParams.get('courseId');

        // Return mock quizzes for the course
        return new Response(
            JSON.stringify({
                data: [
                    {
                        id: 'quiz-001',
                        title: 'Biology Fundamentals',
                        description: 'Basic biology concepts',
                        courseId: courseId || 'course-123',
                        maximumAttempts: 3,
                        status: 'Published',
                        availableFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        questionsCount: 5,
                        submissionsCount: 12,
                        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        showResultOnClose: true,
                        shuffleQuestions: true,
                        shuffleOptions: false,
                    },
                ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // POST /api/Quizzes  (create new quiz) - mock implementation
    http.post('*/api/Quizzes', async ({ request }) => {
        try {
            const body = (await request.json()) as Record<string, any>;

            // Validation
            const errors: Record<string, string> = {};

            if (!body.title?.trim()) errors.title = 'Title is required';
            if (!body.courseId?.trim()) errors.courseId = 'Course ID is required';
            if (typeof body.maximumAttempts !== 'number') errors.maximumAttempts = 'Maximum attempts must be a number';
            if (!body.status) errors.status = 'Status is required';
            if (!body.availableFrom) errors.availableFrom = 'Available from date is required';
            if (!body.availableUntil) errors.availableUntil = 'Available until date is required';
            if (typeof body.showResultOnClose !== 'boolean') errors.showResultOnClose = 'Show result on close must be boolean';
            if (typeof body.shuffleQuestions !== 'boolean') errors.shuffleQuestions = 'Shuffle questions must be boolean';
            if (typeof body.shuffleOptions !== 'boolean') errors.shuffleOptions = 'Shuffle options must be boolean';
            if (!Array.isArray(body.questions) || body.questions.length === 0) {
                errors.questions = 'At least one question is required';
            }

            // Check date logic
            if (body.availableFrom && body.availableUntil) {
                const from = new Date(body.availableFrom).getTime();
                const until = new Date(body.availableUntil).getTime();
                if (until <= from) {
                    errors.availableUntil = 'Available until must be after available from';
                }
            }

            // Return 400 if validation fails
            if (Object.keys(errors).length > 0) {
                return new Response(
                    JSON.stringify({
                        statusCode: 400,
                        message: 'Validation failed',
                        errors,
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Generate mock response
            const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();

            return new Response(
                JSON.stringify({
                    data: {
                        id: quizId,
                        title: body.title,
                        description: body.description || null,
                        courseId: body.courseId,
                        maximumAttempts: body.maximumAttempts,
                        status: body.status,
                        availableFrom: body.availableFrom,
                        availableUntil: body.availableUntil,
                        publishedDate: body.publishedDate || (body.status === 'Published' ? now : null),
                        publishedAt: body.status === 'Published' ? now : null,
                        showResultOnClose: body.showResultOnClose,
                        shuffleQuestions: body.shuffleQuestions,
                        shuffleOptions: body.shuffleOptions,
                        questionsCount: body.questions.length,
                        submissionsCount: 0,
                        createdAt: now,
                        questions: body.questions.map((q: any, idx: number) => ({
                            id: q.id || `q-${quizId}-${idx}`,
                            questionText: q.questionText,
                            questionType: q.questionType,
                            mark: q.mark,
                            instructions: q.instructions || null,
                            explanation: q.explanation || null,
                            options: q.options.map((opt: any, optIdx: number) => ({
                                id: `opt-${quizId}-${idx}-${optIdx}`,
                                optionText: opt.optionText,
                                isCorrect: opt.isCorrect,
                            })),
                        })),
                    },
                    statusCode: 201,
                    message: 'Quiz created successfully',
                }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return new Response(
                JSON.stringify({
                    statusCode: 400,
                    message: 'Invalid request body',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }),

    // GET /api/Quizzes/:id  (single quiz) -> use real backend
    http.get('*/api/Quizzes/:id', () => passthrough()),

    // PUT /api/Quizzes/:id  (update) -> use real backend
    http.put('*/api/Quizzes/:id', () => passthrough()),

    // DELETE /api/Quizzes/:id -> use real backend
    http.delete('*/api/Quizzes/:id', () => passthrough()),

    // ── Quiz Attempts mock handlers ────────────────────────────────────────

    // GET /api/Quizzes/:id/attempts -> returns student's attempts for that quiz
    http.get('*/api/Quizzes/:id/attempts', () => {
        return new Response(
            JSON.stringify({
                data: {
                    attempts: [
                        {
                            id: 'ba4caa3-3d70-4a06-8ac2-4989c0b6c',
                            attemptId: 'ba4caa3-3d70-4a06-8ac2-4989c0b6c',
                            quizId: 'mock-quiz-id',
                            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                            submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                            status: 'Submitted',
                            timeLimit: 3600,
                            score: 75,
                            totalMarks: 100,
                            duration: 1800,
                            attemptNumber: 1,
                        },
                    ],
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // GET /api/Attempts/:id/result -> returns attempt result (accessible by student)
    http.get('*/api/Attempts/:id/result', () => {
        return new Response(
            JSON.stringify({
                data: mockAttemptResult,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // GET /api/Attempts/:id/student-answers -> INSTRUCTOR ONLY - returns student answers with feedback
    http.get('*/api/Attempts/:id/student-answers', () => {
        // In production, the backend checks user role and returns 403 if not instructor
        // For mock purposes, we return the data but note it's instructor-only
        return new Response(
            JSON.stringify({
                data: mockStudentAnswers,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // Other attempt endpoints pass through to real backend
    http.post('*/api/Quizzes/:id/Attempts', () => passthrough()),
    http.get('*/api/Quizzes/:id/attempts', () => passthrough()),
    http.get('*/api/Attempts/:id/questions', () => passthrough()),
    http.post('*/api/Attempts/:id/save', () => passthrough()),
    http.put('*/api/Attempts/:id/submit', () => passthrough()),

    // POST /api/Attempts/ai-evaluations - Mock storing AI evaluation in localStorage
    http.post('*/api/Attempts/ai-evaluations', async ({ request }) => {
        try {
            const body = await request.json() as any;
            let evaluations: any[] = [];
            try {
                const stored = localStorage.getItem('ai-grading-evaluations');
                if (stored) {
                    evaluations = JSON.parse(stored);
                }
            } catch (e) {
                console.error('Failed to parse ai-grading-evaluations', e);
            }
            evaluations.push(body);
            localStorage.setItem('ai-grading-evaluations', JSON.stringify(evaluations));
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Thank you. Your evaluation will help improve future AI grading performance.',
                    data: null,
                    statusCode: 200
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid evaluation data',
                    statusCode: 400
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }),

    // GET /api/Attempts/ai-evaluations/analytics - Retrieve analytics for evaluations
    http.get('*/api/Attempts/ai-evaluations/analytics', () => {
        let evaluations: any[] = [];
        try {
            const stored = localStorage.getItem('ai-grading-evaluations');
            if (stored) {
                evaluations = JSON.parse(stored);
            }
        } catch (e) {}

        if (evaluations.length === 0) {
            evaluations = [
                { 
                    aiRating: 5, 
                    aiScore: 4.5, 
                    instructorFinalScore: 4.5, 
                    instructorComment: 'Highly accurate matching my rubric expectations!', 
                    selectedFeedbackThemes: ['Accurate Rubric Alignment', 'Feedback Detail is Exceptional'], 
                    additionalFeedback: 'Highly accurate matching my rubric expectations!',
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
                },
                { 
                    aiRating: 4, 
                    aiScore: 3.5, 
                    instructorFinalScore: 4.0, 
                    instructorComment: 'Good, but missed one small mention of context.', 
                    selectedFeedbackThemes: ['Model Strictness on Synonyms', 'Strong Explanation Quality'], 
                    additionalFeedback: 'Good, but missed one small mention of context.',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
                },
                { 
                    aiRating: 5, 
                    aiScore: 5.0, 
                    instructorFinalScore: 5.0, 
                    instructorComment: 'Flawless evaluation for this essay response.', 
                    selectedFeedbackThemes: ['Accurate Rubric Alignment', 'Accurate Partial Marks'], 
                    additionalFeedback: 'Flawless evaluation for this essay response.',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
                },
                { 
                    aiRating: 3, 
                    aiScore: 2.0, 
                    instructorFinalScore: 3.5, 
                    instructorComment: 'A bit too strict on the explanation rubric.', 
                    selectedFeedbackThemes: ['Minor Over-crediting on Length', 'Generic Feedback'], 
                    additionalFeedback: 'A bit too strict on the explanation rubric.',
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() 
                },
                { 
                    aiRating: 4, 
                    aiScore: 4.0, 
                    instructorFinalScore: 4.0, 
                    instructorComment: 'Very satisfied with the feedback comments.', 
                    selectedFeedbackThemes: ['Accurate Rubric Alignment', 'Strong Explanation Quality'], 
                    additionalFeedback: 'Very satisfied with the feedback comments.',
                    createdAt: new Date(Date.now()).toISOString() 
                }
            ];
        }

        const total = evaluations.length;
        const avgRating = total > 0 ? evaluations.reduce((acc, curr) => acc + curr.aiRating, 0) / total : 0;
        
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        evaluations.forEach(e => {
            const r = Math.round(e.aiRating) as 1|2|3|4|5;
            if (distribution[r] !== undefined) {
                distribution[r]++;
            }
        });

        const satisfied = evaluations.filter(e => e.aiRating >= 4).length;
        const satisfactionRate = total > 0 ? (satisfied / total) * 100 : 0;

        const discrepancies = evaluations.map(e => Math.abs(e.aiScore - e.instructorFinalScore));
        const avgDiscrepancy = total > 0 ? discrepancies.reduce((acc, curr) => acc + curr, 0) / total : 0;

        // Dynamic themes aggregation
        const themeCounts: Record<string, number> = {
            'Accurate Rubric Alignment': 0,
            'Model Strictness on Synonyms': 0,
            'Feedback Detail is Exceptional': 0,
            'Minor Over-crediting on Length': 0,
            'Accurate Partial Marks': 0,
            'Generic Feedback': 0,
            'Score Too High': 0,
            'Score Too Low': 0,
            'Missed Key Concepts': 0,
            'Strong Explanation Quality': 0,
            'Other': 0
        };

        evaluations.forEach(e => {
            const themes: string[] = e.selectedFeedbackThemes || [];
            themes.forEach(t => {
                if (themeCounts[t] !== undefined) {
                    themeCounts[t]++;
                }
            });
        });

        const themeStats = Object.entries(themeCounts).map(([theme, count]) => {
            let type = 'Mixed';
            let sentiment = 'Calibration';
            if (['Accurate Rubric Alignment', 'Feedback Detail is Exceptional', 'Accurate Partial Marks', 'Strong Explanation Quality'].includes(theme)) {
                type = 'Positive';
                sentiment = 'High Match';
            } else if (['Minor Over-crediting on Length', 'Generic Feedback', 'Score Too High', 'Score Too Low', 'Missed Key Concepts'].includes(theme)) {
                type = 'Negative';
                sentiment = 'Tuning Required';
            }
            return { theme, count, type, sentiment };
        }).sort((a, b) => b.count - a.count);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    totalEvaluations: total,
                    averageRating: parseFloat(avgRating.toFixed(2)),
                    satisfactionRate: Math.round(satisfactionRate),
                    averageDiscrepancy: parseFloat(avgDiscrepancy.toFixed(2)),
                    distribution,
                    themeStats,
                    recentEvaluations: evaluations.slice(-5).reverse()
                },
                statusCode: 200
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // GET /api/Quizzes/:id/ai-generated-questions - Return seed AI generated questions
    http.get('*/api/Quizzes/:id/ai-generated-questions', () => {
        const questions = [
            {
                id: 'aiq-001',
                questionText: 'Explain the concept of backpropagation in neural networks and how it is used to optimize model weights.',
                questionType: 'Written',
                mark: 10,
                instructions: 'Provide a detailed explanation with examples.',
                explanation: 'Backpropagation is the algorithm used to compute gradients of the loss function with respect to each weight by applying the chain rule layer by layer.',
                options: null,
                topicName: 'Neural Networks'
            },
            {
                id: 'aiq-002',
                questionText: 'Which of the following is NOT a type of machine learning?',
                questionType: 'MCQ',
                mark: 5,
                instructions: null,
                explanation: 'Compressive learning is not a recognized type of machine learning.',
                options: [
                    { optionId: 'o1', optionText: 'Supervised Learning', isCorrect: false },
                    { optionId: 'o2', optionText: 'Unsupervised Learning', isCorrect: false },
                    { optionId: 'o3', optionText: 'Compressive Learning', isCorrect: true },
                    { optionId: 'o4', optionText: 'Reinforcement Learning', isCorrect: false }
                ],
                topicName: 'Machine Learning Fundamentals'
            },
            {
                id: 'aiq-003',
                questionText: 'True or False: A decision tree can only be used for classification tasks.',
                questionType: 'TrueFalse',
                mark: 3,
                instructions: null,
                explanation: 'Decision trees can be used for both classification and regression tasks.',
                options: [
                    { optionId: 'tf1', optionText: 'True', isCorrect: false },
                    { optionId: 'tf2', optionText: 'False', isCorrect: true }
                ],
                topicName: 'Decision Trees'
            },
            {
                id: 'aiq-004',
                questionText: 'Describe the differences between L1 and L2 regularization and when you would use each.',
                questionType: 'Written',
                mark: 8,
                instructions: 'Include mathematical formulations in your answer.',
                explanation: 'L1 regularization (Lasso) adds absolute value of weights to the loss, encouraging sparsity. L2 regularization (Ridge) adds squared weights, encouraging smaller weights overall.',
                options: null,
                topicName: 'Regularization Techniques'
            },
            {
                id: 'aiq-005',
                questionText: 'Which optimizer is known for combining momentum with adaptive learning rates?',
                questionType: 'MCQ',
                mark: 5,
                instructions: null,
                explanation: 'Adam optimizer combines the benefits of AdaGrad and RMSProp.',
                options: [
                    { optionId: 'a1', optionText: 'SGD', isCorrect: false },
                    { optionId: 'a2', optionText: 'Adam', isCorrect: true },
                    { optionId: 'a3', optionText: 'AdaGrad', isCorrect: false },
                    { optionId: 'a4', optionText: 'Batch Gradient Descent', isCorrect: false }
                ],
                topicName: 'Optimization'
            }
        ];

        return new Response(
            JSON.stringify({
                success: true,
                data: questions,
                statusCode: 200
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // POST /api/Quizzes/ai-questions/validate - Store AI question validation in localStorage
    http.post('*/api/Quizzes/ai-questions/validate', async ({ request }) => {
        try {
            const body = await request.json() as any;
            let validations: any[] = [];
            try {
                const stored = localStorage.getItem('ai-question-validations');
                if (stored) validations = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse ai-question-validations', e);
            }
            validations.push(body);
            localStorage.setItem('ai-question-validations', JSON.stringify(validations));
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Thank you. Your validation helps improve future AI-generated assessments.',
                    data: null,
                    statusCode: 200
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return new Response(
                JSON.stringify({ success: false, message: 'Invalid validation data', statusCode: 400 }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }),

    // GET /api/Quizzes/ai-questions/validation-analytics - Return analytics from stored validations
    http.get('*/api/Quizzes/ai-questions/validation-analytics', () => {
        let validations: any[] = [];
        try {
            const stored = localStorage.getItem('ai-question-validations');
            if (stored) validations = JSON.parse(stored);
        } catch (e) {}

        if (validations.length === 0) {
            validations = [
                { questionId: 'aiq-001', quizId: 'q1', instructorId: '1', isRelated: true, courseId: 1, topicName: 'Neural Networks', questionText: 'Explain backpropagation...', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString() },
                { questionId: 'aiq-002', quizId: 'q1', instructorId: '1', isRelated: true, courseId: 1, topicName: 'Neural Networks', questionText: 'What is a CNN?', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 28*24*60*60*1000).toISOString() },
                { questionId: 'aiq-003', quizId: 'q2', instructorId: '2', isRelated: false, courseId: 2, topicName: 'Decision Trees', questionText: 'Explain quantum computing...', courseName: 'Machine Learning 101', instructorName: 'Prof. Ahmed Ali', createdAt: new Date(Date.now() - 25*24*60*60*1000).toISOString() },
                { questionId: 'aiq-004', quizId: 'q2', instructorId: '2', isRelated: true, courseId: 2, topicName: 'Decision Trees', questionText: 'How does a random forest work?', courseName: 'Machine Learning 101', instructorName: 'Prof. Ahmed Ali', createdAt: new Date(Date.now() - 22*24*60*60*1000).toISOString() },
                { questionId: 'aiq-005', quizId: 'q3', instructorId: '1', isRelated: true, courseId: 1, topicName: 'Regularization Techniques', questionText: 'What is L1 regularization?', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 20*24*60*60*1000).toISOString() },
                { questionId: 'aiq-006', quizId: 'q3', instructorId: '1', isRelated: false, courseId: 1, topicName: 'Regularization Techniques', questionText: 'What is blockchain?', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 18*24*60*60*1000).toISOString() },
                { questionId: 'aiq-007', quizId: 'q4', instructorId: '3', isRelated: true, courseId: 3, topicName: 'Optimization', questionText: 'Explain Adam optimizer', courseName: 'Advanced AI', instructorName: 'Dr. Maria Costa', createdAt: new Date(Date.now() - 15*24*60*60*1000).toISOString() },
                { questionId: 'aiq-008', quizId: 'q4', instructorId: '3', isRelated: true, courseId: 3, topicName: 'Optimization', questionText: 'What is gradient descent?', courseName: 'Advanced AI', instructorName: 'Dr. Maria Costa', createdAt: new Date(Date.now() - 12*24*60*60*1000).toISOString() },
                { questionId: 'aiq-009', quizId: 'q5', instructorId: '2', isRelated: false, courseId: 2, topicName: 'Machine Learning Fundamentals', questionText: 'Explain dark matter...', courseName: 'Machine Learning 101', instructorName: 'Prof. Ahmed Ali', createdAt: new Date(Date.now() - 10*24*60*60*1000).toISOString() },
                { questionId: 'aiq-010', quizId: 'q5', instructorId: '2', isRelated: true, courseId: 2, topicName: 'Machine Learning Fundamentals', questionText: 'What is overfitting?', courseName: 'Machine Learning 101', instructorName: 'Prof. Ahmed Ali', createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString() },
                { questionId: 'aiq-011', quizId: 'q6', instructorId: '1', isRelated: true, courseId: 1, topicName: 'Neural Networks', questionText: 'What is dropout?', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
                { questionId: 'aiq-012', quizId: 'q6', instructorId: '3', isRelated: true, courseId: 3, topicName: 'Optimization', questionText: 'What is learning rate scheduling?', courseName: 'Advanced AI', instructorName: 'Dr. Maria Costa', createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
                { questionId: 'aiq-013', quizId: 'q7', instructorId: '1', isRelated: true, courseId: 1, topicName: 'Neural Networks', questionText: 'Explain transfer learning', courseName: 'Deep Learning', instructorName: 'Dr. Sarah Jenkins', createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
                { questionId: 'aiq-014', quizId: 'q7', instructorId: '2', isRelated: false, courseId: 2, topicName: 'Decision Trees', questionText: 'What is photosynthesis?', courseName: 'Machine Learning 101', instructorName: 'Prof. Ahmed Ali', createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
            ];
        }

        const total = validations.length;
        const related = validations.filter(v => v.isRelated).length;
        const unrelated = total - related;
        const relatedRate = total > 0 ? Math.round((related / total) * 100) : 0;

        // Topic performance
        const topicMap: Record<string, { related: number; total: number }> = {};
        validations.forEach(v => {
            if (!topicMap[v.topicName]) topicMap[v.topicName] = { related: 0, total: 0 };
            topicMap[v.topicName].total++;
            if (v.isRelated) topicMap[v.topicName].related++;
        });
        const topicPerformance = Object.entries(topicMap).map(([topic, data]) => ({
            topic,
            related: data.related,
            unrelated: data.total - data.related,
            total: data.total,
            relatedRate: Math.round((data.related / data.total) * 100)
        })).sort((a, b) => b.total - a.total);

        // Course performance
        const courseMap: Record<string, { courseName: string; related: number; total: number }> = {};
        validations.forEach(v => {
            const key = String(v.courseId);
            if (!courseMap[key]) courseMap[key] = { courseName: v.courseName, related: 0, total: 0 };
            courseMap[key].total++;
            if (v.isRelated) courseMap[key].related++;
        });
        const coursePerformance = Object.entries(courseMap).map(([courseId, data]) => ({
            courseId,
            courseName: data.courseName,
            totalValidations: data.total,
            relatedCount: data.related,
            unrelatedCount: data.total - data.related,
            relatedRate: Math.round((data.related / data.total) * 100)
        }));

        // Monthly trend (last 6 months)
        const monthlyTrend: { month: string; related: number; unrelated: number; rate: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const monthValidations = validations.filter(v => {
                const vDate = new Date(v.createdAt);
                return vDate >= monthStart && vDate <= monthEnd;
            });
            const mTotal = monthValidations.length;
            const mRelated = monthValidations.filter(v => v.isRelated).length;
            monthlyTrend.push({
                month: monthStr,
                related: mRelated,
                unrelated: mTotal - mRelated,
                rate: mTotal > 0 ? Math.round((mRelated / mTotal) * 100) : 0
            });
        }

        // Problematic topics (below 70% related rate)
        const problematicTopics = topicPerformance.filter(t => t.relatedRate < 70 && t.total >= 1);

        // Recently flagged (unrelated) questions
        const recentlyFlagged = validations
            .filter(v => !v.isRelated)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    totalValidations: total,
                    relatedCount: related,
                    unrelatedCount: unrelated,
                    relatedRate,
                    topicPerformance,
                    coursePerformance,
                    monthlyTrend,
                    problematicTopics,
                    recentlyFlagged
                },
                statusCode: 200
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // GET /api/Dashboard/admin/ai_question_generation_dashboard
    http.get('*/api/Dashboard/admin/ai_question_generation_dashboard', () => {
        return new Response(
            JSON.stringify({
                success: true,
                message: null,
                data: {
                    totalValidation: 9,
                    topicAlignmentRate: 89,
                    relatedQuestions: 8,
                    unrelatedQuestions: 1,
                    overviewByCourses: [
                        {
                            courseName: "Introduction to Programming",
                            generatedByAi: 9,
                            relatedCount: 8,
                            unRelatedCount: 1
                        }
                    ]
                },
                statusCode: 200
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),

    // GET /api/Dashboard/admin/ai_grading_dashboard
    http.get('*/api/Dashboard/admin/ai_grading_dashboard', () => {
        return new Response(
            JSON.stringify({
                success: true,
                message: null,
                data: {
                    totalAiEvaluation: 10,
                    averageAiRating: 3.4,
                    satisfacationRate: 68,
                    lowQualityReviews: 3,
                    poorCount: 1,
                    fairCount: 2,
                    goodCount: 2,
                    veryGoodCount: 2,
                    excellentCount: 3,
                    instructorFeedbackOnAiGrading: {
                        MissedKeyConcepts: 2,
                        AccurateRubricAlignment: 2,
                        AccuratePartialMarks: 2,
                        StrongExplanationQuality: 3,
                        Other: 1
                    },
                    lowestRatedAiEvaluations: [
                        {
                            rating: 1,
                            questionText: "<p>What is Programming?</p>",
                            courseName: "Introduction to Programming",
                            aiScore: 5,
                            aiFeedback: "Good",
                            instructorName: "John Instructor"
                        },
                        {
                            rating: 2,
                            questionText: "<p>In one or two sentences, explain why programming is important in everyday life.</p>",
                            courseName: "Introduction to Programming",
                            aiScore: 7,
                            aiFeedback: "There is a better answer than that.",
                            instructorName: "John Instructor"
                        },
                        {
                            rating: 2,
                            questionText: "<p>In one or two sentences, explain why programming is important in everyday life.</p>",
                            courseName: "Introduction to Programming",
                            aiScore: 0,
                            aiFeedback: null,
                            instructorName: "John Instructor"
                        }
                    ]
                },
                statusCode: 200
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }),
];
