import { http } from 'msw';

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
        const body = await request.json();
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
        const body = await request.json();
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
        const body = await request.json();
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
];
