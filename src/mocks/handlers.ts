import { http, HttpResponse } from 'msw';
import { API_URL } from '@/lib/constants';

export const handlers = [
    // Auth endpoints
    http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    id: '1',
                    email: body.email,
                    firstName: 'John',
                    lastName: 'Doe',
                    fullName: 'John Doe',
                    roles: ['Student'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                accessToken: 'mock-access-token',
                csrfToken: 'mock-csrf-token',
            },
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

    http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                id: '1',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                roles: ['Student'],
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

