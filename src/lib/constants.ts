export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Ailern';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROLES = {
    ADMIN: 'Admin',
    INSTRUCTOR: 'Instructor',
    STUDENT: 'Student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_EMAIL: '/verify-email',
    SET_PASSWORD: '/set-password',
    FORBIDDEN: '/403',
    NOT_FOUND: '/404',

    // Student routes
    DASHBOARD: '/dashboard',
    MY_COURSES: '/my-courses',
    COURSES: '/courses',
    COURSE_DETAIL: '/courses/:id',
    LEARN: '/learn/:courseId/:lessonId',
    PROFILE: '/profile',
    CHANGE_PASSWORD: '/change-password',
    NOTIFICATIONS: '/notifications',
    ASSIGNMENTS: '/assignments',
    ASSIGNMENT_DETAIL: '/assignments/:id',
    QUIZZES: '/quizzes',
    QUIZ: '/quiz/:id',
    MESSAGES: '/messages',
    GRADES: '/grades',

    // Instructor routes
    INSTRUCTOR: '/instructor',
    INSTRUCTOR_COURSES: '/instructor/courses',
    INSTRUCTOR_MANAGE_COURSE: '/instructor/courses/:id/manage',
    INSTRUCTOR_COURSE_NEW: '/instructor/courses/new',
    INSTRUCTOR_COURSE_EDIT: '/instructor/courses/:id/edit',
    INSTRUCTOR_COURSE_EDIT_CONTENT: '/instructor/courses/:id/content',
    INSTRUCTOR_GRADEBOOK: '/instructor/gradebook',
    INSTRUCTOR_ASSIGNMENTS: '/instructor/assignments',
    INSTRUCTOR_ASSIGNMENT_CREATE: '/instructor/assignments/create',
    INSTRUCTOR_ASSIGNMENT_EDIT: '/instructor/assignments/:id/edit',
    INSTRUCTOR_SUBMISSIONS: '/instructor/assignments/:assignmentId/submissions',
    INSTRUCTOR_QUIZ_CREATE: '/instructor/quiz/create',
    INSTRUCTOR_QUIZ_QUESTIONS: '/instructor/quiz/questions',

    // Admin routes
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_USER_CREATE: '/admin/users/create',
    ADMIN_USER_EDIT: '/admin/users/:id/edit',
    ADMIN_COURSES: '/admin/courses',
    ADMIN_COURSE_APPROVAL: '/admin/courses/approval',
    ADMIN_REPORTS: '/admin/reports',
    ADMIN_SETTINGS: '/admin/settings',
} as const;

export const QUERY_KEYS = {
    ME: ['me'],
    COURSES: ['courses'],
    COURSE: (id: string) => ['course', id],
    LESSONS: (courseId: string) => ['lessons', courseId],
    LESSON: (id: string) => ['lesson', id],
    ENROLLMENTS: ['enrollments'],
    ENROLLMENT: (id: string) => ['enrollment', id],
    QUIZZES: (courseId: string) => ['quizzes', courseId],
    QUIZ: (id: string) => ['quiz', id],
    USERS: ['users'],
    USER: (id: string) => ['user', id],
} as const;

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    CSRF_TOKEN: 'csrf_token',
    USER: 'user',
} as const;

