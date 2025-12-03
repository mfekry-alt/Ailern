import { create } from 'zustand';
import type { User } from '@/types';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

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

export const useAuthStore = create<AuthState>((set, get) => ({
    user: storage.get<User>(STORAGE_KEYS.USER),
    isAuthenticated: !!storage.get<User>(STORAGE_KEYS.USER),
    isLoading: true,

    setUser: (user) => {
        if (user) {
            storage.set(STORAGE_KEYS.USER, user);
            set({ user, isAuthenticated: true, isLoading: false });
        } else {
            storage.remove(STORAGE_KEYS.USER);
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    logout: () => {
        storage.remove(STORAGE_KEYS.USER);
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.CSRF_TOKEN);
        set({ user: null, isAuthenticated: false });
    },

    hasRole: (role) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
    },

    hasAnyRole: (roles) => {
        const { user } = get();
        return roles.some((role) => user?.roles?.includes(role)) ?? false;
    },
}));

