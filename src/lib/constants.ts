export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Ailern';
export const API_URL =
    import.meta.env.VITE_API_URL ?? 'https://localhost:7080/api';

export const ROLES = {
    ADMIN: 'Admin',
    INSTRUCTOR: 'Instructor',
    STUDENT: 'Student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const normalizeRole = (role?: string | null): Role | string => {
    if (!role) return '';

    const normalized = role.trim().toLowerCase();
    if (normalized === 'admin') return ROLES.ADMIN;
    if (normalized === 'instructor') return ROLES.INSTRUCTOR;
    if (normalized === 'student') return ROLES.STUDENT;

    return role;
};

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',// NOSONAR
    CONFIRM_EMAIL: '/confirm-email',
    CONFIRM_CHANGE_EMAIL: '/confirm-change-email',
    VERIFY_EMAIL: '/verify-email',
    SET_PASSWORD: '/set-password',      // NOSONAR
    FORBIDDEN: '/403',
    NOT_FOUND: '/404',

    // Student routes
    DASHBOARD: '/dashboard',
    MY_COURSES: '/my-courses',
    COURSES: '/courses',
    COURSE_DETAIL: '/courses/:courseId',
    COURSE_VIDEO: '/courses/:courseId/video/:fileId',
    LEARN: '/learn/:courseId/:lessonId',
    PROFILE: '/profile',
    CHANGE_PASSWORD: '/change-password',        // NOSONAR
    CHANGE_EMAIL: '/change-email',
    NOTIFICATIONS: '/notifications',
    ASSIGNMENTS: '/assignments',
    ASSIGNMENT_DETAIL: '/assignments/:id',
    QUIZZES: '/quizzes',
    QUIZ: '/quiz/:id',
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
    INSTRUCTOR_UPCOMING_EVENTS: '/instructor/upcoming-events',
    INSTRUCTOR_SUBMISSIONS: '/instructor/assignments/:assignmentId/submissions',
    INSTRUCTOR_QUIZ_CREATE: '/courses/:courseId/quiz/create',
    INSTRUCTOR_QUIZ_QUESTIONS: '/instructor/quiz/questions',
    INSTRUCTOR_STATISTICS: '/instructor/statistics',
    INSTRUCTOR_QUIZ_EDIT: '/instructor/quiz/:id/edit',
    INSTRUCTOR_QUIZ_UPDATE: '/instructor/quiz/:id/update',
    INSTRUCTOR_QUIZ_QUESTIONS_EDIT: '/instructor/quiz/:id/questions/edit',
    INSTRUCTOR_QUIZ_DASHBOARD: '/quiz-dashboard/:quizId',
    INSTRUCTOR_QUIZ_SUBMISSIONS: '/instructor/quizzes/:quizId/submissions',
    INSTRUCTOR_QUIZ_SUBMISSION_REVIEW: '/instructor/quizzes/:quizId/submissions/:attemptId',
    INSTRUCTOR_AI_ASSISTANT: '/instructor/courses/:id/manage/ai-assistant',
    INSTRUCTOR_QUIZ_MANAGE: '/instructor/quiz/:quizId/manage',
    INSTRUCTOR_QUIZ_AI_GRADING: '/quizzes/:quizId/ai-grading',

    // Admin routes
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_USER_CREATE: '/admin/users/create',
    ADMIN_USER_EDIT: '/admin/users/:id/edit',
    ADMIN_COURSES: '/admin/courses',
    ADMIN_SETTINGS: '/admin/settings',
    ADMIN_CONTENT_REPORTS: '/admin/content-reports',
    ADMIN_AI_PERFORMANCE: '/admin/ai-performance',
} as const;

export const QUERY_KEYS = {
    ME: ['me'],
    COURSES: ['courses'],
    ADMIN_COURSES: (params: object) => ['admin-courses', params],
    COURSE: (id: string) => ['course', id],
    LESSONS: (courseId: string) => ['lessons', courseId],
    LESSON: (id: string) => ['lesson', id],
    ENROLLMENTS: ['enrollments'],
    ENROLLMENT: (id: string) => ['enrollment', id],
    QUIZZES: (courseId: string) => ['quizzes', courseId],
    QUIZ: (id: string) => ['quiz', id],
    QUIZ_SUBMISSIONS: (quizId: string, status?: string | null) => status
        ? ['quiz-submissions', quizId, status]
        : ['quiz-submissions', quizId],
    USERS: ['users'],
    USER: (id: string) => ['user', id],
    ADMIN_USERS: (params: object) => ['admin-users', params],
    USER_COUNTS: ['user-counts'],
    ASSIGNMENTS: ['assignments'],
    ASSIGNMENT: (id: number) => ['assignment', id],
    INSTRUCTOR_ASSIGNMENTS: ['instructor-assignments'],
    ASSIGNMENT_SUBMISSIONS: (assignmentId: number) => ['assignment-submissions', assignmentId],
    SUBMISSION_FILES: (assignmentId: number, submissionId: number) => ['submission-files', assignmentId, submissionId],
    ATTEMPTS: (quizId: string) => ['attempts', quizId],
    ATTEMPT: (attemptId: string) => ['attempt', attemptId],
    ATTEMPT_GRADE: (attemptId: string) => ['attempt-grade', attemptId],
    INSTRUCTOR_STATS: ['instructor-stats'],
    UPCOMING_EVENTS: ['upcoming-events'],
    INSTRUCTOR_MY_COURSES: ['instructor-my-courses'],
    INSTRUCTOR_MY_COURSES_PROGRESS: ['instructor-my-courses-progress'],
    /** Student — GET /Users/students/my-courses */
    STUDENT_MY_COURSES: ['student-courses'],
    STUDENT_DASHBOARD: ['student-dashboard'],
    COURSE_SECTIONS: (courseId: string) => ['course-sections', courseId],
    COURSE_ASSIGNMENTS: (courseId: string) => ['course-assignments', courseId],
    COURSE_QUIZZES: (courseId: string) => ['course-quizzes', courseId],
    ASSIGNMENT_SUBMISSION: (assignmentId: number) => ['assignment-submission', assignmentId],
    /** Student — GET /Courses/my-learning (courses with saved progress) */
    MY_LEARNING: ['my-learning'],
    DISCUSSIONS: (courseId: string | number) => ['discussions', courseId],
    DISCUSSION: (discussionId: string | number) => ['discussion', discussionId],
    REPORTS_DASHBOARD: ['reports-dashboard'],
} as const;

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    EXPIRES_ON: 'expires_on',
    USER: 'user',
    CSRF_TOKEN: 'csrf_token',
    QUIZ_BUILDER_DRAFT: 'quiz_builder_draft',
    QUIZ_SETTINGS_DRAFT: 'quiz_settings_draft',
    QUIZ_EDIT_DRAFT: 'quiz_edit_draft',
} as const;
