import { create } from 'zustand';
import type { User } from '@/types';
import { storage } from '@/lib/storage';
import { normalizeRole, STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    setUser: (user: User | null) => void;
    setAccessToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    // Initialize from cache on app load
    initFromCache: () => void;
}

/**
 * Normalize user roles to ensure consistent format
 */
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

/**
 * Load cached user from localStorage
 */
const loadCachedUser = (): User | null => {
    try {
        const cachedUser = storage.get<User>(STORAGE_KEYS.USER);
        return normalizeUser(cachedUser);
    } catch {
        return null;
    }
};

/**
 * Load cached access token from localStorage
 */
const loadCachedToken = (): string | null => {
    try {
        return storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initialize from cache for instant UI (navbar avatar, etc.)
    user: loadCachedUser(),
    isAuthenticated: !!loadCachedUser(),
    isLoading: false, // Start as false to prevent login page flash/reset
    accessToken: loadCachedToken(),

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

    setAccessToken: (token) => {
        if (token) {
            storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
        } else {
            storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        }
        set({ accessToken: token });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    logout: () => {
        storage.remove(STORAGE_KEYS.USER);
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.EXPIRES_ON);
        storage.remove(STORAGE_KEYS.CSRF_TOKEN);
        set({ user: null, isAuthenticated: false, accessToken: null });
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

    // Initialize auth state from cache - called on app load
    initFromCache: () => {
        const cachedUser = loadCachedUser();
        const cachedToken = loadCachedToken();

        set({
            user: cachedUser,
            isAuthenticated: !!cachedUser,
            accessToken: cachedToken,
            isLoading: false,
        });
    },
}));
