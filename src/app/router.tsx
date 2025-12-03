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
import { RegisterPage } from '@/routes/RegisterPage';
import { ForgotPasswordPage } from '@/routes/ForgotPasswordPage';
import { NotFoundPage } from '@/routes/NotFoundPage';
import { ForbiddenPage } from '@/routes/ForbiddenPage';
import { NotificationsPage } from '@/routes/NotificationsPage';
import { MessagesPage } from '@/routes/MessagesPage';

// Student pages
import { DashboardPage } from '@/routes/student/DashboardPage';
import { MyCoursesPage } from '@/routes/student/MyCoursesPage';
import { CoursesPage } from '@/routes/student/CoursesPage';
import { CourseDetailPage } from '@/routes/student/CourseDetailPage';
import { LessonPlayerPage } from '@/routes/student/LessonPlayerPage';
import { ProfilePage } from '@/routes/student/ProfilePage';
import { AssignmentsPage } from '@/routes/student/AssignmentsPage';
import { GradesPage } from '@/routes/student/GradesPage';

// Instructor pages
import { InstructorDashboardPage } from '@/routes/instructor/InstructorDashboardPage';
import { InstructorCoursesPage } from '@/routes/instructor/InstructorCoursesPage';
import { InstructorCourseEditPage } from '@/routes/instructor/InstructorCourseEditPage';
import { InstructorCourseEditContentPage } from '@/routes/instructor/InstructorCourseEditContentPage';
import { InstructorGradebookPage } from '@/routes/instructor/InstructorGradebookPage';
import { InstructorCalendarPage } from '@/routes/instructor/InstructorCalendarPage';
import { InstructorMessagesPage } from '@/routes/instructor/InstructorMessagesPage';
import { InstructorAssignmentsPage } from '@/routes/instructor/InstructorAssignmentsPage';

// Admin pages
import { AdminDashboardPage } from '@/routes/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/routes/admin/AdminUsersPage';
import { AdminCoursesPage } from '@/routes/admin/AdminCoursesPage';
import { AdminReportsPage } from '@/routes/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/routes/admin/AdminSettingsPage';

export const AppRouter = () => {
    return (
        <Routes>
            {/* Auth routes (guest only) - Index page is login */}
            <Route
                element={
                    <GuestOnly>
                        <AuthLayout />
                    </GuestOnly>
                }
            >
                <Route path={ROUTES.HOME} element={<LoginPage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            </Route>

            {/* Public routes */}
            <Route element={<MainLayout />}>
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
                <Route path={ROUTES.MY_COURSES} element={<MyCoursesPage />} />
                <Route path={ROUTES.COURSES} element={<CoursesPage />} />
                <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetailPage />} />
                <Route path={ROUTES.LEARN} element={<LessonPlayerPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path={ROUTES.ASSIGNMENTS} element={<AssignmentsPage />} />
                <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
                <Route path={ROUTES.GRADES} element={<GradesPage />} />
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
                <Route path={ROUTES.INSTRUCTOR_COURSES} element={<InstructorCoursesPage />} />
                <Route path={ROUTES.INSTRUCTOR_COURSE_NEW} element={<InstructorCourseEditPage />} />
                <Route path={ROUTES.INSTRUCTOR_COURSE_EDIT} element={<InstructorCourseEditPage />} />
                <Route path="/instructor/courses/:id/content" element={<InstructorCourseEditContentPage />} />
                <Route path={ROUTES.INSTRUCTOR_GRADEBOOK} element={<InstructorGradebookPage />} />
                <Route path={ROUTES.INSTRUCTOR_ASSIGNMENTS} element={<InstructorAssignmentsPage />} />
                <Route path="/instructor/calendar" element={<InstructorCalendarPage />} />
                <Route path="/instructor/messages" element={<InstructorMessagesPage />} />
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
                <Route path={ROUTES.ADMIN_COURSES} element={<AdminCoursesPage />} />
                <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
                <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
    );
};

