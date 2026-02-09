import { http, HttpResponse } from 'msw';
import { API_URL } from '@/lib/constants';

export const handlers = [
    // Auth endpoints - Updated to match real API paths (/Auth with capital A)
    http.post(`${API_URL}/Auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        
        // Check for unverified email
        if (body.email === 'unverified@admin.com') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Email is not verified.', code: 'EMAIL_NOT_VERIFIED' },
                { status: 403 }
            );
        }
        
        // Support both old and new credentials
        const isAdmin = 
            (body.email === 'admin@gmail.com' && body.password === 'P@ssw0rd!') ||
            (body.email === 'admin@admin.com' && body.password === 'admin123');
        
        const isInstructor = 
            (body.email === 'instructor@gmail.com' && body.password === 'P@ssw0rd!') ||
            (body.email === 'instructor@instructor.com' && body.password === 'instructor123');
        
        const isStudent = 
            (body.email === 'student@gmail.com' && body.password === 'P@ssw0rd!');
        
        // Invalid credentials
        if (!isAdmin && !isInstructor && !isStudent) {
            return HttpResponse.json(
                { success: false, data: null, message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }
        
        const role = isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student';
        const accessToken = isAdmin
            ? 'mock-admin-access-token'
            : isInstructor
                ? 'mock-instructor-access-token'
                : 'mock-student-access-token';
        
        const firstName = isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student';
        const lastName = isAdmin ? 'User' : isInstructor ? 'User' : 'User';
        
        return HttpResponse.json({
            success: true,
            data: {
                accessToken,
                refreshToken: `mock-refresh-token-${role.toLowerCase()}`,
                userName: `${firstName} ${lastName}`,
                email: body.email,
                role: role,
            },
        });
    }),

    // Email verification endpoint
    http.get(`${API_URL}/Auth/confirm-email`, async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');
        
        if (!token || token === 'invalid') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Invalid verification link.', code: 'INVALID_TOKEN' },
                { status: 400 }
            );
        }
        if (token === 'expired') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Verification link expired.', code: 'TOKEN_EXPIRED' },
                { status: 410 }
            );
        }
        return HttpResponse.json({
            success: true,
            data: null,
            message: 'Email verified successfully.',
        });
    }),

    // Resend confirmation email
    http.post(`${API_URL}/Auth/resend-confirmation-email`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        return HttpResponse.json({
            success: true,
            data: null,
            message: 'If an account exists with this email, a verification link has been sent.',
        });
    }),

    // Forgot password
    http.post(`${API_URL}/Auth/send-password-reset-email`, async ({ request }) => {
        const body = (await request.json()) as { email?: string };
        if (!body.email) {
            return HttpResponse.json(
                { success: false, data: null, message: 'Email is required.', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }
        return HttpResponse.json({
            success: true,
            data: null,
            message: 'If an account exists with this email, a reset link has been sent.',
        });
    }),

    // Change/Reset password
    http.post(`${API_URL}/Auth/change-password`, async ({ request }) => {
        const body = (await request.json()) as { token?: string; newPassword?: string };
        if (!body.token || !body.newPassword) {
            return HttpResponse.json(
                { success: false, data: null, message: 'Invalid request.', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }
        if (body.token === 'expired') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Reset token expired.', code: 'TOKEN_EXPIRED' },
                { status: 410 }
            );
        }
        return HttpResponse.json({
            success: true,
            data: null,
            message: 'Password updated successfully.',
        });
    }),

    // Refresh token
    http.post(`${API_URL}/Auth/refresh-token`, async ({ request }) => {
        const body = (await request.json()) as { refreshToken: string };
        return HttpResponse.json({
            success: true,
            data: {
                accessToken: 'mock-new-access-token',
                refreshToken: 'mock-new-refresh-token',
                userName: 'Test User',
                email: 'test@example.com',
                role: 'Student',
            },
        });
    }),

    // Student registration
    http.post(`${API_URL}/Auth/students/register`, async ({ request }) => {
        const body = (await request.json()) as {
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            password: string;
        };
        return HttpResponse.json({
            success: true,
            data: {
                accessToken: 'mock-student-access-token',
                refreshToken: 'mock-student-refresh-token',
                userName: `${body.firstName} ${body.lastName}`,
                email: body.email,
                role: 'Student',
            },
        });
    }),

    // Instructor registration
    http.post(`${API_URL}/Auth/instructor/register`, async ({ request }) => {
        const body = (await request.json()) as {
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            password: string;
        };
        return HttpResponse.json({
            success: true,
            data: {
                accessToken: 'mock-instructor-access-token',
                refreshToken: 'mock-instructor-refresh-token',
                userName: `${body.firstName} ${body.lastName}`,
                email: body.email,
                role: 'Instructor',
            },
        });
    }),

    // Admin registration
    http.post(`${API_URL}/Auth/admin/register`, async ({ request }) => {
        const body = (await request.json()) as {
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            password: string;
        };
        return HttpResponse.json({
            success: true,
            data: {
                accessToken: 'mock-admin-access-token',
                refreshToken: 'mock-admin-refresh-token',
                userName: `${body.firstName} ${body.lastName}`,
                email: body.email,
                role: 'Admin',
            },
        });
    }),

    // Courses endpoints
    http.get(`${API_URL}/Courses`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                items: [
                    {
                        id: 1,
                        title: 'Introduction to Programming',
                        description: 'Learn the basics of programming with Python',
                        shortDescription: 'Beginner programming course',
                        thumbnail: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Programming',
                        instructorId: 1,
                        instructorName: 'Instructor User',
                        category: 'Programming',
                        level: 'Beginner',
                        price: 49.99,
                        duration: 600,
                        status: 'Approved',
                        enrollmentCount: 150,
                        rating: 4.5,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: 2,
                        title: 'Advanced Web Development',
                        description: 'Master modern web development with React and TypeScript',
                        shortDescription: 'Advanced web dev course',
                        thumbnail: 'https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Web+Dev',
                        instructorId: 1,
                        instructorName: 'Instructor User',
                        category: 'Web Development',
                        level: 'Advanced',
                        price: 99.99,
                        duration: 1200,
                        status: 'Approved',
                        enrollmentCount: 85,
                        rating: 4.8,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
                totalCount: 2,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            },
        });
    }),

    // Get single course
    http.get(`${API_URL}/Courses/:id`, ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            success: true,
            data: {
                id: Number(id),
                title: 'Introduction to Programming',
                description: 'Learn the basics of programming with Python',
                shortDescription: 'Beginner programming course',
                thumbnail: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Programming',
                instructorId: 1,
                instructorName: 'Instructor User',
                category: 'Programming',
                level: 'Beginner',
                price: 49.99,
                duration: 600,
                status: 'Approved',
                enrollmentCount: 150,
                rating: 4.5,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });
    }),

    // Create course
    http.post(`${API_URL}/Courses`, async ({ request }) => {
        const body = (await request.json()) as any;
        return HttpResponse.json({
            success: true,
            data: {
                id: Math.floor(Math.random() * 1000),
                ...body,
                status: 'Pending',
                enrollmentCount: 0,
                rating: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });
    }),

    // Update course
    http.put(`${API_URL}/Courses/:id`, async ({ request, params }) => {
        const body = (await request.json()) as any;
        const { id } = params;
        return HttpResponse.json({
            success: true,
            data: {
                id: Number(id),
                ...body,
                updatedAt: new Date().toISOString(),
            },
        });
    }),

    // Delete course
    http.delete(`${API_URL}/Courses/:id`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: null,
            message: 'Course deleted successfully.',
        });
    }),

    // Student's enrolled courses
    http.get(`${API_URL}/Users/students/my-courses`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                items: [
                    {
                        id: 1,
                        title: 'Introduction to Programming',
                        description: 'Learn the basics of programming',
                        thumbnail: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Programming',
                        progress: 65,
                        enrolledAt: new Date().toISOString(),
                    },
                ],
                totalCount: 1,
            },
        });
    }),

    // Available courses for enrollment
    http.get(`${API_URL}/Courses/available-courses`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                items: [
                    {
                        id: 1,
                        title: 'Introduction to Programming',
                        description: 'Learn the basics of programming',
                        thumbnail: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Programming',
                        instructorName: 'Instructor User',
                        category: 'Programming',
                        level: 'Beginner',
                        price: 49.99,
                        rating: 4.5,
                        enrollmentCount: 150,
                    },
                ],
                totalCount: 1,
            },
        });
    }),
];

