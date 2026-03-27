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
    attemptId: 'ba4caa3-3d70-4a06-8ac2-4989c0b6c',
    quizId: 'mock-quiz-id',
    score: 75,
    totalScore: 100,
    percentage: 75,
    status: 'Graded',
    submittedAt: new Date().toISOString(),
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
];
