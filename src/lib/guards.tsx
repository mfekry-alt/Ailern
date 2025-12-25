import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from './constants';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

interface RequireRoleProps {
    roles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RequireRole = ({ roles, children, fallback }: RequireRoleProps) => {
    const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!hasAnyRole(roles)) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return <Navigate to={ROUTES.FORBIDDEN} replace />;
    }

    return <>{children}</>;
};

interface GuestOnlyProps {
    children: React.ReactNode;
}

export const GuestOnly = ({ children }: GuestOnlyProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect based on user role
        console.log('GuestOnly guard: User is authenticated, redirecting. User roles:', user?.roles);
        if (user?.roles?.includes('Admin')) {
            console.log('GuestOnly: Redirecting to ADMIN dashboard');
            return <Navigate to={ROUTES.ADMIN} replace />;
        }
        if (user?.roles?.includes('Instructor')) {
            console.log('GuestOnly: Redirecting to INSTRUCTOR dashboard');
            return <Navigate to={ROUTES.INSTRUCTOR} replace />;
        }
        console.log('GuestOnly: Redirecting to STUDENT dashboard');
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <>{children}</>;
};

