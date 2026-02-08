export const ENDPOINTS = {
    // Auth endpoints (based on API: /api/Auth/*)
    AUTH: {
        LOGIN: '/Auth/login',
        REFRESH: '/Auth/refresh-token',
        REVOKE_TOKEN: '/Auth/revoke-token',
        CONFIRM_EMAIL: '/Auth/confirm-email',
        RESEND_CONFIRMATION_EMAIL: '/Auth/resend-confirmation-email',
        SEND_PASSWORD_RESET_EMAIL: '/Auth/send-password-reset-email',
        CHANGE_PASSWORD: '/Auth/change-password',
    },

    // Admins endpoints (based on API: /api/Auth/admin/*)
    ADMINS: {
        REGISTER: '/Auth/admin/register',
    },

    // Instructors endpoints (based on API: /api/Auth/instructor/*)
    INSTRUCTORS: {
        REGISTER: '/Auth/instructor/register',
    },

    // Students endpoints (based on API: /api/Auth/students/* and /api/Users/students/*)
    STUDENTS: {
        REGISTER: '/Auth/students/register',
        MY_COURSES: '/Users/students/my-courses',
    },

    // Users endpoints (based on API: /api/Users/*)
    USERS: {
        GET: (id: number) => `/Users/${id}`,
        ADD_ROLE: (id: number) => `/Users/${id}/roles`,
        REMOVE_ROLE: (id: number) => `/Users/${id}/roles`,
        BY_ROLE: (roleId: number) => `/Users/roles/${roleId}`,
    },

    // Courses endpoints (based on API: /api/Courses/*)
    COURSES: {
        LIST: '/Courses',
        GET: (id: number) => `/Courses/${id}`,
        CREATE: '/Courses',
        UPDATE: (id: number) => `/Courses/${id}`,
        DELETE: (id: number) => `/Courses/${id}`,
        REJECT: (id: number) => `/Courses/${id}/reject`,
        ENROLL: (id: number) => `/Courses/${id}/enroll`,
        AVAILABLE_COURSES: '/Courses/available-courses',
        ENROLLMENT_REQUESTS: (id: number) => `/Courses/${id}/enrollment-requests`,
        APPROVE_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}/approve`,
        REJECT_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}/reject`,
        DELETE_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}`,
        STUDENTS: (id: number) => `/Courses/${id}/students`,
    },

    // Assignments endpoints (based on API: /api/Assignments/* and /api/Courses/*/Assignments)
    ASSIGNMENTS: {
        CREATE: '/Assignments',
        UPDATE: (id: number) => `/Assignments/${id}`,
        DELETE: (id: number) => `/Assignments/${id}`,
        GET: (id: number) => `/Assignments/${id}`,
        CONFIRM_UPLOAD: '/Assignments/confirm-upload',
        DELETE_FILE: (assignmentId: number, fileId: number) => `/Assignments/${assignmentId}/files/${fileId}`,
        COURSE_ASSIGNMENTS_INSTRUCTOR: (courseId: number) => `/Courses/${courseId}/instructors/Assignments`,
        COURSE_ASSIGNMENTS_STUDENT: (courseId: number) => `/Courses/${courseId}/students/Assignments`,
    },

    // Assignment Submissions endpoints (based on API: /api/Assignments/Submissions/*)
    SUBMISSIONS: {
        CREATE: '/Assignments/Submissions',
        CONFIRM_UPLOAD: (id: number) => `/Assignments/Submissions/${id}/confirm-upload`,
        DELETE: (id: number) => `/Assignments/Submissions/${id}`,
        GET_BY_ASSIGNMENT: (assignmentId: number) => `/Assignments/${assignmentId}/Submissions`,
        GET_FILES: (assignmentId: number, submissionId: number) => `/Assignments/${assignmentId}/Submissions/${submissionId}/files`,
    },
} as const;

