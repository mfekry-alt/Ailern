import { updateAssignment } from "./services/assignment.service";
export { updateAssignment };

export const ENDPOINTS = {
    // Auth endpoints (based on API: /api/Auth/*)
    AUTH: {
        LOGIN: '/Auth/login',
        REGISTER: '/Auth/register',
        REFRESH: '/Auth/refresh-token',
        REVOKE_TOKEN: '/auth/revoke-token',
        CONFIRM_EMAIL: '/Auth/confirm-email',
        RESEND_CONFIRMATION_EMAIL: '/Auth/resend-confirmation-email',
        FORGET_PASSWORD: '/auth/forget-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
    },

    // Students endpoints (based on API: /api/Auth/students/* and /api/Users/students/*)
    STUDENTS: {
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
        MY_COURSES: '/Users/instructor/my-courses', // Fallback endpoint that doesn't require ID
        INSTRUCTOR_COURSES: (instructorId: number) => `/Courses/instructors/${instructorId}`,
        ENROLLMENT_REQUESTS: (id: number) => `/Courses/${id}/enrollment-requests`,
        APPROVE_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}/approve`,
        REJECT_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}/reject`,
        DELETE_ENROLLMENT: (id: number, studentId: number) => `/Courses/${id}/enrollments/${studentId}`,
        STUDENTS: (id: number) => `/Courses/${id}/students`,
    },

    // Assignments endpoints (based on API: /api/Assignments/* and /api/Courses/*/Assignments)
    ASSIGNMENTS: {
        CREATE: (courseId: number) => `/Courses/${courseId}/Assignments`,
        UPDATE: (id: number) => `/Assignments/${id}`,
        DELETE: (id: number) => `/Assignments/${id}`,
        GET: (id: number) => `/Assignments/${id}`,
        CONFIRM_UPLOAD: '/Assignments/confirm-upload',
        DELETE_FILE: (assignmentId: number, fileId: string) => `/Assignments/${assignmentId}/files/${fileId}`,
        COURSE_ASSIGNMENTS_INSTRUCTOR: (courseId: number) => `/Courses/${courseId}/instructors/Assignments`,
        COURSE_ASSIGNMENTS_STUDENT: (courseId: number) => `/Courses/${courseId}/students/Assignments`,
    },

    // Assignment Submissions endpoints (based on API: /api/Assignments/Submissions/*)
    SUBMISSIONS: {
        CREATE: '/Assignments/Submissions',
        CONFIRM_UPLOAD: (id: number) => `/Assignments/Submissions/${id}/confirm-upload`,
        DELETE: (id: number) => `/Assignments/Submissions/${id}`,
        GET_BY_ASSIGNMENT: (assignmentId: number) => `/Assignments/${assignmentId}/Submissions`,
        GET_MY_SUBMISSION: (assignmentId: number) => `/Assignments/${assignmentId}/my-submission`,
        GET_FILES: (assignmentId: number, submissionId: number) => `/Assignments/${assignmentId}/Submissions/${submissionId}/files`,
        REVIEW: (submissionId: number) => `/Assignments/Submissions/${submissionId}`,
    },

    // Quizzes endpoints
    QUIZZES: {
        CREATE: '/Quizzes',
        GET: (id: string) => `/Quizzes/${id}`,
        UPDATE: (id: string) => `/Quizzes/${id}`,
        DELETE: (id: string) => `/Quizzes/${id}`,
        BY_COURSE: (courseId: string) => `/courses/${courseId}/quizzes`,
        LIST: '/Quizzes',
        GENERATE_BY_AI: (quizId: string) => `/Quizzes/${quizId}/generate-by-ai`,
        UPSERT_QUESTIONS: (quizId: string) => `/Quizzes/${quizId}/questions`,
        GENERATE_FILES: (quizId: string) => `/Quizzes/${quizId}/generate-questions-files`,
        JOB_STATUS: (jobId: string) => `/Quizzes/job/${jobId}`,
        GET_ATTEMPTS: (quizId: string) => `/Quizzes/${quizId}/attempts`,
        GET_SUBMISSIONS: (quizId: string) => `/Quizzes/${quizId}/submissions`,
    },

    // Sections endpoints
    SECTIONS: {
        BY_COURSE: (courseId: number) => `/Sections/courses/${courseId}/sections`,
        GET: (sectionId: string) => `/Sections/${sectionId}`,
        CREATE: '/Sections',
        UPDATE: (sectionId: string) => `/Sections/${sectionId}`,
        DELETE: (sectionId: string) => `/Sections/${sectionId}`,
    },

    // Quiz Attempts endpoints
    ATTEMPTS: {
        START: (quizId: string) => `/Quizzes/${quizId}/attempts`, // POST - creates new attempt
        GET_ATTEMPTS: (quizId: string) => `/Quizzes/${quizId}/attempts`, // GET
        GET_QUESTIONS: (attemptId: string) => `/Attempts/${attemptId}/questions`, // GET
        SAVE: (attemptId: string) => `/Attempts/${attemptId}/save`, // POST
        SUBMIT: (attemptId: string) => `/Attempts/${attemptId}/submit`, // PUT
        GET_RESULT: (attemptId: string) => `/Attempts/${attemptId}/result`, // GET
        GET_STUDENT_ANSWERS: (attemptId: string) => `/Attempts/${attemptId}/student-answers`, // GET
        GRADE: (attemptId: string) => `/Attempts/${attemptId}/grade`, // PUT
    },

    // Instructor Dashboard endpoints
    INSTRUCTOR: {
        STATS: '/Dashboard/instructor',
        UPCOMING_EVENTS: '/Dashboard/UpcomingEvents',
        MY_COURSES: '/Users/instructor/my-courses',
    // Dashboard endpoints
    DASHBOARD: {
        QUIZ: (quizId: string) => `/Dashboard/quiz/${quizId}`,
        ADMIN: '/Dashboard/admin',
    },
} as const;
