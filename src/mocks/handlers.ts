import { http, HttpResponse } from 'msw';
import { API_URL } from '@/lib/constants';

export const handlers = [
    // Auth endpoints
    http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        if (body.email === 'unverified@admin.com') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Email is not verified.', code: 'EMAIL_NOT_VERIFIED' },
                { status: 403 }
            );
        }
        const isAdmin = body.email === 'admin@admin.com' && body.password === 'admin123';
        const isInstructor = body.email === 'instructor@instructor.com' && body.password === 'instructor123';
        const role = isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student';
        const accessToken = isAdmin
            ? 'mock-admin-access-token'
            : isInstructor
                ? 'mock-instructor-access-token'
                : 'mock-access-token';
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: '1',
                    email: body.email,
                    firstName: 'John',
                    lastName: 'Doe',
                    fullName: 'John Doe',
                    roles: [role],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                accessToken,
                csrfToken: 'mock-csrf-token',
            },
        });
    }),

    http.post(`${API_URL}/auth/verify-email`, async ({ request }) => {
        const body = (await request.json()) as { token?: string; email?: string; resend?: boolean };
        if (body.resend) {
            return HttpResponse.json({
                success: true,
                data: null,
                message: 'If an account exists with this email, a verification link has been sent.',
            });
        }
        if (!body.token || body.token === 'invalid') {
            return HttpResponse.json(
                { success: false, data: null, message: 'Invalid verification link.', code: 'INVALID_TOKEN' },
                { status: 400 }
            );
        }
        if (body.token === 'expired') {
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

    http.post(`${API_URL}/auth/forgot-password`, async ({ request }) => {
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

    http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
        const body = (await request.json()) as { token?: string; password?: string };
        if (!body.token || !body.password) {
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

    http.post(`${API_URL}/auth/register`, async ({ request }) => {
        const body = (await request.json()) as {
            email: string;
            firstName: string;
            lastName: string;
            password: string;
        };
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: '1',
                    email: body.email,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    fullName: `${body.firstName} ${body.lastName}`,
                    roles: ['Student'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                accessToken: 'mock-access-token',
                csrfToken: 'mock-csrf-token',
            },
        });
    }),

    http.get(`${API_URL}/auth/me`, ({ request }) => {
        const authHeader = request.headers.get('authorization') || '';
        const isAdmin = authHeader.includes('mock-admin-access-token');
        const isInstructor = authHeader.includes('mock-instructor-access-token');
        const role = isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student';
        const email = isAdmin ? 'admin@admin.com' : isInstructor ? 'instructor@instructor.com' : 'user@example.com';
        return HttpResponse.json({
            success: true,
            data: {
                id: '1',
                email,
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                roles: [role],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });
    }),

    // Courses endpoint
    http.get(`${API_URL}/courses`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                data: [
                    {
                        id: '1',
                        title: 'Introduction to Programming',
                        description: 'Learn the basics of programming',
                        thumbnail: '',
                        instructorId: '1',
                        category: 'Programming',
                        level: 'Beginner',
                        price: 49.99,
                        duration: 600,
                        status: 'Published',
                        enrollmentCount: 150,
                        rating: 4.5,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
                page: 1,
                pageSize: 10,
                total: 1,
                totalPages: 1,
            },
        });
    }),
];

