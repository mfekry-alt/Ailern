import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { normalizeRole, ROLES, ROUTES } from './constants';
import { LoadingSpinner } from '@/components/LoadingSpinner';
interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
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
        return <LoadingSpinner />;
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
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        const userRoles = user?.roles?.map((role) => normalizeRole(role)) ?? [];
        if (userRoles.includes(ROLES.ADMIN)) {
            return <Navigate to={ROUTES.ADMIN} replace />;
        }
        if (userRoles.includes(ROLES.INSTRUCTOR)) {
            return <Navigate to={ROUTES.INSTRUCTOR} replace />;
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <>{children}</>;
};

