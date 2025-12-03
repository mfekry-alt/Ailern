export const ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
        ME: '/auth/me',
    },

    // Users
    USERS: {
        LIST: '/users',
        GET: (id: string) => `/users/${id}`,
        CREATE: '/users',
        UPDATE: (id: string) => `/users/${id}`,
        DELETE: (id: string) => `/users/${id}`,
    },

    // Courses
    COURSES: {
        LIST: '/courses',
        GET: (id: string) => `/courses/${id}`,
        CREATE: '/courses',
        UPDATE: (id: string) => `/courses/${id}`,
        DELETE: (id: string) => `/courses/${id}`,
        MODULES: (id: string) => `/courses/${id}/modules`,
    },

    // Modules
    MODULES: {
        GET: (id: string) => `/modules/${id}`,
        CREATE: '/modules',
        UPDATE: (id: string) => `/modules/${id}`,
        DELETE: (id: string) => `/modules/${id}`,
        LESSONS: (id: string) => `/modules/${id}/lessons`,
    },

    // Lessons
    LESSONS: {
        GET: (id: string) => `/lessons/${id}`,
        CREATE: '/lessons',
        UPDATE: (id: string) => `/lessons/${id}`,
        DELETE: (id: string) => `/lessons/${id}`,
        PROGRESS: (id: string) => `/lessons/${id}/progress`,
    },

    // Enrollments
    ENROLLMENTS: {
        LIST: '/enrollments',
        GET: (id: string) => `/enrollments/${id}`,
        ENROLL: '/enrollments',
        UNENROLL: (id: string) => `/enrollments/${id}`,
        MY_COURSES: '/enrollments/my-courses',
    },

    // Quizzes
    QUIZZES: {
        LIST: '/quizzes',
        GET: (id: string) => `/quizzes/${id}`,
        CREATE: '/quizzes',
        UPDATE: (id: string) => `/quizzes/${id}`,
        DELETE: (id: string) => `/quizzes/${id}`,
        SUBMIT: (id: string) => `/quizzes/${id}/submit`,
        SUBMISSIONS: (id: string) => `/quizzes/${id}/submissions`,
    },
} as const;

