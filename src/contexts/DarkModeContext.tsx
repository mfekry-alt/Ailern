import { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

interface DarkModeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};

interface DarkModeProviderProps {
    children: React.ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
    // Always start with light mode (false). Dark mode only activates when user clicks toggle.
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = storage.get<boolean>('darkMode');
        // Only use saved preference if it exists and user had previously enabled dark mode
        if (saved === true) {
            return true;
        }
        // Default to light mode
        return false;
    });

    // Initialize document class on mount
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        // Persist when dark mode changes (safe wrapper)
        storage.set('darkMode', isDarkMode);

        // Update document class for Tailwind dark mode
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev: boolean) => !prev);
    };

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
