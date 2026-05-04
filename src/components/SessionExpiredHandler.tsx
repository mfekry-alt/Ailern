import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/features/auth/store';

/**
 * Invisible component that listens for the `auth:session_expired`
 * custom event dispatched by the Axios interceptor when a refresh
 * token rotation fails.
 *
 * Instead of a hard `window.location.href` redirect (which causes
 * a full page reload), this component uses React Router's
 * `navigate()` for a seamless SPA transition.
 */
export const SessionExpiredHandler = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);

    useEffect(() => {
        const handler = () => {
            logout();
            navigate(ROUTES.LOGIN, { replace: true });
        };

        window.addEventListener('auth:session_expired', handler);
        return () => window.removeEventListener('auth:session_expired', handler);
    }, [navigate, logout]);

    return null;
};
