import { useAuthStore } from '@/features/auth/store';

export const useAuth = () => {
    const { user, isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuthStore();

    return {
        user,
        isAuthenticated,
        isLoading,
        hasRole,
        hasAnyRole,
    };
};

