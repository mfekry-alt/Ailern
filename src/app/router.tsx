import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, ROLES } from '@/lib/constants';
import { ProtectedRoute, RequireRole, GuestOnly } from '@/lib/guards';
// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { InstructorLayout } from './layouts/InstructorLayout';

// Public pages
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { SignupPage } from '@/routes/SignupPage';
import { ConfirmEmailPage } from '@/routes/ConfirmEmailPage';
import { ConfirmChangeEmailPage } from '@/routes/ConfirmChangeEmailPage';
import { ForgotPasswordPage } from '@/routes/ForgotPasswordPage';
import { SetPasswordPage } from '@/routes/SetPasswordPage';
import { ChangePasswordPage } from '@/routes/ChangePasswordPage';
import { ChangeEmailPage } from '@/routes/ChangeEmailPage';
import { NotFoundPage } from '@/routes/NotFoundPage';
import { ForbiddenPage } from '@/routes/ForbiddenPage';
import { NotificationsPage } from '@/routes/NotificationsPage';
import { FilePreviewPage } from '@/routes/FilePreviewPage';

// Student pages
import { DashboardPage } from '@/routes/student/DashboardPage';

import { CoursesPage } from '@/routes/student/CoursesPage';
import { LessonPlayerPage } from '@/routes/student/LessonPlayerPage';
import { ProfilePage } from '@/routes/ProfilePage';
import { QuizAttemptsPage } from '@/routes/student/QuizAttemptsPage';
import { QuizAttemptViewer } from '@/routes/student/QuizAttemptViewer';
import { QuizResultViewer } from '@/components/QuizResultViewer';
import { AIGradingResultPage } from '@/routes/student/AIGradingResultPage';

// Course Details (new course-centric feature)
import { CourseDetailsLayout } from '@/features/course-details/pages/CourseDetailsLayout';
import { OverviewTab } from '@/features/course-details/pages/OverviewTab';
import { SectionsTab } from '@/features/course-details/pages/SectionsTab';
import { AssignmentsTab } from '@/features/course-details/pages/AssignmentsTab';
import { AssignmentDetailsPage } from '@/features/course-details/pages/AssignmentDetailsPage';
import { QuizzesTab } from '@/features/course-details/pages/QuizzesTab';
import { VideoViewerPage } from '@/features/course-details/pages/VideoViewerPage';

// Instructor pages
import { InstructorDashboardPage } from '@/routes/instructor/InstructorDashboardPage';
import { InstructorCoursesPage } from '@/routes/instructor/InstructorCoursesPage';
import { InstructorManageCoursePage } from '@/routes/instructor/InstructorManageCoursePage';
import { InstructorCourseEditPage } from '@/routes/instructor/InstructorCourseEditPage';
import { CourseManageLayout } from './layouts/CourseManageLayout';
import { CourseSectionsTab } from '@/routes/instructor/course/CourseSectionsTab';
import { CourseAssignmentsTab } from '@/routes/instructor/course/CourseAssignmentsTab';
import { CourseQuizzesTab } from '@/routes/instructor/course/CourseQuizzesTab';
import { CourseStudentsTab } from '@/routes/instructor/course/CourseStudentsTab';
import { CourseAIAssistantTab } from '@/routes/instructor/course/CourseAIAssistantTab';
import { InstructorGradebookPage } from '@/routes/instructor/InstructorGradebookPage';
import { InstructorAssignmentsPage } from '@/routes/instructor/InstructorAssignmentsPage';
import { InstructorQuizCreatePage } from '@/routes/instructor/InstructorQuizCreatePage';
import { InstructorQuizQuestionBuilderPage } from '@/routes/instructor/InstructorQuizQuestionBuilderPage';
import { InstructorQuizEditPage } from '@/routes/instructor/InstructorQuizEditPage';
import { InstructorQuizQuestionsEditPage } from '@/routes/instructor/InstructorQuizQuestionsEditPage';
import { InstructorAssignmentCreatePage } from '@/routes/instructor/InstructorAssignmentCreatePage';
import { InstructorAssignmentEditPage } from '@/routes/instructor/InstructorAssignmentEditPage';
import { InstructorSubmissionsPage } from '@/routes/instructor/InstructorSubmissionsPage';
import { InstructorUpcomingEventsPage } from '@/routes/instructor/InstructorUpcomingEventsPage';
import { QuizDashboardPage } from '@/routes/instructor/QuizDashboardPage';
import { InstructorQuizSubmissionsPage } from '@/routes/instructor/InstructorQuizSubmissionsPage';
import { InstructorQuizSubmissionReviewPage } from '@/routes/instructor/InstructorQuizSubmissionReviewPage';

// Admin pages
import { AdminDashboardPage } from '@/routes/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/routes/admin/AdminUsersPage';
import { AdminUserCreatePage } from '@/routes/admin/AdminUserCreatePage';
import { AdminUserEditPage } from '@/routes/admin/AdminUserEditPage';
import { AdminCoursesPage } from '@/routes/admin/AdminCoursesPage';
import { AdminReportsPage } from '@/routes/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/routes/admin/AdminSettingsPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AppRouter = () => {
    return (
        <Routes>
            {/* Auth routes (guest only) */}
            <Route
                element={
                    <GuestOnly>
                        <AuthLayout />
                    </GuestOnly>
                }
            >
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTES.SET_PASSWORD} element={<SetPasswordPage />} />
            </Route>

            {/* Confirm email (accessible whether logged in or not) */}
            <Route element={<AuthLayout />}>
                <Route path={ROUTES.CONFIRM_EMAIL} element={<ConfirmEmailPage />} />
                <Route path={ROUTES.CONFIRM_CHANGE_EMAIL} element={<ConfirmChangeEmailPage />} />
            </Route>

            {/* File preview (standalone, no layout) */}
            <Route path="/preview" element={<FilePreviewPage />} />

            {/* Public routes */}
            <Route element={<MainLayout />}>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
                <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
            </Route>

            {/* Protected student routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.COURSES} element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailsLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<OverviewTab />} />
                    <Route path="sections" element={<SectionsTab />} />
                    <Route path="assignments" element={<AssignmentsTab />} />
                    <Route path="assignments/:assignmentId" element={<AssignmentDetailsPage />} />
                    <Route path="quizzes" element={<QuizzesTab />} />
                </Route>
                <Route path="/courses/:courseId/video/:fileId" element={<VideoViewerPage />} />
                <Route path={ROUTES.LEARN} element={<LessonPlayerPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
                <Route path={ROUTES.CHANGE_EMAIL} element={<ChangeEmailPage />} />
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path="/quizzes/:id/attempts" element={<QuizAttemptsPage />} />
                <Route path="/quizzes/:id/attempt" element={<QuizAttemptViewer />} />
                <Route path="/quizzes/:id/attempt/:attemptId" element={<QuizResultViewer />} />
                <Route path="/quizzes/:id/attempt/:attemptId/ai-result" element={<AIGradingResultPage />} />
            </Route>

            {/* Protected instructor routes */}
            <Route
                element={
                    <RequireRole roles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
                        <InstructorLayout />
                    </RequireRole>
                }
            >
                <Route path={ROUTES.INSTRUCTOR} element={<InstructorDashboardPage />} />
                <Route path={ROUTES.INSTRUCTOR_COURSES} element={<InstructorCoursesPage />} />                <Route path={ROUTES.INSTRUCTOR_MANAGE_COURSE} element={<InstructorManageCoursePage />} />                <Route path={ROUTES.INSTRUCTOR_COURSE_NEW} element={<InstructorCourseEditPage />} />
                <Route path={ROUTES.INSTRUCTOR_COURSE_EDIT} element={<InstructorCourseEditPage />} />
                <Route path="/instructor/courses/:id/manage" element={<CourseManageLayout />}>
                    <Route index element={<Navigate to="ai-assistant" replace />} />
                    <Route path="sections" element={<CourseSectionsTab />} />
                    <Route path="assignments" element={<CourseAssignmentsTab />} />
                    <Route path="quizzes" element={<CourseQuizzesTab />} />
                    <Route path="students" element={<CourseStudentsTab />} />
                    <Route path="ai-assistant" element={<CourseAIAssistantTab />} />
                </Route>
                <Route path={ROUTES.INSTRUCTOR_GRADEBOOK} element={<InstructorGradebookPage />} />
                <Route path={ROUTES.INSTRUCTOR_ASSIGNMENTS} element={<InstructorAssignmentsPage />} />
                <Route path={ROUTES.INSTRUCTOR_ASSIGNMENT_CREATE} element={<Navigate to={ROUTES.INSTRUCTOR_ASSIGNMENTS} replace />} />
                <Route path="/instructor/courses/:courseId/assignments/create" element={<InstructorAssignmentCreatePage />} />
                <Route path={ROUTES.INSTRUCTOR_ASSIGNMENT_EDIT} element={<InstructorAssignmentEditPage />} />
                <Route path={ROUTES.INSTRUCTOR_UPCOMING_EVENTS} element={<InstructorUpcomingEventsPage />} />
                <Route path={ROUTES.INSTRUCTOR_SUBMISSIONS} element={<InstructorSubmissionsPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_QUESTIONS} element={<InstructorQuizQuestionBuilderPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_EDIT} element={<InstructorQuizEditPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_QUESTIONS_EDIT} element={<InstructorQuizQuestionsEditPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_CREATE} element={<InstructorQuizCreatePage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_DASHBOARD} element={<QuizDashboardPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_SUBMISSIONS} element={<InstructorQuizSubmissionsPage />} />
                <Route path={ROUTES.INSTRUCTOR_QUIZ_SUBMISSION_REVIEW} element={<InstructorQuizSubmissionReviewPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
                <Route path={ROUTES.CHANGE_EMAIL} element={<ChangeEmailPage />} />
            </Route>
            {/* Protected admin routes */}
            <Route
                element={
                    <RequireRole roles={[ROLES.ADMIN]}>
                        <DashboardLayout />
                    </RequireRole>
                }
            >
                <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
                <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
                <Route path={ROUTES.ADMIN_USER_CREATE} element={<AdminUserCreatePage />} />
                <Route path={ROUTES.ADMIN_USER_EDIT} element={<AdminUserEditPage />} />
                <Route path={ROUTES.ADMIN_COURSES} element={<AdminCoursesPage />} />
                <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
                <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
                <Route path={ROUTES.CHANGE_EMAIL} element={<ChangeEmailPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
    );
};
