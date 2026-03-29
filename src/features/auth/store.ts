import { create } from 'zustand';
import type { User } from '@/types';
import { storage } from '@/lib/storage';
import { normalizeRole, STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
}

const normalizeUser = (user: User | null): User | null => {
    if (!user) return null;

    const raw = user as User & { role?: string };
    let normalizedRoles: string[] = [];

    if (Array.isArray(raw.roles) && raw.roles.length > 0) {
        normalizedRoles = raw.roles.map((r) => normalizeRole(r));
    } else if (raw.role) {
        normalizedRoles = [normalizeRole(raw.role)];
    }

    return {
        ...raw,
        roles: normalizedRoles,
    };
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: normalizeUser(storage.get<User>(STORAGE_KEYS.USER)),
    isAuthenticated: !!storage.get<User>(STORAGE_KEYS.USER),
    isLoading: true,

    setUser: (user) => {
        const normalizedUser = normalizeUser(user);

        if (normalizedUser) {
            storage.set(STORAGE_KEYS.USER, normalizedUser);
            set({ user: normalizedUser, isAuthenticated: true, isLoading: false });
        } else {
            storage.remove(STORAGE_KEYS.USER);
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    logout: () => {
        storage.remove(STORAGE_KEYS.USER);
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.EXPIRES_ON);
        storage.remove(STORAGE_KEYS.CSRF_TOKEN);
        set({ user: null, isAuthenticated: false });
    },

    hasRole: (role) => {
        const { user } = get();
        const normalizedRole = normalizeRole(role);
        return user?.roles?.some((userRole) => normalizeRole(userRole) === normalizedRole) ?? false;
    },

    hasAnyRole: (roles) => {
        const { user } = get();
        const normalizedTargetRoles = roles.map((role) => normalizeRole(role));
        const userRoles = user?.roles?.map((userRole) => normalizeRole(userRole)) ?? [];
        return normalizedTargetRoles.some((role) => userRoles.includes(role));
    },
}));

